<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SupplyCategory extends Model
{
    protected $table = 'tbl_supply_categories';
    protected $fillable = ['name'];

    public function suppliers()
    {
        return $this->hasMany(Supplier::class, 'category_id');
    }
}
