# Secure API Gateway

A production-grade API Gateway with JWT authentication, Redis rate limiting, audit logging, and a Next.js dashboard.

## Project Structure

```
Secure-Api-Gateway/
├── gateway/          # Express API gateway (Node.js)
└── frontend/         # Next.js 16 dashboard (App Router + Tailwind CSS v4)
```

## Prerequisites

- Node.js 18+
- Redis (local or cloud — e.g. Redis Cloud free tier)

## Quick Start

### 1. Gateway

```bash
cd gateway
cp .env.example .env      # set JWT_SECRET and REDIS_URL
npm install
npm run dev               # http://localhost:3000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev               # http://localhost:3000
```

Next.js rewrites `/api/*` to `http://localhost:3000/api/*` automatically in development.

## API Routes

### Public

| Method | Path                      | Description            |
|--------|---------------------------|------------------------|
| POST   | /api/auth/login           | Get JWT token          |
| GET    | /api/auth/verify          | Validate a token       |
| GET    | /api/test/health          | Liveness check         |
| GET    | /api/test/health/ready    | Readiness (Redis ping) |

### Protected (Bearer token required)

| Method | Path                        | Role  | Description              |
|--------|-----------------------------|-------|--------------------------|
| GET    | /api/protected/profile      | any   | JWT user profile         |
| GET    | /api/protected/rate-status  | any   | Current rate limit usage |
| GET    | /api/protected/admin        | admin | Admin-only endpoint      |

## Frontend Pages

| Path        | Access | Description                        |
|-------------|--------|------------------------------------|
| /login      | public | Login form                         |
| /dashboard  | auth   | Profile + rate limit status        |
| /admin      | admin  | System health + admin API response |

## Dev Credentials

| Email               | Password    | Role  |
|---------------------|-------------|-------|
| admin@gateway.dev   | password123 | admin |
| user@gateway.dev    | password123 | user  |

## Environment Variables

### gateway/.env

| Variable          | Default                  | Required |
|-------------------|--------------------------|----------|
| PORT              | 5000                     | No       |
| NODE_ENV          | development              | No       |
| JWT_SECRET        | —                        | YES      |
| REDIS_URL         | redis://localhost:6379   | No       |
| RATE_LIMIT_MAX    | 100                      | No       |
| RATE_LIMIT_WINDOW | 60                       | No       |
| CORS_ORIGINS      | http://localhost:3000    | No       |

### frontend/.env.local

| Variable             | Default                | Description                  |
|----------------------|------------------------|------------------------------|
| NEXT_PUBLIC_API_URL  | http://localhost:3000  | Gateway URL for API rewrites |

## Production Deployment

### Gateway
1. Set `NODE_ENV=production`
2. Set a strong `JWT_SECRET` — `openssl rand -hex 64`
3. Point `REDIS_URL` at your production Redis
4. Set `CORS_ORIGINS` to your frontend domain
5. `npm start`

### Frontend
1. Set `NEXT_PUBLIC_API_URL` to your gateway URL
2. `npm run build && npm start` or deploy to Vercel
