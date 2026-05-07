<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\EmailSetting;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
class AuthController extends Controller
{
    public function register(RegisterRequest $request): JsonResponse
    {
        $data = $request->validated();
        $fullName = trim(sprintf('%s %s', $data['first_name'], $data['last_name']));

        $user = User::query()->create([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'name' => $fullName,
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => User::ROLE_VISITOR,
            'is_superadmin' => false,
        ]);

        $token = $user->createToken($data['device_name'] ?? 'web')->plainTextToken;

        $this->sendNewUserNotification($user);
        PushController::notifyAdmins('New user registered', "{$user->name} ({$user->email}) just registered.");

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ], 201);
    }

    private function sendNewUserNotification(User $user): void
    {
        try {
            $settings = EmailSetting::query()->first();

            if (! $settings || ! $settings->active || ! $settings->monitoring_alert_recipient) {
                return;
            }

            $mailer = strtolower((string) $settings->mailer);
            $encryption = $settings->encryption ?? null;

            config([
                'mail.default' => $mailer,
                "mail.mailers.{$mailer}.transport" => $mailer,
                "mail.mailers.{$mailer}.host" => $settings->host,
                "mail.mailers.{$mailer}.port" => (int) $settings->port,
                "mail.mailers.{$mailer}.encryption" => $encryption ? strtolower($encryption) : null,
                "mail.mailers.{$mailer}.username" => $settings->username,
                "mail.mailers.{$mailer}.password" => $settings->password,
                'mail.from.address' => $settings->from_address,
                'mail.from.name' => $settings->from_name,
            ]);

            $recipient = $settings->monitoring_alert_recipient;
            $name = $user->name;
            $email = $user->email;
            $date = now()->format('d.m.Y H:i');

            Mail::html(
                "<h2>New user registered</h2>
                <p><strong>Name:</strong> {$name}</p>
                <p><strong>Email:</strong> {$email}</p>
                <p><strong>Date:</strong> {$date}</p>",
                function ($message) use ($recipient, $name) {
                    $message->to($recipient)->subject("New registration: {$name}");
                }
            );
        } catch (\Throwable $e) {
            Log::error('Failed to send new user notification email: '.$e->getMessage());
        }
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $data = $request->validated();
        $user = User::query()->where('email', $data['email'])->first();

        if (! $user || ! Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 422);
        }

        $token = $user->createToken($data['device_name'] ?? 'web')->plainTextToken;

        return response()->json([
            'token' => $token,
            'token_type' => 'Bearer',
            'user' => $user,
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    public function tokens(Request $request): JsonResponse
    {
        return response()->json(
            $request->user()->tokens()->get(['id', 'name', 'last_used_at', 'created_at'])
        );
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out']);
    }

    public function logoutAll(Request $request): JsonResponse
    {
        $request->user()->tokens()->delete();

        return response()->json(['message' => 'All tokens revoked']);
    }
}
