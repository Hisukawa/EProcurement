<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ICSItems extends Model
{
    use HasFactory;

    protected $table = 'tbl_ics_items';

    protected $fillable = ['ics_id', 'inventory_item_id', 'inventory_item_number', 'recipient', 'ppe_sub_major_account', 'general_ledger_account', 'series_number', 'office', 'school','quantity', 'unit_cost', 'total_cost', 'type'];

    public function ics()
    {
        return $this->belongsTo(ICS::class, 'ics_id');
    }

    public function inventoryItem()
    {
        return $this->belongsTo(Inventory::class, 'inventory_item_id');
    }
    public function reissuedItem() {
        return $this->hasMany(ReissuedItems::class, 'inventory_item_id', 'inventory_item_id');
    }

    public function disposedItem() {
        return $this->hasMany(DisposedItems::class, 'inventory_item_id', 'inventory_item_id');
    }

}

