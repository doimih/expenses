<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateUserRequest;
use App\Http\Requests\ToggleSuperadminRequest;
use App\Http\Requests\UpdateUserPasswordRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    private function ensureSuperAdmin(Request $request): void
    {
        abort_unless((bool) $request->user()?->is_superadmin, 403, 'Only superadmin can manage users.');
    }

    public function index(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $users = User::query()
            ->select(['id', 'name', 'email', 'is_superadmin', 'created_at'])
            ->orderBy('id')
            ->get();

        return response()->json($users);
    }

    public function store(CreateUserRequest $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $data = $request->validated();

        $user = User::query()->create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'is_superadmin' => (bool) ($data['is_superadmin'] ?? false),
        ]);

        return response()->json([
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'is_superadmin' => $user->is_superadmin,
            'created_at' => $user->created_at,
        ], 201);
    }

    public function updatePassword(UpdateUserPasswordRequest $request, User $user): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $user->update([
            'password' => Hash::make($request->validated('password')),
        ]);

        return response()->json([
            'message' => 'Password updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
        ]);
    }

    public function updateSuperadmin(ToggleSuperadminRequest $request, User $user): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $targetValue = (bool) $request->validated('is_superadmin');

        if ((int) $request->user()->id === (int) $user->id && $targetValue === false) {
            return response()->json(['message' => 'You cannot remove your own superadmin role.'], 422);
        }

        $user->update([
            'is_superadmin' => $targetValue,
        ]);

        return response()->json([
            'message' => 'User role updated successfully',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_superadmin' => $user->is_superadmin,
            ],
        ]);
    }
}
