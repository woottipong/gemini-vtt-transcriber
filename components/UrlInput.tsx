import React, { useState } from 'react';
import { Youtube, ArrowRight, AlertCircle } from 'lucide-react';

interface UrlInputProps {
  onSubmit: (url: string) => void;
  disabled?: boolean;
}

export const UrlInput: React.FC<UrlInputProps> = ({ onSubmit, disabled }) => {
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateUrl = (input: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(input);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    if (!validateUrl(url)) {
      setError("Please enter a valid YouTube URL");
      return;
    }
    setError(null);
    onSubmit(url);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className={`
        glass-panel rounded-3xl p-10 md:p-14 transition-all duration-300
        flex flex-col items-center justify-center text-center
        ${disabled ? 'opacity-50 grayscale pointer-events-none' : ''}
      `}>
        <div className="p-4 rounded-full mb-6 bg-red-500/10 text-red-500 ring-1 ring-red-500/20 shadow-lg shadow-red-500/10">
          <Youtube className="w-10 h-10" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-2">
          YouTube Transcription
        </h3>
        
        <p className="text-slate-400 max-w-sm mx-auto mb-8 text-sm leading-relaxed">
          Paste a YouTube URL below to extract audio and generate subtitles automatically.
        </p>

        <form onSubmit={handleSubmit} className="w-full max-w-md relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <span className="text-slate-600 font-mono text-sm">URL</span>
          </div>
          <input
            type="text"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            disabled={disabled}
            placeholder="https://youtu.be/..."
            className="w-full bg-slate-950/80 border border-slate-700/50 text-slate-200 placeholder-slate-600 rounded-xl py-4 pl-14 pr-14 
            focus:outline-none focus:border-red-500/50 focus:ring-4 focus:ring-red-500/10 transition-all font-mono text-sm shadow-inner"
          />
          <button
            type="submit"
            disabled={disabled || !url}
            className="absolute right-2 top-2 bottom-2 bg-red-600 hover:bg-red-500 text-white px-3 rounded-lg transition-all 
            disabled:opacity-0 disabled:translate-x-4 shadow-lg shadow-red-900/20 flex items-center justify-center transform"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        {error && (
          <div className="mt-5 flex items-center gap-2 text-red-400 text-sm animate-slide-up bg-red-950/30 px-4 py-2 rounded-lg border border-red-900/50">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};