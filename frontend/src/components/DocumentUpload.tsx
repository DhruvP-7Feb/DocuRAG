'use client';

import React, { useRef, useState } from 'react';
import { DocumentMetadata } from '../types';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Eye, RefreshCw, HardDrive } from 'lucide-react';

interface DocumentUploadProps {
  document: DocumentMetadata | null;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadError: string | null;
  onOpenChunks: () => void;
  onReset: () => void;
}

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  document,
  onUpload,
  isUploading,
  uploadError,
  onOpenChunks,
  onReset,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        await onUpload(file);
      } else {
        alert('Please upload a valid PDF document.');
      }
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      await onUpload(file);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 KB';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-5 mb-6 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Active PDF Document
          </h3>
        </div>
        {document && document.status === 'ready' && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Vector Indexed
          </span>
        )}
      </div>

      {/* Upload Zone (when no document or error) */}
      {(!document || document.status === 'idle' || document.status === 'error') && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center p-8 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
            isDragOver
              ? 'border-cyan-400 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
              : 'border-slate-700/80 hover:border-slate-500 bg-slate-900/40 hover:bg-slate-900/60'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />

          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 border border-white/10 mb-4 shadow-inner">
            <UploadCloud className={`w-7 h-7 ${isUploading ? 'text-cyan-400 animate-bounce' : 'text-slate-300'}`} />
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-white mb-1">
              {isUploading ? 'Ingesting PDF Pipeline...' : 'Click or Drag & Drop PDF here'}
            </p>
            <p className="text-xs text-slate-400 max-w-xs">
              Supports standard PDFs. Text will be parsed via PyMuPDF and indexed into ChromaDB.
            </p>
          </div>

          {isUploading && (
            <div className="w-full max-w-xs mt-4">
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full animate-pulse"></div>
              </div>
              <p className="text-[11px] text-cyan-400 text-center mt-1.5 font-mono">
                Extracting $\rightarrow$ Chunking $\rightarrow$ Embedding...
              </p>
            </div>
          )}

          {uploadError && (
            <div className="flex items-center gap-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-2 rounded-lg mt-4 max-w-md">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}
        </div>
      )}

      {/* Ingestion in Progress state */}
      {document && document.status === 'processing' && (
        <div className="flex flex-col items-center justify-center p-8 rounded-xl bg-slate-900/60 border border-cyan-500/30">
          <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-sm font-semibold text-white">Ingesting {document.filename}...</p>
          <p className="text-xs text-slate-400 mt-1">
            PyMuPDF text extraction & SentenceTransformers embeddings in progress.
          </p>
        </div>
      )}

      {/* Active Document Card */}
      {document && document.status === 'ready' && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-900/60 border border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex-shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white max-w-xs truncate" title={document.filename}>
                  {document.filename}
                </h4>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                  {formatFileSize(document.filesize)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-slate-400">
                <span className="flex items-center gap-1 text-slate-300">
                  <strong className="text-white font-semibold">{document.page_count}</strong> pages extracted
                </span>
                <span className="text-slate-600">•</span>
                <span className="flex items-center gap-1 text-slate-300">
                  <strong className="text-white font-semibold">{document.chunk_count}</strong> vector chunks
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              onClick={onOpenChunks}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 border border-white/10 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" />
              <span>Inspect Chunks</span>
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold text-cyan-300 hover:text-white bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replace PDF</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        </div>
      )}
    </div>
  );
};
