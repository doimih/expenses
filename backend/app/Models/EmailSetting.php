<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailSetting extends Model
{
    protected $fillable = [
        'name',
        'mailer',
        'host',
        'port',
        'encryption',
        'username',
        'password',
        'from_address',
        'from_name',
        'monitoring_alert_recipient',
        'active',
    ];

    protected $casts = [
        'port' => 'integer',
        'active' => 'boolean',
    ];
}
