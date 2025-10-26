<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Disposed extends Model
{
    protected $table = 'tbl_disposal';
    protected $fillable = [
        'rrsp_number',
        'ics_number',
        'date_disposed',
    ];

    public function items()
    {
        return $this->hasMany(DisposedItems::class, 'disposal_id');
    }
}
