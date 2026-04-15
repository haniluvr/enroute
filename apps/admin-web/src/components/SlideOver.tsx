import { X } from 'lucide-react';
import { useEffect } from 'react';

interface SlideOverProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const SlideOver = ({ isOpen, onClose, title, children }: SlideOverProps) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 z-[60] bg-[#0a0f1c]/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-[70] w-full max-w-2xl bg-[#111524] border-l border-white/10 shadow-2xl overflow-y-auto custom-scrollbar flex flex-col transform transition-transform duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#161a29] shrink-0">
          <h2 className="text-xl font-bold text-white tracking-wide">{title}</h2>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex-1 relative">
            {children}
        </div>
      </div>
    </>
  );
};
