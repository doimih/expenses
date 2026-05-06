<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExpenseRequest;
use App\Models\Expense;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $month = $request->query('month');

        $query = Expense::query()
            ->with('category:id,name,color')
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->orderByDesc('id');

        if ($month && preg_match('/^\d{4}-\d{2}$/', $month)) {
            $query->whereRaw("to_char(date, 'YYYY-MM') = ?", [$month]);
        }

        return response()->json($query->get());
    }

    public function store(ExpenseRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Validate category exists globally
        $categoryExists = \App\Models\Category::where('id', $data['category_id'])->exists();
        abort_unless($categoryExists, 422, 'Invalid category');

        $expense = $request->user()->expenses()->create($data);

        return response()->json($expense->load('category:id,name,color'), 201);
    }

    public function show(Request $request, Expense $expense): JsonResponse
    {
        abort_unless($expense->user_id === $request->user()->id, 404);

        return response()->json($expense->load('category:id,name,color'));
    }

    public function update(ExpenseRequest $request, Expense $expense): JsonResponse
    {
        abort_unless($expense->user_id === $request->user()->id, 404);

        $data = $request->validated();
        
        // Validate category exists globally
        $categoryExists = \App\Models\Category::where('id', $data['category_id'])->exists();
        abort_unless($categoryExists, 422, 'Invalid category');

        $expense->update($data);

        return response()->json($expense->load('category:id,name,color'));
    }

    public function destroy(Request $request, Expense $expense): JsonResponse
    {
        abort_unless($expense->user_id === $request->user()->id, 404);

        $expense->delete();

        return response()->json(['message' => 'Expense deleted']);
    }
}
