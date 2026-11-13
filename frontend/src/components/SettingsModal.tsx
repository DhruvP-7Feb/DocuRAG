'use client';

import React, { useState, useEffect } from 'react';
import { AppSettings } from '../types';
import { X, Key, Sliders, Cpu, Check, ExternalLink, ShieldCheck } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings | null;
  onSaveSettings: (newSettings: {
    gemini_api_key?: string;
    model_name?: string;
    top_k?: number;
  }) => Promise<void>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [modelName, setModelName] = useState('gemini-3.8-flash');
  const [topK, setTopK] = useState(4);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (settings) {
      setModelName(settings.model_name || 'gemini-3.8-flash');
      setTopK(settings.top_k || 4);
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSettings({
        gemini_api_key: apiKey ? apiKey.trim() : undefined,
        model_name: modelName,
        top_k: topK,
      });
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
      }, 1000);
    } catch (err) {
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const models = [
    {
      id: 'gemini-3.8-flash',
      name: 'Gemini 3.8 Flash',
      tag: 'Recommended',
      desc: 'Latest high-performance model, ultra-fast generation',
    },
    {
      id: 'gemini-2.5-flash',
      name: 'Gemini 2.5 Flash',
      tag: 'Fast',
      desc: 'Lightweight & cost-efficient for quick answers',
    },
    {
      id: 'gemini-1.5-flash',
      name: 'Gemini 1.5 Flash',
      tag: 'Legacy',
      desc: 'Stable legacy model for standard document queries',
    },
    {
      id: 'gemini-1.5-pro',
      name: 'Gemini 1.5 Pro',
      tag: 'Deep Reasoning',
      desc: 'High intelligence for complex, nuanced documents',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl glass-panel bg-slate-900 border border-white/15 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-slate-900/80">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">DocuRAG Settings</h3>
              <p className="text-xs text-slate-400">
                Configure Google Gemini API & Vector Retrieval Parameters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="p-6 space-y-5">
          {/* Gemini API Key */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <span>Google Gemini API Key</span>
                {settings?.has_api_key && (
                  <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono normal-case">
                    <ShieldCheck className="w-3 h-3" /> Configured ({settings.gemini_api_key_masked})
                  </span>
                )}
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder={
                  settings?.has_api_key
                    ? 'Enter new key to replace existing...'
                    : 'Paste AIzaSy... key here'
                }
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs glass-input rounded-xl pr-16 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800"
              >
                {showKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Your API key communicates directly with Google Gemini API and is saved in your backend environment.
            </p>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
              Gemini Model
            </label>
            <div className="space-y-2">
              {models.map((m) => (
                <label
                  key={m.id}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    modelName === m.id
                      ? 'bg-cyan-500/10 border-cyan-400/60 shadow-md shadow-cyan-500/10'
                      : 'bg-slate-950/40 border-white/5 hover:border-white/15'
                  }`}
                >
                  <input
                    type="radio"
                    name="model"
                    value={m.id}
                    checked={modelName === m.id}
                    onChange={() => setModelName(m.id)}
                    className="mt-1 text-cyan-500 focus:ring-cyan-400"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{m.name}</span>
                      <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-300">
                        {m.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Top K Chunks Slider */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                Top-K Chunks Retrieved
              </label>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                {topK} passages
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="8"
              step="1"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-1">
              <span>1 (Focused)</span>
              <span>4 (Balanced)</span>
              <span>8 (Comprehensive)</span>
            </div>
          </div>

          {/* Fixed System Info */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 text-[11px] space-y-1.5 text-slate-400">
            <div className="flex justify-between">
              <span>Embedding Model:</span>
              <span className="font-mono text-slate-300">{settings?.embedding_model || 'all-MiniLM-L6-v2'}</span>
            </div>
            <div className="flex justify-between">
              <span>Vector Database:</span>
              <span className="font-mono text-slate-300">ChromaDB (Persistent)</span>
            </div>
            <div className="flex justify-between">
              <span>Chunk Size / Overlap:</span>
              <span className="font-mono text-slate-300">{settings?.chunk_size || 800} / {settings?.chunk_overlap || 150} chars</span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl gradient-border-btn text-xs font-bold text-white shadow-lg shadow-cyan-500/20 disabled:opacity-50"
            >
              {saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Saved!</span>
                </>
              ) : isSaving ? (
                <span>Saving...</span>
              ) : (
                <span>Save Settings</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
