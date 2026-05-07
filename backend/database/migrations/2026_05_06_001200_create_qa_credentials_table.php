<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('qa_credentials')) {
            Schema::create('qa_credentials', function (Blueprint $table) {
                $table->id();
                $table->string('name');
                $table->string('notes')->nullable();
                $table->string('key_hash');       // SHA-256 of the raw key
                $table->string('key_prefix', 20); // first ~12 chars for display
                $table->string('scope')->nullable(); // space-separated scopes
                $table->timestamp('last_used_at')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('qa_credentials');
    }
};
