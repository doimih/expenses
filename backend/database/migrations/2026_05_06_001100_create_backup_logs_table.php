<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('backup_logs')) {
            Schema::create('backup_logs', function (Blueprint $table) {
                $table->id();
                $table->timestamp('started_at');
                $table->string('status'); // success, error, running
                $table->text('details')->nullable();
                $table->string('file_path')->nullable(); // S3 object key
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('backup_logs');
    }
};
