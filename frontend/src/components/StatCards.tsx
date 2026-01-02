import { DollarSign, Activity, TrendingUp, Zap } from 'lucide-react';

interface StatCardsProps {
  metrics: {
    totalCost: number;
    totalTasks: number;
    successfulTasks: number;
    failedTasks: number;
    avgCostPerTask: number;
    successRate: number;
  } | null;
}

export default function StatCards({ metrics }: StatCardsProps) {
  if (!metrics) {
    return null;
  }

  const stats = [
    {
      title: 'Total Cost (7d)',
      value: `$${metrics.totalCost.toFixed(4)}`,
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Total Tasks',
      value: metrics.totalTasks.toLocaleString(),
      icon: Activity,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Success Rate',
      value: `${metrics.successRate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Avg Cost/Task',
      value: `$${metrics.avgCostPerTask.toFixed(6)}`,
      icon: Zap,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="stat-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-white">{stat.value}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
