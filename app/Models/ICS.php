<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ICS extends Model
{
    use HasFactory;

    protected $table = 'tbl_ics';

    protected $fillable = ['po_id', 'ics_number', 'requested_by', 'recipient', 'received_from', 'remarks'];

    // Header relations
    public function po()
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_id');
    }

    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function receivedFrom()
    {
        return $this->belongsTo(User::class, 'received_from');
    }

    // Header → Items
    public function items()
    {
        return $this->hasMany(ICSItems::class, 'ics_id');
    }
}

