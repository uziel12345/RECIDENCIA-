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
| Buildings | `/buildings` | CRUD de edificios |
| Classrooms | `/classrooms` | CRUD de aulas + horario público |
| Categories | `/categories` | Categorías de edificios |
| Procedures | `/procedures` | Trámites y servicios |
| Search | `/search` | Búsqueda unificada full-text |
| Users | `/users` | Gestión de usuarios admin |
| Students | `/students` | CRUD de alumnos + ubicación académica |
| Professors | `/professors` | CRUD de profesores + ubicación académica |
| Schedules | `/schedules` | Horarios con inscripción de alumnos |
| Navigation | `/navigation` | Rutas campus (grafo A\*) |
| Audit | `/audit` | Registro de acciones (superadmin) |

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
- MySQL 8 con `mysql2/promise` (pool lazy)
- JWT en cookie `httpOnly` + CSRF Double Submit
- Zod (validación de esquemas)
- Multer (upload de imágenes)
- Helmet + CORS + Express Rate Limit
- Vitest (374 tests, 26 suites)

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
│   ├── schema.sql                # DDL completo (16 tablas)
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
| 1 | `users` | Usuarios administrativos |
| 2 | `categories` | Categorías de edificios |
| 3 | `buildings` | Edificios del campus |
| 4 | `building_images` | Imágenes de edificios |
| 5 | `classrooms` | Aulas dentro de edificios |
| 6 | `procedure_categories` | Categorías de trámites |
| 7 | `procedures` | Trámites y servicios |
| 8 | `procedure_requirements` | Requisitos por trámite |
| 9 | `procedure_classrooms` | Relación trámite↔aula |
| 10 | `navigation_nodes` | Nodos del grafo de rutas |
| 11 | `navigation_edges` | Aristas del grafo de rutas |
| 12 | `audit_logs` | Registro de auditoría |
| 13 | `students` | Alumnos (soft delete) |
| 14 | `professors` | Profesores (soft delete) |
| 15 | `schedules` | Horarios académicos |
| 16 | `student_schedules` | Inscripción alumno↔horario |

## Control de acceso (RBAC)

| Permiso | viewer | servicios_escolares | recursos_humanos | admin | superadmin |
|---|:---:|:---:|:---:|:---:|:---:|
| `can_view_buildings` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `can_manage_buildings` | — | — | — | ✓ | ✓ |
| `can_manage_users` | — | — | — | ✓ | ✓ |
| `can_view_audit_log` | — | — | — | — | ✓ |
| `can_manage_procedures` | — | — | — | ✓ | ✓ |
| `can_manage_navigation` | — | — | — | ✓ | ✓ |
| `can_view_student_location` | — | ✓ | — | ✓ | ✓ |
| `can_manage_students` | — | ✓ | — | ✓ | ✓ |
| `can_view_professor_location` | — | — | ✓ | ✓ | ✓ |
| `can_manage_professors` | — | — | ✓ | ✓ | ✓ |

## Desarrollo local

### Requisitos

- Node.js ≥ 20
- pnpm ≥ 9
- MySQL 8

### Configuración

```bash
# 1. Instalar dependencias
pnpm install

# 2. Crear base de datos
mysql -u root -p -e "CREATE DATABASE mapa_ito CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p mapa_ito < docs/schema.sql
mysql -u root -p mapa_ito < docs/seed.sql

# 3. Variables de entorno
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Editar ambos archivos con tus credenciales

# 4. Arrancar en desarrollo
pnpm --filter api dev
pnpm --filter web dev
```

### Verificación

```bash
# Typecheck completo del monorepo
pnpm -r typecheck

# Tests de la API
pnpm --filter api test

# Lint del frontend
pnpm --filter web lint
```
