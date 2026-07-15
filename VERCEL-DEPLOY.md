# Deploying the dashboard to Vercel (dashboard.steez.digital)

Chosen path: free, matches how steez.digital is hosted. Trade-off accepted:
not China-optimized (see AGENTS.md/CLAUDE.md notes on the original Alibaba
plan in `DEPLOY.md` — revisit that if mainland reachability becomes a real
requirement later).

## 1. Import the repo

- [vercel.com/new](https://vercel.com/new) → Import Git Repository →
  `YXNGSTERX/steez-dashboard` (private repo — grant Vercel's GitHub App
  access to it if prompted).
- Framework preset: Next.js (auto-detected). Don't deploy yet — add the
  database and env vars first (next two steps), then hit Deploy.

## 2. Add Postgres

- In the new project → **Storage** tab → **Create Database** → **Postgres**
  (free Hobby tier) → Connect to this project.
- Vercel adds several env vars automatically (`POSTGRES_URL`,
  `POSTGRES_URL_NON_POOLING`, etc). Copy the value of
  **`POSTGRES_URL_NON_POOLING`** and set it as a new env var named
  `DATABASE_URL` (this app's code + `prisma.config.ts` only read
  `DATABASE_URL` — see `.env.production.example`).

## 3. Environment variables

Project → Settings → Environment Variables, add:

| Key | Value |
|---|---|
| `DATABASE_URL` | the `POSTGRES_URL_NON_POOLING` value from step 2 |
| `AUTH_SECRET` | generate your own: run `openssl rand -base64 32` locally, paste the output (never commit this value anywhere) |
| `PUBLIC_ALLOWED_ORIGINS` | `https://konlito.steez.digital` |
| `OSS_REGION` | `oss-cn-hongkong` |
| `OSS_ACCESS_KEY_ID` | *(leave blank for now — fill when you have real OSS creds; image upload will 500 until then, rest of the app works)* |
| `OSS_ACCESS_KEY_SECRET` | *(same)* |
| `OSS_BUCKET` | *(same)* |
| `ASSET_BASE_URL` | *(same)* |

## 4. Deploy

Click **Deploy**. The `vercel-build` script (`package.json`) runs
`prisma generate && prisma migrate deploy && next build` automatically —
migrations apply on every deploy, no manual step needed.

First deploy only — seed the Konlito tenant + owner. Either:
- Vercel dashboard → project → a one-off `vercel env pull` + local
  `npx tsx prisma/seed.ts` pointed at the new `DATABASE_URL`, or
- Add a temporary API route that calls the seed logic once, then remove it.

## 5. Domain

- Project → Settings → Domains → add `dashboard.steez.digital` → Vercel
  shows a CNAME (or A record) to add.
- In GoDaddy DNS: add that record for the `dashboard` subdomain.

## Known gaps until you're ready

- **Image upload** (`/api/upload`, product gallery) needs real Alibaba OSS
  credentials — currently blank. Everything else (auth, catalog CRUD,
  analytics, team, settings) works without them.
- **Not China-optimized.** If mainland factory staff need fast/reliable
  access later, migrate to the Alibaba ECS+RDS path documented in
  `DEPLOY.md` — that plan is fully scripted and ready, just needs
  provisioning (was paused mid-way when this Vercel path was chosen instead).
