<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    public const ROLE_VISITOR = 'visitor';

    public const ROLE_USER = 'user';

    public const ROLE_SUPERADMIN = 'superadmin';

    protected $fillable = [
        'first_name',
        'last_name',
        'name',
        'email',
        'password',
        'role',
        'is_superadmin',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'role' => 'string',
        'is_superadmin' => 'boolean',
    ];

    public function isSuperadmin(): bool
    {
        return $this->role === self::ROLE_SUPERADMIN || (bool) $this->is_superadmin;
    }

    public function categories(): HasMany
    {
        return $this->hasMany(Category::class);
    }

    public function expenses(): HasMany
    {
        return $this->hasMany(Expense::class);
    }
}
