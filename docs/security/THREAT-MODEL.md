# Modelo de amenazas

Fecha de revisión: 2026-08-03. Método: STRIDE, revisión manual de código y configuración, pruebas unitarias y auditoría de dependencias. No se realizaron pruebas activas contra producción.

## Arquitectura y límites de confianza

```text
Navegador anónimo ──HTTPS──> proxy/TLS ──HTTP loopback──> Express
Navegador admin ─ cookie httpOnly + CSRF ────────────────┘
Express ──consultas parametrizadas / pool limitado──> PostgreSQL
Express ──archivos redecodificados──> uploads/buildings
CI ──lockfile + acciones fijadas por SHA──> artefactos/release
Operador ──SSH/Tailscale──> systemd, Nginx, backup local
```

Los límites principales son navegador–proxy, proxy–Node, Node–PostgreSQL, carga–filesystem, repositorio–CI y operador–servidor. Node y PostgreSQL no deben exponerse directamente a Internet.

## Activos y clasificación

| Activo | Clasificación | Riesgo dominante |
|---|---|---|
| Usuarios administrativos, roles y hashes | restringido | toma de cuenta / escalamiento |
| Alumnos, profesores, matrículas, RFC y horarios | confidencial académico | BOLA, enumeración, uso indebido |
| Cookies JWT y tokens CSRF | secreto efímero | secuestro de sesión |
| Base PostgreSQL y respaldos | confidencial | extracción, corrupción, pérdida |
| Imágenes y Excel importados | no confiable | parser bomb, contenido activo, agotamiento |
| Mapa, edificios, aulas, trámites | público | alteración / disponibilidad |
| Logs de auditoría | restringido | manipulación, PII, falta de trazabilidad |
| Pipeline y dependencias | privilegiado | compromiso de cadena de suministro |

## Actores y supuestos

- visitante anónimo malicioso;
- usuario autenticado con privilegios mínimos o cuenta comprometida;
- administrador interno que excede su función;
- atacante con una dependencia o pipeline comprometido;
- tráfico automatizado/DDoS;
- operador legítimo que comete un error de despliegue.

Se asume HTTPS en el borde, host Linux mantenido, PostgreSQL en loopback, repositorio privado o con secretos ausentes y una única instancia Node. Si se escala a varias instancias, el rate limit en memoria debe migrar a un almacén compartido.

## Amenazas y controles

| STRIDE | Escenario | Control actual | Riesgo residual |
|---|---|---|---|
| Spoofing | falsificar o reutilizar JWT | HS256 explícito, `iss`, `aud`, expiración ≤8 h, cookie `httpOnly`, validación de usuario/rol/token_version en BD | falta MFA; rotación operativa pendiente |
| Tampering | petición mutante desde otro origen | SameSite Strict, Double Submit CSRF, CORS explícito, Zod | XSS mismo origen aún rompería el modelo; mantener CSP |
| Repudiation | negar una acción administrativa | auditoría en BD, request ID generado por servidor, logs JSON sin cuerpo/query/cookies | alertas y retención central no implementadas |
| Information disclosure | consultar horario por matrícula | autenticación y `can_manage_students`; ubicación de profesor/alumno separada por función | falta identidad de alumno para autoservicio seguro |
| Information disclosure | errores/logs filtran secretos | mensajes genéricos en producción, logs normalizados, sin cuerpos ni URL de consulta | proxy/SO deben conservar permisos y rotación |
| Denial of service | ZIP bomb o imagen gigante | ZIP con límites por entrada/total/ratio/filas; imágenes 10 MB, 40 MP, una página, rate limit y redecodificación | DDoS volumétrico requiere CDN/WAF externo |
| Elevation of privilege | viewer llama CRUD | middleware de autenticación + permiso por ruta; matriz completa probada | error futuro de ruta; mantener revisión deny-by-default por router |
| Tampering/XSS | `resource_url` usa `javascript:` | solo HTTP(S) en API y filtro defensivo en React | limpiar registros históricos no conformes |
| Supply chain | paquete o Action alterado | lockfile congelado, Actions por SHA, Dependabot, auditoría prod, CodeQL | dev dependencies con alertas; requieren upgrades planificados |

## Abuso priorizado

1. Enumerar matrículas para extraer horarios: mitigado localmente; requiere desplegar esta versión.
2. Entregar un XLSX comprimido que expanda memoria/CPU: mitigado antes de inflar y procesar.
3. Subir un archivo disfrazado o imagen de dimensiones extremas: decodificación, comparación MIME/formato y reescritura sin metadatos.
4. Robar una cuenta administrativa: lockout, rate limit, Argon2id, revocación; MFA y llave SSH siguen pendientes.
5. Saturar el enlace público: límites de aplicación ayudan, pero WAF/CDN es una decisión de infraestructura pendiente.

## Revisión

Actualizar este modelo al agregar identidad estudiantil, nuevas cargas de archivos, proveedores externos, más instancias, cambios de dominio/proxy o nuevos roles. Revisar al menos cada seis meses.
