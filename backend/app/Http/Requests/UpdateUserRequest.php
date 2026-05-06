<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        /** @var User|null $user */
        $user = $this->route('user');

        return [
            'first_name' => ['required_without:name', 'string', 'max:60'],
            'last_name' => ['required_without:name', 'string', 'max:60'],
            'name' => ['nullable', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user?->id)],
            'role' => ['required', 'in:' . implode(',', [User::ROLE_VISITOR, User::ROLE_USER, User::ROLE_SUPERADMIN])],
        ];
    }

    protected function prepareForValidation(): void
    {
        [$firstName, $lastName] = $this->normalizeNameParts();

        $this->merge([
            'first_name' => $firstName,
            'last_name' => $lastName,
            'name' => trim(sprintf('%s %s', $firstName, $lastName)),
            'role' => $this->normalizeRole(),
        ]);
    }

    private function normalizeRole(): string
    {
        $role = trim((string) $this->input('role', ''));

        if ($role !== '') {
            return $role;
        }

        return filter_var($this->input('is_superadmin'), FILTER_VALIDATE_BOOL)
            ? User::ROLE_SUPERADMIN
            : User::ROLE_USER;
    }

    private function normalizeNameParts(): array
    {
        $firstName = trim((string) $this->input('first_name', ''));
        $lastName = trim((string) $this->input('last_name', ''));

        if ($firstName !== '' || $lastName !== '') {
            return [$firstName, $lastName];
        }

        $parts = preg_split('/\s+/', trim((string) $this->input('name', '')), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        if ($parts === []) {
            return ['', ''];
        }

        if (count($parts) === 1) {
            return [$parts[0], ''];
        }

        return [implode(' ', array_slice($parts, 0, -1)), $parts[count($parts) - 1]];
    }
}