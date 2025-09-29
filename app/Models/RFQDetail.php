<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RFQDetail extends Model
{
    /** @use HasFactory<\Database\Factories\RFQDetailFactory> */
    use HasFactory;
    protected $table = 'tbl_rfq_details';

    protected $fillable = [
        'rfq_id',
        'pr_details_id',
        'quoted_price',
        'estimated_bid',
        'supplier_id',
        'is_winner_as_read',
        'is_winner_as_calculated',
        'remarks_as_read',
        'remarks_as_calculated'
        ];
    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
    public function prDetail()
    {
        return $this->belongsTo(PurchaseRequestDetail::class, 'pr_details_id');
    }
    public function rfq()
    {
        return $this->belongsTo(Rfq::class, 'rfq_id');
    }



}
