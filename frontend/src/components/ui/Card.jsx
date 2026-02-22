import clsx from 'clsx';

export function Card({ children, className, ...props }) {
    return (
        <div
            className={clsx(
                'bg-white rounded-[24px] p-6 shadow-sm border border-gray-100',
                'transition-all duration-200 hover:shadow-md',
                className
            )}
            {...props}
        >
            {children}
        </div>
    );
}

export function StatsCard({ title, value, trend, icon: Icon, color = 'blue', trendLabel }) {
    const colorStyles = {
        cyan: { bg: 'bg-cyan-50', text: 'text-cyan-600', icon: 'text-cyan-600' },
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-600' },
        purple: { bg: 'bg-blue-50', text: 'text-blue-600', icon: 'text-blue-600' },
        indigo: { bg: 'bg-cyan-50', text: 'text-cyan-600', icon: 'text-cyan-600' },
        orange: { bg: 'bg-orange-50', text: 'text-orange-600', icon: 'text-orange-600' },
        red: { bg: 'bg-red-50', text: 'text-red-600', icon: 'text-red-600' },
        emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600', icon: 'text-emerald-600' },
    };

    const styles = colorStyles[color] || colorStyles.teal;

    return (
        <Card className="flex flex-col justify-between h-full">
            <div className="flex items-start justify-between mb-4">
                <div className={clsx("p-3 rounded-2xl", styles.bg)}>
                    {Icon && <Icon className={clsx("h-6 w-6", styles.icon)} />}
                </div>
                {trend && (
                    <span className={clsx(
                        "text-xs font-semibold px-2.5 py-1 rounded-full",
                        trend.startsWith('+') ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"
                    )}>
                        {trend}
                    </span>
                )}
            </div>
            <div>
                <h3 className="text-3xl font-bold text-gray-900 mb-1">{value}</h3>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                {trendLabel && <p className="text-xs text-gray-400 mt-1">{trendLabel}</p>}
            </div>
        </Card>
    );
}
