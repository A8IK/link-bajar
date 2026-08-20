# Link Bajar

Multi-role SEO link marketplace (guest posts, link insertions, HARO, 301 redirects, PR, SEO packages, web dev).

## Roles
Admin · Buyer · Seller · Agency · Partnership

## Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + React Router + TanStack Query + Zustand + react-helmet-async
- **Backend**: Node.js + Express + Sequelize + PostgreSQL + Redis + Socket.io
- **Infra**: Nginx (load balancer) + Docker Compose + GitHub Actions

## Project Layout
```
link-bajar/
├── backend/          Express API (stateless, scalable)
├── frontend/         React SPA
├── nginx/            Reverse-proxy + load balancer config
├── docker/           Dockerfiles
├── .github/workflows CI/CD pipelines
└── docs/             Architecture + DB schema notes
```

## Local development

### 1. Prereqs
- Node 20+
- Docker Desktop (for Postgres + Redis)

### 2. Boot infra
```bash
docker compose -f docker/docker-compose.dev.yml up -d
```

### 3. Backend
```bash
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

### 4. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Frontend: http://localhost:5173 — API: http://localhost:4000

## Production
```bash
docker compose -f docker/docker-compose.prod.yml up -d --scale backend=3
```
Nginx will round-robin requests across the 3 backend replicas. See [nginx/nginx.conf](nginx/nginx.conf).

## Docs
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- [docs/DATABASE.md](docs/DATABASE.md)
- [docs/API.md](docs/API.md)
