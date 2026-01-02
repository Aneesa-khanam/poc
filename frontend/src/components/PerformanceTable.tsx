import { TrendingUp, TrendingDown } from 'lucide-react';

interface PerformanceTableProps {
  data: any[];
}

export default function PerformanceTable({ data }: PerformanceTableProps) {
  if (!data || data.length === 0) {
    return (
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-4">Model Performance (24h)</h3>
        <div className="flex items-center justify-center h-64 text-slate-400">
          No performance data available
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-xl font-bold text-white mb-4">Model Performance (24h)</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-2 text-slate-400 font-medium">Model</th>
              <th className="text-right py-3 px-2 text-slate-400 font-medium">Tasks</th>
              <th className="text-right py-3 px-2 text-slate-400 font-medium">Success</th>
              <th className="text-right py-3 px-2 text-slate-400 font-medium">Avg Latency</th>
              <th className="text-right py-3 px-2 text-slate-400 font-medium">Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 8).map((row, index) => {
              const successRate = row.total_executions > 0
                ? (row.successful / row.total_executions) * 100
                : 0;

              return (
                <tr key={index} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                  <td className="py-3 px-2">
                    <div className="flex flex-col">
                      <span className="text-white font-medium">{row.model_name}</span>
                      <span className="text-xs text-slate-400">{row.provider}</span>
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-white">
                    {row.total_executions}
                  </td>
                  <td className="text-right py-3 px-2">
                    <div className="flex items-center justify-end space-x-1">
                      <span className={successRate >= 90 ? 'text-green-400' : 'text-yellow-400'}>
                        {successRate.toFixed(0)}%
                      </span>
                      {successRate >= 90 ? (
                        <TrendingUp className="w-4 h-4 text-green-400" />
                      ) : (
                        <TrendingDown className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-white">
                    {Math.round(row.avg_latency_ms)}ms
                  </td>
                  <td className="text-right py-3 px-2 text-green-400">
                    ${parseFloat(row.total_cost).toFixed(4)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
