<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use App\Models\PurchaseRequest;

class PurchaseRequestRejected extends Notification implements ShouldQueue
{
    use Queueable;

    public $pr;
    public $reject_reason;

    public function __construct(PurchaseRequest $pr, $reject_reason)
    {
        $this->pr = $pr;
        $this->reject_reason = $reject_reason;
    }

    public function via($notifiable)
    {
        return ['mail', 'database'];
    }

    public function toMail($notifiable)
    {
        return (new MailMessage)
            ->subject('Purchase Request Rejected')
            ->line('Your purchase request #' . $this->pr->pr_number . ' has been rejected.')
            ->line('Reason: ' . $this->reject_reason)
            ->action('View Details', url('/purchase-requests/' . $this->pr->id))
            ->line('Thank you.');
    }

public function toArray($notifiable)
{
    return [
        'type' => 'rejected', // 👈 key identifier
        'message' => "❌ Your Purchase Request #{$this->pr->pr_number} has been rejected.",
        'pr_id' => $this->pr->id,
        'reason' => $this->reject_reason,
    ];
}

}
