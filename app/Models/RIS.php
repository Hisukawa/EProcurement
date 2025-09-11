<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RIS extends Model
{
    /** @use HasFactory<\Database\Factories\RISFactory> */
    use HasFactory;

    protected $table = "tbl_ris";

    protected $fillable = ['po_id', 'inventory_item_id', 'ris_number', 'issued_to', 'issued_by', 'quantity', 'remarks'];

    public function inventoryItem()
    {
        return $this->belongsTo(Inventory::class, 'inventory_item_id');
    }
    public function po()
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_id');
    }

    public function issuedTo()
    {
        return $this->belongsTo(User::class, 'issued_to');
    }

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

}
