<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Throwable;

class EmailSettingController extends Controller
{
    public function get(): JsonResponse
    {
        $settings = EmailSetting::query()->first();

        if (! $settings) {
            return response()->json([
                'name' => '',
                'mailer' => 'SMTP',
                'host' => '',
                'port' => 587,
                'encryption' => 'TLS',
                'username' => '',
                'password' => '',
                'from_address' => '',
                'from_name' => '',
                'monitoring_alert_recipient' => '',
                'active' => true,
            ]);
        }

        return response()->json($settings);
    }

    public function put(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'mailer' => ['required', 'string', 'max:50'],
            'host' => ['required', 'string', 'max:255'],
            'port' => ['required', 'integer', 'min:1', 'max:65535'],
            'encryption' => ['nullable', 'string', 'max:20'],
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
            'from_address' => ['required', 'email', 'max:255'],
            'from_name' => ['required', 'string', 'max:255'],
            'monitoring_alert_recipient' => ['required', 'email', 'max:255'],
            'active' => ['boolean'],
        ]);

        $settings = EmailSetting::query()->first();

        if (! $settings) {
            $settings = EmailSetting::query()->create($payload);
        } else {
            $settings->fill($payload)->save();
        }

        return response()->json($settings);
    }

    public function delete(): JsonResponse
    {
        EmailSetting::query()->delete();

        return response()->json([
            'message' => 'Email settings deleted',
        ]);
    }

    public function test(Request $request): JsonResponse
    {
        $payload = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'mailer' => ['required', 'string', 'max:50'],
            'host' => ['required', 'string', 'max:255'],
            'port' => ['required', 'integer', 'min:1', 'max:65535'],
            'encryption' => ['nullable', 'string', 'max:20'],
            'username' => ['required', 'string', 'max:255'],
            'password' => ['required', 'string'],
            'from_address' => ['required', 'email', 'max:255'],
            'from_name' => ['required', 'string', 'max:255'],
            'monitoring_alert_recipient' => ['required', 'email', 'max:255'],
            'active' => ['boolean'],
        ]);

        if (isset($payload['active']) && ! $payload['active']) {
            return response()->json([
                'message' => 'Email is disabled. Enable it before sending a test email.',
            ], 422);
        }

        $mailer = strtolower((string) $payload['mailer']);
        $encryption = $payload['encryption'] ?? null;

        config([
            'mail.default' => $mailer,
            "mail.mailers.{$mailer}.transport" => $mailer,
            "mail.mailers.{$mailer}.host" => $payload['host'],
            "mail.mailers.{$mailer}.port" => (int) $payload['port'],
            "mail.mailers.{$mailer}.encryption" => $encryption ? strtolower($encryption) : null,
            "mail.mailers.{$mailer}.username" => $payload['username'],
            "mail.mailers.{$mailer}.password" => $payload['password'],
            'mail.from.address' => $payload['from_address'],
            'mail.from.name' => $payload['from_name'],
        ]);

        try {
            Mail::raw('This is a test email from Expenses settings.', function ($message) use ($payload) {
                $message
                    ->to($payload['monitoring_alert_recipient'])
                    ->subject('Expenses - test email');
            });

            return response()->json([
                'message' => 'Test email sent successfully.',
            ]);
        } catch (Throwable $e) {
            return response()->json([
                'message' => 'Failed to send test email: '.$e->getMessage(),
            ], 422);
        }
    }
}
