import { useState } from 'react';
import { Search, Link } from 'lucide-react';

export default function UrlInput({ onAnalyze, isLoading, value }) {
  const [url, setUrl] = useState(value || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative group">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Link className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-400 transition-colors" />
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste video or audio URL here..."
          className="block w-full pl-12 pr-32 py-4 bg-gray-900/50 border border-gray-700/50 rounded-xl text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-lg shadow-inner"
          required
        />
        <div className="absolute inset-y-0 right-2 flex items-center">
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium transition-all"
          >
            {isLoading ? (
              <span className="animate-pulse">Analyzing...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Analyze
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
