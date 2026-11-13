'use client';

import React from 'react';
import { DocumentMetadata, AppSettings } from '../types';
import { FileText, Settings, RefreshCw, Key, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  document: DocumentMetadata | null;
  settings: AppSettings | null;
  onOpenSettings: () => void;
  onResetDocument: () => void;
  isResetting: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  document,
  settings,
  onOpenSettings,
  onResetDocument,
  isResetting,
}) => {
  return (
    <header className="w-full border-b border-white/10 bg-[#0b1120]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand Logo & Tagline */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 shadow-lg shadow-cyan-500/25">
            <Sparkles className="w-5 h-5 text-white" />
            <div className="absolute -inset-0.5 rounded-xl bg-cyan-400 opacity-20 blur-sm -z-10"></div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Docu<span className="gradient-text font-black">RAG</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Single PDF
              </span>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              PyMuPDF • Sentence Transformers • ChromaDB • Gemini API
            </p>
          </div>
        </div>

        {/* Status & Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Active Model Indicator */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-white/10 text-xs text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-slate-400">Model:</span>
            <span className="font-semibold text-white">{settings?.model_name || 'gemini-3.8-flash'}</span>
          </div>

          {/* Active Document Status Badge */}
          {document && document.status === 'ready' && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{document.page_count} Pages Indexed</span>
            </div>
          )}

          {/* Clear Document Button */}
          {document && document.status === 'ready' && (
            <button
              onClick={onResetDocument}
              disabled={isResetting}
              title="Clear active document from vector store"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-rose-400 bg-slate-800/50 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Clear Doc</span>
            </button>
          )}

          {/* Settings / API Key Button */}
          <button
            onClick={onOpenSettings}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-white/15 transition-all shadow-sm hover:border-cyan-500/50"
          >
            <Key className="w-3.5 h-3.5 text-cyan-400" />
            <span>API Settings</span>
            {!settings?.has_api_key && (
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
