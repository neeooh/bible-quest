<?php

use App\Http\Controllers\Api\AiSessionController;
use App\Http\Controllers\Api\MentorChatController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1/ai')->group(function () {
    Route::post('session', AiSessionController::class)->middleware('throttle:10,1');
    Route::post('mentor', MentorChatController::class);
});
