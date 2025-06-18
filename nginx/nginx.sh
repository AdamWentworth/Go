#!/bin/bash

NGINX_CONF="/media/adam/storage/Code/Go/nginx/nginx.conf"

case "$1" in
  start)
    echo "Starting Nginx with custom config..."
    sudo nginx -c "$NGINX_CONF" -g "daemon off;"
    ;;
  stop)
    echo "Stopping Nginx..."
    sudo nginx -s stop
    ;;
  reload)
    echo "Reloading Nginx..."
    sudo nginx -s reload
    ;;
  *)
    echo "Usage: $0 {start|stop|reload}"
    ;;
esac
