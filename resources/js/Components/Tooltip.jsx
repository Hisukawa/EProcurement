import { useState } from 'react';
import { Link } from '@inertiajs/react';

export default function TooltipLink({ to, children, tooltip }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative inline-block"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Link href={to} className="text-blue-600 hover:underline">
        {children}
      </Link>

      {showTooltip && (
        <div className="absolute bottom-full mb-2 w-max px-2 py-1 bg-gray-800 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
          {tooltip}
        </div>
      )}
    </div>
  );
}
