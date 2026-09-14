import type {
  AuthPayload,
  DocumentItem,
  Session,
  SessionDetail,
  Source,
  User,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "https://api.turboturismo.com";
const TOKEN_KEY = "chatpdf_token";

export class ChatApiError extends Error {}

// ─── Auth token helpers ───────────────────────────────────

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  window.localStorage.removeItem(TOKEN_KEY);
}

function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const h = { ...(extra ?? {}) };
  const token = getToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

// ─── Auth endpoints ───────────────────────────────────────

export async function register(
  email: string,
  password: string,
  name?: string
): Promise<AuthPayload> {
  return request("/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, name }),
  });
}

export async function login(
  email: string,
  password: string
): Promise<AuthPayload> {
  return request("/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function logout(): Promise<void> {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    // Token may already be invalid; still clear local state.
  }
  clearToken();
}

export async function getMe(): Promise<User> {
  const data = await request("/auth/me");
  return data.user;
}

export async function forgotPassword(email: string): Promise<{
  message: string;
  reset_link?: string;
}> {
  return request("/auth/forgot-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(
  token: string,
  password: string
): Promise<{ message: string }> {
  return request("/auth/reset-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, password }),
  });
}

function normalizeSources(raw: unknown): Source[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((s) => {
    const r = s as Record<string, unknown>;
    return {
      title:
        (r?.title as string) ??
        (r?.source as string) ??
        (r?.filename as string) ??
        "Untitled source",
      snippet: (r?.text as string) ?? (r?.content as string) ?? (r?.snippet as string),
      score: r?.score as number | undefined,
      page: typeof r?.page === "number" ? (r.page as number) : undefined,
      url: r?.url as string | undefined,
      locator:
        (r?.locator as string) ??
        (r?.page != null ? `p. ${r.page}` : undefined),
    };
  });
}

async function request(path: string, init?: RequestInit) {
  const headers = authHeaders(init?.headers as Record<string, string> | undefined);
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...init, headers });
  } catch {
    throw new ChatApiError(
      `Could not reach the backend at ${API_URL}. Is FastAPI running and is CORS enabled?`
    );
  }
  if (res.status === 401) {
    clearToken();
    if (typeof window !== "undefined" && !path.startsWith("/auth/")) {
      window.location.href = "/login";
    }
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new ChatApiError(
      `Backend returned ${res.status} ${res.statusText}. ${text}`.trim()
    );
  }
  return res.json();
}

export async function sendChatMessage(
  question: string,
  opts?: { sessionId?: string; sources?: string[]; language?: string }
): Promise<{ answer: string; sources: Source[]; model?: string }> {
  const data = await request("/rag/ask", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      session_id: opts?.sessionId || null,
      sources: opts?.sources || null,
      language: opts?.language || null,
    }),
  });
  const answer = data.answer ?? data.response ?? data.message ?? "";
  if (!answer) {
    throw new ChatApiError("Backend response didn't include an answer.");
  }
  return {
    answer,
    sources: normalizeSources(data.sources),
    model: data.model,
  };
}

export async function summarizeDocuments(opts?: {
  sessionId?: string;
  sources?: string[];
  language?: string;
}): Promise<{ answer: string; model?: string }> {
  const data = await request("/rag/summarize", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      session_id: opts?.sessionId || null,
      sources: opts?.sources || null,
      language: opts?.language || null,
    }),
  });
  return { answer: data.answer, model: data.model };
}

export async function uploadDocument(
  file: File,
  sessionId?: string
): Promise<{
  filename: string;
  size: number;
  chunks: number;
  pages: number;
  success: boolean;
  message: string;
}> {
  const form = new FormData();
  form.append("file", file);
  const q = sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : "";
  try {
    const res = await fetch(`${API_URL}/rag/upload${q}`, {
      method: "POST",
      headers: authHeaders(),
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new ChatApiError(body.detail || `Upload failed (${res.status})`);
    }
    return await res.json();
  } catch (e) {
    if (e instanceof ChatApiError) throw e;
    throw new ChatApiError(e instanceof Error ? e.message : "Upload failed");
  }
}

export async function ingestUrl(
  url: string,
  sessionId?: string
): Promise<{
  filename: string;
  title: string;
  url: string;
  chunks: number;
  pages: number;
  success: boolean;
}> {
  return request("/rag/ingest-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, session_id: sessionId || null }),
  });
}

export async function ingestYouTube(
  url: string,
  sessionId?: string
): Promise<{
  filename: string;
  title: string;
  channel?: string;
  thumbnail?: string;
  url: string;
  video_id: string;
  chunks: number;
  pages: number;
  success: boolean;
}> {
  return request("/rag/ingest-youtube", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, session_id: sessionId || null }),
  });
}

/** True if the text looks like a YouTube video URL. */
export function isYouTubeUrl(text: string): boolean {
  return /(?:youtube\.com|youtu\.be)\/(?:watch\?v=|shorts\/|embed\/|live\/)?[A-Za-z0-9_-]{11}/.test(
    text.trim()
  );
}

/** True if the text looks like any http(s) link (website or video). */
export function isWebUrl(text: string): boolean {
  return /^https?:\/\/\S+$/i.test(text.trim());
}

export async function getDocuments(): Promise<DocumentItem[]> {
  const data = await request("/rag/documents");
  return data.documents ?? [];
}

export function fileUrl(name: string): string {
  return `${API_URL}/rag/files/${encodeURIComponent(name)}`;
}

export function getAuthHeaders(): Record<string, string> {
  return authHeaders();
}

export async function deleteDocument(name: string): Promise<void> {
  await request(`/rag/documents/${encodeURIComponent(name)}`, { method: "DELETE" });
}

export async function createSession(
  title?: string,
  sources: string[] = []
): Promise<Session> {
  return request("/rag/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title: title || "New Chat", sources }),
  });
}

export async function listSessions(): Promise<Session[]> {
  return request("/rag/sessions");
}

export async function getSession(id: string): Promise<SessionDetail> {
  return request(`/rag/sessions/${id}`);
}

export async function patchSession(
  id: string,
  patch: { title?: string; add_sources?: string[]; remove_sources?: string[] }
): Promise<{ ok: boolean; sources: string[] }> {
  return request(`/rag/sessions/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function deleteSession(id: string): Promise<void> {
  await request(`/rag/sessions/${id}`, { method: "DELETE" });
}
