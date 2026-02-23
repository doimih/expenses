<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MonthlyReportService;
use Carbon\Carbon;
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
}
