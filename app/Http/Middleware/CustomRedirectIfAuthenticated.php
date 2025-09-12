<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CustomRedirectIfAuthenticated
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$guards)
    {
        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                $user = Auth::user();

                if ($user->hasRol('admin')) {
                    return redirect()->route('admin.dashboard');
                } elseif ($user->hasRole('requester')) {
                    return redirect()->route('requester.dashboard');
                } elseif ($user->hasRole('bac_approver')) {
                    return redirect()->route('bac_approver.dashboard');
                } elseif ($user->hasRole('supply_officer')) {
                    return redirect()->route('supply_officer.dashboard');
                }

                // fallback
                return redirect()->route('dashboard');
            }
        }

        return $next($request);
    }
}
