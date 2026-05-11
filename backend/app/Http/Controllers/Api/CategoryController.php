<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Models\Category;
use App\Models\User;
use App\Support\LocalizedMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    private function ensureWritable(Request $request): void
    {
        abort_unless($request->user()?->role !== User::ROLE_VISITOR, 403, LocalizedMessage::text('Conturile de vizitator sunt doar pentru vizualizare.', 'Visitor accounts are read-only.', $request));
    }

    public function index(Request $request): JsonResponse
    {
        $categories = $request->user()->categories()->orderBy('name')->get();

        return response()->json($categories);
    }

    public function store(CategoryRequest $request): JsonResponse
    {
        $this->ensureWritable($request);

        $category = $request->user()->categories()->create($request->validated());

        return response()->json($category, 201);
    }

    public function show(Request $request, Category $category): JsonResponse
    {
        abort_unless($category->user_id === $request->user()->id, 404);

        return response()->json($category);
    }

    public function update(CategoryRequest $request, Category $category): JsonResponse
    {
        $this->ensureWritable($request);

        abort_unless($category->user_id === $request->user()->id, 404);

        $category->update($request->validated());

        return response()->json($category);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $this->ensureWritable($request);

        abort_unless($category->user_id === $request->user()->id, 404);

        $category->delete();

        return response()->json(['message' => LocalizedMessage::text('Categoria a fost ștearsă.', 'Category deleted', $request)]);
    }
}
