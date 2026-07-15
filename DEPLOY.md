# Deploying the dashboard to Alibaba Cloud (dashboard.steez.digital)

Unlike Konlito (static export → OSS+CDN), this app needs a live Node server
+ Postgres. Target: single ECS instance running the Next.js server via PM2
behind Nginx, RDS Postgres in the same VPC, DNS on GoDaddy pointed at the ECS
public IP. No ICP filing needed — `cn-hongkong` region isn't mainland.

## 0. Provision (console or `aliyun` CLI — account-level, do this yourself
   or hand me an AccessKey with ECS/RDS/VPC/OSS permissions)

- **ECS**: `ecs.c6.large` (2 vCPU/4GB), region `cn-hongkong`, Ubuntu 22.04.
  Security group: open 22 (SSH, your IP only), 80, 443.
- **RDS**: ApsaraDB PostgreSQL, smallest tier, **same VPC** as the ECS
  instance. Create DB `steez_dashboard` + a user/password.
- **OSS bucket**: same pattern as Konlito's (`CHINA-DEPLOY.md`), region
  `oss-cn-hongkong`. Public-read or CDN in front. Get an AccessKey scoped to
  this bucket for `OSS_ACCESS_KEY_ID`/`OSS_ACCESS_KEY_SECRET`.
- Note the ECS instance's **public IP** for step 4.

## 1. First-time server setup (SSH into the ECS instance)

```bash
sudo apt update && sudo apt install -y nginx postgresql-client
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2

sudo mkdir -p /srv/steez-dashboard
sudo chown $USER:$USER /srv/steez-dashboard
git clone https://github.com/YXNGSTERX/steez-dashboard.git /srv/steez-dashboard
cd /srv/steez-dashboard
cp .env.production.example .env
# edit .env: fill DATABASE_URL (RDS internal endpoint), AUTH_SECRET
# (openssl rand -base64 32), OSS_* creds, PUBLIC_ALLOWED_ORIGINS
npm ci
npx prisma migrate deploy
npx tsx prisma/seed.ts   # only on very first setup — seeds Konlito tenant + owner
npm run build

pm2 start deploy/ecosystem.config.js
pm2 save
pm2 startup   # follow its printed instructions to enable on-boot
```

## 2. Nginx + TLS

```bash
sudo cp deploy/nginx.conf.template /etc/nginx/sites-available/dashboard.steez.digital
sudo ln -s /etc/nginx/sites-available/dashboard.steez.digital /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d dashboard.steez.digital
```

## 3. DNS (GoDaddy)

Add an A record:

```
A   dashboard   ->   <ECS public IP>
```

## 4. Every subsequent deploy

```bash
ssh <user>@<ecs-ip>
cd /srv/steez-dashboard
./deploy/deploy.sh
```

## 5. Wire Konlito's live site to this dashboard (optional, separate step)

Once this is live and reachable at `https://dashboard.steez.digital`, Konlito's
public site can point its live-data fetch (`lib/liveData.ts`) and tracking
calls (`lib/tracking.ts`) at this URL instead of `localhost:3002`. Not done as
part of this deploy — a deliberate follow-up once the dashboard's proven
stable in production.
