<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\DatabaseMessage;
use App\Models\PurchaseRequest;

class ApprovedFormUploaded extends Notification implements ShouldQueue
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
            'message' => 'An approved form has been uploaded for PR #' . $this->purchaseRequest->pr_number,
            'pr_id' => $this->purchaseRequest->id,
            'url' => route('bac_user.view_details', $this->purchaseRequest->id),
        ];
    }
}
