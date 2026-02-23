<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'expenses/health'],
    'allowed_methods' => ['*'],
    'allowed_origins' => ['http://localhost:15173', 'https://projects.doimih.net'],
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
