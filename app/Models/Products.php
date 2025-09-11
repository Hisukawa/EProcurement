<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Products extends Model
{
    /** @use HasFactory<\Database\Factories\ProductsFactory> */
    use HasFactory;
    protected $table = 'tbl_products';
     protected $fillable = [
        'name',
        'specs',
        'unit_id',
        'category_id',
        'default_price',
        'supply_category_id'
    ];
    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class, 'category_id');
    }
    public function supplier_category()
    {
        return $this->belongsTo(SupplyCategory::class, 'supply_category_id');
    }
}
