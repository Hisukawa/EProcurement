<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RIS extends Model
{
    use HasFactory;

    protected $table = "tbl_ris";

    protected $fillable = [
        'po_id',
        'ris_number',
        'requested_by',
        
        'issued_by',
        'remarks',
    ];

    // Relationships
    public function po()
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_id');
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function items()
    {
        return $this->hasMany(RISItems::class, 'ris_id');
    }
}
