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
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  sources?: Source[];
  isError?: boolean;
}
