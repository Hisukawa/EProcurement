import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import logo from '../src/depedlogo.png';

export default function GuestLayout({ children }) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-gray-300 pt-6 sm:justify-center sm:pt-0">
            <div>
                <Link href="/">
                    <img src={logo} className="h-60 w-60 fill-current text-gray-500" />
                </Link>
            </div>

            <div className="mt-6 w-full overflow-hidden bg-white px-6 py-4 shadow-md sm:max-w-4xl sm:rounded-lg">
                {children}
            </div>
        </div>
    );
}

