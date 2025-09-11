<?php

namespace App\Notifications;

use App\Models\PurchaseRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PurchaseRequestSubmitted extends Notification
{
    use Queueable;

    protected $purchaseRequest;

    public function __construct(PurchaseRequest $purchaseRequest)
    {
        $this->purchaseRequest = $purchaseRequest;
    }

/*************  ✨ Windsurf Command ⭐  *************/
    /**
     * Get the notification delivery channels.
     *
     * @param mixed $notifiable
     * @return array<string>
     */

/*******  cd723033-4584-456e-b0f2-3e20edf5abdb  *******/
    public function via($notifiable)
    {
        return ['database']; // Store in database
    }

    public function toDatabase($notifiable)
    {
        return [
            'message' => 'A new Purchase Request (' . $this->purchaseRequest->pr_number . ') has been submitted.',
            'pr_id' => $this->purchaseRequest->id,
            'submitted_by' => $this->purchaseRequest->focal_person,
        ];
    }
}
