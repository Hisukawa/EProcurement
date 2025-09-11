<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    protected $table = 'tbl_units';
    protected $fillable = [
        'unit',
    ];

    public $timestamps = false;
    public function purchaseRequestDetails()
    {
        return $this->hasMany(PurchaseRequestDetail::class, 'unit');
    }

    
}
