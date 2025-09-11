<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLogs extends Model
{
    protected $table = 'tbl_audit_logs';
    protected $fillable = [
        'action',
        'entity_type',
        'entity_id',
        'changes',
        'reason',
        'user_id',
    ];

    public function user()
{
    return $this->belongsTo(User::class);
}

}
