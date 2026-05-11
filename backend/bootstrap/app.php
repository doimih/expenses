<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Http\Middleware\RestrictHealthOrigin;
use App\Http\Middleware\SuperadminMiddleware;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

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
        $exceptions->report(function (Throwable $e): void {
            if ($e instanceof ValidationException || $e instanceof AuthenticationException || $e instanceof AuthorizationException) {
                return;
            }

            if ($e instanceof HttpExceptionInterface && $e->getStatusCode() < 500) {
                return;
            }

            try {
                $request = app()->runningInConsole() ? null : request();
                $user = $request?->user();
                $context = [
                    'url' => $request?->fullUrl(),
                    'route' => $request?->route()?->getName(),
                    'ip' => $request?->ip(),
                    'user_agent' => $request?->userAgent(),
                ];

                DB::table('platform_error_logs')->insert([
                    'occurred_at' => now(),
                    'source' => app()->runningInConsole() ? 'console' : 'http',
                    'level' => 'error',
                    'exception_class' => $e::class,
                    'message' => $e->getMessage() ?: $e::class,
                    'request_method' => $request?->method(),
                    'request_path' => $request ? '/'.ltrim($request->path(), '/') : 'console',
                    'route_name' => $request?->route()?->getName(),
                    'ip_address' => $request?->ip(),
                    'user_id' => $user?->id,
                    'user_email' => $user?->email,
                    'user_role' => $user?->role,
                    'context' => json_encode($context, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    'trace' => $e->getTraceAsString(),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } catch (Throwable) {
                // Do not allow error logging to break the original exception flow.
            }
        });
    })->create();
