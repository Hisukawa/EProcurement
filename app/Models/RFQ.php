<?php

// app/Models/RFQ.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
/**
 * @property \App\Models\PurchaseRequest|null $purchaseRequest
 */
class RFQ extends Model
{
    protected $table = 'tbl_rfqs';

    protected $fillable = ['user_id', 'pr_id', 'supplier_id',];

    
    public function purchaseRequest()
    {
        return $this->belongsTo(PurchaseRequest::class, 'pr_id');
    }

    public function details()
    {
        return $this->hasMany(RFQDetail::class, 'rfq_id');
    }

    // In App\Models\RFQ.php
public function supplierTotals()
{
    return $this->hasMany(RFQSupplierTotal::class, 'rfq_id'); // Assuming SupplierTotal is a model
}




}

