import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';

interface CostChartProps {
  data: any[] | null;
}

export default function CostChart({ data }: CostChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-4">Cost Breakdown by Model</h3>
        <div className="flex items-center justify-center h-64 text-slate-400">
          No cost data available
        </div>
      </div>
    );
  }

  // Group by date and model
  const chartData = data.reduce((acc: any[], item: any) => {
    const date = format(new Date(item.date), 'MMM dd');
    const existing = acc.find(d => d.date === date);
    
    if (existing) {
      existing[item.models.name] = parseFloat(item.total_cost);
      existing.total += parseFloat(item.total_cost);
    } else {
      acc.push({
        date,
        [item.models.name]: parseFloat(item.total_cost),
        total: parseFloat(item.total_cost),
      });
    }
    
    return acc;
  }, []);

  // Get unique model names for bars
  const modelNames = [...new Set(data.map(d => d.models.name))];
  const colors = ['#0ea5e9', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#ec4899'];

  return (
    <div className="card">
      <h3 className="text-xl font-bold text-white mb-4">Cost Breakdown by Model</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis dataKey="date" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" tickFormatter={(value) => `$${value.toFixed(3)}`} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#f1f5f9' }}
            formatter={(value: any) => [`$${parseFloat(value).toFixed(6)}`, '']}
          />
          <Legend />
          {modelNames.map((name, index) => (
            <Bar
              key={name}
              dataKey={name}
              stackId="cost"
              fill={colors[index % colors.length]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
