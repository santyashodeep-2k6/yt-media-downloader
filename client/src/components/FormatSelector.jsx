import { useState } from 'react';
import { Download, Monitor, Music, Settings2 } from 'lucide-react';

export default function FormatSelector({ info, onDownload }) {
  const [type, setType] = useState('video'); // video or audio
  const [format, setFormat] = useState('mp4');
  const [quality, setQuality] = useState('highest');

  const videoFormats = ['mp4', 'webm', 'mkv'];
  const audioFormats = ['mp3', 'wav', 'aac'];

  const handleDownload = () => {
    onDownload(format, quality);
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 p-1 bg-gray-900 rounded-xl border border-gray-800">
        <button
          onClick={() => { setType('video'); setFormat('mp4'); }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
            type === 'video' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          <Monitor className="w-4 h-4" /> Video
        </button>
        <button
          onClick={() => { setType('audio'); setFormat('mp3'); }}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all ${
            type === 'audio' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
          }`}
        >
          <Music className="w-4 h-4" /> Audio
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> Format
          </label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none"
          >
            {(type === 'video' ? videoFormats : audioFormats).map(f => (
              <option key={f} value={f}>{f.toUpperCase()}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-400 flex items-center gap-2">
            <Settings2 className="w-4 h-4" /> {type === 'video' ? 'Quality' : 'Bitrate'}
          </label>
          <select
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 appearance-none"
          >
            {type === 'video' ? (
              <>
                <option value="highest">Highest Quality</option>
                {info.availableQualities?.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </>
            ) : (
              <>
                <option value="320">320 kbps</option>
                <option value="256">256 kbps</option>
                <option value="128">128 kbps</option>
              </>
            )}
          </select>
        </div>
      </div>

      <button
        onClick={handleDownload}
        className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-indigo-900/20"
      >
        <Download className="w-5 h-5" />
        Start Download
      </button>
    </div>
  );
}
