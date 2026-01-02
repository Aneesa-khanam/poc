import { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';

interface TaskSubmitFormProps {
  onSubmitSuccess: () => void;
}

export default function TaskSubmitForm({ onSubmitSuccess }: TaskSubmitFormProps) {
  const [taskType, setTaskType] = useState('text_summarization');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const taskTypes = [
    { value: 'text_summarization', label: 'Text Summarization' },
    { value: 'data_extraction', label: 'Data Extraction' },
    { value: 'classification', label: 'Classification' },
    { value: 'sentiment_analysis', label: 'Sentiment Analysis' },
    { value: 'code_generation', label: 'Code Generation' },
    { value: 'translation', label: 'Translation' },
    { value: 'question_answering', label: 'Question Answering' },
    { value: 'content_generation', label: 'Content Generation' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/route', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskType,
          inputText,
          metadata: {
            source: 'dashboard',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to route task');
      }

      setResult(data.data);
      onSubmitSuccess();
      
      // Clear form after successful submission
      setTimeout(() => {
        setInputText('');
        setResult(null);
      }, 5000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h2 className="text-2xl font-bold text-white mb-4">Submit Task for Routing</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="taskType" className="block text-sm font-medium text-slate-300 mb-2">
            Task Type
          </label>
          <select
            id="taskType"
            value={taskType}
            onChange={(e) => setTaskType(e.target.value)}
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {taskTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="inputText" className="block text-sm font-medium text-slate-300 mb-2">
            Input Text
          </label>
          <textarea
            id="inputText"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={4}
            required
            placeholder="Enter your text here..."
            className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !inputText.trim()}
          className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Routing...</span>
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              <span>Submit Task</span>
            </>
          )}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg">
          <p className="text-red-200">{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-4 bg-green-900/50 border border-green-700 rounded-lg">
          <h3 className="text-lg font-semibold text-green-200 mb-2">Routing Decision</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Task ID:</span>
              <span className="text-white font-mono">{result.taskId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Selected Model:</span>
              <span className="text-white font-semibold">{result.selectedModel.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Provider:</span>
              <span className="text-white">{result.selectedModel.provider}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Cost:</span>
              <span className="text-green-400">${result.selectedModel.estimatedCost.toFixed(6)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Estimated Latency:</span>
              <span className="text-white">{result.selectedModel.estimatedLatency}ms</span>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-700">
              <p className="text-slate-300 text-xs">{result.decision.reason}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
