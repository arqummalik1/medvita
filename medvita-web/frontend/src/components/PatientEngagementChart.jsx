import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Mon', visits: 40, satisfaction: 24 },
  { name: 'Tue', visits: 30, satisfaction: 13 },
  { name: 'Wed', visits: 20, satisfaction: 98 },
  { name: 'Thu', visits: 27, satisfaction: 39 },
  { name: 'Fri', visits: 18, satisfaction: 48 },
  { name: 'Sat', visits: 23, satisfaction: 38 },
  { name: 'Sun', visits: 34, satisfaction: 43 },
];

export default function PatientEngagementChart() {
  return (
    <div className="glass-panel p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">Patient Engagement</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">Weekly visit analytics</p>
        </div>
        <select className="bg-slate-50 dark:bg-slate-800 border-none text-xs rounded-lg px-3 py-1.5 text-slate-600 dark:text-slate-300 font-medium focus:ring-0 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
        </select>
      </div>

      <div className="flex-1 w-full min-h-[300px]" style={{ width: '99%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2DD4BF" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2DD4BF" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSat" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#94A3B8', fontSize: 12 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                backdropFilter: 'blur(8px)',
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              itemStyle={{ fontSize: '12px', fontWeight: 600 }}
              labelStyle={{ color: '#64748B', marginBottom: '4px' }}
            />
            <Area
              type="monotone"
              dataKey="visits"
              stroke="#2DD4BF"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorVisits)"
            />
            <Area
              type="monotone"
              dataKey="satisfaction"
              stroke="#3B82F6"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorSat)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
