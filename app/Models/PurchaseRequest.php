<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PurchaseRequest extends Model
{
    /** @use HasFactory<\Database\Factories\PurchaseRequestFactory> */
    use HasFactory;
    protected $table = 'tbl_purchase_requests';
    protected $fillable = [

        'pr_number','focal_person_user', 'division_id', 'purpose', 'requested_by', 'status', 'is_sent', 'approval_image', 'total_price', 'rejection_reason', 'send_back_reason',
    ];
    

    public function details()
    {
        return $this->hasMany(PurchaseRequestDetail::class, 'pr_id', 'id');
    }
    public function division()
    {
        return $this->belongsTo(Division::class, 'division_id');
    }
    public function requestedBy()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }
    public function focal_person()
    {
        return $this->belongsTo(User::class, 'focal_person_user');
    }
    public function rfqs()
    {
        return $this->hasMany(RFQ::class, 'pr_id');
    }
    // PurchaseRequest.php (model)
public function getPage($perPage = 10)
{
    $position = self::where('focal_person_user', $this->focal_person_user)
        ->where('created_at', '>=', $this->created_at)
        ->count();

    return ceil($position / $perPage);
}





}
