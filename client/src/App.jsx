import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import UrlInput from './components/UrlInput';
import MediaPreview from './components/MediaPreview';
import FormatSelector from './components/FormatSelector';
import ProgressTracker from './components/ProgressTracker';

function App() {
  const [url, setUrl] = useState('');
  const [mediaInfo, setMediaInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [downloadId, setDownloadId] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Setup socket connection
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
    const newSocket = io(API_URL);
    setSocket(newSocket);
    return () => newSocket.close();
  }, []);

  const handleAnalyze = async (inputUrl) => {
    setUrl(inputUrl);
    setLoading(true);
    setError(null);
    setMediaInfo(null);
    setDownloadId(null);
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const res = await axios.post(`${API_URL}/api/media/analyze`, { url: inputUrl });
      setMediaInfo(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to analyze URL');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format, quality) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
      const res = await axios.post(`${API_URL}/api/media/download`, {
        url,
        format,
        quality
      });
      setDownloadId(res.data.downloadId);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to start download');
    }
  };

  const handleReset = () => {
    setDownloadId(null);
    setMediaInfo(null);
    setUrl('');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center p-6 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-900 via-gray-950 to-black">
      <div className="w-full max-w-2xl translate-y-[-5vh]">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-4">
            YT Media Downloader
          </h1>
          <p className="text-gray-400 text-lg">Download and convert media from legal sources instantly.</p>
        </div>

        <div className="glass-panel p-6 md:p-8 space-y-6">
          <UrlInput onAnalyze={handleAnalyze} isLoading={loading} value={url} />
          
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-center text-sm font-medium">
              {error}
            </div>
          )}

          {mediaInfo && !downloadId && (
            <div className="space-y-6 animate-[fadeIn_0.5s_ease-out]">
              <MediaPreview info={mediaInfo} />
              <FormatSelector info={mediaInfo} onDownload={handleDownload} />
            </div>
          )}

          {downloadId && socket && (
            <ProgressTracker downloadId={downloadId} socket={socket} onReset={handleReset} />
          )}
        </div>
        
        <p className="text-center text-xs text-gray-500 mt-8 mb-2 max-w-md mx-auto leading-relaxed">
          Disclaimer: Users are responsible for ensuring they have rights to download content. Only download public domain, user-owned, or explicitly permitted media.
        </p>
        <p className="text-center text-sm font-bold tracking-widest text-indigo-400/80 uppercase mt-4">
          Developed by VERTEX
        </p>
      </div>
    </div>
  );
}

export default App;
