import { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import axios from 'axios';
import {
  HomeIcon,
  ClipboardDocumentIcon,
  Bars3Icon,
  XMarkIcon,
} from '@heroicons/react/24/solid';
import { BellAlertIcon } from '@heroicons/react/16/solid';
import NavLink from '@/Components/NavLink';
import Dropdown from '@/Components/Dropdown';
import logo from '../src/deped1.png';
import { Inertia } from '@inertiajs/inertia';
import { CheckCircleIcon, ClipboardCheckIcon, FileTextIcon } from 'lucide-react';
import { Toaster } from "@/components/ui/toaster";
import usePolling from "@/hooks/usePolling";

export default function ApproverLayout({ header, children }) {
  const { user } = usePage().props.auth;
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);

  const notificationsRef = useRef(null);
  const unreadCount = notifications.filter((n) => !n.read).length;
  const [flashMessage, setFlashMessage] = useState('');
  const [showFlash, setShowFlash] = useState(false);
const [hasInitialized, setHasInitialized] = useState(false);


  useEffect(() => {
    const interval = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const response = await axios.get('/notifications');
      const notificationsWithReadFlag = response.data.map(n => ({
        ...n,
        read: n.read_at !== null,
      }));

      const newUnread = notificationsWithReadFlag.filter(n => !n.read).length;
      const prevUnread = notifications.filter(n => !n.read).length;

      if (hasInitialized && newUnread > prevUnread) {
        triggerFlash('📬 A purchase request has been submitted!');
      }

      setNotifications(notificationsWithReadFlag);
      if (!hasInitialized) setHasInitialized(true);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  fetchNotifications();
  const interval = setInterval(fetchNotifications, 10000);
  return () => clearInterval(interval);
}, [notifications, hasInitialized]);


  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const triggerFlash = (message) => {
    setFlashMessage(message);
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 10000); // 10 seconds
  };

  const formattedDateTime = currentDateTime.toLocaleString('en-PH', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: true,
  });

const markAsRead = async (notification) => {
  try {
    await axios.post(`/notifications/${notification.id}/read`);
    setNotifications((prevNotifications) =>
      prevNotifications.map((n) =>
        n.id === notification.id ? { ...n, read: true } : n
      )
    );

  } catch (error) {
    console.error('Failed to mark notification as read:', error);
  }
};


  return (
    <>
    {showFlash && (
        <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-6 py-4 rounded-lg shadow-lg z-50 animate-pulse text-lg font-semibold">
          {flashMessage}
        </div>
      )}
    
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900 text-white flex items-center justify-between px-4 py-3 shadow-md">
        <Link href="/">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
        </Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="focus:outline-none">
          {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-64 w-full bg-gray-900 text-white md:sticky md:top-0 h-screen sticky z-50`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex justify-center mb-6">
            <Link href="/">
              <img src={logo} alt="Department Logo" className="h-20 w-[200px] object-contain" draggable="false" />
            </Link>
          </div>

          <div className="text-center text-xs text-gray-400 font-mono mb-6 select-none">
            Supply & Property Office
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            <NavLink
              href={route('bac_user.dashboard')}
              active={route().current('bac_user.dashboard')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg"
            >
              <HomeIcon className="w-5 h-5 text-gray-300" />
              <span className="text-white font-medium">Dashboard</span>
            </NavLink>

            <NavLink
              href={route('bac_user.purchase_requests')}
              active={route().current('bac_user.purchase_requests')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg"
            >
              <ClipboardDocumentIcon className="w-5 h-5 text-gray-300" />
              <span className="text-white font-medium">Purchase Requests</span>
            </NavLink>
            <NavLink
              href={route('bac_user.approved_requests')}
              active={route().current('bac_user.approved_requests')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg"
            >
              <CheckCircleIcon className="w-5 h-5 text-gray-300" />
              <span className="text-white font-medium">Approved for Quotations</span>
            </NavLink>

            <NavLink
              href={route('bac_user.for_quotations')}
              active={route().current('bac_user.for_quotations')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg"
            >
              <FileTextIcon className="w-5 h-5 text-gray-300" />
              <span className="text-white font-medium">Quotations</span>
            </NavLink>

          </nav>

        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow sticky top-0 z-30 px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{header || 'Dashboard'}</h1>
            <p className="text-sm text-gray-500 font-medium">
              e-Procurement & Inventory Management System
            </p>
          </div>

          <div className="relative flex items-center gap-4">
            <button onClick={() => setShowNotifications((prev) => !prev)} className="relative focus:outline-none">
              <BellAlertIcon className="w-6 h-6 text-gray-600 hover:text-gray-800" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div
                ref={notificationsRef}
                className="absolute right-0 top-8 w-96 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden"
              >
                <div className="px-4 py-3 border-b bg-gray-50 text-sm font-semibold text-gray-700">
                  Notifications
                </div>

                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-center text-gray-500">
                    You're all caught up!
                  </div>
                ) : (
                  <ul className="max-h-[420px] overflow-y-auto divide-y divide-gray-100">
                    {notifications
                      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                      .slice(0, 10)
                      .map((n) => (
                        <li
                          key={n.id}
                          onClick={async () => {
                            try {
                              // Mark as read
                              await axios.post(`/notifications/${n.id}/read`);
                              
                              // Redirect to PR details page
                              if (n.url) {
                                router.visit(n.url);
                              }
                            } catch (error) {
                              console.error('Failed to handle notification:', error);
                            }
                          }}
                          className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition duration-150 ${
                            n.read ? 'bg-white text-gray-500' : 'bg-gray-50 text-gray-900 font-semibold'
                          }`}
                        >
                          <div className="flex-shrink-0 mt-1">
                            {n.read ? (
                              <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405M19.595 15.595A2.1 2.1 0 0120 14.5V11a8.001 8.001 0 00-6.536-7.874m0 0A8 8 0 0119 11v3.5c0 .397.158.779.439 1.06M12.5 21a3.5 3.5 0 01-3.5-3.5" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-indigo-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 2a6 6 0 00-6 6v3.586L2.707 14.879a1 1 0 001.414 1.414L6 14.414V16a2 2 0 002 2h4a2 2 0 002-2v-1.586l1.879 1.879a1 1 0 001.414-1.414L16 11.586V8a6 6 0 00-6-6z" />
                              </svg>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm leading-tight">
                              {n.data?.message || n.message || 'You have a new notification.'}
                            </p>
                            <div className="flex justify-between mt-1 text-xs">
                              <span className="text-gray-400">
                                {new Date(n.created_at).toLocaleString('en-PH', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {n.read ? (
                                <span className="text-gray-400">Read</span>
                              ) : (
                                <span className="text-blue-500 font-medium">Unread</span>
                              )}
                            </div>
                          </div>
                        </li>
                      ))}
                  </ul>
                )}

                {notifications.some((n) => !n.read) && (
                  <button
                    onClick={async () => {
                      try {
                        await Promise.all(
                          notifications.map((n) =>
                            n.read ? null : axios.post(`/notifications/${n.id}/read`)
                          )
                        );
                        setNotifications((prev) =>
                          prev.map((n) => ({ ...n, read: true }))
                        );
                      } catch (error) {
                        console.error('Failed to mark all as read:', error);
                      }
                    }}
                    className="w-full text-center py-3 text-sm text-indigo-600 hover:bg-gray-100 border-t"
                  >
                    Mark all as read
                  </button>
                )}
              </div>
            )}


            <div className="hidden md:block">
              <Dropdown>
                <Dropdown.Trigger>
                  <span className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer">
                    {user.firstname} {user.lastname}
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </Dropdown.Trigger>
                <Dropdown.Content>
                  <Dropdown.Link href={route('profile.edit')}>Profile</Dropdown.Link>
                  <Dropdown.Link href={route('logout')} method="post" as="button">
                    Log Out
                  </Dropdown.Link>
                </Dropdown.Content>
              </Dropdown>
            </div>
          </div>
        </header>

        <main className="p-6 flex-1 overflow-y-auto bg-gray-300">{children}</main>
        <Toaster />
      </div>
    </div>
        </>
  );
}
