'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '../components/Header';
import { PipelineVisualizer } from '../components/PipelineVisualizer';
import { DocumentUpload } from '../components/DocumentUpload';
import { ChunkInspector } from '../components/ChunkInspector';
import { SettingsModal } from '../components/SettingsModal';
import { ChatInterface } from '../components/ChatInterface';
import { 
  DocumentMetadata, 
  ChunkItem, 
  ChatMessage, 
  AppSettings, 
  PipelineStage 
} from '../types';
import { 
  checkHealth, 
  getDocumentStatus, 
  getDocumentChunks, 
  uploadPDF, 
  queryDocument, 
  getSettings, 
  updateSettings, 
  resetDocument 
} from '../services/api';

export default function Home() {
  const [document, setDocument] = useState<DocumentMetadata | null>(null);
  const [chunks, setChunks] = useState<ChunkItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>('idle');
  
  // Loading & Modal States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isChunksOpen, setIsChunksOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Initialize data on mount
  useEffect(() => {
    const init = async () => {
      try {
        await checkHealth();
        setBackendOnline(true);
      } catch (e) {
        setBackendOnline(false);
      }

      try {
        const fetchedSettings = await getSettings();
        setSettings(fetchedSettings);
      } catch (e) {
        console.error('Failed to load settings:', e);
      }

      try {
        const docStatus = await getDocumentStatus();
        if (docStatus && docStatus.status === 'ready') {
          setDocument(docStatus);
          setPipelineStage('ready');
          loadChunks();
        }
      } catch (e) {
        console.error('Failed to load document status:', e);
      }
    };

    init();
  }, []);

  const loadChunks = async () => {
    try {
      const data = await getDocumentChunks();
      setChunks(data.chunks || []);
    } catch (e) {
      console.error('Failed to load chunks:', e);
    }
  };

  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setPipelineStage('uploading');

    // Simulate animated stage progression for realistic visual feedback
    const stageTimer1 = setTimeout(() => setPipelineStage('extracting'), 500);
    const stageTimer2 = setTimeout(() => setPipelineStage('chunking'), 1200);
    const stageTimer3 = setTimeout(() => setPipelineStage('embedding'), 1900);
    const stageTimer4 = setTimeout(() => setPipelineStage('indexing'), 2600);

    try {
      const res = await uploadPDF(file);
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(stageTimer4);

      setDocument(res.document);
      setPipelineStage('ready');
      await loadChunks();
      
      // Clear previous chat when new document is uploaded
      setMessages([]);
    } catch (err: any) {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(stageTimer4);

      setPipelineStage('idle');
      setUploadError(err.message || 'Failed to process document');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isQuerying) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: queryText,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsQuerying(true);

    try {
      const res = await queryDocument(
        queryText,
        undefined, // Uses saved backend key or settings
        settings?.model_name,
        settings?.top_k || 4
      );

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        sources: res.sources,
        model_used: res.model_used,
        retrieval_latency_ms: res.retrieval_latency_ms,
        generation_latency_ms: res.generation_latency_ms,
        timestamp: new Date().toLocaleTimeString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ Error: ${err.message || 'Failed to retrieve response.'} If this is your first time, please ensure your Google Gemini API key is configured in the API Settings dialog.`,
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleResetDocument = async () => {
    if (!confirm('Are you sure you want to clear the active document and vector store?')) return;
    setIsResetting(true);
    try {
      await resetDocument();
      setDocument(null);
      setChunks([]);
      setMessages([]);
      setPipelineStage('idle');
    } catch (e) {
      alert('Failed to reset document');
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveSettings = async (newSettings: {
    gemini_api_key?: string;
    model_name?: string;
    top_k?: number;
  }) => {
    await updateSettings(newSettings);
    const refreshed = await getSettings();
    setSettings(refreshed);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-slate-100">
      {/* Header */}
      <Header
        document={document}
        settings={settings}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onResetDocument={handleResetDocument}
        isResetting={isResetting}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 flex flex-col">
        {/* Backend Warning Banner if unreachable */}
        {backendOnline === false && (
          <div className="mb-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <span>
              <strong>Note:</strong> DocuRAG backend is currently offline. Start the backend with <code>uvicorn app.main:app --reload</code>.
            </span>
            <button
              onClick={async () => {
                try {
                  await checkHealth();
                  setBackendOnline(true);
                } catch {}
              }}
              className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-white font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Pipeline Visualizer (Top) */}
        <PipelineVisualizer
          currentStage={pipelineStage}
          isQuerying={isQuerying}
        />

        {/* Split View Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
          {/* Left Column: Document Upload & Status (5 cols) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <DocumentUpload
              document={document}
              onUpload={handleUpload}
              isUploading={isUploading}
              uploadError={uploadError}
              onOpenChunks={() => setIsChunksOpen(true)}
              onReset={handleResetDocument}
            />

            {/* Architecture Overview Card */}
            <div className="glass-panel rounded-2xl p-5 border border-white/5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Tech Stack Specifications
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">PDF Parser:</span>
                  <span className="text-white font-mono font-medium">PyMuPDF (fitz)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Chunking Engine:</span>
                  <span className="text-white font-mono font-medium">LangChain RecursiveSplitter</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Embedding Model:</span>
                  <span className="text-cyan-400 font-mono font-medium">all-MiniLM-L6-v2 (384-dim)</span>
                </div>
                <div className="flex justify-between py-1 border-b border-white/5">
                  <span className="text-slate-400">Vector Database:</span>
                  <span className="text-emerald-400 font-mono font-medium">ChromaDB (Persistent)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-400">Synthesis LLM:</span>
                  <span className="text-purple-400 font-mono font-medium">Google Gemini API</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive RAG Chat & Sources (7 cols) */}
          <div className="lg:col-span-7 flex flex-col h-full">
            <ChatInterface
              messages={messages}
              onSendMessage={handleSendMessage}
              isQuerying={isQuerying}
              document={document}
              onClearChat={() => setMessages([])}
            />
          </div>
        </div>
      </main>

      {/* Chunk Inspector Modal */}
      <ChunkInspector
        isOpen={isChunksOpen}
        onClose={() => setIsChunksOpen(false)}
        chunks={chunks}
        isLoading={false}
      />

      {/* Settings & API Key Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
