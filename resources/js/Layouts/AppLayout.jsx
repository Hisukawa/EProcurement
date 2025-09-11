import React, { useState } from "react"
import { usePage, Link } from "@inertiajs/react"
import { AppSidebar } from "@/Components/ui/sidebar" // your shadcn sidebar
import { SidebarProvider } from "@/Components/ui/sidebar" // make sure shadcn sidebar provider wraps
import { Bell } from "lucide-react"

export default function AppLayout({ header, children }) {
  const { auth } = usePage().props
  const user = auth?.user

  const [showNotifications, setShowNotifications] = useState(false)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-gray-100">
        {/* Shadcn Sidebar */}
        <AppSidebar />

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col">
          {/* Header */}
          <header className="bg-white shadow sticky top-0 z-30 px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">{header || "Dashboard"}</h1>
              <p className="text-sm text-gray-500 font-medium">
                e-Procurement & Inventory Management System
              </p>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-4">
              {/* Notifications */}
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                className="relative focus:outline-none"
              >
                <Bell className="w-6 h-6 text-gray-600 hover:text-gray-800" />
                {/* Example unread badge */}
                {auth?.notifications?.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
                    {auth.notifications.length}
                  </span>
                )}
              </button>

              {/* User Dropdown */}
              <div className="hidden md:block">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    {user?.firstname} {user?.lastname}
                  </span>
                  <Link
                    href={route("logout")}
                    method="post"
                    as="button"
                    className="text-xs text-red-600 hover:underline"
                  >
                    Logout
                  </Link>
                </div>
              </div>
            </div>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto p-6 bg-gray-200">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
