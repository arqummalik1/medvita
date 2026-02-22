import clsx from 'clsx';

export function Badge({ children, variant = 'default', className }) {
    const variants = {
        default: 'bg-gray-100 text-gray-700',
        success: 'bg-[#D1FAE5] text-[#065F46]',    // Green
        warning: 'bg-[#FEF3C7] text-[#92400E]',    // Yellow
        error: 'bg-[#FEE2E2] text-[#991B1B]',      // Red
        info: 'bg-[#DBEAFE] text-[#1E40AF]',       // Blue
        purple: 'bg-[#E0F2F1] text-[#00695C]',     // Teal (mapped from purple)
        confirmed: 'bg-[#D8F4E6] text-[#065F46]',  // Mint
        pending: 'bg-[#FFF7ED] text-[#9A3412]',    // Orange
        cancelled: 'bg-[#FEF2F2] text-[#991B1B]',  // Red
        active: 'bg-[#E0F2F1] text-[#00695C]',     // Teal (active)
    };

    return (
        <span
            className={clsx(
                'inline-flex items-center px-3 py-1 rounded-[20px] text-xs font-semibold gap-1.5',
                variants[variant] || variants.default,
                className
            )}
        >
            {variant === 'confirmed' && <span className="w-1.5 h-1.5 rounded-full bg-[#34D399]" />}
            {variant === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />}
            {variant === 'cancelled' && <span className="w-1.5 h-1.5 rounded-full bg-[#F87171]" />}
            {children}
        </span>
    );
}
