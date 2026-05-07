<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

class BackupController extends Controller
{
    public function getScheduler(): JsonResponse
    {
        $rows = DB::table('app_settings')
            ->whereIn('key', ['backup_hour', 'backup_minute', 'backup_active'])
            ->pluck('value', 'key');

        $now = now('UTC');
        $hour   = (int) ($rows['backup_hour'] ?? 3);
        $minute = (int) ($rows['backup_minute'] ?? 0);
        $active = filter_var($rows['backup_active'] ?? 'true', FILTER_VALIDATE_BOOLEAN);

        // Calculate next run
        $next = now('UTC')->setTime($hour, $minute, 0);
        if ($next->lte($now)) {
            $next->addDay();
        }

        $lastLog = DB::table('backup_logs')
            ->orderByDesc('started_at')
            ->first();

        return response()->json([
            'hour'       => $hour,
            'minute'     => $minute,
            'active'     => $active,
            'server_now' => $now->format('d.m.Y, H:i:s'),
            'next_run_utc' => $next->format('d.m.Y, H:i:00'),
            'last_run'   => $lastLog ? \Carbon\Carbon::parse($lastLog->started_at)->format('d.m.Y, H:i:00') : null,
        ]);
    }

    public function saveScheduler(Request $request): JsonResponse
    {
        $request->validate([
            'hour'   => ['required', 'integer', 'min:0', 'max:23'],
            'minute' => ['required', 'integer', 'min:0', 'max:59'],
            'active' => ['required', 'boolean'],
        ]);

        foreach (['hour' => $request->hour, 'minute' => $request->minute, 'active' => $request->active ? 'true' : 'false'] as $k => $v) {
            DB::table('app_settings')->upsert(
                ['key' => "backup_{$k}", 'value' => (string) $v, 'updated_at' => now(), 'created_at' => now()],
                ['key'],
                ['value', 'updated_at']
            );
        }

        return response()->json(['message' => 'Scheduler salvat.']);
    }

    public function runNow(): JsonResponse
    {
        // Get S3 settings
        $rows = DB::table('app_settings')
            ->whereIn('key', ['storage_endpoint', 'storage_bucket', 'storage_access_key', 'storage_secret_key', 'storage_region'])
            ->pluck('value', 'key');

        if (!($rows['storage_endpoint'] ?? null) || !($rows['storage_bucket'] ?? null)) {
            return response()->json(['message' => 'Configurați mai întâi setările S3.'], 422);
        }

        $logId = DB::table('backup_logs')->insertGetId([
            'started_at' => now(),
            'status'     => 'running',
            'details'    => 'Backup în curs...',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        try {
            $secretKey = Crypt::decryptString($rows['storage_secret_key']);
        } catch (\Exception) {
            DB::table('backup_logs')->where('id', $logId)->update(['status' => 'error', 'details' => 'Secret key invalid.', 'updated_at' => now()]);
            return response()->json(['message' => 'Secret key invalid.'], 422);
        }

        // Run pg_dump
        $dbHost = env('DB_HOST', 'postgres');
        $dbPort = env('DB_PORT', '5432');
        $dbName = env('DB_DATABASE', 'expenses');
        $dbUser = env('DB_USERNAME', 'expenses');
        $dbPass = env('DB_PASSWORD', 'expenses');

        $filename  = 'backup_' . now()->format('Ymd_His') . '.sql';
        $localPath = sys_get_temp_dir() . '/' . $filename;

        $cmd = sprintf(
            'PGPASSWORD=%s pg_dump -h %s -p %s -U %s -d %s --clean -F p -f %s 2>&1',
            escapeshellarg($dbPass),
            escapeshellarg($dbHost),
            escapeshellarg($dbPort),
            escapeshellarg($dbUser),
            escapeshellarg($dbName),
            escapeshellarg($localPath)
        );

        exec($cmd, $output, $exitCode);

        if ($exitCode !== 0) {
            $detail = 'pg_dump failed: ' . implode(' ', $output);
            DB::table('backup_logs')->where('id', $logId)->update(['status' => 'error', 'details' => $detail, 'updated_at' => now()]);
            return response()->json(['message' => $detail], 500);
        }

        // Upload to S3
        try {
            $s3 = new \Aws\S3\S3Client([
                'version'                 => 'latest',
                'region'                  => $rows['storage_region'] ?? 'us-east-1',
                'endpoint'                => $rows['storage_endpoint'],
                'use_path_style_endpoint' => true,
                'credentials'             => [
                    'key'    => $rows['storage_access_key'],
                    'secret' => $secretKey,
                ],
            ]);

            $s3->putObject([
                'Bucket'     => $rows['storage_bucket'],
                'Key'        => $filename,
                'SourceFile' => $localPath,
            ]);

            @unlink($localPath);

            DB::table('backup_logs')->where('id', $logId)->update([
                'status'    => 'success',
                'details'   => 'Backup uploaded.',
                'file_path' => $filename,
                'updated_at' => now(),
            ]);

            return response()->json(['message' => 'Backup realizat cu succes.']);
        } catch (\Exception $e) {
            @unlink($localPath);
            $detail = 'Upload S3 eșuat: ' . $e->getMessage();
            DB::table('backup_logs')->where('id', $logId)->update(['status' => 'error', 'details' => $detail, 'updated_at' => now()]);
            return response()->json(['message' => $detail], 500);
        }
    }

    public function history(): JsonResponse
    {
        $logs = DB::table('backup_logs')
            ->orderByDesc('started_at')
            ->limit(50)
            ->get()
            ->map(fn($row) => [
                'id'         => $row->id,
                'started_at' => \Carbon\Carbon::parse($row->started_at)->format('d.m.Y, H:i:00'),
                'status'     => $row->status,
                'details'    => $row->details,
                'file_path'  => $row->file_path,
            ]);

        return response()->json($logs);
    }

    public function restore(Request $request, int $id): JsonResponse
    {
        $log = DB::table('backup_logs')->where('id', $id)->where('status', 'success')->first();
        if (!$log || !$log->file_path) {
            return response()->json(['message' => 'Backup nu a fost găsit sau nu e valid.'], 404);
        }

        $rows = DB::table('app_settings')
            ->whereIn('key', ['storage_endpoint', 'storage_bucket', 'storage_access_key', 'storage_secret_key', 'storage_region'])
            ->pluck('value', 'key');

        try {
            $secretKey = Crypt::decryptString($rows['storage_secret_key']);
        } catch (\Exception) {
            return response()->json(['message' => 'Secret key invalid.'], 422);
        }

        try {
            $s3 = new \Aws\S3\S3Client([
                'version'                 => 'latest',
                'region'                  => $rows['storage_region'] ?? 'us-east-1',
                'endpoint'                => $rows['storage_endpoint'],
                'use_path_style_endpoint' => true,
                'credentials'             => [
                    'key'    => $rows['storage_access_key'],
                    'secret' => $secretKey,
                ],
            ]);

            $localPath = sys_get_temp_dir() . '/' . basename($log->file_path);
            $s3->getObject([
                'Bucket' => $rows['storage_bucket'],
                'Key'    => $log->file_path,
                'SaveAs' => $localPath,
            ]);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Download S3 eșuat: ' . $e->getMessage()], 500);
        }

        $dbHost = env('DB_HOST', 'postgres');
        $dbPort = env('DB_PORT', '5432');
        $dbName = env('DB_DATABASE', 'expenses');
        $dbUser = env('DB_USERNAME', 'expenses');
        $dbPass = env('DB_PASSWORD', 'expenses');

        $cmd = sprintf(
            'PGPASSWORD=%s psql -h %s -p %s -U %s -d %s -f %s 2>&1',
            escapeshellarg($dbPass),
            escapeshellarg($dbHost),
            escapeshellarg($dbPort),
            escapeshellarg($dbUser),
            escapeshellarg($dbName),
            escapeshellarg($localPath)
        );

        exec($cmd, $output, $exitCode);
        @unlink($localPath);

        if ($exitCode !== 0) {
            return response()->json(['message' => 'Restore eșuat: ' . implode(' ', $output)], 500);
        }

        return response()->json(['message' => 'Restore realizat cu succes.']);
    }
}
