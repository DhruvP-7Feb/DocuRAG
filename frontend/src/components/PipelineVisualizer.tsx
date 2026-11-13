'use client';

import React from 'react';
import { PipelineStage } from '../types';
import { FileText, Cpu, Scissors, Layers, Database, Search, Bot, Sparkles, Check } from 'lucide-react';

interface PipelineVisualizerProps {
  currentStage: PipelineStage;
  isQuerying?: boolean;
}

interface StepItem {
  id: string;
  title: string;
  tool: string;
  icon: React.ReactNode;
  description: string;
}

export const PipelineVisualizer: React.FC<PipelineVisualizerProps> = ({
  currentStage,
  isQuerying = false,
}) => {
  const steps: StepItem[] = [
    {
      id: 'upload',
      title: 'PDF Upload',
      tool: 'Raw Document',
      icon: <FileText className="w-4 h-4" />,
      description: 'Single PDF input',
    },
    {
      id: 'extract',
      title: 'Text Extraction',
      tool: 'PyMuPDF',
      icon: <Cpu className="w-4 h-4" />,
      description: 'Page-aware parsing',
    },
    {
      id: 'chunk',
      title: 'Recursive Chunking',
      tool: 'LangChain',
      icon: <Scissors className="w-4 h-4" />,
      description: 'Splits with metadata',
    },
    {
      id: 'embed',
      title: 'Dense Embeddings',
      tool: 'Sentence Transformers',
      icon: <Layers className="w-4 h-4" />,
      description: 'all-MiniLM-L6-v2 (384d)',
    },
    {
      id: 'vector',
      title: 'Vector Database',
      tool: 'ChromaDB',
      icon: <Database className="w-4 h-4" />,
      description: 'Persistent index',
    },
    {
      id: 'search',
      title: 'Similarity Search',
      tool: 'Cosine / MMR',
      icon: <Search className="w-4 h-4" />,
      description: 'Top-K relevant chunks',
    },
    {
      id: 'llm',
      title: 'Grounded Answer',
      tool: 'Gemini API',
      icon: <Bot className="w-4 h-4" />,
      description: 'Answer + cited pages',
    },
  ];

  const getStepStatus = (stepId: string) => {
    if (currentStage === 'idle') return 'idle';

    if (stepId === 'upload') {
      return currentStage === 'uploading' ? 'active' : 'completed';
    }
    if (stepId === 'extract') {
      if (currentStage === 'uploading') return 'idle';
      if (currentStage === 'extracting') return 'active';
      return 'completed';
    }
    if (stepId === 'chunk') {
      if (['uploading', 'extracting'].includes(currentStage)) return 'idle';
      if (currentStage === 'chunking') return 'active';
      return 'completed';
    }
    if (stepId === 'embed') {
      if (['uploading', 'extracting', 'chunking'].includes(currentStage)) return 'idle';
      if (currentStage === 'embedding') return 'active';
      return 'completed';
    }
    if (stepId === 'vector') {
      if (['uploading', 'extracting', 'chunking', 'embedding'].includes(currentStage)) return 'idle';
      if (currentStage === 'indexing') return 'active';
      return 'completed';
    }
    if (stepId === 'search') {
      if (currentStage !== 'ready') return 'idle';
      return isQuerying ? 'active' : 'completed';
    }
    if (stepId === 'llm') {
      if (currentStage !== 'ready') return 'idle';
      return isQuerying ? 'active' : 'completed';
    }

    return 'idle';
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-4 sm:p-5 mb-6 overflow-hidden">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            RAG Pipeline Architecture
          </h2>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {currentStage === 'idle'
            ? 'Awaiting PDF'
            : currentStage === 'ready'
            ? isQuerying
              ? '⚡ Retrieving & Generating...'
              : 'Indexed & Ready'
            : `Processing: ${currentStage}...`}
        </span>
      </div>

      {/* Steps Flow Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {steps.map((step, idx) => {
          const status = getStepStatus(step.id);
          const isCompleted = status === 'completed';
          const isActive = status === 'active';

          return (
            <div
              key={step.id}
              className={`relative flex flex-col p-3 rounded-xl border transition-all duration-300 ${
                isActive
                  ? 'bg-cyan-500/10 border-cyan-400/60 shadow-lg shadow-cyan-500/20 pulse-glow-active'
                  : isCompleted
                  ? 'bg-slate-800/60 border-emerald-500/40 text-slate-200'
                  : 'bg-slate-900/40 border-white/5 text-slate-500'
              }`}
            >
              {/* Step Number & Status Indicator */}
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-bold text-slate-400">
                  0{idx + 1}
                </span>
                <div
                  className={`flex items-center justify-center w-5 h-5 rounded-full ${
                    isActive
                      ? 'bg-cyan-500 text-black font-bold animate-spin'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                      : 'bg-slate-800 text-slate-600'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-3 h-3" />
                  ) : isActive ? (
                    <span className="w-2 h-2 rounded-full bg-cyan-200"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                  )}
                </div>
              </div>

              {/* Tool / Library Pill */}
              <div className="mb-1">
                <span
                  className={`inline-block text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-cyan-400/20 text-cyan-300'
                      : isCompleted
                      ? 'bg-slate-700/60 text-slate-300'
                      : 'bg-slate-800/40 text-slate-600'
                  }`}
                >
                  {step.tool}
                </span>
              </div>

              {/* Title & Desc */}
              <div className="mt-auto">
                <div className="text-xs font-bold text-white leading-tight">
                  {step.title}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">
                  {step.description}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
