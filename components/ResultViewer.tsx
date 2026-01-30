import React from 'react';
import { Download, RefreshCw, Copy, Check, FileText } from 'lucide-react';
import { FileData } from '../types';

interface ResultViewerProps {
  content: string;
  fileName: string;
  onReset: () => void;
  fileData?: FileData | null;
  youtubeUrl?: string;
}

const base64ToBlob = (base64: string, mimeType: string) => {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i += 1) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

export const ResultViewer: React.FC<ResultViewerProps> = ({ content, fileName, onReset, fileData, youtubeUrl }) => {
  const [copied, setCopied] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState<string | null>(null);
  const [trackUrl, setTrackUrl] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!fileData || !fileData.type.startsWith('video/')) {
      setVideoUrl(null);
      return;
    }

    const blob = base64ToBlob(fileData.base64, fileData.type);
    const url = URL.createObjectURL(blob);
    setVideoUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [fileData]);

  React.useEffect(() => {
    if (!content) {
      setTrackUrl(null);
      return;
    }

    const blob = new Blob([content], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    setTrackUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [content]);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/vtt' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName.replace(/\.[^/.]+$/, "")}.vtt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full max-w-5xl mx-auto animate-slide-up">
      {/* Action Header */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Transcription Complete</h2>
            <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
              Ready for: <span className="text-indigo-400 font-mono bg-indigo-500/10 px-2 py-0.5 rounded">{fileName}</span>
            </p>
          </div>
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <button
            onClick={onReset}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 hover:border-slate-600 transition-all text-sm font-semibold"
          >
            <RefreshCw className="w-4 h-4" />
            New
          </button>
          <button
            onClick={handleDownload}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 transition-all text-sm font-semibold"
          >
            <Download className="w-4 h-4" />
            Download .vtt
          </button>
        </div>
      </div>

      {videoUrl && trackUrl && (
        <div className="mb-8">
          <div className="rounded-2xl overflow-hidden border border-slate-800 bg-black shadow-2xl">
            <video
              className="w-full h-auto"
              controls
              playsInline
            >
              <source src={videoUrl} type={fileData?.type} />
              <track
                kind="subtitles"
                src={trackUrl}
                srcLang="th"
                label="Subtitles"
                default
              />
              Your browser does not support the video tag.
            </video>
          </div>
          <p className="text-xs text-slate-500 mt-2">
            Preview shows captions only for uploaded video files.
          </p>
        </div>
      )}

      {!videoUrl && youtubeUrl && (
        <div className="mb-8 rounded-2xl border border-slate-800/70 bg-slate-900/40 p-5 text-sm text-slate-300">
          <p className="font-semibold text-white mb-1">YouTube preview limitation</p>
          <p className="text-slate-400">
            YouTube embeds do not allow custom VTT overlays in this app. You can still open the video in a new tab and use the generated VTT file.
          </p>
          <a
            className="inline-flex mt-3 items-center gap-2 text-indigo-400 hover:text-indigo-300"
            href={youtubeUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open YouTube video
          </a>
        </div>
      )}

      {/* Editor Window */}
      <div className="relative group rounded-2xl overflow-hidden border border-slate-800 bg-[#0d1117] shadow-2xl">
        {/* Editor Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900/80 border-b border-slate-800 backdrop-blur-md">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
            <div className="w-3 h-3 rounded-full bg-slate-700"></div>
          </div>
          <span className="text-xs text-slate-500 font-mono">webvtt_output.vtt</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors text-xs font-medium"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        {/* Text Area */}
        <textarea
          readOnly
          value={content}
          className="w-full h-[500px] p-6 bg-[#0d1117] text-slate-300 font-mono text-sm leading-relaxed focus:outline-none resize-none selection:bg-indigo-500/30 selection:text-indigo-200"
          spellCheck={false}
        />
      </div>

      <div className="mt-8 flex justify-center">
        <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full bg-indigo-900/20 border border-indigo-500/20 text-indigo-300 text-sm">
          <span className="text-xl">💡</span>
          <p>
            Pro Tip: Upload this .vtt file directly to YouTube Studio or use it with VLC Media Player.
          </p>
        </div>
      </div>
    </div>
  );
};