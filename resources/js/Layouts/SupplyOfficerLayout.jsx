import { useEffect, useRef, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  HomeIcon,
  TruckIcon,
  DocumentTextIcon,
  UsersIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  BellAlertIcon
} from '@heroicons/react/24/solid';
import logo from '../src/deped1.png';
import NavLink from '@/Components/NavLink';
import Dropdown from '@/Components/Dropdown';
import axios from 'axios';
import { BoxesIcon, ClipboardCheck, PackageCheck } from 'lucide-react';
import { Toaster } from "@/components/ui/toaster";

function PORequestsDropdown({ isSidebarCollapsed }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-2 py-2 hover:bg-indigo-600 hover:text-white rounded-lg"
      >
        <div className="flex items-center gap-2 w-full">
          <DocumentTextIcon className="w-5 h-5 text-gray-300 text-sm" />
          {!isSidebarCollapsed && <span className="text-gray-200 text-sm">Purchase Orders</span>}
        </div>
        {!isSidebarCollapsed && (
          <ChevronDownIcon
            className={`w-5 h-5 text-gray-300 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        )}
      </button>

      {isOpen && (
        <nav className="mt-2 pl-10 space-y-1">
          {[
            { label: 'Generate PO', routeName: 'supply_officer.purchase_orders'},
            { label: 'Manage POs', routeName: 'supply_officer.purchase_orders_table'},
          ].map((item) => (
            <NavLink
              key={item.label}
              href={item.routeName ? route(item.routeName) : '#'}
              active={item.routeName ? route().current(item.routeName) : false}
              className="block text-sm text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-1 rounded-md"
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      )}
    </div>
  );
}

export default function SupplyOfficerLayout({ header, children }) {
  const { user } = usePage().props.auth;
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const notificationsRef = useRef(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await axios.get('/notifications');
        setNotifications(res.data);
      } catch (err) {
        console.error('Notification fetch error:', err);
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900 text-white flex items-center justify-between px-4 py-3 shadow-md">
        <Link href="/"><img src={logo} alt="Logo" className="h-10 w-auto" /></Link>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`md:block ${sidebarOpen ? 'block' : 'hidden'} md:w-64 w-full bg-gray-900 text-white sticky top-0 h-screen`}>
        <div className="p-6">
          <Link href="/"><img src={logo} alt="DepEd Logo" className="h-20 mx-auto mb-4" /></Link>
          <p className="text-center text-xs text-gray-400 font-mono mb-4">Supply & Property Office</p>
          <nav className="flex flex-col gap-2">
            <NavLink
              href={route('supply_officer.dashboard')}
              active={route().current('supply_officer.dashboard')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg"
            >
              <HomeIcon className="w-5 h-5 text-gray-300" />
              <span className="text-white font-medium">Dashboard</span>
            </NavLink>
            <PORequestsDropdown isSidebarCollapsed={false} />
            <NavLink
              href={route('supply_officer.iar_table')}
              active={route().current('supply_officer.iar_table')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg"
            >
              <ClipboardCheck className="w-5 h-5 text-gray-300" />
              <span className="text-white text-sm">Inspection and Acceptance Reports</span>
            </NavLink>
            <NavLink
              href={route('supply_officer.inventory')}
              active={route().current('supply_officer.inventory')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg"
            >
              <BoxesIcon className="w-5 h-5 text-gray-300" />
              <span className="text-white font-medium">Inventory</span>
            </NavLink>
            <NavLink
              href={route('supply_officer.ris_issuance')}
              active={[
                'supply_officer.ris_issuance',
                'supply_officer.ics_issuance_low',
                'supply_officer.ics_issuance_high',
                'supply_officer.par_issuance',
              ].some((name) => route().current(name))}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg"
            >
              <PackageCheck className="w-5 h-5 text-gray-300" />
              <span className="text-white font-medium">Item Issuance</span>
            </NavLink>


            <NavLink
              // href={route('supply_officer.suppliers')}
              // active={route().current('supply_officer.suppliers')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg"
            >
              <UsersIcon className="w-5 h-5 text-gray-300" />
              <span className="text-white font-medium">Suppliers</span>
            </NavLink>

            {/* <NavLink
              // href={route('supply_officer.delivery_logs')}
              // active={route().current('supply_officer.delivery_logs')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg"
            >
              <TruckIcon className="w-5 h-5 text-gray-300" />
              <span className="text-white font-medium">Delivery Logs</span>
            </NavLink> */}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow px-6 py-4 flex justify-between items-center sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{header || 'Dashboard'}</h1>
            <p className="text-sm text-gray-500 font-medium">
              e-Procurement & Inventory Management System
            </p>
          </div>

          <div className="relative flex items-center gap-4">
            <button
              onClick={() => setShowNotifications((prev) => !prev)}
              className="relative focus:outline-none"
            >
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
                className="absolute right-0 mt-10 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
              >
                <div className="p-3 font-medium text-gray-700 border-b">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">No notifications.</div>
                ) : (
                  <ul className="max-h-60 overflow-y-auto">
                    {notifications.map((n) => (
                      <li key={n.id} className="px-4 py-2 hover:bg-gray-100 text-sm text-gray-800">
                        {n.data?.message || 'New notification'}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            <Dropdown>
              <Dropdown.Trigger>
                <span className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer">
                  {user.firstname} {user.lastname}
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4-4-4a1 1 0 010-1.414z" />
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
        </header>

        <main className="p-6 flex-1 overflow-y-auto bg-gray-300">
          {children}
        </main>
        <Toaster />
        {/* <footer className="bg-gray-900 text-gray-300 sticky">
          <div className="max-w-7xl mx-auto px-6 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="flex flex-col items-start">
              <img src={logo} alt="DepEd Logo" className="h-12 mb-2" />
              <p className="text-gray-400 text-sm">
                Schools Division Office - Supply & Property Office
              </p>
              <p className="text-gray-400 text-sm mt-1">
                e-Procurement & Inventory Management System
              </p>
            </div>

            
            <div className="flex flex-col">
              <h4 className="text-white font-semibold mb-2">Quick Links</h4>
              <Link href={route('supply_officer.dashboard')} className="hover:text-white transition-colors text-sm mb-1">
                Dashboard
              </Link>
              <Link href={route('supply_officer.inventory')} className="hover:text-white transition-colors text-sm mb-1">
                Inventory
              </Link>
              <Link href={route('supply_officer.purchase_orders')} className="hover:text-white transition-colors text-sm mb-1">
                Purchase Orders
              </Link>
              <Link href={route('supply_officer.ris_issuance')} className="hover:text-white transition-colors text-sm mb-1">
                Issuance
              </Link>
            </div>

            
            <div className="flex flex-col">
              <h4 className="text-white font-semibold mb-2">Contact</h4>
              <p className="text-gray-400 text-sm mb-1">Email: info@deped.gov.ph</p>
              <p className="text-gray-400 text-sm mb-1">Phone: (02) 123-4567</p>
              <p className="text-gray-400 text-sm mb-1">Address: Ilagan City, Isabela</p>
            </div>
          </div>

          
          <div className="border-t border-gray-700 mt-6 py-4 text-center text-gray-500 text-xs">
            &copy; {new Date().getFullYear()} Schools Division Office. All rights reserved.
          </div>
        </footer> */}

      </div>
    </div>
  );
}
