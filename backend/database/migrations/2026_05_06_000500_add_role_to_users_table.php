<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('role', 20)->default(User::ROLE_USER)->after('password');
        });

        DB::table('users')
            ->select(['id', 'is_superadmin'])
            ->orderBy('id')
            ->get()
            ->each(function (object $user): void {
                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'role' => $user->is_superadmin ? User::ROLE_SUPERADMIN : User::ROLE_USER,
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('role');
        });
    }
};