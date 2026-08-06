# Mapa 3D Interactivo — Instituto Tecnológico de Oaxaca

Sistema web para visualizar y administrar un mapa 3D interactivo del campus del ITO. Permite consultar edificios, buscar aulas y trámites, navegar por rutas internas, y gestionar datos académicos desde un panel administrativo protegido por roles.

## Alcance actual

### Funcionalidades públicas

- Mapa 3D interactivo del campus (Three.js / React Three Fiber)
- Búsqueda unificada de edificios, aulas, trámites y servicios
- Tarjeta de detalle con requisitos de trámites
- Navegación con cálculo de rutas dentro del campus
- Vista de horario público por aula (`GET /classrooms/:id/schedule`)

### Panel administrativo (autenticado)

- Autenticación por rol con JWT en cookie `httpOnly` + Double Submit CSRF
- Gestión de edificios e imágenes
- Gestión de usuarios administrativos
- Consulta de ubicación de alumnos por número de control (rol: Servicios Escolares)
- Consulta de ubicación de profesores por número de empleado (rol: Recursos Humanos)
- Gestión de alumnos, profesores y horarios académicos

### Módulos API

| Módulo | Ruta base | Descripción |
|---|---|---|
| Auth | `/auth` | Login, logout, perfil |
| Admin Users | `/auth/admin-users` | Gestión de usuarios administrativos |
| Buildings | `/buildings` | CRUD de edificios, servicios y consulta de categorías |
| Building Images | `/building-images` | Carga y administración de imágenes de edificios |
| Classrooms | `/classrooms` | CRUD de aulas + horario público |
| Procedures | `/procedures` | Trámites y servicios |
| Requirements | `/requirements` | Requisitos de trámites |
| Search | `/search` | Búsqueda unificada full-text |
| Students | `/students` | CRUD de alumnos + ubicación académica |
| Professors | `/professors` | CRUD de profesores + ubicación académica |
| Schedules | `/schedules` | Horarios con inscripción de alumnos |
| Navigation | `/navigation` | Nodos, aristas y rutas del campus |
| Audit Logs | Servicio interno | Registro de acciones administrativas en BD |

## Stack tecnológico

### Frontend (`apps/web`)

- React 19 + TypeScript + Vite
- React Router v7
- Zustand
- Three.js + React Three Fiber + Drei
- Tailwind CSS v4 (`@tailwindcss/vite`)
- Sistema de diseño propio con tokens CSS (`src/styles/index.css`)

### Backend (`apps/api`)

- Node.js + Express + TypeScript
- PostgreSQL con `pg` (pool lazy)
- JWT en cookie `httpOnly` + CSRF Double Submit + Argon2id
- Zod (validación de esquemas)
- Multer + Sharp (carga acotada y redecodificación de imágenes)
- Helmet + CORS + Express Rate Limit
- Vitest + ESLint + CodeQL

### Paquete compartido (`packages/shared`)

- Tipos TypeScript compartidos (auth, edificios, académico, etc.)
- Funciones de API (`fetch` wrappers tipados)
- Utilidades comunes

## Estructura del proyecto

```
RECIDENCIA-/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── modules/          # Módulos de dominio
│   │   │   │   ├── auth/
│   │   │   │   ├── buildings/
│   │   │   │   ├── classrooms/
│   │   │   │   ├── procedures/
│   │   │   │   ├── students/
│   │   │   │   ├── professors/
│   │   │   │   ├── schedules/
│   │   │   │   └── ...
│   │   │   ├── shared/           # Middlewares, helpers, servicios
│   │   │   ├── routes/
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   └── .env.example
│   │
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   ├── components/ui/    # Componentes reutilizables
│       │   ├── features/         # Módulos de UI por dominio
│       │   │   ├── admin/
│       │   │   ├── buildings/
│       │   │   ├── search/
│       │   │   └── ...
│       │   ├── store/
│       │   ├── styles/           # Sistema de diseño (tokens CSS + .ito-* clases)
│       │   └── types/
│       └── .env.example
│
├── packages/
│   └── shared/
│       └── src/
│           ├── api/              # Wrappers de API tipados
│           ├── types/            # Tipos compartidos
│           └── utils/
│
├── docs/
│   ├── schema.sql                # DDL completo (17 tablas)
│   └── seed.sql                  # Datos de prueba mínimos
│
├── package.json
└── pnpm-workspace.yaml
```

## Base de datos

El esquema completo se encuentra en [`docs/schema.sql`](docs/schema.sql).  
Los datos de prueba (seed mínimo) se encuentran en [`docs/seed.sql`](docs/seed.sql).

### Tablas principales

| # | Tabla | Descripción |
|---|---|---|
| 1 | `admin_users` | Usuarios administrativos |
| 2 | `building_categories` | Categorías de edificios |
| 3 | `buildings` | Edificios del campus |
| 4 | `building_images` | Imágenes de edificios |
| 5 | `building_services` | Servicios disponibles en edificios |
| 6 | `navigation_nodes` | Nodos del grafo de rutas |
| 7 | `navigation_edges` | Aristas del grafo de rutas |
| 8 | `building_entrances` | Entradas de edificios vinculadas al grafo |
| 9 | `classrooms` | Aulas dentro de edificios |
| 10 | `procedures` | Trámites y servicios |
| 11 | `procedure_requirements` | Requisitos por trámite |
| 12 | `building_procedures` | Relación edificio-trámite |
| 13 | `audit_logs` | Registro de auditoría |
| 14 | `students` | Alumnos (soft delete) |
| 15 | `professors` | Profesores (soft delete) |
| 16 | `schedules` | Horarios académicos |
| 17 | `student_schedules` | Inscripción alumno-horario |

## Control de acceso (RBAC)

| Permiso | viewer | servicios_escolares | recursos_humanos | admin | superadmin |
|---|:---:|:---:|:---:|:---:|:---:|
| `can_view_buildings` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `can_edit_buildings` | — | — | — | ✓ | ✓ |
| `can_edit_photos` | — | — | — | ✓ | ✓ |
| `can_manage_admin_users` | — | — | — | — | ✓ |
| `can_manage_users` | — | — | — | — | ✓ |
| `can_view_audit_logs` | — | — | — | ✓ | ✓ |
| `can_view_student_location` | — | ✓ | — | ✓ | ✓ |
| `can_manage_students` | — | ✓ | — | ✓ | ✓ |
| `can_view_professor_location` | — | — | ✓ | ✓ | ✓ |
| `can_manage_professors` | — | — | ✓ | ✓ | ✓ |

## Desarrollo local

### Requisitos

- Node.js ≥ 20
- pnpm ≥ 9
- PostgreSQL

### Configuración

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear base de datos
createdb -U postgres mapa_ito
psql -U postgres -d mapa_ito -f docs/schema.sql
psql -U postgres -d mapa_ito -f docs/seed.sql

# 3. Variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Editar ambos archivos con tus credenciales

# 4. Arrancar en desarrollo
pnpm dev
```

## Producción

La guía operativa completa del servidor, releases, almacenamiento persistente,
verificación y rollback está en
[`docs/PRODUCTION-DEPLOYMENT.md`](docs/PRODUCTION-DEPLOYMENT.md).

La API sirve tanto `/api` y `/uploads` como el build estático del frontend,
por lo que sólo se necesita exponer un proceso Node en el puerto configurado.

```bash
corepack enable
pnpm install --frozen-lockfile
pnpm build
pnpm start
```

Antes de arrancar, configura en el servidor las variables descritas en
[`apps/api/.env.example`](apps/api/.env.example). Como mínimo se requieren
la conexión PostgreSQL, `JWT_SECRET`, `JWT_EXPIRES_IN` y el dominio HTTPS en
`CORS_ORIGIN`. El comando `pnpm start` fuerza `NODE_ENV=production`; el puerto
por defecto es `3001`. Si el frontend y la API usan el mismo dominio, no es
necesario definir `VITE_API_URL`. Detrás de Nginx u otro proxy inverso,
configura `HOST=127.0.0.1` para no exponer directamente el proceso Node.

La configuración de referencia en
[`deploy/nginx/mapa-ito.conf`](deploy/nginx/mapa-ito.conf) sirve directamente
los bundles versionados y el modelo 3D, activa gzip para recursos de texto y
mantiene Express como origen de la API y de las rutas dinámicas. Si se publica
con Tailscale Funnel, apunta Funnel al puerto `80` de Nginx, no directamente al
puerto `3001` de Node.

El directorio `apps/api/uploads` debe montarse como almacenamiento persistente
si se despliega en un contenedor o en un servicio con disco efímero.

## Verificación

```bash
# Typecheck completo del monorepo
pnpm -r typecheck

# Tests de la API
pnpm --filter api test

# Lint del frontend
pnpm --filter web lint
```
