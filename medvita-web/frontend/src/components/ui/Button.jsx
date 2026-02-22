import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

export function Button({
    children,
    variant = 'primary',
    size = 'md',
    className,
    isLoading,
    disabled,
    type = 'button',
    ...props
}) {
    const variants = {
        primary: 'bg-teal-600 text-white shadow-md shadow-teal-200 hover:bg-teal-700 hover:-translate-y-[1px] hover:shadow-lg border border-transparent',
        blue: 'bg-blue-600 text-white shadow-md shadow-blue-200 hover:bg-blue-700 hover:-translate-y-[1px] hover:shadow-lg border border-transparent',
        secondary: 'bg-transparent text-teal-700 border border-teal-200 hover:bg-teal-50',
        icon: 'w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200 hover:text-black',
        danger: 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200',
        ghost: 'text-gray-600 hover:bg-gray-100 hover:text-black'
    };

    const sizes = {
        sm: 'text-xs px-4 py-2 rounded-full',
        md: 'text-sm px-6 py-2.5 rounded-full',
        lg: 'text-base px-8 py-3.5 rounded-full',
        icon: 'p-0' // Specific for icon variant
    };

    // Override size for icon variant
    const finalSize = variant === 'icon' ? sizes.icon : sizes[size];

    return (
        <button
            type={type}
            className={clsx(
                'inline-flex items-center justify-center font-semibold transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none',
                variants[variant],
                finalSize,
                className
            )}
            disabled={disabled || isLoading}
            {...props}
        >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            {children}
        </button>
    );
}
