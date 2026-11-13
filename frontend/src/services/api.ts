import { DocumentMetadata, ChunkItem, SourceCitation, AppSettings } from '../types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface QueryResult {
  answer: string;
  sources: SourceCitation[];
  query: string;
  model_used: string;
  retrieval_latency_ms: number;
  generation_latency_ms: number;
}

export interface UploadResponse {
  success: boolean;
  message: string;
  document: DocumentMetadata;
  pipeline_metrics: {
    pages_extracted: number;
    total_chars: number;
    total_words: number;
    chunks_created: number;
    processing_time_ms: number;
  };
}

export async function checkHealth() {
  const res = await fetch(`${API_BASE_URL}/api/health`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Backend is not reachable');
  return res.json();
}

export async function getDocumentStatus(): Promise<DocumentMetadata | null> {
  const res = await fetch(`${API_BASE_URL}/api/document/status`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function getDocumentChunks(): Promise<{ total_chunks: number; chunks: ChunkItem[] }> {
  const res = await fetch(`${API_BASE_URL}/api/document/chunks`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch document chunks');
  return res.json();
}

export async function uploadPDF(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Upload failed' }));
    throw new Error(errorData.detail || 'Upload failed');
  }

  return res.json();
}

export async function queryDocument(
  query: string,
  apiKey?: string,
  modelName?: string,
  topK: number = 4
): Promise<QueryResult> {
  const res = await fetch(`${API_BASE_URL}/api/query`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query,
      api_key: apiKey || undefined,
      model_name: modelName || undefined,
      top_k: topK,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Query failed' }));
    throw new Error(errorData.detail || 'Query failed');
  }

  return res.json();
}

export async function getSettings(): Promise<AppSettings> {
  const res = await fetch(`${API_BASE_URL}/api/settings`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateSettings(data: {
  gemini_api_key?: string;
  model_name?: string;
  top_k?: number;
  chunk_size?: number;
  chunk_overlap?: number;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

export async function resetDocument(): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/document/reset`, {
    method: 'POST',
  });

  if (!res.ok) throw new Error('Failed to reset document');
  return res.json();
}
