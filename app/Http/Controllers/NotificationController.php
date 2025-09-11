<?php

namespace App\Http\Controllers;

    use Illuminate\Http\Request;
    use Illuminate\Support\Facades\Auth;
    use App\Models\User;
class NotificationController extends Controller
{


    public function fetch()
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        return $user->notifications()
            ->whereNull('read_at') // Laravel uses this field to track unread notifications
            ->latest()
            ->take(5)
            ->get();
    }
    public function markAsRead($id)
    {
        /** @var User $user */
        $user = Auth::user();

        if (!$user) {
            return response()->json(['error' => 'Unauthenticated'], 401);
        }

        $notification = $user->notifications()->find($id);

        if (!$notification) {
            return response()->json(['error' => 'Notification not found'], 404);
        }

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }



}
