import clsx from 'clsx';
import { Search } from 'lucide-react';

import { forwardRef } from 'react';

export const Input = forwardRef(({
    className,
    type = 'text',
    label,
    error,
    icon,
    ...props
}, ref) => {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-label mb-1.5 ml-1">
                    {label}
                </label>
            )}
            <div className="relative">
                {icon && (
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                        {icon}
                    </div>
                )}
                <input
                    type={type}
                    className={clsx(
                        'input-field',
                        icon && 'pl-11',
                        error && 'ring-red-300 focus:ring-red-400',
                        className
                    )}
                    ref={ref}
                    {...props}
                />
            </div>
            {error && (
                <p className="mt-1 text-xs text-red-500 ml-1">{error}</p>
            )}
        </div>
    );
});

Input.displayName = 'Input';

export function SearchInput({ className, ...props }) {
    return (
        <div className={clsx('relative', className)}>
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
                type="text"
                className="input-field pl-11"
                placeholder="Search patients, appointments..."
                {...props}
            />
        </div>
    );
}
