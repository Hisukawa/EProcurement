<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class Category extends Model
{
    use HasFactory;

    protected $table = 'tbl_categories';

    protected $fillable = [
        'name',
        'description',
    ];

    public function products()
    {
        return $this->hasMany(Products::class, 'category_id');
    }
}
