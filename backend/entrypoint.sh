#!/usr/bin/env bash
set -e

cd /var/www

if [ ! -f .env ]; then
  cp .env.example .env
fi

set_env() {
  key="$1"
  value="$2"
  if grep -q "^${key}=" .env; then
    sed -i "s#^${key}=.*#${key}=${value}#" .env
  else
    echo "${key}=${value}" >> .env
  fi
}

set_env "APP_ENV" "${APP_ENV:-local}"
set_env "APP_URL" "${APP_URL:-http://localhost:18000}"
set_env "DB_CONNECTION" "${DB_CONNECTION:-pgsql}"
set_env "DB_HOST" "${DB_HOST:-postgres}"
set_env "DB_PORT" "${DB_PORT:-5432}"
set_env "DB_DATABASE" "${DB_DATABASE:-expenses}"
set_env "DB_USERNAME" "${DB_USERNAME:-expenses}"
set_env "DB_PASSWORD" "${DB_PASSWORD:-expenses}"

if [ -z "${APP_KEY}" ] || [ "${APP_KEY}" = "base64:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=" ]; then
  php artisan key:generate --force
fi

php artisan migrate --force
php artisan serve --host=0.0.0.0 --port=8000
