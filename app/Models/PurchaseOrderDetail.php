<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseOrderDetail extends Model
{
    /** @use HasFactory<\Database\Factories\PurchaseOrderDetailFactory> */
    use HasFactory;
    protected $table = 'tbl_po_details';
    protected $fillable = ['po_id', 'pr_detail_id', 'quantity', 'unit_price', 'total_price'];
    public function prDetail()
    {
        return $this->belongsTo(PurchaseRequestDetail::class, 'pr_detail_id');
    }
}
