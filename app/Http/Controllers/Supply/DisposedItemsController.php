<?php

namespace App\Http\Controllers\Supply;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

class DisposedItemsController extends Controller
{
    public function disposed_items()
    {
        return inertia('Supply/DisposedItems');
    }
}
