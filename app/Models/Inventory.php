<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    /** @use HasFactory<\Database\Factories\InventoryFactory> */
    use HasFactory;
    protected $table = 'tbl_inventory';
    protected $fillable = ['recorded_by', 'requested_by', 'po_detail_id', 'item_desc', 'total_stock', 'unit_id', 'unit_cost', 'last_received', 'status'];

    public function recordedBy(){
        return $this->belongsTo(User::class, 'recorded_by');
    }
    public function unit()
    {
        return $this->belongsTo(Unit::class, 'unit_id');
    }
    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
    public function product() {
        return $this->belongsTo(Products::class);
    }
    public function prDetail()
    {
        return $this->hasOneThrough(
            PurchaseRequestDetail::class,
            PurchaseOrderDetail::class,
            'id',           // Foreign key on tbl_po_details
            'id',           // Foreign key on tbl_pr_details
            'po_detail_id', // Local key on tbl_inventory
            'pr_detail_id'  // Local key on tbl_po_details
        );
    }


    public function poDetail()
    {
        return $this->belongsTo(PurchaseOrderDetail::class, 'po_detail_id');
    }


}
