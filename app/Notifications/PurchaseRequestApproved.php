<?php

namespace App\Notifications;

use App\Models\PurchaseRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PurchaseRequestApproved extends Notification
{
    use Queueable;

    protected $purchaseRequest;

    public function __construct(PurchaseRequest $purchaseRequest)
    {
        $this->purchaseRequest = $purchaseRequest;
    }

    public function via($notifiable)
    {
        return ['database'];
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => 'Your Purchase Request (' . $this->purchaseRequest->pr_number . ') has been approved. It is now under the process of quotation. Please wait for the issuance of the Purchase Order.',
            'pr_id' => $this->purchaseRequest->id,
            'status' => 'approved',
        ];
    }
}
