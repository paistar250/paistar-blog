#!/usr/bin/env bash
set -Eeuo pipefail
test "$(id -u)" -eq 0
source_dir=${1:?Source directory required}
release=${2:?Release identifier required}
[[ "$release" =~ ^[a-z0-9-]{7,60}$ ]]
deploy_dir=/opt/paistar/apps/blog
install -d -m 0755 "$deploy_dir" /srv/paistar/caddy/data /srv/paistar/caddy/config
install -d -o 1000 -g 1000 -m 0750 /srv/paistar/uploads
install -d -m 0700 "$deploy_dir/secrets"
if ! test -s "$deploy_dir/secrets/db-password"; then
  install -o 1000 -g 1000 -m 0400 /opt/paistar/infra/secrets/mysql-app-password "$deploy_dir/secrets/db-password"
fi
if ! test -s "$deploy_dir/secrets/admin-initial-password"; then
  umask 077
  openssl rand -base64 30 > "$deploy_dir/secrets/admin-initial-password"
  chown 1000:1000 "$deploy_dir/secrets/admin-initial-password"
  chmod 0400 "$deploy_dir/secrets/admin-initial-password"
fi
docker build -t "paistar-blog:$release" "$source_dir"
if ! test -f "$deploy_dir/.env"; then
  docker pull --quiet caddy:2-alpine
  caddy_image=$(docker image inspect caddy:2-alpine --format '{{index .RepoDigests 0}}')
else
  caddy_image=$(sed -n 's/^CADDY_IMAGE=//p' "$deploy_dir/.env")
  cp "$deploy_dir/.env" "$deploy_dir/previous-release.env"
fi
install -m 0644 "$source_dir/deploy/compose.yaml" "$deploy_dir/compose.yaml"
if test -f "$deploy_dir/public-tls-enabled"; then
  cat "$source_dir/deploy/Caddyfile" > "$deploy_dir/Caddyfile"
  preview_origin=
else
  cat "$source_dir/deploy/Caddyfile.preview" > "$deploy_dir/Caddyfile"
  preview_origin=https://localhost:8443
fi
printf 'BLOG_IMAGE=paistar-blog:%s\nCADDY_IMAGE=%s\nPREVIEW_ORIGIN=%s\n' "$release" "$caddy_image" "$preview_origin" > "$deploy_dir/.env"
cd "$deploy_dir"
docker compose config --quiet
if ! docker compose up -d --wait --wait-timeout 240; then
  if test -s previous-release.env; then
    cp previous-release.env .env
    docker compose up -d --wait --wait-timeout 180
  fi
  exit 1
fi
docker compose exec -T caddy caddy reload --config /etc/caddy/Caddyfile
curl --fail --silent http://127.0.0.1:4321/api/health
printf '\nApplication deployed; administrator credentials remain in restricted server files.\n'
