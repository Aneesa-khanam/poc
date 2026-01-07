import { useState } from 'react';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import TaskSubmitForm from './components/TaskSubmitForm';

function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTaskSubmitted = () => {
    // Trigger dashboard refresh
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Model Routing & Cost Controller
          </h1>
          <p className="text-slate-400 text-lg">
            Intelligent AI model selection for optimal cost and performance
          </p>
        </div>

        <div className="mb-8">
          <TaskSubmitForm onSubmitSuccess={handleTaskSubmitted} />
        </div>

        <Dashboard key={refreshKey} />
      </main>
    </div>
  );
}

export default App;
