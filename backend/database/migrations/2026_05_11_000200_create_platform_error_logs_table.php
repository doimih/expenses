<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('platform_error_logs')) {
            Schema::create('platform_error_logs', function (Blueprint $table) {
                $table->id();
                $table->timestamp('occurred_at');
                $table->string('source')->default('http');
                $table->string('level')->default('error');
                $table->string('exception_class');
                $table->text('message');
                $table->string('request_method')->nullable();
                $table->string('request_path')->nullable();
                $table->string('route_name')->nullable();
                $table->string('ip_address')->nullable();
                $table->unsignedBigInteger('user_id')->nullable();
                $table->string('user_email')->nullable();
                $table->string('user_role')->nullable();
                $table->longText('context')->nullable();
                $table->longText('trace')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('platform_error_logs');
    }
};