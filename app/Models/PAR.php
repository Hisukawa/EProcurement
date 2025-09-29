<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PAR extends Model
{
    use HasFactory;

    protected $table = 'tbl_par';

    protected $fillable = ['po_id', 'par_number', 'requested_by', 'issued_by', 'remarks', 'date_acquired'];

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
        return $this->hasMany(PARItems::class, 'par_id');
    }
}

