FROM php:8.3-cli

WORKDIR /var/www

RUN apt-get update && apt-get install -y \
    git \
    unzip \
    curl \
    libpq-dev \
    postgresql-client \
    && docker-php-ext-install pdo pdo_pgsql \
    && rm -rf /var/lib/apt/lists/*

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

RUN composer create-project laravel/laravel /tmp/laravel --no-interaction \
    && cp -a /tmp/laravel/. /var/www/ \
    && rm -rf /tmp/laravel \
    && composer require laravel/sanctum aws/aws-sdk-php --no-interaction

COPY . /app-overlay
RUN rm -f /var/www/database/migrations/*_create_users_table.php \
    && rm -f /var/www/database/migrations/*_create_password_reset_tokens_table.php \
    && rm -f /var/www/database/migrations/*_create_sessions_table.php \
    && cp -r /app-overlay/app/* /var/www/app/ \
    && cp -r /app-overlay/bootstrap/* /var/www/bootstrap/ \
    && cp -r /app-overlay/routes/* /var/www/routes/ \
    && cp -r /app-overlay/config/* /var/www/config/ \
    && cp -r /app-overlay/database/* /var/www/database/ \
    && cp /app-overlay/entrypoint.sh /usr/local/bin/entrypoint.sh \
    && chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
