
import React from 'react';

interface MicButtonProps {
  isRecording: boolean;
  onClick: () => void;
  disabled?: boolean;
}

const MicButton: React.FC<MicButtonProps> = ({ isRecording, onClick, disabled }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative w-48 h-48 rounded-full flex items-center justify-center transition-all duration-300
          ${isRecording 
            ? 'bg-red-600 shadow-[0_0_50px_rgba(220,38,38,0.5)] scale-110' 
            : 'bg-red-500 hover:bg-red-600 shadow-xl hover:scale-105 active:scale-95'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
        `}
      >
        {/* Анімація при записі */}
        {isRecording && (
          <>
            <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></div>
            <div className="absolute -inset-4 rounded-full border-2 border-red-500/30 animate-pulse"></div>
          </>
        )}
        
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="64" 
          height="64" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="text-white drop-shadow-lg"
        >
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
      </button>
      
      <p className={`text-lg font-medium tracking-wide uppercase transition-colors duration-300 ${isRecording ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
        {isRecording ? 'Слухаю...' : 'Натисніть, щоб говорити'}
      </p>
    </div>
  );
};

export default MicButton;
