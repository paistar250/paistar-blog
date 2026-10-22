#!/usr/bin/env bash
set -Eeuo pipefail
test "$(id -u)" -eq 0
source_dir=${1:?Source directory required}
deploy_dir=/opt/paistar/apps/blog
install -m 0644 "$source_dir/deploy/Caddyfile" "$deploy_dir/Caddyfile"
cd "$deploy_dir"
docker compose exec -T caddy caddy validate --config /etc/caddy/Caddyfile
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile
touch "$deploy_dir/public-tls-enabled"
sed -i 's|^PREVIEW_ORIGIN=.*|PREVIEW_ORIGIN=|' .env
docker compose up -d --wait --wait-timeout 180 app
