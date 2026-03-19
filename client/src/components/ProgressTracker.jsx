import { useState, useEffect } from 'react';
import { Download, Loader2, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ProgressTracker({ downloadId, socket, onReset }) {
  const [status, setStatus] = useState('starting'); // starting, downloading, converting, completed, error
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Initializing download...');
  const [downloadUrl, setDownloadUrl] = useState(null);

  useEffect(() => {
    if (!socket || !downloadId) return;

    const handleProgress = (data) => {
      setStatus(data.status);
      if (data.progress !== undefined) setProgress(parseFloat(data.progress));
      if (data.message) setMessage(data.message);
      if (data.downloadUrl) setDownloadUrl(data.downloadUrl);
    };

    socket.on(`progress:${downloadId}`, handleProgress);

    return () => {
      socket.off(`progress:${downloadId}`);
    };
  }, [socket, downloadId]);

  const getStateColor = () => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-indigo-500';
    }
  };

  const getStateIcon = () => {
    switch (status) {
      case 'completed': return <CheckCircle2 className="w-6 h-6 text-green-400" />;
      case 'error': return <AlertCircle className="w-6 h-6 text-red-400" />;
      default: return <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />;
    }
  };

  return (
    <div className="p-6 bg-gray-900 border border-gray-800 rounded-xl space-y-4 animate-[fadeIn_0.5s_ease-out]">
      <div className="flex items-center gap-4 border-b border-gray-800 pb-4">
        {getStateIcon()}
        <div>
          <h4 className="font-semibold text-gray-100 capitalize">
            {status.replace('-', ' ')}
          </h4>
          <p className="text-sm text-gray-400">
            {status === 'downloading' ? `Progress: ${progress}%` : message}
          </p>
        </div>
      </div>

      <div className="relative pt-2">
        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-gray-800">
          <div
            style={{ width: `${progress}%` }}
            className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ${getStateColor()}`}
          ></div>
        </div>
      </div>

      {status === 'completed' && downloadUrl && (
        <a
          href={`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}${downloadUrl}`}
          download
          className="w-full py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors block text-center"
        >
          <Download className="w-4 h-4" /> Save File to Device
        </a>
      )}

      {(status === 'completed' || status === 'error') && (
        <button
          onClick={onReset}
          className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Download Another Item
        </button>
      )}
    </div>
  );
}
