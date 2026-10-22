# PHP 8.5.12 fixes GHSA-w8hw-w9fx-j79w and GHSA-6wmf-4rv5-p3rp.
# Pin the verified multi-platform image, not a mutable PHP/FrankenPHP tag.
FROM dunglas/frankenphp:1.13.2-php8.5-alpine@sha256:1654329698f63194af20122a3c483f3259b715d2a304e39e6398cbb8e9efcfcf AS php-base

COPY backend/laravel/docker/prod/check-runtime.php /usr/local/lib/check-php-runtime.php
RUN php /usr/local/lib/check-php-runtime.php \
    && frankenphp php-cli /usr/local/lib/check-php-runtime.php

RUN install-php-extensions \
        pdo_pgsql \
        pgsql \
        bcmath \
        gd \
        zip \
        intl \
        mbstring

WORKDIR /var/www/html

FROM php-base AS build

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer
COPY backend/laravel/composer.json backend/laravel/composer.lock ./
RUN composer install \
        --no-dev \
        --no-scripts \
        --no-autoloader \
        --prefer-dist \
        --no-interaction \
        --no-progress

COPY backend/laravel/ ./
COPY crawler/data/saved_superstars.json seed-data/saved_superstars.json
COPY crawler/data/matches/ seed-data/royal_rumble_matches/
COPY crawler/data/images/ seed-data/wrestlers/

RUN composer dump-autoload --classmap-authoritative --no-dev \
    && rm -rf /root/.composer /tmp/*

FROM php-base AS runtime

ENV XDG_CONFIG_HOME=/tmp/caddy/config \
    XDG_DATA_HOME=/tmp/caddy/data \
    HOME=/tmp

COPY --from=build --chown=www-data:www-data /var/www/html /var/www/html
COPY backend/laravel/docker/prod/Caddyfile /etc/frankenphp/Caddyfile

RUN mkdir -p \
        storage/app/public \
        storage/framework/cache/data \
        storage/framework/sessions \
        storage/framework/views \
        storage/logs \
        bootstrap/cache \
        /tmp/caddy/config \
        /tmp/caddy/data \
    && php artisan storage:link \
    && chown -R www-data:www-data storage bootstrap/cache /tmp/caddy \
    && setcap -r /usr/local/bin/frankenphp

USER 82:82

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD php -r 'exit(@file_get_contents("http://127.0.0.1:8080/api/health") === false ? 1 : 0);'

ENTRYPOINT ["frankenphp", "run", "--config", "/etc/frankenphp/Caddyfile"]
