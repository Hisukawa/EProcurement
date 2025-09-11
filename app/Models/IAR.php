<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class IAR extends Model
{
    /** @use HasFactory<\Database\Factories\IARFactory> */
    use HasFactory;
    protected $table = 'tbl_iar';
    protected $fillable = [
        'po_id',
        'iar_number',
        'specs',
        'unit',
        'quantity_ordered',
        'quantity_received',
        'unit_price',
        'total_price',
        'remarks',
        'inspection_committee_id',
        'date_received',
    ];

    public function purchaseOrder() {
        return $this->belongsTo(PurchaseOrder::class, 'po_id');
    }
        public function inspectionCommittee()
            {
                return $this->belongsTo(InspectionCommittee::class, 'inspection_committee_id');
            }

}
