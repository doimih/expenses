<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $categories = Category::orderBy('name')->get();

        return response()->json($categories);
    }

    public function store(CategoryRequest $request): JsonResponse
    {
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
        abort_unless($category->user_id === $request->user()->id, 404);

        $category->update($request->validated());

        return response()->json($category);
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        abort_unless($category->user_id === $request->user()->id, 404);

        $category->delete();

        return response()->json(['message' => 'Category deleted']);
    }
}
