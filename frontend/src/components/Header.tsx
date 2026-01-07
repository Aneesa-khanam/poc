import { Activity, DollarSign, Zap } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-slate-800 border-b border-slate-700">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-600 p-2 rounded-lg">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Airr 3.0</h1>
              <p className="text-sm text-slate-400">Model Router</p>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-green-500" />
              <span className="text-sm text-slate-300">System Operational</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-primary-500" />
              <span className="text-sm text-slate-300">Cost Optimized</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
