import { Clock, Cpu } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface RecentDecisionsProps {
  decisions: any[];
}

export default function RecentDecisions({ decisions }: RecentDecisionsProps) {
  if (!decisions || decisions.length === 0) {
    return (
      <div className="card">
        <h3 className="text-xl font-bold text-white mb-4">Recent Routing Decisions</h3>
        <div className="flex items-center justify-center h-64 text-slate-400">
          No routing decisions yet
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <h3 className="text-xl font-bold text-white mb-4">Recent Routing Decisions</h3>
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {decisions.map((decision, index) => (
          <div
            key={index}
            className="bg-slate-700/50 rounded-lg p-4 hover:bg-slate-700 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Cpu className="w-4 h-4 text-primary-500" />
                <span className="text-white font-medium">{decision.models.name}</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{formatDistanceToNow(new Date(decision.created_at), { addSuffix: true })}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400">Task Type:</span>
                <span className="text-white ml-2">{decision.task_types.name}</span>
              </div>
              <div>
                <span className="text-slate-400">Score:</span>
                <span className="text-white ml-2">{decision.decision_score.toFixed(3)}</span>
              </div>
              <div>
                <span className="text-slate-400">Input Tokens:</span>
                <span className="text-white ml-2">{decision.input_tokens}</span>
              </div>
              <div>
                <span className="text-slate-400">Est. Tokens Out:</span>
                <span className="text-white ml-2">{decision.estimated_output_tokens}</span>
              </div>
            </div>

            {decision.decision_reason && (
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                {decision.decision_reason}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
