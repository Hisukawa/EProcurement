<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PAR extends Model
{
    /** @use HasFactory<\Database\Factories\PARFactory> */
    use HasFactory;
    protected $table = 'tbl_par';

    protected $fillable = ['inventory_item_id', 'po_id', 'par_number', 'received_by', 'issued_by', 'quantity', 'unit_cost', 'total_cost', 'property_no', 'remarks', 'date_acquired'];

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

    public function issuedBy()
    {
        return $this->belongsTo(User::class, 'received_from');
    }
}
