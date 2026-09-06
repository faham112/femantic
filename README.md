# Femantic – Real-Time True Traffic Analytics

Production domain: **https://analytics.globalcareerhub.org**

## Production

DNS A record:

```
analytics.globalcareerhub.org  →  VPS IP
```

Then on the VPS:

```bash
cd /var/www/html/femantic
git pull origin main
sudo bash scripts/deploy-femantic.sh
sudo certbot --nginx -d analytics.globalcareerhub.org
```

- App: https://analytics.globalcareerhub.org
- Login: https://analytics.globalcareerhub.org/login
- Admin: `admin@femantic.com` / `Admin@12345`
- Tracker: https://analytics.globalcareerhub.org/tracker/femantic.js

### Install tracker

```html
<script defer
  data-site="YOUR_API_KEY"
  src="https://analytics.globalcareerhub.org/tracker/femantic.js"></script>
```

## Local Docker

```bash
cp .env.example .env
docker-compose up --build
```
