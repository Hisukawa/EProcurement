<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PurchaseRequestRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules()
    {
        return [
            'focal_person' => 'required|exists:users,id',
            'pr_number' => 'required|string|max:50|unique:tbl_purchase_requests,pr_number',
            'purpose' => 'nullable|string|max:1000',
            'division_id' => 'required|exists:tbl_divisions,id',
            'requested_by' => 'required|string|max:255',

            'products.*.product_id' => 'required|exists:tbl_products,id',
            'products.*.item' => 'required|string|max:255',
            'products.*.specs' => 'required|string|max:1000',
            'products.*.unit' => 'required|string|max:50',
            'products.*.unit_price' => 'nullable|numeric|min:0',
            'products.*.total_item_price' => 'nullable|numeric|min:0',
            'products.*.quantity' => 'required|numeric|min:0.01',
        ];
    }
}
