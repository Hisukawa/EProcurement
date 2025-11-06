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

    protected $fillable = ['user_id', 'pr_id', 'supplier_id', 'total_price_calculated', 'project_no', 'date_of_opening', 'venue', 'bac_cn', 'services', 'location', 'subject', 'delivery_period', 'abc'];

    
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
public function purchaseOrder()
{
    return $this->hasOne(PurchaseOrder::class, 'rfq_id'); // Assuming PurchaseOrder is a model  
}

public function recordedBy()
{
    return $this->belongsTo(User::class, 'user_id'); // Assuming User is a model  

}
}
