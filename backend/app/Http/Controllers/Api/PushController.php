<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Minishlink\WebPush\Subscription;
use Minishlink\WebPush\WebPush;

class PushController extends Controller
{
    private function makeWebPush(): WebPush
    {
        return new WebPush([
            'VAPID' => [
                'subject' => config('app.url'),
                'publicKey' => config('webpush.vapid_public_key'),
                'privateKey' => config('webpush.vapid_private_key'),
            ],
        ]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'string'],
            'keys.p256dh' => ['required', 'string'],
            'keys.auth' => ['required', 'string'],
        ]);

        PushSubscription::query()->updateOrCreate(
            ['endpoint' => $data['endpoint']],
            [
                'user_id' => $request->user()->id,
                'p256dh_key' => $data['keys']['p256dh'],
                'auth_key' => $data['keys']['auth'],
            ]
        );

        return response()->json(['message' => 'Subscribed']);
    }

    public function unsubscribe(Request $request): JsonResponse
    {
        $data = $request->validate([
            'endpoint' => ['required', 'string'],
        ]);

        PushSubscription::query()
            ->where('endpoint', $data['endpoint'])
            ->where('user_id', $request->user()->id)
            ->delete();

        return response()->json(['message' => 'Unsubscribed']);
    }

    public function vapidPublicKey(): JsonResponse
    {
        return response()->json([
            'publicKey' => config('webpush.vapid_public_key'),
        ]);
    }

    /** Send a push to all superadmin subscribers */
    public static function notifyAdmins(string $title, string $body): void
    {
        $adminIds = User::query()
            ->where('is_superadmin', true)
            ->pluck('id');

        if ($adminIds->isEmpty()) {
            return;
        }

        $subscriptions = PushSubscription::query()
            ->whereIn('user_id', $adminIds)
            ->get();

        if ($subscriptions->isEmpty()) {
            return;
        }

        try {
            $webPush = new WebPush([
                'VAPID' => [
                    'subject' => config('app.url'),
                    'publicKey' => config('webpush.vapid_public_key'),
                    'privateKey' => config('webpush.vapid_private_key'),
                ],
            ]);

            $payload = json_encode([
                'title' => $title,
                'body' => $body,
                'icon' => '/expenses/manifest.json',
            ]);

            foreach ($subscriptions as $sub) {
                $subscription = Subscription::create([
                    'endpoint' => $sub->endpoint,
                    'keys' => [
                        'p256dh' => $sub->p256dh_key,
                        'auth' => $sub->auth_key,
                    ],
                ]);
                $webPush->queueNotification($subscription, $payload);
            }

            foreach ($webPush->flush() as $report) {
                if (! $report->isSuccess()) {
                    // Remove expired/invalid subscriptions
                    PushSubscription::query()
                        ->where('endpoint', $report->getRequest()->getUri()->__toString())
                        ->delete();
                }
            }
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error('Push notification failed: '.$e->getMessage());
        }
    }
}
