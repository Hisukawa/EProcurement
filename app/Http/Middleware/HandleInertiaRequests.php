<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => fn () => $request->user()
                    ? $request->user()->only(['id', 'name', 'email', 'firstname', 'lastname', 'position']) + [
                        'roles' => $request->user()->getRoleNames(),
                    ]
                    : null,
                'notifications' => fn () => $request->user()
                    ? $request->user()->unreadNotifications()
                        ->latest()
                        ->take(10)
                        ->get()
                        ->map(function ($notification) {
                            return [
                                'id' => $notification->id,
                                'type' => class_basename($notification->type),
                                'data' => $notification->data,
                                'created_at' => $notification->created_at->diffForHumans(),
                            ];
                        })
                    : [],
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'newProduct' => fn () => $request->session()->get('newProduct')
            ],
            
        ]);
    }

}
