import React, { useState } from 'react';
import { Loader2, Zap, Github, MessageSquareText, FileAudio, Youtube } from 'lucide-react';
import { Dropzone } from './components/Dropzone';
import { UrlInput } from './components/UrlInput';
import { ResultViewer } from './components/ResultViewer';
import { transcribeAudio } from './services/geminiService';
import { AppStatus, FileData } from './types';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [inputMode, setInputMode] = useState<'file' | 'url'>('file');
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [urlInput, setUrlInput] = useState<string>('');
  const [vttContent, setVttContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (file: FileData) => {
    setFileData(file);
    setStatus(AppStatus.PROCESSING);
    setError(null);

    try {
      const vtt = await transcribeAudio(file.base64, file.type);
      setVttContent(vtt);
      setStatus(AppStatus.SUCCESS);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred.");
      setStatus(AppStatus.ERROR);
    }
  };

  const handleUrlSubmit = async (url: string) => {
    setUrlInput(url);
    setStatus(AppStatus.PROCESSING);
    setError(null);

    try {
      const response = await fetch('/api/process-youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to download video from backend.");
      }

      const result = await response.json();
      const downloadedFile: FileData = result.data;

      setFileData(downloadedFile);

      const vtt = await transcribeAudio(downloadedFile.base64, downloadedFile.type);
      setVttContent(vtt);
      setStatus(AppStatus.SUCCESS);

    } catch (err: any) {
      console.error(err);
      let errorMessage = err.message;
      if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('Unexpected token')) {
        errorMessage = "Could not connect to the backend server. If running locally, ensure 'node server.js' is active.";
      }
      setError(errorMessage);
      setStatus(AppStatus.ERROR);
    }
  };

  const handleReset = () => {
    setStatus(AppStatus.IDLE);
    setFileData(null);
    setUrlInput('');
    setVttContent('');
    setError(null);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none opacity-50"></div>
      <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 rounded-full blur-[100px] pointer-events-none opacity-30"></div>

      {/* Header */}
      <header className="sticky top-0 z-50 glass-panel border-b-0 border-b-slate-800/50 bg-slate-950/70">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 group cursor-pointer" onClick={handleReset}>
            <div className="p-2 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-lg shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform duration-300">
              <MessageSquareText className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Gemini VTT
            </h1>
          </div>
          <a href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-white/5">
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">Source Code</span>
          </a>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-16 md:py-24">

        {/* Intro Section */}
        {status === AppStatus.IDLE && (
          <div className="text-center mb-12 animate-slide-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-glow">
              <Zap className="w-3 h-3" /> Powered by Gemini 1.5 Flash
            </div>
            <h2 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
              Subtitles generated <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-blue-400 to-emerald-400 animate-pulse-slow">
                instantly & locally
              </span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Transform your video and audio into accurate WebVTT subtitles in seconds.
              No servers, no waiting—just pure Gemini AI power.
            </p>
          </div>
        )}

        {/* Input Toggle */}
        {status === AppStatus.IDLE && (
          <div className="flex justify-center mb-10 animate-slide-up [animation-delay:100ms]">
            <div className="bg-slate-900/50 p-1.5 rounded-2xl flex gap-1 border border-slate-800/50 shadow-inner backdrop-blur-md">
              <button
                onClick={() => setInputMode('file')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${inputMode === 'file'
                    ? 'bg-slate-700 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
              >
                <FileAudio className={`w-4 h-4 ${inputMode === 'file' ? 'text-indigo-400' : ''}`} />
                Upload File
              </button>
              <button
                onClick={() => setInputMode('url')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${inputMode === 'url'
                    ? 'bg-slate-700 text-white shadow-lg'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
              >
                <Youtube className={`w-4 h-4 ${inputMode === 'url' ? 'text-red-400' : ''}`} />
                YouTube URL
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex justify-center w-full">
          {status === AppStatus.IDLE && (
            <div className="w-full animate-slide-up [animation-delay:200ms]">
              {inputMode === 'file' ? (
                <Dropzone onFileSelect={handleFileSelect} />
              ) : (
                <UrlInput onSubmit={handleUrlSubmit} />
              )}
            </div>
          )}

          {status === AppStatus.PROCESSING && (
            <div className="text-center py-20 animate-fade-in">
              <div className="relative inline-flex justify-center items-center">
                <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20 rounded-full animate-pulse"></div>
                <div className="relative z-10 w-24 h-24 rounded-full border-4 border-slate-800 border-t-indigo-500 animate-spin"></div>
                <Loader2 className="absolute z-20 w-8 h-8 text-indigo-400 animate-spin" />
              </div>
              <h3 className="text-2xl font-bold text-white mt-10 mb-2 tracking-tight">
                {inputMode === 'file' ? 'Analyzing Audio' : 'Fetching Video'}
              </h3>
              <p className="text-slate-400">
                {inputMode === 'file'
                  ? 'Gemini is listening to your file...'
                  : 'Downloading and extracting audio stream...'}
              </p>
              {fileData && (
                <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-900/80 border border-slate-800 text-slate-400 text-sm font-mono">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  {fileData.name}
                </div>
              )}
            </div>
          )}

          {status === AppStatus.SUCCESS && (
            <ResultViewer
              content={vttContent}
              fileName={fileData?.name || 'transcription'}
              onReset={handleReset}
              fileData={fileData}
              youtubeUrl={inputMode === 'url' ? urlInput : ''}
            />
          )}

          {status === AppStatus.ERROR && (
            <div className="w-full max-w-lg animate-fade-in">
              <div className="glass-panel p-8 rounded-3xl text-center border-red-500/20 bg-red-950/10">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-1 ring-red-500/20">
                  <Zap className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Something went wrong</h3>
                <p className="text-red-200/80 mb-8 text-sm leading-relaxed">
                  {error}
                </p>
                <button
                  onClick={handleReset}
                  className="px-8 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-red-900/20 hover:shadow-red-900/40"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default App;