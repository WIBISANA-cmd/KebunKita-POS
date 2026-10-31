#!/bin/sh
set -e

cd /var/www/html

if [ -z "$APP_KEY" ]; then
    echo "APP_KEY wajib diisi. Buat dengan: docker run --rm php:8.5-cli php -r \"echo 'base64:'.base64_encode(random_bytes(32)).PHP_EOL;\"" >&2
    exit 1
fi

mkdir -p \
    storage/app/public \
    storage/app/private \
    storage/framework/cache/data \
    storage/framework/sessions \
    storage/framework/views \
    storage/logs \
    bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

if [ "${RUN_MIGRATIONS:-false}" = "true" ]; then
    su-exec www-data php artisan migrate --force
fi

su-exec www-data php artisan optimize

if [ "$1" = "supervisord" ]; then
    exec "$@"
fi

exec su-exec www-data "$@"
