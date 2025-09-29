<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
/**
 * @property \App\Models\RFQ|null $rfq
 */
class PurchaseOrder extends Model
{
    /** @use HasFactory<\Database\Factories\PurchaseOrderFactory> */
    use HasFactory;
    protected $table = 'tbl_purchase_orders';
    protected $fillable = ['po_number', 'rfq_id', 'supplier_id', 'user_id', 'recorded_by', 'status'];

    public function details()
    {
        return $this->hasMany(PurchaseOrderDetail::class, 'po_id');
    }
    public function rfq() {
        return $this->belongsTo(RFQ::class, 'rfq_id');
    }

    public function supplier() {
        return $this->belongsTo(Supplier::class, 'supplier_id');
    }
    public function iar(){
        return $this->hasOne(IAR::class, 'po_id');
    }
    public function recordedBy()
    {
        return $this->belongsTo(User::class, 'recorded_by'); // Assuming User is a model  
    }
}
