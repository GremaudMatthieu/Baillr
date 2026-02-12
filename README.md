# Baillr

SaaS platform for French property managers (bailleurs) to manage rental properties, tenants, leases, rent collection, and accounting.

## Architecture

- **Frontend**: Next.js 16 (App Router, Turbopack, Tailwind CSS 4)
- **Backend**: NestJS 11 (CQRS/Event Sourcing, Hexagonal Architecture)
- **Event Store**: KurrentDB 25.1.0
- **Database**: PostgreSQL 18 (read models via Prisma 7)
- **Authentication**: Clerk

## Getting Started

### Prerequisites

- Node.js 22+
- Docker & Docker Compose

### Start Infrastructure

```bash
docker compose up -d
```

- KurrentDB Admin UI: http://localhost:2113
- PostgreSQL: localhost:5432

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000

### Backend

```bash
cd backend
npm install
npx prisma migrate dev
npm run start:dev
```

API available at http://localhost:3001/api

## Developer Documentation

- [**Project Context**](./docs/project-context.md) — Architectural decisions, established patterns, and conventions
- [**Anti-Patterns**](./docs/anti-patterns.md) — Centralized catalog of mistakes to avoid (with correct patterns)
- [**DTO Checklist**](./docs/dto-checklist.md) — Defense-in-depth validation checklist for DTOs

## Project Structure

```
Baillr/
├── frontend/          # Next.js 16 App Router
├── backend/           # NestJS 11 CQRS/ES
├── docs/              # Developer documentation
├── scripts/           # CI/quality scripts
├── docker-compose.yml # KurrentDB + PostgreSQL
└── .github/workflows/ # CI pipeline
```
