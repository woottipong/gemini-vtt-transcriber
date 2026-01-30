import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileAudio, FileVideo, AlertCircle } from 'lucide-react';
import { FileData } from '../types';
import { fileToBase64 } from '../utils/base64';

interface DropzoneProps {
  onFileSelect: (file: FileData) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

export const Dropzone: React.FC<DropzoneProps> = ({ onFileSelect, disabled }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    setError(null);

    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      setError("Please upload a valid audio or video file.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError("File is too large for browser-based processing. Please use a file smaller than 20MB.");
      return;
    }

    try {
      const base64Content = await fileToBase64(file);

      onFileSelect({
        name: file.name,
        type: file.type,
        size: file.size,
        base64: base64Content
      });
    } catch (fileError) {
      setError(fileError instanceof Error ? fileError.message : "Failed to read file.");
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const files = e.dataTransfer.files;
    if (files.length > 0) processFile(files[0]);
  }, [disabled]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
        className={`
          relative group cursor-pointer rounded-3xl p-12 transition-all duration-300
          flex flex-col items-center justify-center text-center
          border-2 border-dashed
          ${isDragging
            ? 'border-indigo-500 bg-indigo-500/10 scale-[1.02]'
            : 'border-slate-700/50 bg-slate-900/30 hover:bg-slate-800/50 hover:border-indigo-400/50'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          backdrop-blur-sm
        `}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
          className="hidden"
          hidden
          accept="audio/*,video/*"
          disabled={disabled}
        />

        {/* Icon Circle */}
        <div className={`
          p-5 rounded-full mb-6 transition-all duration-300 shadow-lg
          ${isDragging
            ? 'bg-indigo-500 text-white shadow-indigo-500/30'
            : 'bg-slate-800 text-slate-400 group-hover:text-indigo-400 group-hover:scale-110'
          }
        `}>
          <Upload className="w-8 h-8" />
        </div>

        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
          {isDragging ? 'Drop it like it\'s hot' : 'Upload Media File'}
        </h3>

        <p className="text-slate-400 max-w-sm mx-auto mb-8 leading-relaxed">
          Drag & drop your file here or click to browse.
          <br />
          <span className="text-sm text-slate-500 mt-1 block font-medium">(Max 20MB)</span>
        </p>

        {/* File Format Badges */}
        <div className="flex gap-3">
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs font-medium text-slate-400">
            <FileAudio className="w-3.5 h-3.5 text-indigo-400" /> MP3 / WAV
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-slate-700/50 text-xs font-medium text-slate-400">
            <FileVideo className="w-3.5 h-3.5 text-pink-400" /> MP4 / MOV
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-300 animate-slide-up">
          <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}
    </div>
  );
};