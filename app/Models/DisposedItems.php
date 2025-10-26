<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DisposedItems extends Model
{
    protected $table = 'tbl_disposed_items';
    protected $fillable = [
        'disposed_id',
        'inventory_item_id',
        'returned_by',
        'disposed_by',
        'quantity',
        'remarks',
    ];

    public function disposed()
    {
        return $this->belongsTo(Disposed::class);
    }
    public function inventoryItem()
    {
        return $this->belongsTo(Inventory::class, 'inventory_item_id');
    }
    public function returnedBy()
    {
        return $this->belongsTo(User::class, 'returned_by');
    }
}
