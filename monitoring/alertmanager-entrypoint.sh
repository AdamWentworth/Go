#!/bin/sh
set -eu

sed \
  -e "s|\${ALERT_EMAIL_FROM}|${ALERT_EMAIL_FROM:-}|g" \
  -e "s|\${ALERT_EMAIL_USER}|${ALERT_EMAIL_USER:-}|g" \
  -e "s|\${ALERT_EMAIL_PASS}|${ALERT_EMAIL_PASS:-}|g" \
  /etc/alertmanager/alertmanager.tmpl.yml > /tmp/alertmanager.generated.yml

exec /bin/alertmanager --config.file=/tmp/alertmanager.generated.yml --storage.path=/alertmanager
