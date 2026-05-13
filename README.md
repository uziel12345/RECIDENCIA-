# Mapa 3D Interactivo del Instituto Tecnológico de Oaxaca

Sistema web para visualizar y administrar un mapa 3D interactivo del Instituto Tecnológico de Oaxaca. El proyecto permite consultar edificios, ver información relevante del campus, navegar por rutas internas y administrar datos desde un panel protegido.

## Objetivo del proyecto

El objetivo es desarrollar una plataforma digital para alumnos, visitantes y personal administrativo del Instituto Tecnológico de Oaxaca.

El sistema contempla:

- Página web interactiva.
- Mapa 3D del campus.
- Búsqueda de edificios.
- Visualización de información por edificio.
- Cálculo de rutas de navegación.
- Panel administrativo.
- Gestión de edificios.
- Gestión de imágenes de edificios.
- Autenticación y autorización por roles.
- Base para una futura app móvil iOS y Android.

## Tecnologías principales

### Frontend web

- React
- TypeScript
- Vite
- React Router
- Zustand
- Three.js
- React Three Fiber
- Drei
- Tailwind CSS

### Backend API

- Node.js
- Express
- TypeScript
- MySQL
- JWT
- bcryptjs
- Zod
- Multer
- Helmet
- CORS
- Express Rate Limit

### Monorepo

- pnpm workspaces
- Paquete compartido `packages/shared`

## Estructura del proyecto

```txt
RECIDENCIA-/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── config/
│   │   │   ├── controllers/
│   │   │   ├── db/
│   │   │   ├── modules/
│   │   │   ├── routes/
│   │   │   ├── shared/
│   │   │   ├── app.ts
│   │   │   └── server.ts
│   │   └── .env.example
│   │
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   ├── components/
│       │   ├── features/
│       │   ├── services/
│       │   ├── store/
│       │   ├── styles/
│       │   └── types/
│       └── .env.example
│
├── packages/
│   └── shared/
│       └── src/
│           ├── api/
│           ├── types/
│           └── utils/
│
├── package.json
├── pnpm-workspace.yaml
└── README.md

