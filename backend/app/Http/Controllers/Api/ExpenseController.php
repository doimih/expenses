<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ExpenseRequest;
use App\Models\Expense;
use App\Models\User;
use App\Support\LocalizedMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    private function ensureWritable(Request $request): void
    {
        abort_unless($request->user()?->role !== User::ROLE_VISITOR, 403, LocalizedMessage::text('Conturile de vizitator sunt doar pentru vizualizare.', 'Visitor accounts are read-only.', $request));
    }

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
        $this->ensureWritable($request);

        $data = $request->validated();

        // Validate category exists globally
        $categoryExists = \App\Models\Category::where('id', $data['category_id'])->exists();
        abort_unless($categoryExists, 422, LocalizedMessage::text('Categorie invalidă', 'Invalid category', $request));

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
        $this->ensureWritable($request);

        abort_unless($expense->user_id === $request->user()->id, 404);

        $data = $request->validated();
        
        // Validate category exists globally
        $categoryExists = \App\Models\Category::where('id', $data['category_id'])->exists();
        abort_unless($categoryExists, 422, LocalizedMessage::text('Categorie invalidă', 'Invalid category', $request));

        $expense->update($data);

        return response()->json($expense->load('category:id,name,color'));
    }

    public function destroy(Request $request, Expense $expense): JsonResponse
    {
        $this->ensureWritable($request);

        abort_unless($expense->user_id === $request->user()->id, 404);

        $expense->delete();

        return response()->json(['message' => LocalizedMessage::text('Cheltuiala a fost ștearsă.', 'Expense deleted', $request)]);
    }
}
