<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RISItems extends Model
{
    use HasFactory;

    protected $table = "tbl_ris_items";

    protected $fillable = [
        'ris_id',
        'inventory_item_id',
        'unit_cost',
        'total_cost',
        'quantity',
    ];

    // Relationships
    public function ris()
    {
        return $this->belongsTo(RIS::class, 'ris_id');
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
