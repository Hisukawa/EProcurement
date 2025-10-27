import { useEffect, useState } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
  HomeIcon,
  ClipboardDocumentIcon,
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  TvIcon,
} from '@heroicons/react/24/solid';
import NavLink from '@/Components/NavLink';
import Dropdown from '@/Components/Dropdown';
import logo from '../src/deped1.png';
import { Activity, ActivityIcon, Settings, UserCog, Users } from 'lucide-react';
import { Toaster } from '@/Components/ui/toaster';

// function PurchaseRequestsDropdown({ isSidebarCollapsed }) {
//   const [isOpen, setIsOpen] = useState(false);

//   return (
//     <div className="w-full">
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         aria-expanded={isOpen}
//         className="flex items-center justify-between w-full px-2 py-2 hover:bg-indigo-600 hover:text-white rounded-lg transition-all duration-200"
//       >
//         <div className="flex items-center gap-2 w-full">
//           <ClipboardDocumentIcon className="w-5 h-5 text-gray-300" />
//           {!isSidebarCollapsed && <span className="text-gray-200 font-medium text-nowrap pe-1">Purchase Requests</span>}
//         </div>
//         {!isSidebarCollapsed && (
//           <ChevronDownIcon
//             className={`w-5 h-5 text-gray-300 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
//           />
//         )}
//       </button>

//       {isOpen && (
//         <nav className="mt-2 pl-10 space-y-1">
//           {[
//             { label: 'Purchase Requests' },
//             { label: 'For Review' },
//             { label: 'Approved' },
//             { label: 'Disapproved' },
//           ].map((item) => (
//             <NavLink
//               key={item.label}
//               href={item.routeName ? route(item.routeName) : '#'}
//               active={item.routeName ? route().current(item.routeName) : false}
//               className="block text-sm text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-1 rounded-md transition"
//             >
//               {item.label}
//             </NavLink>
//           ))}
//         </nav>
//       )}
//     </div>
//   );
// }

export default function AdminLayout({ header, children }) {
  const { user } = usePage().props.auth;
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-100">
      {/* Mobile Header */}
      <div className="md:hidden bg-gray-900 text-white flex items-center justify-between px-4 py-3 shadow-md">
        <Link href="/">
          <img src={logo} alt="Logo" className="h-10 w-auto" />
        </Link>
        {/* <button onClick={() => setSidebarOpen(!sidebarOpen)} className="focus:outline-none">
          {sidebarOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button> */}
      </div>

      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'block' : 'hidden'
        } md:block md:w-64 w-full bg-gray-900 text-white shadow-2xl md:sticky md:top-0 h-screen md:h-auto sticky z-50 transition-all duration-300`}
      >
        <div className="p-6 flex flex-col h-full">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <Link href="/">
              <img src={logo} alt="Department Logo" className="h-20 w-[200px] object-contain" draggable="false" />
            </Link>
          </div>

          {/* Time */}
          <div className="text-center text-xs text-gray-400 font-mono mb-6 select-none">
            Supply and Property Office
          </div>

          {/* Navigation */}
          <nav className="flex flex-col gap-2">
            <NavLink
              href={route('admin.dashboard')}
              active={route().current('admin.dashboard')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg transition-all duration-200"
            >
              <HomeIcon className="w-5 h-5 text-gray-300" />
              <span className="text-white font-medium">Dashboard</span>
            </NavLink>

            <NavLink
              href={route('admin.activity_logs')}
              active={route().current('admin.activity_logs')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg transition-all duration-200"
            >
              <TvIcon className="w-5 h-5 text-gray-300" />
              <span className="text-white font-medium">Activity Logs</span>
            </NavLink>

            <NavLink
              href={route('admin.view_users')}
              active={route().current('admin.view_users')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg transition-all duration-200"
            >
              <Users className="w-5 h-5 text-gray-300" />
              <span className="text-white font-medium">Users</span>
            </NavLink>
            <NavLink
              href={route('admin.settings')}
              active={route().current('admin.settings')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg transition-all duration-200"
            >
              <Settings className="w-5 h-5 text-gray-300" />
              <span className="text-white font-medium">System Settings</span>
            </NavLink>
            {/* <NavLink
              href={route('admin.audit_logs')}
              active={route().current('admin.audit_logs')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-600 rounded-lg transition-all duration-200"
            >
              <ClipboardDocumentIcon className="w-5 h-5 text-gray-300" />
              <span className="text-white font-medium">Audit Logs</span>
            </NavLink> */}

            {/* <PurchaseRequestsDropdown isSidebarCollapsed={false} /> */}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow sticky top-0 z-20 px-6 py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">{header || 'Dashboard'}</h1>
            <p className="text-sm text-gray-500 font-medium">
              e-Procurement & Inventory Management System
            </p>
          </div>

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
        </header>

        <main className="p-6 flex-1 overflow-y-auto bg-gray-300">{children}</main>
        <Toaster/>
      </div>
    </div>
  );
}
