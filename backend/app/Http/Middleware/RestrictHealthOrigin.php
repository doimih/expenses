<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RestrictHealthOrigin
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->is('health')) {
            return $next($request);
        }

        $allowedOrigin = 'https://projects.doimih.net';
        $origin = $request->headers->get('origin');

        if ($origin !== $allowedOrigin) {
            return response()->json(['message' => 'Forbidden'], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }
}
