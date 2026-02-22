import { LineChart, Line, ResponsiveContainer } from 'recharts';

export default function SparklineChart({ data, color }) {
    // Transform array of numbers to array of objects for Recharts
    const chartData = data.map((value, index) => ({ index, value }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
                <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke={color} 
                    strokeWidth={2} 
                    dot={false} 
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
