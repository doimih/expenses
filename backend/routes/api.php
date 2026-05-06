<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::get('/auth/tokens', [AuthController::class, 'tokens']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::post('/auth/logout-all', [AuthController::class, 'logoutAll']);

    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('expenses', ExpenseController::class);
    Route::get('/users', [UserController::class, 'index']);
    Route::post('/users', [UserController::class, 'store']);
    Route::put('/users/{user}', [UserController::class, 'update']);
    Route::put('/users/{user}/password', [UserController::class, 'updatePassword']);
    Route::delete('/users/{user}', [UserController::class, 'destroy']);

    Route::get('/reports/monthly', [ReportController::class, 'monthly']);
    Route::get('/reports/admin-overview', [ReportController::class, 'adminOverview']);
});
