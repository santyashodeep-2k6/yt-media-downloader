import { Clock } from 'lucide-react';

export default function MediaPreview({ info }) {
  const formatDuration = (seconds) => {
    if (!seconds) return 'Unknown';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col sm:flex-row gap-5 p-4 rounded-xl bg-gray-900 border border-gray-800">
      <div className="w-full sm:w-48 aspect-video flex-shrink-0 rounded-lg overflow-hidden bg-gray-800 relative shadow-md">
        {info.thumbnail ? (
          <img src={info.thumbnail} alt={info.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600">
            No Thumbnail
          </div>
        )}
        {info.duration > 0 && (
          <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/80 text-white text-xs rounded-md flex items-center gap-1 font-medium backdrop-blur-sm">
            <Clock className="w-3 h-3" />
            {formatDuration(info.duration)}
          </div>
        )}
      </div>
      
      <div className="flex flex-col justify-center flex-grow min-w-0">
        <div className="text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
          {info.source}
        </div>
        <h3 className="font-semibold text-gray-100 text-lg line-clamp-2 leading-snug" title={info.title}>
          {info.title}
        </h3>
      </div>
    </div>
  );
}
