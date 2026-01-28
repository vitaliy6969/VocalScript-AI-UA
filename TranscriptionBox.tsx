
import React, { useState, useEffect, useRef } from 'react';

interface TranscriptionBoxProps {
  text: string;
  onClear: () => void;
}

const TranscriptionBox: React.FC<TranscriptionBoxProps> = ({ text, onClear }) => {
  const [copied, setCopied] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Автопрокрутка вниз при додаванні тексту
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [text]);

  return (
    <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col transition-all border-t-slate-700">
      <div className="flex items-center justify-between px-6 py-4 bg-slate-800/40 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
          <span className="text-sm font-bold text-slate-300 tracking-wider uppercase">Оброблений результат</span>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={onClear}
            className="px-3 py-1 text-xs font-semibold text-slate-500 hover:text-slate-300 transition-colors uppercase"
          >
            Очистити
          </button>
          <button
            onClick={handleCopy}
            disabled={!text}
            className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all transform active:scale-95 ${
              copied 
                ? 'bg-green-600 text-white' 
                : text 
                  ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-900/20' 
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {copied ? 'ГОТОВО!' : 'КОПІЮВАТИ'}
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="p-8 min-h-[250px] max-h-[500px] overflow-y-auto bg-slate-900/50 text-slate-100 leading-relaxed font-sans text-lg scroll-smooth scrollbar-thin scrollbar-thumb-slate-800"
      >
        {text ? (
          <div className="animate-in fade-in duration-500">
            <p className="whitespace-pre-wrap selection:bg-red-500/30">
              {text}
              <span className="inline-block w-1.5 h-5 ml-1 bg-red-500 animate-pulse align-middle"></span>
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-30">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-slate-400"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p className="italic text-center">
              Почніть говорити, і я перетворю ваше мовлення на ідеальний текст...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptionBox;
