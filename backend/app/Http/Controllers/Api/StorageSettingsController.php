<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Crypt;

class StorageSettingsController extends Controller
{
    private array $fields = ['provider', 'region', 'endpoint', 'bucket', 'access_key', 'secret_key'];
    private array $encrypted = ['secret_key'];

    public function show(): JsonResponse
    {
        $rows = DB::table('app_settings')
            ->whereIn('key', array_map(fn($f) => "storage_{$f}", $this->fields))
            ->pluck('value', 'key');

        $data = [];
        foreach ($this->fields as $field) {
            $dbKey = "storage_{$field}";
            $raw = $rows[$dbKey] ?? null;
            if ($raw && in_array($field, $this->encrypted)) {
                try {
                    $data[$field] = Crypt::decryptString($raw);
                } catch (\Exception) {
                    $data[$field] = '';
                }
            } else {
                $data[$field] = $raw ?? '';
            }
        }

        // Mask secret_key in response
        if (!empty($data['secret_key'])) {
            $data['secret_key'] = str_repeat('*', 11);
        }

        return response()->json($data);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'provider'   => ['nullable', 'string', 'max:100'],
            'region'     => ['nullable', 'string', 'max:100'],
            'endpoint'   => ['nullable', 'string', 'max:255'],
            'bucket'     => ['nullable', 'string', 'max:255'],
            'access_key' => ['nullable', 'string', 'max:255'],
            'secret_key' => ['nullable', 'string', 'max:255'],
        ]);

        foreach ($this->fields as $field) {
            $value = $request->input($field);
            if ($value === null) {
                continue;
            }
            // Don't overwrite secret_key if it's the masked placeholder
            if ($field === 'secret_key' && preg_match('/^\*+$/', $value)) {
                continue;
            }
            $dbKey = "storage_{$field}";
            $storeValue = in_array($field, $this->encrypted) ? Crypt::encryptString($value) : $value;
            DB::table('app_settings')->upsert(
                ['key' => $dbKey, 'value' => $storeValue, 'updated_at' => now(), 'created_at' => now()],
                ['key'],
                ['value', 'updated_at']
            );
        }

        return response()->json(['message' => 'Setările au fost salvate.']);
    }

    public function testConnection(Request $request): JsonResponse
    {
        // Try to get credentials from request body first, then from database
        $endpoint = $request->input('endpoint');
        $bucket = $request->input('bucket');
        $accessKey = $request->input('access_key');
        $secretKey = $request->input('secret_key');
        $region = $request->input('region');

        // If secret_key is masked (all *), load from database
        if ($secretKey && preg_match('/^\*+$/', $secretKey)) {
            $secretKey = null;
        }

        // If not in request, load from database
        if (!$endpoint || !$bucket || !$accessKey || !$secretKey) {
            $rows = DB::table('app_settings')
                ->whereIn('key', array_map(fn($f) => "storage_{$f}", $this->fields))
                ->pluck('value', 'key');

            $endpoint = $endpoint ?? ($rows['storage_endpoint'] ?? null);
            $bucket = $bucket ?? ($rows['storage_bucket'] ?? null);
            $accessKey = $accessKey ?? ($rows['storage_access_key'] ?? null);
            $region = $region ?? ($rows['storage_region'] ?? null) ?? 'us-east-1';
            
            $secretKeyEnc = $rows['storage_secret_key'] ?? null;
            if (!$secretKey && $secretKeyEnc) {
                try {
                    $secretKey = Crypt::decryptString($secretKeyEnc);
                } catch (\Exception) {
                    return response()->json(['message' => 'Secret key invalid/corupt.'], 422);
                }
            }
        }

        if (!$endpoint || !$bucket || !$accessKey || !$secretKey) {
            return response()->json(['message' => 'Configurația S3 este incompletă. Salvează setările înainte de test.'], 422);
        }

        try {
            $s3 = new \Aws\S3\S3Client([
                'version'                 => 'latest',
                'region'                  => $region ?? 'us-east-1',
                'endpoint'                => $endpoint,
                'use_path_style_endpoint' => true,
                'credentials'             => [
                    'key'    => $accessKey,
                    'secret' => $secretKey,
                ],
            ]);

            $s3->headBucket(['Bucket' => $bucket]);

            return response()->json(['message' => 'Conexiune reușită! Bucket-ul există și este accesibil.']);
        } catch (\Aws\Exception\AwsException $e) {
            $errorMsg = $e->getAwsErrorMessage() ?: $e->getMessage();
            return response()->json(['message' => 'Eroare S3: ' . $errorMsg], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Eroare: ' . $e->getMessage()], 422);
        }
    }
}
