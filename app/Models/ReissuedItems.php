<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ReissuedItems extends Model
{
    protected $table = 'tbl_reissued_items';
    protected $fillable = [
        'reissued_id',
        'inventory_item_id',
        'returned_by',
        'reissued_by',
        'recipient',
        'quantity',
        'remarks',
    ];

    public function reissued()
    {
        return $this->belongsTo(Reissued::class, 'reissued_id');
    }
    public function inventoryItem()
    {
        return $this->belongsTo(Inventory::class, 'inventory_item_id');
    }
    public function returnedBy()
    {
        return $this->belongsTo(User::class, 'returned_by');
    }
    public function reissuedBy()
    {
        return $this->belongsTo(User::class, 'reissued_by');
    }
}
