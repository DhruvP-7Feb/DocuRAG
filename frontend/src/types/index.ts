export interface DocumentMetadata {
  id: string;
  filename: string;
  filesize: number;
  page_count: number;
  chunk_count: number;
  uploaded_at: string;
  status: 'idle' | 'processing' | 'ready' | 'error';
  error_message?: string;
}

export interface ChunkItem {
  chunk_id: string;
  page_number: number;
  chunk_index: number;
  char_count: number;
  content: string;
  content_preview: string;
}

export interface SourceCitation {
  source_id: string;
  page_number: number;
  snippet: string;
  relevance_score?: number | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  model_used?: string;
  retrieval_latency_ms?: number;
  generation_latency_ms?: number;
  timestamp: string;
}

export interface AppSettings {
  has_api_key: boolean;
  gemini_api_key_masked: string;
  model_name: string;
  top_k: number;
  chunk_size: number;
  chunk_overlap: number;
  embedding_model: string;
}

export type PipelineStage = 
  | 'idle'
  | 'uploading'
  | 'extracting'
  | 'chunking'
  | 'embedding'
  | 'indexing'
  | 'ready';
