<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('first_name')->default('')->after('id');
            $table->string('last_name')->default('')->after('first_name');
        });

        DB::table('users')
            ->select(['id', 'name'])
            ->orderBy('id')
            ->get()
            ->each(function (object $user): void {
                [$firstName, $lastName] = $this->splitName($user->name);

                DB::table('users')
                    ->where('id', $user->id)
                    ->update([
                        'first_name' => $firstName,
                        'last_name' => $lastName,
                        'name' => trim(sprintf('%s %s', $firstName, $lastName)),
                    ]);
            });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['first_name', 'last_name']);
        });
    }

    private function splitName(?string $name): array
    {
        $parts = preg_split('/\s+/', trim((string) $name), -1, PREG_SPLIT_NO_EMPTY) ?: [];

        if ($parts === []) {
            return ['', ''];
        }

        if (count($parts) === 1) {
            return [$parts[0], ''];
        }

        return [implode(' ', array_slice($parts, 0, -1)), $parts[count($parts) - 1]];
    }
};