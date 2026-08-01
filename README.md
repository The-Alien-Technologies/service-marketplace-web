# Service Marketplace Web

React/Next.js 15 frontend for the Service Marketplace platform.

---

## Local Development

### Prerequisites
- Node.js 20+
- Backend API running locally

### Setup

```bash
npm install
npm run dev
```

App runs at `http://localhost:3001` (or whichever port Next.js picks).

### Environment Variables

Create a `.env.local` file in the project root (never commit this file):

```env
# Backend API (point to your local backend)
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# Better Auth
BETTER_AUTH_URL=http://localhost:3001
BETTER_AUTH_DATABASE_URL=file:./auth.db
NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3001

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Google Maps
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

**Variable types:**
- `NEXT_PUBLIC_*` — baked into the browser JS bundle **at build time**. Must be set as Docker build args for staging/production.
- Non-prefixed vars — server-only (API routes, server components). Pass as runtime container env vars.

---

## CI/CD Pipeline

The pipeline is defined in `.github/workflows/deploy.yml` and triggers on pushes to `main` or `staging`.

### What it does

1. Logs in to GitHub Container Registry (GHCR)
2. Reads branch-specific secrets and sets them as build args
3. Builds the Docker image with `NEXT_PUBLIC_*` vars baked in
4. Pushes the image to GHCR

### Image tags

| Branch | Tags |
|--------|------|
| `main` | `latest`, `main`, `main-<sha>` |
| `staging` | `staging-latest`, `staging`, `staging-<sha>` |

### Required GitHub Secrets

Set these in **GitHub → Settings → Secrets and variables → Actions**:

| Secret | Description |
|--------|-------------|
| `NEXT_PUBLIC_API_URL_PROD` | Production backend API URL (e.g. `https://api.yourdomain.com/api`) |
| `NEXT_PUBLIC_API_URL_STAGING` | Staging backend API URL (e.g. `https://api-staging.yourdomain.com/api`) |
| `NEXT_PUBLIC_BETTER_AUTH_URL_PROD` | Production auth URL |
| `NEXT_PUBLIC_BETTER_AUTH_URL_STAGING` | Staging auth URL |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps API key (shared across environments) |

> **Important:** `NEXT_PUBLIC_*` variables are compiled into the JS bundle — they cannot be changed after the image is built. Each environment needs its own image built with the correct values.

### Runtime secrets (set on your server/deployment platform)

These are **not** build args — pass them as environment variables when running the container:

| Variable | Description |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `BETTER_AUTH_SECRET` | Better Auth secret key |
| `BETTER_AUTH_DATABASE_URL` | Auth database connection string |
| `BETTER_AUTH_URL` | Auth server URL |

---

## Docker

### Build locally

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3000/api \
  --build-arg NEXT_PUBLIC_BETTER_AUTH_URL=http://localhost:3001 \
  --build-arg NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your-key \
  -t service-marketplace-web .
```

### Run

```bash
docker run -p 3000:3000 \
  -e GOOGLE_CLIENT_ID=your-id \
  -e GOOGLE_CLIENT_SECRET=your-secret \
  -e BETTER_AUTH_SECRET=your-secret \
  -e BETTER_AUTH_DATABASE_URL=your-db-url \
  -e BETTER_AUTH_URL=http://your-auth-url \
  service-marketplace-web
```

### Pull from GHCR

```bash
# Staging
docker pull ghcr.io/the-alien-technologies/service-marketplace-web:staging-latest

# Production
docker pull ghcr.io/the-alien-technologies/service-marketplace-web:latest
```

---

## Debugging

### Staging requests going to localhost

If the deployed app makes API calls to `http://localhost:3000`, the `NEXT_PUBLIC_API_URL_STAGING` secret is either:
- Empty
- Set to a localhost value

Check the "Verify build args" step in the GitHub Actions run — it prints the domain being baked in (e.g. `api-staging.yourdomain.com`).

### Build failures

- **TypeScript errors** — run `npm run build` locally first to catch them before pushing
- **ESLint errors** — run `npm run lint` locally
- **Google Fonts timeout (arm64)** — arm64 QEMU emulation on GitHub Actions has unreliable network access to Google Fonts CDN. The pipeline builds `linux/amd64` only to avoid this.

---

## Project Structure

See `PROJECT_STRUCTURE.md` for a full breakdown of the codebase.
