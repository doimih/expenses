<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class QaConnectorController extends Controller
{
    public function index(): JsonResponse
    {
        $rows = DB::table('qa_credentials')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($r) => [
                'id'          => $r->id,
                'name'        => $r->name,
                'notes'       => $r->notes,
                'key_prefix'  => $r->key_prefix,
                'scope'       => $r->scope,
                'last_used_at' => $r->last_used_at,
                'created_at'  => $r->created_at,
            ]);

        return response()->json($rows);
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'name'  => ['required', 'string', 'max:100'],
            'notes' => ['nullable', 'string', 'max:255'],
            'scope' => ['nullable', 'string', 'max:255'],
        ]);

        $rawKey = 'qa_' . Str::random(32);
        $prefix = substr($rawKey, 0, 12);
        $hash   = hash('sha256', $rawKey);

        $id = DB::table('qa_credentials')->insertGetId([
            'name'       => $request->name,
            'notes'      => $request->notes,
            'key_hash'   => $hash,
            'key_prefix' => $prefix,
            'scope'      => $request->scope ?? 'spectacole scan-jobs',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        return response()->json([
            'id'      => $id,
            'name'    => $request->name,
            'raw_key' => $rawKey, // shown only once
            'key_prefix' => $prefix,
            'scope'   => $request->scope ?? 'spectacole scan-jobs',
        ], 201);
    }

    public function rotate(int $id): JsonResponse
    {
        $row = DB::table('qa_credentials')->where('id', $id)->first();
        if (!$row) {
            return response()->json(['message' => 'Credential negăsit.'], 404);
        }

        $rawKey = 'qa_' . Str::random(32);
        $prefix = substr($rawKey, 0, 12);
        $hash   = hash('sha256', $rawKey);

        DB::table('qa_credentials')->where('id', $id)->update([
            'key_hash'   => $hash,
            'key_prefix' => $prefix,
            'updated_at' => now(),
        ]);

        return response()->json([
            'id'      => $id,
            'raw_key' => $rawKey, // shown only once
            'key_prefix' => $prefix,
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        DB::table('qa_credentials')->where('id', $id)->delete();
        return response()->json(['message' => 'Credential șters.']);
    }

    /**
     * Public endpoint – validates the X-QA-API-Key header and updates last_used_at.
     */
    public function health(Request $request): JsonResponse
    {
        $key = $request->header('X-QA-API-Key');
        if (!$key) {
            return response()->json(['message' => 'Missing X-QA-API-Key header.'], 401);
        }

        $hash = hash('sha256', $key);
        $row  = DB::table('qa_credentials')->where('key_hash', $hash)->first();

        if (!$row) {
            return response()->json(['message' => 'Invalid API key.'], 401);
        }

        DB::table('qa_credentials')->where('id', $row->id)->update(['last_used_at' => now()]);

        return response()->json(['status' => 'ok', 'credential' => $row->name]);
    }
}
