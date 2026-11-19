<?php

return [

    /*
    | Only the AI API is called from the browser. List the sites that may call
    | it in AI_ALLOWED_ORIGINS (comma-separated), e.g.
    | "https://biblequest.example,http://localhost:5173".
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['GET', 'POST', 'OPTIONS'],

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('AI_ALLOWED_ORIGINS', 'http://localhost:5173')),
    ))),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['Content-Type', 'Authorization', 'Accept'],

    'exposed_headers' => ['Retry-After'],

    'max_age' => 86400,

    'supports_credentials' => false,

];
