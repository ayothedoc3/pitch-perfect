# Coolify Deployment Guide for PitchBuddy

## Single-Service Deployment (recommended)

Deploy the monorepo as one Node.js app in Coolify.

- **Source**: your Git repository
- **Branch**: `main`
- **Build Pack**: Node.js 18+
- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm run start`
- **Exposed Port**: 3000 (Next.js). The Express API stays internal on 3011.

The root `npm run start` script launches:
- `frontend/package.json` `start` (`next start -H 0.0.0.0`) so Next.js listens on every interface.
- `backend/package.json` `start:prod`, which runs Prisma migrations (`prestart`) before starting `dist/server.js` on port 3011.

### Environment variables to set on the Coolify app

```
# Frontend / proxy configuration
NEXT_PUBLIC_API_URL=/api
INTERNAL_API_URL=http://127.0.0.1:3011/api/:path*

# Backend API
BACKEND_PORT=3011
DATABASE_URL=postgresql://postgres:<password>@<internal-host>:5432/postgres?sslmode=require
FRONTEND_URL=https://www.pitchbuddy.online
FRONTEND_URLS=https://www.pitchbuddy.online
JWT_SECRET=<replace-with-secure-random-value>
NODE_ENV=production
OPENAI_API_KEY=<your-openai-key>
PORT=3000
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15
UPLOAD_DIR=/app/backend/uploads
UPLOAD_MAX_SIZE=100000000
```

(Replace placeholders; keep `sslmode=require` only if your database enforces SSL.)

If you use Coolify's managed Postgres service, make sure `DATABASE_URL` matches its "Postgres URL (internal)" output. Update `FRONTEND_URLS` or add `CORS_ALLOWED_ORIGINS` if additional domains need API access.

### Database service (if managed by Coolify)

Use the default Postgres template:
- **Image**: `postgres:17-alpine`
- **Environment**: `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- The generated internal URL should be copied into the app's `DATABASE_URL`.

### Health checks

- Frontend: `GET /` on port 3000
- Backend (optional internal check): `GET /api/health` on port 3011

## Optional: Multi-service deployment

If you prefer dedicated services for frontend, backend, and database, reuse the scripts above but point each service at its own directory (`frontend/`, `backend/`) with the same environment variables. Alternatively, use `.coolify/docker-compose.yml` with exposed ports 3000 (frontend) and 3001 (backend).

## Troubleshooting

- Missing env vars cause the backend to exit before accepting traffic—double-check Coolify's environment panel.
- Prisma errors (`P1012`, `P1001`) indicate an unreachable or misconfigured database URL.
- If you see "Bad Gateway", confirm `npm run start` is up by checking the container logs and calling `/api/health` inside the container (`curl localhost:3011/api/health`).

## Deployment automation tips

- `npm run start` applies migrations automatically via the backend's `prestart` hook.
- To run migrations manually without the full stack: `cd backend && npm run migrate:deploy`.
- For CI/CD pipelines, a single `npm install && npm run build` followed by `npm run start` matches the Coolify configuration.
