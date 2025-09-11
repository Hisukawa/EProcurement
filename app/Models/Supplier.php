<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Supplier extends Model
{
    /** @use HasFactory<\Database\Factories\SupplierFactory> */
    use HasFactory;

    protected $table = 'tbl_suppliers';
    protected $fillable = ["company_name","address", "tin_num", "representative_name", "category_id"];
    public function category()
    {
        return $this->belongsTo(SupplyCategory::class, 'category_id');
    }

}
