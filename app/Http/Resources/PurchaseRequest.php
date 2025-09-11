<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PurchaseRequest extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'pr_number' => $this->pr_number,
            'focal_person' => $this->focal_person,
            'purpose' => $this->purpose,
            'requested_by' => $this->requested_by,
            'status' => $this->status,
            'division_id' => $this->division?->division,
        ];
    }
}
