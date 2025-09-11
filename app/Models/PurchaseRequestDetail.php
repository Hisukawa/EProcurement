<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseRequestDetail extends Model
{
    use HasFactory;
    protected $table = 'tbl_pr_details';

protected $fillable = [
    'pr_id',
    'product_id',
    'item',
    'specs',
    'unit',
    'quantity',
    'unit_price',
    'total_item_price',
];


    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class, 'pr_id');
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit');
    }

    public function product()
    {
        return $this->belongsTo(Products::class, 'product_id');
    }
    public function rfq_details()
    {
        return $this->hasMany(RFQDetail::class, 'pr_details_id');
    }


}
