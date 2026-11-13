'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, SourceCitation, DocumentMetadata } from '../types';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  FileText, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Copy, 
  Check, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';

interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (query: string) => Promise<void>;
  isQuerying: boolean;
  document: DocumentMetadata | null;
  onClearChat: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isQuerying,
  document,
  onClearChat,
}) => {
  const [input, setInput] = useState('');
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isQuerying]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isQuerying) return;
    const query = input.trim();
    setInput('');
    await onSendMessage(query);
  };

  const toggleSources = (messageId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [messageId]: !prev[messageId],
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const sampleQuestions = [
    'Provide a comprehensive summary of this document.',
    'What are the key technical concepts or principles discussed?',
    'What specific recommendations or conclusions are highlighted?',
    'What are the main architecture components mentioned?',
  ];

  const isDocReady = document && document.status === 'ready';

  return (
    <div className="w-full flex-1 flex flex-col glass-panel rounded-2xl overflow-hidden min-h-[550px] border border-white/10 shadow-2xl">
      {/* Chat Header */}
      <div className="px-6 py-3.5 border-b border-white/10 bg-slate-900/80 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              DocuRAG Assistant
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            </h3>
            <p className="text-[11px] text-slate-400">
              Answers grounded strictly in your document with page citations
            </p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="text-xs text-slate-400 hover:text-white px-2.5 py-1 rounded bg-slate-800/50 hover:bg-slate-800 transition-colors"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 px-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 flex items-center justify-center mb-4">
              <Sparkles className="w-7 h-7 text-cyan-400" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">
              Ask anything about your document
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mb-6">
              {isDocReady
                ? 'Your document is indexed in ChromaDB. Select a suggested prompt below or type your question.'
                : 'Please upload a PDF first to begin semantic search and grounded question answering.'}
            </p>

            {/* Quick Prompts */}
            {isDocReady && (
              <div className="w-full max-w-lg space-y-2 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Suggested Questions:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sampleQuestions.map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => onSendMessage(q)}
                      className="p-2.5 text-xs text-left text-slate-300 hover:text-white bg-slate-900/60 hover:bg-cyan-500/10 border border-white/5 hover:border-cyan-500/30 rounded-xl transition-all"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-md shadow-cyan-500/20">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 text-sm transition-all ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/20'
                    : 'bg-slate-900/90 border border-white/10 text-slate-200 rounded-tl-none shadow-md'
                }`}
              >
                {/* Assistant Message Content */}
                <div className="leading-relaxed whitespace-pre-wrap font-sans text-[13px] sm:text-sm">
                  {msg.content}
                </div>

                {/* Assistant Metadata & Latencies */}
                {msg.role === 'assistant' && (
                  <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                    <div className="flex items-center gap-3">
                      {msg.model_used && (
                        <span className="font-mono text-cyan-400 font-semibold">
                          {msg.model_used}
                        </span>
                      )}
                      {msg.retrieval_latency_ms !== undefined && (
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>Search: {msg.retrieval_latency_ms}ms</span>
                        </span>
                      )}
                      {msg.generation_latency_ms !== undefined && (
                        <span className="text-slate-400">
                          Gen: {msg.generation_latency_ms}ms
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(msg.content, msg.id)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                        title="Copy answer"
                      >
                        {copiedId === msg.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Grounded Sources Accordion */}
                {msg.role === 'assistant' && msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-white/10">
                    <button
                      onClick={() => toggleSources(msg.id)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-cyan-300 hover:text-cyan-200 py-1"
                    >
                      <span className="flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Retrieved Sources ({msg.sources.length} passages)</span>
                      </span>
                      {expandedSources[msg.id] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {expandedSources[msg.id] && (
                      <div className="mt-2 space-y-2 pt-1">
                        {msg.sources.map((src, sIdx) => (
                          <div
                            key={src.source_id || sIdx}
                            className="p-2.5 rounded-lg bg-slate-950/70 border border-white/5 text-xs text-slate-300"
                          >
                            <div className="flex items-center justify-between mb-1.5 font-mono">
                              <span className="inline-flex items-center gap-1 font-bold text-[11px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                                📄 Page {src.page_number}
                              </span>
                              {src.relevance_score !== null && src.relevance_score !== undefined && (
                                <span className="text-[10px] text-emerald-400 font-semibold">
                                  Relevance: {(src.relevance_score * 100).toFixed(1)}%
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-300 italic line-clamp-3 leading-relaxed">
                              &ldquo;{src.snippet}&rdquo;
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 flex-shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Spinner / Thinking Indicator */}
        {isQuerying && (
          <div className="flex gap-3.5 items-start">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white flex-shrink-0 mt-1 shadow-md">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl rounded-tl-none bg-slate-900/90 border border-cyan-500/30 text-xs text-slate-300 flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></span>
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-cyan-300 font-medium">
                Searching ChromaDB & generating grounded answer with Gemini...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-950/80 border-t border-white/10">
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={!isDocReady || isQuerying}
            placeholder={
              !isDocReady
                ? 'Upload a PDF to ask questions...'
                : 'Ask a question about the document...'
            }
            className="w-full pl-4 pr-12 py-3 text-sm glass-input rounded-xl disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-500"
          />
          <button
            type="submit"
            disabled={!isDocReady || !input.trim() || isQuerying}
            className="absolute right-2 p-2 rounded-lg gradient-border-btn text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-500 text-center mt-2">
          Responses cite specific page numbers from your uploaded PDF using ChromaDB similarity search.
        </p>
      </div>
    </div>
  );
};
