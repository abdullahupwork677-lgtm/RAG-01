import { ChatMessage, Source } from "./types";

/**
 * Base URL of your FastAPI backend.
 * Set NEXT_PUBLIC_API_URL in .env.local, e.g.:
 *   NEXT_PUBLIC_API_URL=http://localhost:8000
 */
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/**
 * Endpoint path that accepts a question and returns a grounded answer.
 * Adjust if your FastAPI route is named differently (e.g. "/question", "/ask").
 */
const CHAT_ENDPOINT = `${API_URL}/rag/ask`;

interface RawSource {
  title?: string;
  source?: string;
  filename?: string;
  text?: string;
  content?: string;
  snippet?: string;
  score?: number;
  page?: number | string;
  locator?: string;
}

interface RawChatResponse {
  answer?: string;
  response?: string;
  message?: string;
  sources?: RawSource[];
  context?: RawSource[];
}

/**
 * Normalizes whatever shape the backend returns into our Source type.
 * EDIT THIS if your backend's field names differ from the guesses below.
 */
function normalizeSources(raw?: (RawSource | string)[]): Source[] {
  if (!raw) return [];
  return raw.map((s) => {
    if (typeof s === "string") {
      return { title: s };
    }
    return {
      title: s.title ?? s.source ?? s.filename ?? "Untitled source",
      snippet: s.text ?? s.content ?? s.snippet,
      score: s.score,
      locator:
        s.locator ?? (s.page !== undefined ? `p. ${s.page}` : undefined),
    };
  });
}

export class ChatApiError extends Error {}

/**
 * Sends the user's question (plus optional prior turns) to the backend
 * and returns the assistant's answer with any cited sources.
 *
 * EDIT THE REQUEST BODY below to match your FastAPI request schema
 * if it expects different field names (e.g. "question" instead of "question").
 */
export async function sendChatMessage(
  question: string,
  history: ChatMessage[]
): Promise<{ answer: string; sources: Source[] }> {
  let res: Response;
  try {
    res = await fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        // history: history.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
  } catch {
    throw new ChatApiError(
      `Could not reach the backend at ${CHAT_ENDPOINT}. Is FastAPI running and is CORS enabled?`
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ChatApiError(
      `Backend returned ${res.status} ${res.statusText}. ${text}`.trim()
    );
  }

  const data: RawChatResponse = await res.json();
  const answer = data.answer ?? data.response ?? data.message ?? "";

  if (!answer) {
    throw new ChatApiError(
      "Backend response didn't include a recognizable answer field. Check the response shape in lib/api.ts."
    );
  }

  return {
    answer,
    sources: normalizeSources(data.sources ?? data.context),
  };
}
