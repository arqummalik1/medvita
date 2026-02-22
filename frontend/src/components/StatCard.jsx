import SparklineChart from './SparklineChart';

export default function StatCard({ title, value, trendValue, chartData, period = "This Week" }) {
    const isPositive = trendValue > 0;

    return (
        <div className="stat-card-modern group">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                    <h3 className="text-slate-500 dark:text-slate-400 text-sm font-medium mb-1">{title}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</span>
                    </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${isPositive
                    ? 'bg-teal-50 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'
                    : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'
                    }`}>
                    {isPositive ? '+' : ''}{trendValue}%
                </span>
            </div>

            <div className="h-16 w-full relative z-10 min-h-[64px]" style={{ width: '99%' }}>
                <SparklineChart data={chartData} color={isPositive ? '#2DD4BF' : '#F43F5E'} />
            </div>

            <p className="text-xs text-slate-400 mt-4 relative z-10 font-medium">
                Compared to {period}
            </p>
        </div>
    );
}
