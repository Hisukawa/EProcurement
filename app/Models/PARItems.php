<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PARItems extends Model
{
    use HasFactory;

    protected $table = 'tbl_par_items';

    protected $fillable = ['par_id', 'inventory_item_id','inventory_item_number', 'recipient', 'ppe_sub_major_account', 'general_ledger_account', 'series_number', 'office', 'school', 'quantity', 'unit_cost', 'total_cost', 'property_no'];

    public function par()
    {
        return $this->belongsTo(PAR::class, 'par_id');
    }

    public function inventoryItem()
    {
        return $this->belongsTo(Inventory::class, 'inventory_item_id');
    }
}

