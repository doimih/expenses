<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Expense;
use App\Models\User;
use App\Services\MonthlyReportService;
use Carbon\Carbon;
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
            ->orderByDesc('created_at')
            ->limit(4)
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
            ->orderByDesc('created_at')
            ->limit(6)
            ->get()
            ->map(fn (Expense $expense) => [
                'type' => 'expense',
                'title' => trim("{$expense->user?->first_name} {$expense->user?->last_name}") ?: $expense->user?->name ?: 'Utilizator',
                'description' => sprintf('A adăugat cheltuiala %s - RON %s', $expense->category?->name ?? 'Fără categorie', number_format((float) $expense->amount, 0, ',', '.')),
                'meta' => $expense->created_at,
                'timestamp' => $expense->created_at,
                'color' => $expense->category?->color ?? '#6366f1',
            ]);

        $activity = Collection::make()
            ->merge($recentUsers)
            ->merge($recentExpenses)
            ->sortByDesc('timestamp')
            ->take(6)
            ->values()
            ->map(fn (array $item) => [
                ...$item,
                'timestamp' => Carbon::parse($item['timestamp'])->toIso8601String(),
                'meta' => $item['meta'] instanceof Carbon ? $item['meta']->toIso8601String() : $item['meta'],
            ]);

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
        ]);
    }
}
