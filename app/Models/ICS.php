<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ICS extends Model
{
    /** @use HasFactory<\Database\Factories\ICSFactory> */
    use HasFactory;

    protected $table = 'tbl_ics';

    protected $fillable = ['inventory_item_id', 'po_id', 'ics_number', 'received_by', 'received_from', 'quantity', 'unit_cost', 'total_cost', 'remarks', 'type'];

    public function inventoryItem()
    {
        return $this->belongsTo(Inventory::class, 'inventory_item_id');
    }
    public function po()
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_id');
    }

    public function receivedBy()
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    public function receivedFrom()
    {
        return $this->belongsTo(User::class, 'received_from');
    }
}
