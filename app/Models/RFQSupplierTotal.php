<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RFQSupplierTotal extends Model
{
    protected $table = 'tbl_rfq_supplier_totals';

    protected $fillable = [
        'rfq_id',
        'supplier_id',
        'total_quoted_price',
        'final_total_price',
        'total_mode',
    ];

     public function supplier()
    {
        return $this->belongsTo(Supplier::class, 'supplier_id'); // 'supplier_id' is the FK in rfq_supplier_totals
    }

    // Optionally, if it belongs to an RFQ
    public function rfq()
    {
        return $this->belongsTo(RFQ::class, 'rfq_id');
    }
}

