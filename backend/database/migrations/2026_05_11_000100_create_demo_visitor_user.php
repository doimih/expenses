<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

return new class extends Migration {
    public function up(): void
    {
        DB::table('users')->updateOrInsert(
            ['email' => 'uservisit'],
            [
                'name' => 'uservisit',
                'first_name' => '',
                'last_name' => '',
                'password' => Hash::make('Temp123!'),
                'role' => User::ROLE_VISITOR,
                'is_superadmin' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        );
    }

    public function down(): void
    {
        DB::table('users')->where('email', 'uservisit')->delete();
    }
};