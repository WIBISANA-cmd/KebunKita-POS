# syntax=docker/dockerfile:1

# ---- 1. Aset frontend (Vite + React) --------------------------------------
FROM node:24-alpine AS aset
WORKDIR /app
COPY package.json package-lock.json .npmrc ./
RUN npm ci
COPY vite.config.ts tsconfig.json ./
COPY resources ./resources
COPY public ./public
RUN npm run build

# ---- 2. PHP dasar dengan ekstensi yang dibutuhkan aplikasi ------------------
FROM php:8.5-fpm-alpine AS dasar
ADD --chmod=755 https://github.com/mlocati/docker-php-extension-installer/releases/latest/download/install-php-extensions /usr/local/bin/
RUN install-php-extensions pdo_pgsql pgsql bcmath intl zip gd pcntl opcache \
    && apk add --no-cache nginx supervisor su-exec

# ---- 3. Dependensi Composer tanpa paket development -------------------------
FROM dasar AS vendor
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
WORKDIR /var/www/html
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-interaction --no-scripts --no-autoloader --prefer-dist
COPY . .
RUN composer dump-autoload --no-dev --optimize --no-scripts

# ---- 4. Image akhir ---------------------------------------------------------
FROM dasar AS produksi
WORKDIR /var/www/html
COPY --from=vendor --chown=www-data:www-data /var/www/html ./
COPY --from=aset --chown=www-data:www-data /app/public/build ./public/build

COPY docker/php.ini /usr/local/etc/php/conf.d/zz-kebunkita.ini
COPY docker/fpm-pool.conf /usr/local/etc/php-fpm.d/zz-kebunkita.conf
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY --chmod=755 docker/entrypoint.sh /usr/local/bin/entrypoint

RUN ln -sfn ../storage/app/public public/storage \
    && php artisan package:discover --ansi

EXPOSE 80
ENTRYPOINT ["entrypoint"]
CMD ["supervisord", "-c", "/etc/supervisord.conf"]
