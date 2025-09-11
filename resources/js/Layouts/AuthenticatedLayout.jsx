import ApplicationLogo from '@/Components/ApplicationLogo';
import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import { Link, usePage } from '@inertiajs/react';
import { useState } from 'react';

export default function AuthenticatedLayout({ header, children }) {
    const { user } = usePage().props.auth;
    const [showingNavigationDropdown, setShowingNavigationDropdown] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100">
            {/* Top Navigation */}
            <nav className="bg-indigo-700 shadow text-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16 items-center">
                        {/* Left: Logo + App Title */}
                        <div className="flex items-center gap-4">
                            <Link href="/" className="flex items-center gap-2">
                                <ApplicationLogo className="block h-9 w-auto fill-white" />
                                <span className="text-lg font-semibold leading-tight hidden sm:inline">
                                    e-Procurement & Inventory
                                    <br className="hidden lg:block" />
                                    Management System
                                </span>
                            </Link>

                            <div className="hidden sm:flex space-x-8 sm:ms-10">
                                <NavLink href={route('dashboard')} active={route().current('dashboard')} className="text-white hover:text-gray-200">
                                    Dashboard
                                </NavLink>
                            </div>
                        </div>

                        {/* Right: User Menu */}
                        <div className="hidden sm:flex sm:items-center">
                            <Dropdown>
                                <Dropdown.Trigger>
                                    <span className="inline-flex rounded-md">
                                        <button
                                            type="button"
                                            className="inline-flex items-center px-3 py-2 text-sm font-medium leading-4 text-white hover:text-gray-200 focus:outline-none transition"
                                        >
                                            {user.firstname} {user.lastname}
                                            <svg className="ms-2 h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                                <path
                                                    fillRule="evenodd"
                                                    d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                        </button>
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

                        {/* Mobile Menu Toggle */}
                        <div className="sm:hidden">
                            <button
                                onClick={() => setShowingNavigationDropdown(prev => !prev)}
                                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:bg-indigo-600 focus:outline-none"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        className={showingNavigationDropdown ? 'hidden' : 'inline-flex'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={showingNavigationDropdown ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {showingNavigationDropdown && (
                    <div className="sm:hidden bg-indigo-800 text-white px-4 pb-4">
                        <div className="pt-2 space-y-1">
                            <ResponsiveNavLink
                                href={route('dashboard')}
                                active={route().current('dashboard')}
                                className="text-white hover:text-gray-300"
                            >
                                Dashboard
                            </ResponsiveNavLink>
                        </div>

                        <div className="border-t border-indigo-600 mt-3 pt-3">
                            <div className="text-sm font-medium">{user.firstname} {user.lastname}</div>
                            <div className="text-xs text-gray-300">{user.email}</div>
                            <div className="mt-2 space-y-1">
                                <ResponsiveNavLink href={route('profile.edit')}>
                                    Profile
                                </ResponsiveNavLink>
                                <ResponsiveNavLink method="post" href={route('logout')} as="button">
                                    Log Out
                                </ResponsiveNavLink>
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            {/* Optional Page Header */}
            {header && (
                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        <h1 className="text-xl font-semibold text-gray-800">{header}</h1>
                        <p className="text-sm text-gray-500">e-Procurement & Inventory Management System</p>
                    </div>
                </header>
            )}

            {/* Main Content */}
            <main className="p-6">{children}</main>
        </div>
    );
}
