import { useEffect, useState } from 'react';
import StatCards from './StatCards';
import CostChart from './CostChart';
import PerformanceTable from './PerformanceTable';
import RecentDecisions from './RecentDecisions';
import FailurePatterns from './FailurePatterns';

export default function Dashboard() {
  const [costMetrics, setCostMetrics] = useState<any>(null);
  const [performance, setPerformance] = useState<any[]>([]);
  const [decisions, setDecisions] = useState<any[]>([]);
  const [failures, setFailures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [costRes, perfRes, decisionsRes, failuresRes] = await Promise.all([
        fetch('/api/metrics/cost?days=7'),
        fetch('/api/metrics/performance'),
        fetch('/api/metrics/decisions?limit=10'),
        fetch('/api/metrics/failures'),
      ]);

      const [costData, perfData, decisionsData, failuresData] = await Promise.all([
        costRes.json(),
        perfRes.json(),
        decisionsRes.json(),
        failuresRes.json(),
      ]);

      setCostMetrics(costData.data);
      setPerformance(perfData.data || []);
      setDecisions(decisionsData.data || []);
      setFailures(failuresData.data || []);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <StatCards metrics={costMetrics?.summary} />
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CostChart data={costMetrics?.metrics} />
        <PerformanceTable data={performance} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentDecisions decisions={decisions} />
        <FailurePatterns failures={failures} />
      </div>
    </div>
  );
}
