<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateUserRequest;
use App\Http\Requests\ToggleSuperadminRequest;
use App\Http\Requests\UpdateUserRequest;
use App\Http\Requests\UpdateUserPasswordRequest;
use App\Models\User;
use App\Support\LocalizedMessage;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    private function ensureSuperAdmin(Request $request): void
    {
        abort_unless($request->user()?->isSuperadmin(), 403, LocalizedMessage::text('Doar superadmin poate gestiona utilizatorii.', 'Only superadmin can manage users.', $request));
    }

    public function index(Request $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $users = User::query()
            ->select(['id', 'first_name', 'last_name', 'name', 'email', 'role', 'is_superadmin', 'created_at'])
            ->orderBy('id')
            ->get();

        return response()->json($users);
    }

    public function store(CreateUserRequest $request): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $data = $request->validated();
        $fullName = trim(sprintf('%s %s', $data['first_name'], $data['last_name']));
        $role = $data['role'] ?? User::ROLE_USER;

        $user = User::query()->create([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'name' => $fullName,
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
            'role' => $role,
            'is_superadmin' => $role === User::ROLE_SUPERADMIN,
        ]);

        return response()->json([
            'id' => $user->id,
            'first_name' => $user->first_name,
            'last_name' => $user->last_name,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'is_superadmin' => $user->is_superadmin,
            'created_at' => $user->created_at,
        ], 201);
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $data = $request->validated();
        $fullName = trim(sprintf('%s %s', $data['first_name'], $data['last_name']));
        $role = $data['role'];

        if ((int) $request->user()->id === (int) $user->id && $role !== User::ROLE_SUPERADMIN) {
            return response()->json(['message' => LocalizedMessage::text('Nu îți poți elimina propriul rol de superadmin.', 'You cannot remove your own superadmin role.', $request)], 422);
        }

        $user->update([
            'first_name' => $data['first_name'],
            'last_name' => $data['last_name'],
            'name' => $fullName,
            'email' => $data['email'],
            'role' => $role,
            'is_superadmin' => $role === User::ROLE_SUPERADMIN,
        ]);

        return response()->json([
            'message' => LocalizedMessage::text('Utilizator actualizat cu succes.', 'User updated successfully.', $request),
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
                'is_superadmin' => $user->is_superadmin,
                'created_at' => $user->created_at,
            ],
        ]);
    }

    public function updatePassword(UpdateUserPasswordRequest $request, User $user): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        $user->update([
            'password' => Hash::make($request->validated('password')),
        ]);

        return response()->json([
            'message' => LocalizedMessage::text('Parola a fost actualizată cu succes.', 'Password updated successfully.', $request),
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->ensureSuperAdmin($request);

        if ((int) $request->user()->id === (int) $user->id) {
            return response()->json(['message' => LocalizedMessage::text('Nu îți poți șterge propriul cont.', 'You cannot delete your own account.', $request)], 422);
        }

        $user->tokens()->delete();
        $user->delete();

        return response()->json([
            'message' => LocalizedMessage::text('Utilizator șters cu succes.', 'User deleted successfully.', $request),
        ]);
    }
}
