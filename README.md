# Expenses Manager

Expenses Manager is a Dockerized full-stack app for personal/team expense tracking, with token-based auth, category management, monthly reports, and a PWA frontend.

## Dev Stack

### Backend
- **PHP 8.3** (`php:8.3-cli`)
- **Laravel** (fresh install in container, customized app code overlaid from `backend/`)
- **Laravel Sanctum** for API token authentication
- **PostgreSQL driver** (`pdo_pgsql`)

### Frontend
- **React 18**
- **Vite 6**
- **Tailwind CSS 3** + PostCSS + Autoprefixer
- **Axios** for API calls
- **React Router 7**
- **Chart.js 4** + `react-chartjs-2`

### Infrastructure / Runtime
- **Docker Compose** (multi-service orchestration)
- **PostgreSQL 16** (`postgres:16-alpine`)
- **Nginx 1.27** (frontend static serving)
- Optional public exposure via **Traefik** (external network: `shop-online_web`)

## Architecture

### Services
- `postgres` → database container
- `backend` → Laravel API, runs migrations on startup
- `frontend` → Vite build output served by Nginx

### Default Local Ports
- Frontend: `http://localhost:15173`
- Backend API: `http://localhost:18000`
- PostgreSQL: `localhost:15432`

### Public Path (if Traefik is enabled)
- Frontend/API base path: `https://projects.doimih.net/expenses`
- Health endpoint: `https://projects.doimih.net/expenses/health`

## Project Structure

```text
expenses/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── app/
│   │   ├── Http/Controllers/Api/
│   │   ├── Http/Middleware/
│   │   ├── Http/Requests/
│   │   ├── Models/
│   │   └── Services/
│   ├── bootstrap/
│   ├── config/
│   ├── database/migrations/
│   └── routes/
└── frontend/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── public/
    └── src/
```

## Quick Start

### Prerequisites
- Docker + Docker Compose
- (Optional for Traefik routing) external Docker network `shop-online_web`

### Run all services

```bash
docker compose up --build
```

### Stop services

```bash
docker compose down
```

### Stop and remove DB volume

```bash
docker compose down -v
```

## Environment Notes

- Backend `.env` is auto-created from `.env.example` in `entrypoint.sh`.
- `APP_KEY` is auto-generated at startup when missing or placeholder.
- Migrations run automatically on container start: `php artisan migrate --force`.
- Frontend build args are set in `docker-compose.yml`:
  - `VITE_API_URL=/expenses/api`
  - `VITE_BASE_PATH=/expenses/`

## API Overview

Base path locally: `http://localhost:18000/api`

### Health
- `GET /health`

> Health requests are restricted by middleware and require `Origin: https://projects.doimih.net` when that rule is active.

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me` *(auth:sanctum)*
- `GET /api/auth/tokens` *(auth:sanctum)*
- `POST /api/auth/logout` *(auth:sanctum)*
- `POST /api/auth/logout-all` *(auth:sanctum)*

### Categories *(auth:sanctum)*
- `GET /api/categories`
- `POST /api/categories`
- `GET /api/categories/{id}`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`

### Expenses *(auth:sanctum)*
- `GET /api/expenses?month=YYYY-MM`
- `POST /api/expenses`
- `GET /api/expenses/{id}`
- `PUT /api/expenses/{id}`
- `DELETE /api/expenses/{id}`

### Reports *(auth:sanctum)*
- `GET /api/reports/monthly?month=YYYY-MM`

### User Management *(superadmin only, auth:sanctum)*
- `GET /api/users`
- `POST /api/users`
- `PUT /api/users/{user}/password`
- `PATCH /api/users/{user}/superadmin`

## Authentication

The API uses Bearer tokens issued by Sanctum.

1. Call `POST /api/auth/login` or `POST /api/auth/register`
2. Read `token` from response
3. Send header:

```http
Authorization: Bearer <token>
Accept: application/json
```

The frontend stores the token in `localStorage` and injects it via Axios request interceptor.

## PWA Notes

- Manifest: `frontend/public/manifest.json`
- Service Worker: `frontend/public/sw.js`
- App includes cache reset action in UI (header button)
- iOS install: Safari → Share → Add to Home Screen

## Frontend Pages

- Login
- Dashboard
- Expenses
- Categories
- Users (admin operations)

## Common Commands

### Rebuild from scratch

```bash
docker compose down -v
docker compose up --build
```

### Check running services

```bash
docker compose ps
```

### Backend logs

```bash
docker compose logs -f backend
```

### Frontend logs

```bash
docker compose logs -f frontend
```

## Troubleshooting

- **Cannot connect to Traefik network**: create or adjust `shop-online_web` network, or remove Traefik network attachment for local-only use.
- **CORS/auth issues**: verify `SANCTUM_STATEFUL_DOMAINS`, `SESSION_DOMAIN`, and frontend URL values in compose env.
- **403 on `/health`**: send the required `Origin` header expected by `RestrictHealthOrigin` middleware.
- **Stale frontend assets**: use the app’s **Reset cache** button and reload.

## Security / Production Recommendations

- Move secrets (`APP_KEY`, DB credentials) to real secret management.
- Add rate limiting for login endpoints.
- Harden CORS and allowed origins per environment.
- Add CI checks and API tests (auth, users, categories, expenses, reports).
