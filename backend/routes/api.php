<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BackupController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\EmailSettingController;
use App\Http\Controllers\Api\PushController;
use App\Http\Controllers\Api\QaConnectorController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\StorageSettingsController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

Route::get('/push/vapid-public-key', [PushController::class, 'vapidPublicKey']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/auth/tokens', [AuthController::class, 'tokens']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout-all', [AuthController::class, 'logoutAll']);

    Route::post('/push/subscribe', [PushController::class, 'subscribe']);
    Route::post('/push/unsubscribe', [PushController::class, 'unsubscribe']);

    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('expenses', ExpenseController::class);
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::put('/users/{user}/password', [UserController::class, 'updatePassword']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);

    Route::get('/reports/monthly', [ReportController::class, 'monthly']);
    Route::get('/reports/admin-overview', [ReportController::class, 'adminOverview']);

    // Settings - superadmin only
    Route::middleware('superadmin')->group(function () {
        Route::get('/settings/storage', [StorageSettingsController::class, 'show']);
        Route::put('/settings/storage', [StorageSettingsController::class, 'update']);
        Route::post('/settings/storage/test', [StorageSettingsController::class, 'testConnection']);

        Route::get('/settings/email', [EmailSettingController::class, 'get']);
        Route::put('/settings/email', [EmailSettingController::class, 'put']);
        Route::delete('/settings/email', [EmailSettingController::class, 'delete']);
        Route::post('/settings/email/test', [EmailSettingController::class, 'test']);

        Route::get('/settings/backup/scheduler', [BackupController::class, 'getScheduler']);
        Route::put('/settings/backup/scheduler', [BackupController::class, 'saveScheduler']);
        Route::post('/settings/backup/run', [BackupController::class, 'runNow']);
        Route::get('/settings/backup/history', [BackupController::class, 'history']);
        Route::post('/settings/backup/restore/{id}', [BackupController::class, 'restore']);

        // QA Connector credentials management
        Route::get('/settings/qa-connector', [QaConnectorController::class, 'index']);
        Route::post('/settings/qa-connector', [QaConnectorController::class, 'store']);
        Route::post('/settings/qa-connector/{id}/rotate', [QaConnectorController::class, 'rotate']);
        Route::delete('/settings/qa-connector/{id}', [QaConnectorController::class, 'destroy']);
    });
});

// Public QA Connector health endpoint (no auth required, uses X-QA-API-Key)
Route::get('/qa-connector/health', [QaConnectorController::class, 'health']);
