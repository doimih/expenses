<?php

namespace App\Support;

use Illuminate\Http\Request;

final class LocalizedMessage
{
    public static function isRomanian(?Request $request = null): bool
    {
        $source = $request?->header('Accept-Language') ?? request()->header('Accept-Language') ?? app()->getLocale() ?? 'ro';

        return str_starts_with(strtolower((string) $source), 'ro');
    }

    public static function text(string $ro, string $en, ?Request $request = null): string
    {
        return self::isRomanian($request) ? $ro : $en;
    }
}