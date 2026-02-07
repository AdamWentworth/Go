# Monitoring Stack

This folder runs Prometheus + Alertmanager for the Pokemon service.

## Severe Email Alerts

Alertmanager is configured to email only `severity="critical"` alerts to:

- `adamjohnwentworth@gmail.com`

Set SMTP credentials on the host before starting `monitoring/docker-compose.yml`:

```powershell
$env:ALERT_EMAIL_FROM="adamjohnwentworth@gmail.com"
$env:ALERT_EMAIL_USER="adamjohnwentworth@gmail.com"
$env:ALERT_EMAIL_PASS="<gmail-app-password>"
```

Gmail requires an App Password when 2FA is enabled.

If you keep secrets in the repo-root `.env`, include it explicitly:

```bash
docker compose -f monitoring/docker-compose.yml --env-file .env up -d
```

## Start

```bash
docker compose -f monitoring/docker-compose.yml up -d
```
