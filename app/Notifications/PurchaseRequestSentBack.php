<?php

namespace App\Notifications;

use App\Models\PurchaseRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PurchaseRequestSentBack extends Notification
{
    use Queueable;

    protected $purchaseRequest;
    protected $reason;

    public function __construct(PurchaseRequest $purchaseRequest, string $reason)
    {
        $this->purchaseRequest = $purchaseRequest;
        $this->reason = $reason;
    }

    /**
     * Get the notification delivery channels.
     */
    public function via($notifiable)
    {
        return ['database']; // Store in database
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => 'Your Purchase Request (' . $this->purchaseRequest->pr_number . ') has been sent back for revision.',
            'pr_id'   => $this->purchaseRequest->id,
            'reason'  => $this->reason,
        ];
    }
}
