<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ICSItems extends Model
{
    use HasFactory;

    protected $table = 'tbl_ics_items';

    protected $fillable = ['ics_id', 'inventory_item_id', 'quantity', 'unit_cost', 'total_cost'];

    public function ics()
    {
        return $this->belongsTo(ICS::class, 'ics_id');
    }

    public function inventoryItem()
    {
        return $this->belongsTo(Inventory::class, 'inventory_item_id');
    }
}

