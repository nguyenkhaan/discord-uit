# Frontend

React single-page application for the SE347 project. It uses feature-based modules, typed API contracts, and TanStack Query for server state.

## Overview

- **React 19** + **TypeScript** (strict mode)
- **Vite 8** for local development and production builds
- **Tailwind CSS v4** for styling
- **React Router** for client-side routing
- **TanStack Query** for queries and mutations
- **Axios** for HTTP requests
- **Bun** for package management and scripts

## Folder structure

```text
frontend/
├── public/                 # Static files served from the site root
├── src/
│   ├── api/                # Axios clients and HTTP configuration
│   ├── assets/             # Source-imported assets
│   ├── components/         # Reusable common and layout components
│   ├── context/            # React context, providers, and consumer hooks
│   ├── contract/           # Generated OpenAPI TypeScript types
│   ├── features/           # Feature modules: pages, components, hooks, services
│   ├── lib/                # Shared framework-independent utilities
│   ├── routes/             # Route definitions
│   ├── App.tsx             # Application shell
│   ├── index.css           # Tailwind setup, global styles, and design tokens
│   └── main.tsx            # Application entry point
├── tests/                  # Tests mirroring the source structure
├── package.json
└── vite.config.ts
```

Keep feature-specific code in `src/features/<feature>`. Pages compose the UI; API calls belong in `*.service.ts`, while query and mutation logic belongs in `*.hooks.ts`.

## How to set up

### Technology requirements

- [Bun](https://bun.sh/) (latest stable version)
- A running backend API, normally available at `http://localhost:4000`

### Commands

```bash
cd app/frontend
bun install
```

Create a `.env.local` file and point the frontend to the API:

```env
VITE_BASE_URL=http://localhost:4000
```

Start the development server:

```bash
bun run dev
```

Useful checks:

```bash
bun run lint
bun run build
bun test
```

## API contract generation

`src/contract/api-contract.ts` is generated from the backend OpenAPI specification. Do not edit it manually. With the backend running, regenerate it from the frontend directory:

```bash
bunx openapi-typescript http://localhost:4000/api/docs/openapi \
  --output src/contract/api-contract.ts
```
