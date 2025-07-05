export interface CorpusFile {
  id: string;
  corpus_id: string;
  filename: string;
  is_ingested: boolean;
  created_at: string;
  updated_at: string;
}

export interface Corpus {
  id: string;
  name: string;
  description?: string;
  default_prompt: string;
  qdrant_collection_name: string;
  path: string;
  embedding_model: string;
  completion_model: string;
  created_at: string;
  updated_at: string;
  files: CorpusFile[];
}

export interface ConversationPart {
  id: string;
  conversation_id: string;
  query: string;
  context_chunks: string[];
  response: string;
  sources?: string[];
  embedding_model_used: string;
  completion_model_used: string;
  chunks_retrieved: number;
  created_at: string;
}

export interface Conversation {
  id: string;
  corpus_id: string;
  title?: string;
  created_at: string;
  parts: ConversationPart[];
} 