#!/usr/bin/env bash
# Run ON the ECS host, from /srv/steez-dashboard (after `git clone` + first-time setup).
# Re-run this for every subsequent deploy.
set -euo pipefail

cd /srv/steez-dashboard

git pull origin main
npm ci
npx prisma migrate deploy
npm run build

pm2 reload deploy/ecosystem.config.js --update-env
pm2 save
