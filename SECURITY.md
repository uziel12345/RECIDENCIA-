# Política de seguridad

## Versiones soportadas

Solo la versión desplegada desde la rama `master` recibe correcciones de seguridad. Las ramas de trabajo y releases anteriores no se consideran soportadas.

## Reporte responsable

No publiques vulnerabilidades, credenciales, datos académicos ni capturas con información personal en Issues. Repórtalos de forma privada al responsable técnico del Instituto e incluye:

- componente y versión afectada;
- pasos mínimos para reproducir sin datos reales;
- impacto estimado;
- evidencia redactada, sin contraseñas, cookies, tokens ni expedientes.

El responsable debe acusar recibo en un máximo objetivo de 3 días hábiles, clasificar el riesgo en 5 días y acordar una ventana de corrección. No se autoriza probar contra producción, degradar el servicio, extraer datos ni acceder a cuentas ajenas.

## Alcance autorizado de pruebas

Las pruebas activas se ejecutan únicamente en `localhost` o en un staging aislado con autorización escrita. El workflow `ZAP passive baseline` exige confirmación y el entorno protegido `security-staging`. Producción solo admite revisiones pasivas y cambios aprobados con respaldo y rollback.

## Manejo de credenciales

Los secretos viven fuera de Git, en el archivo de entorno del servidor con permisos mínimos o en un gestor de secretos. Toda credencial expuesta en chat, correo, logs o una incidencia debe rotarse; no basta con borrar el mensaje.
