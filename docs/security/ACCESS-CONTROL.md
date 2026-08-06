# Control de acceso y datos sensibles

## Matriz efectiva

| Permiso | viewer | servicios_escolares | recursos_humanos | admin | superadmin |
|---|:---:|:---:|:---:|:---:|:---:|
| Ver edificios administrativos | — | ✓ | ✓ | ✓ | ✓ |
| Editar edificios | — | — | — | ✓ | ✓ |
| Editar fotos | — | — | — | ✓ | ✓ |
| Gestionar administradores | — | — | — | — | ✓ |
| Gestionar usuarios genéricos | — | — | — | — | ✓ |
| Ver auditoría | — | — | — | ✓ | ✓ |
| Ver ubicación/horario individual de alumno | — | ✓ | — | ✓ | ✓ |
| Gestionar alumnos | — | ✓ | — | ✓ | ✓ |
| Ver ubicación de profesor | — | — | ✓ | ✓ | ✓ |
| Gestionar profesores | — | — | ✓ | ✓ | ✓ |

La fuente canónica es `ROLE_PERMISSIONS` en `packages/shared/src/types/auth.types.ts`. La prueba recorre cada combinación rol–permiso y falla si el middleware difiere de esa fuente.

## Reglas

- Los endpoints públicos solo contienen información del campus, catálogo de trámites y horario de aula sin personas.
- Los horarios ligados a una matrícula y las ubicaciones académicas requieren sesión y el permiso funcional correspondiente.
- No existe todavía una identidad de alumno. Por ello el autoservicio público por número de control queda deshabilitado: no debe reabrirse hasta implementar autenticación y autorización “solo mi expediente”.
- El rol se vuelve a consultar en PostgreSQL en cada petición autenticada; no se confía en un rol contenido en JWT.
- Desactivar un usuario impide la siguiente petición. Logout y restablecimiento de contraseña incrementan `token_version`.
- Solo `superadmin` gestiona cuentas administrativas. Revisar usuarios y permisos trimestralmente y al terminar una relación laboral.

## Casos negativos obligatorios

- sin token → 401;
- token con algoritmo, emisor o audiencia incorrectos → 401;
- usuario desactivado o versión revocada → 401;
- rol sin permiso → 403;
- mutación sin CSRF válido → 403;
- matrícula/UUID/parámetros inválidos → 400 antes del servicio;
- origen CORS no listado → 403.
