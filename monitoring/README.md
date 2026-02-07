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

Recommended for prod and local Docker Compose:

1. Create `monitoring/.env` (gitignored) with:
   - `ALERT_EMAIL_FROM`
   - `ALERT_EMAIL_USER`
   - `ALERT_EMAIL_PASS`
2. Use `--env-file monitoring/.env` when starting the stack.

## Start

```bash
docker compose -f monitoring/docker-compose.yml --env-file monitoring/.env up -d
```

## CI and CD

- CI workflow: `.github/workflows/ci-monitoring.yml`
  - Validates Prometheus config and alert rules (`promtool`)
  - Validates Alertmanager config syntax (`amtool`)
  - Validates compose rendering (`docker compose config`)

- Manual prod deploy workflow: `.github/workflows/deploy-monitoring-prod.yml`
  - Runs on your self-hosted prod runner
  - Pulls latest repo changes on prod
  - Ensures required Docker networks exist
  - Deploys `prometheus` + `alertmanager`
  - Checks health endpoints before success
