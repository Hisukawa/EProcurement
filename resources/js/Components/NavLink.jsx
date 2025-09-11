import { Link } from '@inertiajs/react';

export default function NavLink({
    active = false,
    className = '',
    children,
    icon: Icon = null,
    ...props
}) {
    const baseClasses =
        'flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150';

    const activeClasses =
        'bg-gray-800 text-white';

    const inactiveClasses =
        'text-gray-300 hover:bg-gray-700 hover:text-white';

    return (
        <Link
            {...props}
            className={`${baseClasses} ${active ? activeClasses : inactiveClasses} ${className}`}
            aria-current={active ? 'page' : undefined}
        >
            {Icon && <Icon className="w-5 h-5 text-gray-300" />}
            {children}
        </Link>
    );
}
