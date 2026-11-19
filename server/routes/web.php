<?php

use Illuminate\Support\Facades\Route;

// This app only serves the JSON API under /api; the PWA is hosted separately.
Route::get('/', fn () => response()->json(['service' => 'BibleQuest API']));
