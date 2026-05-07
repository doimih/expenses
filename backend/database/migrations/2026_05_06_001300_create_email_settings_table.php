<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('email_settings')) {
            return;
        }

        Schema::create('email_settings', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('mailer')->default('SMTP');
            $table->string('host');
            $table->unsignedInteger('port')->default(587);
            $table->string('encryption')->nullable()->default('TLS');
            $table->string('username');
            $table->text('password');
            $table->string('from_address');
            $table->string('from_name');
            $table->string('monitoring_alert_recipient');
            $table->boolean('active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('email_settings');
    }
};
