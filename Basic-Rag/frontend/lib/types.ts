export type Role = "user" | "assistant";

export interface Source {
  /** Display label, e.g. filename or doc title */
  title: string;
  /** The retrieved chunk text shown under the citation */
  snippet?: string;
  /** Optional similarity/relevance score (0-1) */
  score?: number;
  /** Optional page number, section, or other locator */
  locator?: string;
  /** 1-based page number in the source document (for PDF navigation) */
  page?: number;
  /** Original URL if ingested from a website */
  url?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  sources?: Source[];
  isError?: boolean;
}

export interface DocumentItem {
  name: string;
  size: number;
  chunks: number;
}

export interface Session {
  id: string;
  title: string;
  sources: string[];
  created_at: string;
  updated_at: string;
  message_count?: number;
}

export interface SessionDetail extends Session {
  messages: ChatMessage[];
}

export interface User {
  id: string;
  email: string;
  name: string;
  created_at?: string;
}

export interface AuthPayload {
  token: string;
  user: User;
}
