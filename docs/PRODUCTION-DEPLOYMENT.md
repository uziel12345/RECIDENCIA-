# Despliegue de producción de Mapa ITO

Última verificación operativa: 3 de agosto de 2026.

Esta guía describe la arquitectura encontrada en el servidor
`recorridovirtual-ito`, el procedimiento reproducible para publicar un release,
la persistencia de imágenes y la forma de verificar o revertir un despliegue.
No contiene contraseñas, tokens ni valores del archivo de entorno.

## Arquitectura verificada

```text
Internet
  → HTTPS de Tailscale Funnel
  → Nginx en 127.0.0.1:80
  ├─ /assets y /models: archivos del build web
  └─ /, /api y /uploads: Node/Express en 127.0.0.1:3001
       ├─ frontend SPA: apps/web/dist
       ├─ API: apps/api/dist/server.js
       ├─ PostgreSQL en el servidor
       └─ imágenes: /var/www/mapa-ito/uploads
                      ↓ enlace simbólico
                    /var/lib/mapa-ito/uploads
```

Estado observado:

- Sistema: Ubuntu 24.04.
- Node.js: 24.18.1.
- pnpm: 11.17.0.
- PostgreSQL: 17.10.
- Servicio: `mapa-ito.service`, usuario y grupo `mapaito`.
- Nginx, PostgreSQL, Tailscale y `mapa-ito` administrados por systemd.
- Sitio público: `https://recorridovirtual-ito.tailc9c1c3.ts.net`.
- Funnel reenvía `/` a `http://127.0.0.1:80`.
- Backups automáticos mediante `mapa-ito-backup.timer`.

## Rutas importantes

| Contenido | Ruta |
| --- | --- |
| Releases inmutables | `/var/www/mapa-ito-releases/<release-id>` |
| Release activo | `/var/www/mapa-ito` |
| Imágenes persistentes | `/var/lib/mapa-ito/uploads` |
| Enlace requerido en el release | `/var/www/mapa-ito/uploads` |
| Entorno privado de la API | `/etc/mapa-ito/api.env` |
| Unidad systemd | `/etc/systemd/system/mapa-ito.service` |
| Configuración Nginx | `/etc/nginx/sites-available/mapa-ito` |
| Backups | `/var/backups/mapa-ito` |

`/var/www/mapa-ito` es un enlace al release activo. No se debe guardar contenido
mutable dentro de un release. Las imágenes sobreviven a los despliegues porque
viven en `/var/lib/mapa-ito/uploads`.

## Cómo se publica un release

Los comandos siguientes se ejecutan en el servidor con una cuenta autorizada.
Antes de comenzar debe existir un artefacto con el workspace que se desea
publicar, sin `.env`, backups, uploads, `.git` ni secretos.

### 1. Preparar identificador y directorio

```bash
set -euo pipefail

RELEASE_ID="$(date -u +%Y%m%d-%H%M%S)"
RELEASE_DIR="/var/www/mapa-ito-releases/$RELEASE_ID"

sudo install -d -m 0755 "$RELEASE_DIR"
```

Extraer o copiar el artefacto dentro de `RELEASE_DIR`. No copiar el directorio
local `apps/api/uploads`: la fuente canónica en producción es `/var/lib`.

### 2. Instalar y validar

```bash
cd "$RELEASE_DIR"
corepack enable
pnpm install --frozen-lockfile

pnpm -r typecheck
pnpm --filter api test
pnpm --filter web test
pnpm --filter api lint
pnpm --filter web lint
pnpm build
```

No cambiar TypeScript, ESLint o Vitest para ocultar fallos. Un release con un
comando fallido no debe activarse.

### 3. Configurar el frontend de producción

Las variables `VITE_*` se incorporan al bundle durante `pnpm build`.

- En el despliegue actual web y API comparten origen; se debe usar `/api` o no
  definir `VITE_API_URL`.
- `VITE_ENABLE_LOCATION_DEBUG` debe permanecer en `false` salvo una prueba
  controlada.
- No colocar secretos en variables `VITE_*`, porque el navegador puede leerlas.

### 4. Enlazar las imágenes persistentes

Este paso es obligatorio en **cada release** y debe ejecutarse antes de mover
el enlace `current`:

```bash
sudo install -d -o mapaito -g mapaito -m 0750 /var/lib/mapa-ito/uploads
sudo install -d -o mapaito -g mapaito -m 0755 /var/lib/mapa-ito/uploads/buildings

test ! -e "$RELEASE_DIR/uploads"
sudo ln -s /var/lib/mapa-ito/uploads "$RELEASE_DIR/uploads"
test "$(readlink -f "$RELEASE_DIR/uploads")" = "/var/lib/mapa-ito/uploads"
```

La API usa `path.resolve(process.cwd(), "uploads")`. Como systemd establece
`WorkingDirectory=/var/www/mapa-ito`, Express buscará los archivos exactamente
en `/var/www/mapa-ito/uploads`. Tener archivos en `/var/lib` sin este enlace
produce respuestas 404.

### 5. Respaldar y migrar PostgreSQL

Antes de una migración:

```bash
sudo systemctl start mapa-ito-backup.service
sudo systemctl status mapa-ito-backup.service --no-pager
```

Aplicar solamente las migraciones pendientes documentadas en `docs/MIGRATIONS.md`.
No volver a ejecutar `schema.sql` ni `seed.sql` sobre una base ya poblada.

### 6. Activar atómicamente

```bash
sudo ln -s "$RELEASE_DIR" /var/www/mapa-ito.next
sudo mv -Tf /var/www/mapa-ito.next /var/www/mapa-ito

sudo systemctl restart mapa-ito
sudo systemctl reload nginx
```

El cambio mediante enlace evita dejar una mezcla de archivos viejos y nuevos.

### 7. Verificar

```bash
sudo systemctl is-active mapa-ito nginx postgresql tailscaled
sudo journalctl -u mapa-ito -n 100 --no-pager
sudo nginx -t

curl --fail --silent --show-error http://127.0.0.1:3001/api/health
curl --fail --silent --show-error \
  https://recorridovirtual-ito.tailc9c1c3.ts.net/api/health

test "$(readlink -f /var/www/mapa-ito/uploads)" = "/var/lib/mapa-ito/uploads"
find /var/www/mapa-ito/uploads/buildings -maxdepth 1 -type f | wc -l
```

Elegir también una ruta real de `building_images` y comprobarla:

```bash
curl --fail --head \
  "https://recorridovirtual-ito.tailc9c1c3.ts.net/uploads/buildings/ARCHIVO.jpg"
```

La respuesta debe ser `200` y un `Content-Type` de imagen.

## Cómo se almacenan las imágenes

PostgreSQL no guarda el binario de las fotografías. La tabla
`building_images` conserva metadatos y una ruta relativa:

```text
/uploads/buildings/<archivo-generado>.jpg
```

El archivo real se almacena en:

```text
/var/lib/mapa-ito/uploads/buildings/<archivo-generado>.jpg
```

Por eso una migración completa necesita dos piezas inseparables:

1. Filas de PostgreSQL.
2. Directorio persistente de uploads.

Copiar solo la base de datos deja referencias que devuelven 404. Copiar solo
los archivos deja huérfanos que nunca aparecen en la interfaz.

## Diagnóstico de imágenes

### Comprobar registros

Con las variables de `/etc/mapa-ito/api.env` cargadas de forma segura:

```sql
SELECT
  COUNT(*) AS total,
  COUNT(*) FILTER (WHERE is_active) AS activas,
  COUNT(DISTINCT image_url) AS urls,
  COUNT(*) FILTER (WHERE is_cover) AS portadas
FROM building_images;
```

### Comprobar archivos

```bash
find /var/lib/mapa-ito/uploads/buildings \
  -maxdepth 1 -type f -printf '%f\n' | sort
```

Para cada `image_url`, anteponer `/var/www/mapa-ito` y comprobar `test -f`.
Las portadas públicas también se pueden contrastar con `/api/buildings`.

### Interpretación rápida

| BD | Archivo | Resultado |
| --- | --- | --- |
| Sí | Sí | La imagen debe responder; revisar Nginx/URL si falla. |
| Sí | No | Referencia rota; restaurar el archivo desde backup. |
| No | Sí | Archivo huérfano; investigar antes de eliminar. |
| No | No | No existe imagen. |

No insertar manualmente filas para “arreglar” un 404 si la fila ya existe.
Primero se debe comprobar el archivo y el enlace persistente.

## Incidente corregido el 3 de agosto de 2026

Síntoma: las tarjetas tenían rutas de portada, pero ninguna fotografía cargaba.

Hallazgos:

- La API y `/api/health` respondían 200.
- PostgreSQL tenía 65 registros activos de `building_images`.
- Los 61 registros asociados a edificios públicos tenían archivos físicos.
- Existían 63 archivos, con 241,435,917 bytes, en el almacenamiento persistente.
- El release activo no tenía `/var/www/mapa-ito/uploads`.
- Por ello las 61 URLs públicas comprobadas devolvían 404.

Corrección aplicada:

```bash
ln -s /var/lib/mapa-ito/uploads \
  /var/www/mapa-ito-releases/20260803-2130-security/uploads
```

Resultado verificado:

- 61 de 61 URLs públicas responden 200.
- Todas se entregan como `image/jpeg`.
- No se insertaron ni modificaron filas de PostgreSQL.
- No se movieron, sobrescribieron ni eliminaron fotografías.

Datos históricos pendientes, sin impacto en el sitio público:

- Tres referencias antiguas pertenecen al edificio inactivo `J` y apuntan a
  `buildings/j/cover.jpg`, `entrance.jpg` y `side.jpg`; esos archivos no están
  presentes.
- Existe un archivo UUID no referenciado por la base de datos.
- No se eliminaron estos elementos porque requieren una decisión explícita de
  conservación o limpieza.

## Rollback

Para volver al release anterior:

```bash
PREVIOUS_RELEASE="/var/www/mapa-ito-releases/ID_ANTERIOR"

test -f "$PREVIOUS_RELEASE/apps/api/dist/server.js"
test -f "$PREVIOUS_RELEASE/apps/web/dist/index.html"
test "$(readlink -f "$PREVIOUS_RELEASE/uploads")" = "/var/lib/mapa-ito/uploads"

sudo ln -s "$PREVIOUS_RELEASE" /var/www/mapa-ito.rollback
sudo mv -Tf /var/www/mapa-ito.rollback /var/www/mapa-ito
sudo systemctl restart mapa-ito
```

Los uploads son compartidos y no se revierten al cambiar de release. Si hubo
una migración de base incompatible, debe aplicarse el procedimiento de
restauración del backup correspondiente.

## Checklist de cierre

- [ ] Pruebas, typecheck, lint y build aprobados.
- [ ] Backup correcto antes de migraciones.
- [ ] `api.env` presente, sin imprimir sus valores.
- [ ] Enlace `uploads` creado y apuntando a `/var/lib/mapa-ito/uploads`.
- [ ] Release activado mediante enlace atómico.
- [ ] `mapa-ito`, Nginx, PostgreSQL y Tailscale activos.
- [ ] Health check local y público en 200.
- [ ] Una portada y una imagen de galería responden 200.
- [ ] Logs revisados y sin bucles de reinicio.
- [ ] Release anterior conservado para rollback.
