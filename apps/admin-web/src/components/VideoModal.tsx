import { X, ExternalLink } from 'lucide-react';

interface Props {
  url: string | null;
  onClose: () => void;
}

export const VideoModal = ({ url, onClose }: Props) => {
  if (!url) return null;

  
  const getYoutubeVideoId = (u: string) => {
    let id = null;
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
    const match = u.match(regex);
    if (match && match[1]) {
      id = match[1];
    }
    return id;
  };

  const videoId = getYoutubeVideoId(url);
  const isYoutube = !!videoId;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-[#161a29] border border-white/10 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col relative" 
        onClick={e => e.stopPropagation()}
      >
        <div className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center cursor-pointer bg-black/50 hover:bg-black/80 rounded-full transition-colors" onClick={onClose}>
          <X size={18} className="text-white" />
        </div>
        
        {isYoutube ? (
          <div className="w-full aspect-video">
            <iframe 
              width="100%" 
              height="100%" 
              src={`https://www.youtube.com/embed/${videoId}?autoplay=1`} 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
              allowFullScreen 
              className="w-full h-full"
            />
          </div>
        ) : (
          <div className="p-12 text-center flex flex-col items-center">
             <ExternalLink size={48} className="text-gray-500 mb-4" />
             <h3 className="text-xl font-bold text-white mb-2">External Link</h3>
             <p className="text-gray-400 mb-6">This content cannot be embedded directly. Please open it in a new tab.</p>
             <a 
               href={url} 
               target="_blank" 
               rel="noreferrer" 
               className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2"
             >
               Open Link <ExternalLink size={16} />
             </a>
          </div>
        )}
      </div>
    </div>
  );
};
