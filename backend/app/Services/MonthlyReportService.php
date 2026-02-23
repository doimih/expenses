<?php

namespace App\Services;

use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class MonthlyReportService
{
    public function build(int $userId, string $month): array
    {
        $start = Carbon::createFromFormat('Y-m', $month)->startOfMonth();
        $end = (clone $start)->endOfMonth();

        $categoryTotals = Expense::query()
            ->join('categories', 'categories.id', '=', 'expenses.category_id')
            ->where('expenses.user_id', $userId)
            ->whereBetween('expenses.date', [$start->toDateString(), $end->toDateString()])
            ->groupBy('categories.id', 'categories.name', 'categories.color')
            ->orderByDesc(DB::raw('SUM(expenses.amount)'))
            ->get([
                'categories.id',
                'categories.name',
                'categories.color',
                DB::raw('SUM(expenses.amount) as total'),
            ]);

        $monthlyComparison = Expense::query()
            ->where('user_id', $userId)
            ->whereBetween('date', [
                (clone $start)->subMonths(5)->startOfMonth()->toDateString(),
                $end->toDateString(),
            ])
            ->selectRaw("to_char(date, 'YYYY-MM') as month, SUM(amount) as total")
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        $dailyTrend = Expense::query()
            ->where('user_id', $userId)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->selectRaw('date, SUM(amount) as total')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        $total = (float) $categoryTotals->sum('total');

        return [
            'month' => $month,
            'total' => round($total, 2),
            'by_category' => $categoryTotals->map(fn ($row) => [
                'id' => $row->id,
                'name' => $row->name,
                'color' => $row->color,
                'total' => round((float) $row->total, 2),
            ])->values(),
            'charts' => [
                'pie' => [
                    'labels' => $categoryTotals->pluck('name')->values(),
                    'datasets' => [[
                        'label' => 'Distribuție categorii',
                        'data' => $categoryTotals->map(fn ($row) => round((float) $row->total, 2))->values(),
                        'backgroundColor' => $categoryTotals->pluck('color')->values(),
                    ]],
                ],
                'bar' => [
                    'labels' => $monthlyComparison->pluck('month')->values(),
                    'datasets' => [[
                        'label' => 'Total pe luni',
                        'data' => $monthlyComparison->map(fn ($row) => round((float) $row->total, 2))->values(),
                        'backgroundColor' => '#6366F1',
                    ]],
                ],
                'line' => [
                    'labels' => $dailyTrend->pluck('date')->map(fn ($date) => Carbon::parse($date)->format('Y-m-d'))->values(),
                    'datasets' => [[
                        'label' => 'Evoluție zilnică',
                        'data' => $dailyTrend->map(fn ($row) => round((float) $row->total, 2))->values(),
                        'borderColor' => '#0EA5E9',
                        'backgroundColor' => 'rgba(14,165,233,0.2)',
                        'fill' => true,
                        'tension' => 0.35,
                    ]],
                ],
            ],
        ];
    }
}
