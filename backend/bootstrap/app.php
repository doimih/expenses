<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\RestrictHealthOrigin;
use App\Http\Middleware\SuperadminMiddleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
           health: '/health',
    )
    ->withMiddleware(function (Middleware $middleware) {
           $middleware->append(RestrictHealthOrigin::class);
           $middleware->alias(['superadmin' => SuperadminMiddleware::class]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
