<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Expense;
use App\Models\User;
use App\Services\MonthlyReportService;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReportController extends Controller
{
    public function __construct(private readonly MonthlyReportService $monthlyReportService)
    {
    }

    public function monthly(Request $request): JsonResponse
    {
        $month = $request->query('month', Carbon::now()->format('Y-m'));

        abort_unless(preg_match('/^\d{4}-\d{2}$/', $month) === 1, 422, 'Invalid month format. Use YYYY-MM.');

        return response()->json(
            $this->monthlyReportService->build($request->user()->id, $month)
        );
    }

    public function adminOverview(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isSuperadmin(), 403, 'Only superadmin can view admin overview.');

        $month = $request->query('month', Carbon::now()->format('Y-m'));
        $page = max(1, (int) $request->query('page', 1));
        $perPage = max(1, min(100, (int) $request->query('per_page', 50)));
        abort_unless(preg_match('/^\d{4}-\d{2}$/', $month) === 1, 422, 'Invalid month format. Use YYYY-MM.');

        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = (clone $start)->endOfMonth();

        $usersPreview = User::query()
            ->orderByDesc('created_at')
            ->limit(4)
            ->get(['id', 'first_name', 'last_name', 'name', 'email', 'role', 'created_at'])
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => trim("{$user->first_name} {$user->last_name}") ?: $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'status' => 'Active',
                'created_at' => $user->created_at,
            ])
            ->values();

        $recentUsers = User::query()
            ->whereBetween('created_at', [$start, $end])
            ->orderByDesc('created_at')
            ->limit(max(100, $perPage * 6))
            ->get(['id', 'first_name', 'last_name', 'name', 'email', 'created_at'])
            ->map(fn (User $user) => [
                'type' => 'user',
                'title' => trim("{$user->first_name} {$user->last_name}") ?: $user->name,
                'description' => 'Utilizator nou înregistrat',
                'meta' => $user->email,
                'timestamp' => $user->created_at,
                'color' => '#16a34a',
            ]);

        $recentExpenses = Expense::query()
            ->with(['user:id,first_name,last_name,name', 'category:id,name,color'])
            ->whereBetween('created_at', [$start, $end])
            ->orderByDesc('created_at')
            ->limit(max(100, $perPage * 6))
            ->get()
            ->map(fn (Expense $expense) => [
                'type' => 'expense',
                'title' => trim("{$expense->user?->first_name} {$expense->user?->last_name}") ?: $expense->user?->name ?: 'Utilizator',
                'description' => sprintf('A adăugat cheltuiala %s - RON %s', $expense->category?->name ?? 'Fără categorie', number_format((float) $expense->amount, 0, ',', '.')),
                'meta' => $expense->created_at,
                'timestamp' => $expense->created_at,
                'color' => $expense->category?->color ?? '#6366f1',
            ]);

        $activityAll = Collection::make()
            ->merge($recentUsers)
            ->merge($recentExpenses)
            ->sortByDesc('timestamp')
            ->values()
            ->map(fn (array $item) => [
                ...$item,
                'timestamp' => Carbon::parse($item['timestamp'])->toIso8601String(),
                'meta' => $item['meta'] instanceof Carbon ? $item['meta']->toIso8601String() : $item['meta'],
            ]);

        $totalActivity = $activityAll->count();
        $lastPage = max(1, (int) ceil($totalActivity / $perPage));
        $currentPage = min($page, $lastPage);

        $activity = $activityAll
            ->forPage($currentPage, $perPage)
            ->values();

        return response()->json([
            'month' => $month,
            'stats' => [
                'total_users' => User::query()->count(),
                'total_expenses' => Expense::query()->count(),
                'monthly_volume' => round((float) Expense::query()->whereBetween('date', [$start->toDateString(), $end->toDateString()])->sum('amount'), 2),
                'categories_count' => Category::query()->count(),
            ],
            'users_preview' => $usersPreview,
            'activity' => $activity,
            'activity_pagination' => [
                'page' => $currentPage,
                'per_page' => $perPage,
                'total' => $totalActivity,
                'last_page' => $lastPage,
            ],
        ]);
    }

    public function platformErrors(Request $request): JsonResponse
    {
        abort_unless($request->user()?->isSuperadmin(), 403, 'Only superadmin can view platform errors.');

        $month = $request->query('month', Carbon::now()->format('Y-m'));
        $page = max(1, (int) $request->query('page', 1));
        $perPage = max(1, min(100, (int) $request->query('per_page', 50)));

        abort_unless(preg_match('/^\d{4}-\d{2}$/', $month) === 1, 422, 'Invalid month format. Use YYYY-MM.');

        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = (clone $start)->endOfMonth();

        $baseQuery = DB::table('platform_error_logs')
            ->whereBetween('occurred_at', [$start, $end]);

        $total = (clone $baseQuery)->count();
        $lastPage = max(1, (int) ceil($total / $perPage));
        $currentPage = min($page, $lastPage);

        $logs = $baseQuery
            ->orderByDesc('occurred_at')
            ->forPage($currentPage, $perPage)
            ->get()
            ->map(function ($log) {
                $context = null;

                if (!empty($log->context)) {
                    $decoded = json_decode($log->context, true);
                    $context = json_last_error() === JSON_ERROR_NONE ? $decoded : $log->context;
                }

                return [
                    'id' => $log->id,
                    'occurred_at' => Carbon::parse($log->occurred_at)->toIso8601String(),
                    'source' => $log->source,
                    'level' => $log->level,
                    'exception_class' => $log->exception_class,
                    'message' => $log->message,
                    'request_method' => $log->request_method,
                    'request_path' => $log->request_path,
                    'route_name' => $log->route_name,
                    'ip_address' => $log->ip_address,
                    'user_id' => $log->user_id,
                    'user_email' => $log->user_email,
                    'user_role' => $log->user_role,
                    'context' => $context,
                    'trace' => $log->trace,
                ];
            })
            ->values();

        return response()->json([
            'month' => $month,
            'logs' => $logs,
            'pagination' => [
                'page' => $currentPage,
                'per_page' => $perPage,
                'total' => $total,
                'last_page' => $lastPage,
            ],
        ]);
    }
}
