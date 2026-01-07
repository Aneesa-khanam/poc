import { AlertTriangle, XCircle } from 'lucide-react';

interface FailurePatternsProps {
  failures: any[];
}

export default function FailurePatterns({ failures }: FailurePatternsProps) {
  if (!failures || failures.length === 0) {
    return (
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
          <AlertTriangle className="w-5 h-5 text-yellow-500" />
          <span>Failure Patterns</span>
        </h3>
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="text-center">
            <XCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
            <p>No failures detected - system running smoothly!</p>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-500/20 text-red-400 border-red-500';
      case 'investigating':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'resolved':
        return 'bg-green-500/20 text-green-400 border-green-500';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500';
    }
  };

  return (
    <div className="card">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
        <AlertTriangle className="w-5 h-5 text-yellow-500" />
        <span>Failure Patterns</span>
      </h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {failures.slice(0, 10).map((failure, index) => (
          <div
            key={index}
            className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-white font-medium">{failure.models?.name || 'Unknown Model'}</span>
                  <span className={`text-xs px-2 py-1 rounded border ${getStatusColor(failure.status)}`}>
                    {failure.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {failure.task_types?.name || 'Unknown Task Type'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-white font-semibold">{failure.occurrence_count}x</div>
                <div className="text-xs text-slate-400">occurrences</div>
              </div>
            </div>

            <div className="bg-slate-800 rounded p-2 mb-2">
              <code className="text-xs text-red-400">
                {failure.error_code}: {failure.error_signature}
              </code>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="text-slate-400">
                Cost wasted: <span className="text-red-400">${failure.total_cost_wasted.toFixed(4)}</span>
              </div>
              <div className="text-slate-400">
                Avg tokens: <span className="text-white">{failure.avg_tokens_at_failure}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
