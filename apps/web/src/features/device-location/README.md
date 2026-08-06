# Localización del dispositivo v2

Esta característica obtiene la ubicación del dispositivo, la conserva solo en
memoria y, cuando existen puntos físicos calibrados, coloca un marcador en
el modelo 3D del campus. Es independiente de `features/location` y de
`store/location-store.ts`.

## Arquitectura

```text
components/  capa R3F, marcador, precisión y panel de diagnóstico
config/      constantes, puntos físicos de calibración y feature flags
hooks/       coordinación entre permiso, watcher, filtro y store
services/    Capacitor, GPS→metros, calibración y filtro
store/       estado Zustand exclusivo de esta característica
types/       tipos propios; nunca almacena objetos de Capacitor
utils/       grados, Haversine, validación y calidad de precisión
```

Flujo de datos:

```text
acción explícita del usuario
→ permiso de ubicación
→ un único watchPosition de Capacitor
→ DeviceGeoPosition cruda
→ filtro sencillo y DeviceGeoPosition aceptada
→ desplazamiento local este/norte en metros
→ escala + rotación + traslación de la calibración
→ X/Y/Z locales del GLB
→ marcador y círculo de precisión dentro del grupo del campus
```

No se inicia el GPS al montar el mapa. `useDeviceLocation` lo inicia únicamente
desde `startTracking`, impide un segundo watcher y lo limpia al detenerlo,
reiniciar o desmontar el propietario. La lectura de Capacitor se normaliza a
`DeviceGeoPosition`; ninguna estructura del plugin entra al store.

## Conversión de GPS a metros

Para distancias pequeñas se usa una aproximación tangente local con radio
terrestre `6_371_000 m`:

```text
northMeters = Δlat(radianes) × R
eastMeters  = Δlon(radianes) × R × cos(latitudReferencia)
```

`eastMeters` es positivo hacia el este y `northMeters` hacia el norte. El
resultado está en metros y es apropiado para el área de un campus. No es una
proyección cartográfica para viajes o distancias grandes. Haversine se usa
para medir separación entre lecturas y entre los puntos de calibración.

Mientras no haya calibración, la primera lectura aceptada de la sesión sirve
solo como referencia temporal para visualizar desplazamientos locales. No se
usa para inventar una posición dentro del modelo.

## Transformación multipunto

Cada punto relaciona una coordenada GPS medida con un X/Z local del modelo.
Con exactamente dos puntos, sean `A` y `B`:

1. GPS B se convierte a metros este/norte con GPS A como referencia.
2. Se calculan los vectores `vGPS = BGPS - AGPS` y `vMap = BMap - AMap`.
3. `escala = longitud(vMap) / longitud(vGPS)`.
4. `rotación = atan2(vMap.z, vMap.x) - atan2(vGPS.norte, vGPS.este)`.
5. Para una lectura, se aplican inversión configurada, rotación y escala.
6. Se suma la traslación `A.map`.

Con tres o más puntos se ajustan escala, rotación y traslación mediante mínimos
cuadrados ponderados. El peso opcional permite dar más influencia a mediciones
físicas precisas que a coordenadas aproximadas del inventario, sin deformar el
modelo con escalas diferentes por eje.

No se supone que este sea X ni que norte sea Z. Dos puntos sí determinan
escala, rotación y traslación, pero no permiten decidir de forma única si todo
el sistema está reflejado. `CAMPUS_AXIS_INVERSION` deja esa decisión explícita;
se verificó con un tercer punto físico que no está sobre la línea A-B.

La calibración usa las coordenadas GPS centrales de AUL-S, CONACYT y Centro de
Cómputo. Sus X/Z no proceden de las columnas antiguas de la base de datos: se
extrajeron de los centros geométricos reales de los nodos correspondientes en
`campus.glb`. El eje norte está invertido porque el eje Z local del GLB crece
hacia el sur. Nunca se producen `NaN` o `Infinity`.

La lectura física tomada en la entrada de Centro de Cómputo el 2026-08-04
(`17.0789672, -96.7443598`, precisión 3.07 m) se conserva como validación. La
transformación la coloca aproximadamente en `(58.18, -71.50)`, dentro del borde
del nodo real de CC; no se usa como centro del edificio.

Las validaciones de Dirección, Biblioteca, Cafetería y Edificio Q quedaron
dentro de sus nodos o a menos de 1.5 m de la fachada correspondiente. En
Edificio I se detectó una deformación local: la lectura coincidía con la puerta
en X, pero quedaba 20.4 m desplazada en Z. `CAMPUS_LOCAL_CORRECTIONS` corrige
esa entrada dentro de un radio de 8 m y reduce el efecto suavemente hasta cero
a 35 m, sin alterar la calibración global que ya funciona en los otros puntos.

## Cómo medir los puntos reales

1. Elige al menos tres lugares exteriores, inequívocos en el modelo y separados al menos
   30–50 metros: por ejemplo, esquinas de edificios o extremos de un andador.
2. En cada lugar permanece quieto, con cielo abierto, y registra varias
   lecturas durante 30–60 segundos. Conserva latitud, longitud y precisión;
   usa una medición estable en vez de la primera lectura.
3. Abre `public/models/campus.glb` en Blender u otro inspector GLB y coloca el
   cursor exactamente sobre el mismo rasgo físico. Registra sus coordenadas
   locales X y Z.
4. Importante: `CampusViewer` rota todo el grupo `π/2` en Y y luego lo centra.
   Los puntos de configuración deben ser los X/Z **locales del GLB dentro de
   ese grupo**. No sumes el autocentrado ni conviertas a coordenadas de mundo.
5. Si las mediciones de campo difieren de la calibración inicial, actualiza
   `CAMPUS_CALIBRATION_POINTS`. No redondees innecesariamente latitud/longitud.
6. Valida un tercer lugar conocido. Si el desplazamiento queda reflejado,
   corrige `CAMPUS_AXIS_INVERSION` y repite las pruebas.
7. Verifica también `USER_MARKER_HEIGHT = 2`; es provisional y debe ajustarse
   visualmente a la escala definitiva del modelo.

El panel permite copiar un JSON con GPS crudo, lectura filtrada, metros
locales, X/Y/Z, escala, rotación y estado de calibración. No escribe datos en
archivos, logs permanentes, backend ni PostgreSQL.

## Panel de diagnóstico

Crea `apps/web/.env.local` con:

```env
VITE_ENABLE_LOCATION_DEBUG=true
```

Reinicia Vite después de cambiar la variable. En producción el panel no se
muestra cuando la variable no vale exactamente `true`. Sus botones permiten
solicitar permiso, iniciar, detener, limpiar y copiar el estado actual.

La calidad se calcula con límites centralizados: excelente hasta 5 m, buena
hasta 15 m, regular hasta 35 m y pobre por encima. Una precisión pobre no
elimina la lectura cruda. El filtro acepta movimientos menores a 0.5 m y solo
mantiene la última lectura válida ante coordenadas inválidas, saltos mayores a
50 m o velocidad estimada superior a 4 m/s. No usa Kalman.

## Probar en computadora

Desde la raíz del monorepo:

```bash
pnpm --filter web dev
```

Abre la URL local, entra al mapa, pulsa `Solicitar ubicación` y luego
`Iniciar`. `localhost` se considera un contexto seguro en los navegadores
modernos. Comprueba que cambien lectura cruda, timestamp, metros locales y
X/Y/Z. Usa `Detener` y confirma que el estado cambie y no lleguen nuevas
lecturas.

## Probar desde un celular web

La geolocalización web normalmente requiere HTTPS. `http://localhost` solo es
una excepción en la misma computadora y una dirección HTTP de red local no
suele ser suficiente para el teléfono. Sirve el sitio mediante un dominio HTTPS
de confianza, abre ese enlace en el celular y concede permiso. En producción el
panel solo se habilita dentro de la ruta administrativa protegida del mapa.

## Probar con Capacitor en Android

El manifiesto actual ya incluye `ACCESS_COARSE_LOCATION` y
`ACCESS_FINE_LOCATION`. Desde la raíz:

```bash
pnpm --filter web build:capacitor
pnpm --filter web exec cap sync android
pnpm --filter web exec cap open android
```

Compila/ejecuta desde Android Studio en un dispositivo real. Acepta el permiso
“mientras se usa la app”, prueba iniciar/detener varias veces y revisa que solo
haya un watcher. Un emulador necesita una ubicación configurada y no representa
la precisión real del campus.

## Limitaciones conocidas

- GPS suele oscilar varios metros incluso en exteriores y empeora junto a
  edificios altos, árboles densos o clima adverso.
- Dentro de edificios la señal puede ser muy imprecisa o desaparecer. Esta
  etapa no detecta interiores, pisos ni corrige usando edificios.
- Todavía conviene recolectar más puntos físicos repartidos por el campus para
  reducir el error lejos del Centro de Cómputo.
- No hay geocercas, rutas, navegación, historial, otros usuarios, simulación,
  backend de calibración ni persistencia.

## Archivos

- `types/device-location.types.ts`: contratos propios.
- `config/campus-location.config.ts`: constantes y banderas.
- `services/device-geolocation.service.ts`: permisos y watcher Capacitor.
- `services/gps-to-local.service.ts`: GPS a metros locales.
- `services/campus-calibration.service.ts`: transformación al GLB.
- `services/location-filter.service.ts`: filtro inicial transparente.
- `store/device-location.store.ts`: estado en memoria.
- `hooks/useDeviceLocation.ts`: ciclo de vida y procesamiento.
- `components/DeviceLocationLayer.tsx`: puente con el Canvas.
- `components/DeviceLocationMarker.tsx`: marcador animado.
- `components/LocationAccuracyCircle.tsx`: precisión en el suelo.
- `components/LocationDebugPanel.tsx`: controles y diagnóstico local.
- `utils/location-math.ts`: matemáticas compartidas.
- `*.test.ts`: pruebas unitarias del núcleo.
