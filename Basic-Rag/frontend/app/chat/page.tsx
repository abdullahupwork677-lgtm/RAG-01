"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import SessionSidebar from "@/components/SessionSidebar";
import AddDocumentModal from "@/components/AddDocumentModal";
import YouTubeModal from "@/components/YouTubeModal";
import VideoCard from "@/components/VideoCard";
import PdfViewer from "@/components/PdfViewer";
import {
  sendChatMessage,
  summarizeDocuments,
  createSession,
  listSessions,
  getSession,
  deleteSession,
  ingestYouTube,
  ingestUrl,
  isWebUrl,
  isYouTubeUrl,
  ChatApiError,
  getToken,
  getMe,
  logout as apiLogout,
  fileUrl,
  getAuthHeaders,
} from "@/lib/api";
import {
  ChatMessage as ChatMessageType,
  Source,
  Session,
  User,
} from "@/lib/types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [summarizing, setSummarizing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showYouTube, setShowYouTube] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [sessionSources, setSessionSources] = useState<string[]>([]);
  const [language, setLanguage] = useState("");
  const [navTarget, setNavTarget] = useState<{
    page: number;
    signal: number;
  } | null>(null);
  const [videoMeta, setVideoMeta] = useState<{
    title: string;
    url: string;
    channel?: string;
    thumbnail?: string;
    chunks?: number;
    filename?: string;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const sessionsLoadedRef = useRef(false);

  const activePdfFile = useCallback(() => {
    const pdf = sessionSources.find((s) =>
      s.toLowerCase().endsWith(".pdf")
    );
    return pdf ? fileUrl(pdf) : null;
  }, [sessionSources]);

  const loadSessions = useCallback(async () => {
    try {
      const list = await listSessions();
      setSessions(list);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (!getToken()) {
      window.location.href = "/login";
      return;
    }
    getMe()
      .then((u) => {
        if (!mounted) return;
        setUser(u);
        setAuthChecked(true);
        return loadSessions();
      })
      .then(() => {
        sessionsLoadedRef.current = true;
      })
      .catch(() => {
        if (!mounted) return;
        window.location.href = "/login";
      });
    return () => {
      mounted = false;
    };
  }, [loadSessions]);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const refreshSession = useCallback(
    async (id: string) => {
      try {
        const detail = await getSession(id);
        setActiveSession(id);
        setSessionSources(detail.sources ?? []);
        setMessages(
          (detail.messages ?? []).map((m) => ({
            id: String(m.id ?? uid()),
            role: m.role,
            content: m.content,
            sources: m.sources,
            isError: false,
          }))
        );
      } catch {
        // ignore
      }
    },
    []
  );

  const handleNewChat = async () => {
    setVideoMeta(null);
    try {
      const s = await createSession("New Chat");
      await loadSessions();
      await refreshSession(s.id);
    } catch {
      setActiveSession(null);
      setMessages([]);
      setSessionSources([]);
      setVideoMeta(null);
    }
  };

  const handleSelectSession = (id: string) => {
    if (id === activeSession) return;
    setVideoMeta(null);
    refreshSession(id);
  };

  const handleSubmit = async (forced?: string) => {
    const query = (forced ?? input).trim();
    if (!query || loading) return;

    const userMessage: ChatMessageType = {
      id: uid(),
      role: "user",
      content: query,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
let sid = activeSession;
    // YouTube links always open a brand-new chat session.
    if (!sid || isYouTubeUrl(query)) {
      const s = await createSession(query.slice(0, 60) || "New Chat");
      sid = s.id;
      setActiveSession(s.id);
      await loadSessions();
    }

      // Paste a link straight into the chat → ingest it first.
      if (isWebUrl(query)) {
        try {
          if (isYouTubeUrl(query)) {
            const meta = await ingestYouTube(query, sid);
            setVideoMeta({
              title: meta.title,
              url: meta.url,
              channel: meta.channel,
              thumbnail: meta.thumbnail,
              chunks: meta.chunks,
              filename: meta.filename,
            });
            setMessages((prev) => [
              ...prev,
              {
                id: uid(),
                role: "assistant",
                content:
                  "The video is ready. Ask me anything about it — summaries, key points, quotes and more.",
              },
            ]);
          } else {
            const meta = await ingestUrl(query, sid);
            setMessages((prev) => [
              ...prev,
              {
                id: uid(),
                role: "assistant",
                content: `Added “${meta.title}” (${meta.chunks} chunks). Ask me anything about it.`,
              },
            ]);
          }
          void refreshSession(sid);
          void loadSessions();
        } catch (err) {
          setMessages((prev) => [
            ...prev,
            {
              id: uid(),
              role: "assistant",
              content:
                err instanceof ChatApiError ? err.message : "Could not ingest that link.",
              isError: true,
            },
          ]);
        }
        return;
      }

      const { answer, sources } = await sendChatMessage(query, {
        sessionId: sid,
        language: language || undefined,
      });

      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: answer, sources },
      ]);
      // refresh session to pick up new sources + history
      void refreshSession(sid);
      void loadSessions();
    } catch (err) {
      const message =
        err instanceof ChatApiError
          ? err.message
          : "Something went wrong reaching the backend.";
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: message, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (summarizing || (sessionSources.length === 0 && !activeSession)) return;
    setSummarizing(true);
    try {
      const { answer } = await summarizeDocuments({
        sessionId: activeSession ?? undefined,
        language: language || undefined,
      });
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: answer },
      ]);
      if (activeSession) {
        void refreshSession(activeSession);
        void loadSessions();
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: uid(),
          role: "assistant",
          content:
            err instanceof ChatApiError ? err.message : "Summarize failed",
          isError: true,
        },
      ]);
    } finally {
      setSummarizing(false);
    }
  };

  const handleNavigateSource = (source: Source) => {
    if (source.page != null) {
      setNavTarget((p) => ({
        page: source.page ?? 1,
        signal: (p?.signal ?? 0) + 1,
      }));
    }
  };

  const handleUploaded = (
    meta?: {
      filename: string;
      title?: string;
      url?: string;
      channel?: string;
      thumbnail?: string;
      chunks?: number;
    }
  ) => {
    // refresh session sources + sidebar so new documents show up
    if (activeSession) {
      void refreshSession(activeSession);
      void loadSessions();
    }
    // Show the video card AFTER refresh (which clears any previous videoMeta).
    if (meta && meta.url && meta.thumbnail) {
      setVideoMeta({
        title: meta.title || "YouTube video",
        url: meta.url,
        channel: meta.channel,
        thumbnail: meta.thumbnail,
        chunks: meta.chunks,
        filename: meta.filename,
      });
    }
  };

  const handleDeleteSession = async () => {
    if (!activeSession) return;
    await deleteSession(activeSession);
    setActiveSession(null);
    setMessages([]);
    setSessionSources([]);
    setVideoMeta(null);
    await loadSessions();
  };

  const handleLogout = async () => {
    await apiLogout();
    window.location.href = "/login";
  };

  const pdfUrl = activePdfFile();

  if (!authChecked) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-bg text-text-faint">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-bg">
      <div className="flex min-h-0 flex-1">
      <SessionSidebar
        sessions={sessions}
        activeId={activeSession ?? undefined}
        onSelect={handleSelectSession}
        onNew={handleNewChat}
        onOpenYouTube={() => setShowYouTube(true)}
      />

      {/* Chat column */}
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-white px-5 py-3 sm:px-8">
          <div className="flex min-w-0 items-center gap-2">
            {sessionSources.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-accent-soft px-2.5 py-1 font-mono text-[11px] font-bold text-accent">
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
                {sessionSources.length} file
                {sessionSources.length === 1 ? "" : "s"}
              </span>
            )}
            {!activeSession && (
              <span className="text-[13px] font-semibold text-text-faint">
                Start a new chat
              </span>
            )}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={() => {
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-[13px] font-semibold text-gray-700 transition-colors hover:border-indigo-500 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
              </svg>
              Upload
            </button>
            <button
              onClick={() => setShowYouTube(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2 text-[13px] font-semibold text-text transition-colors hover:border-red-500 hover:bg-red-50 hover:text-red-500"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 002.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
              </svg>
              YouTube
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[12px] font-semibold text-text-faint transition-colors hover:text-accent"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75" />
              </svg>
              Home
            </Link>
            {activeSession && (
              <button
                onClick={handleDeleteSession}
                title="Delete this chat"
                aria-label="Delete chat"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-text-faint transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
            {user && (
              <div className="ml-1 flex items-center gap-2 border-l border-border pl-3">
                <span className="hidden max-w-[140px] truncate text-[12px] font-semibold text-text-dim sm:block">
                  {user.name || user.email}
                </span>
                <button
                  onClick={handleLogout}
                  title="Log out"
                  aria-label="Log out"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-text-faint transition-colors hover:bg-accent-soft hover:text-accent"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 006.75 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </header>

        <div
          ref={scrollRef}
          className="thin-scroll flex-1 overflow-y-auto bg-panel"
        >
          <div className="mx-auto w-full max-w-3xl space-y-8 px-4 py-8 sm:px-8">
            {messages.length === 0 && !loading && !videoMeta && (
              <div className="flex min-h-[440px] flex-col items-center justify-center py-8 text-center">
                {/* Logo blob */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 -m-6 rounded-full bg-accent/10 blur-2xl" />
                  <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-white shadow-lg shadow-accent/25">
                    <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" strokeWidth={1.8} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                    </svg>
                  </span>
                </div>
                <h1 className="text-3xl font-extrabold text-text">
                  Chat with your PDFs
                </h1>
                <p className="mt-2 max-w-md text-[15px] leading-relaxed text-text-dim">
                  Upload a document, paste a URL, or drag a file to start.
                  Answers are grounded strictly in your sources.
                </p>

                {/* Drop zone */}
                <button
                  onClick={() => setShowModal(true)}
                  className="group mt-8 flex w-full max-w-md flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white px-6 py-14 transition-colors hover:border-indigo-500 hover:bg-indigo-50"
                >
                  <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 transition-colors group-hover:bg-indigo-600 group-hover:text-white">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.6} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                    </svg>
                  </span>
                  <span className="text-[15px] font-bold text-gray-900">
                    Drop files here or click to browse
                  </span>
                  <span className="mt-1 text-[13px] text-gray-400">
                    PDF, TXT, MD, DOCX, PPTX — or paste a link below
                  </span>
                </button>

                {/* Format chips */}
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  {["PDF", "TXT", "DOCX", "PPTX", "MD"].map((f) => (
                    <span
                      key={f}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-1 text-[11px] font-bold text-gray-400"
                    >
                      {f}
                    </span>
                  ))}
                  <span className="text-gray-400">·</span>
                  <span className="rounded-lg border border-border bg-red-50 px-3 py-1 text-[11px] font-bold text-red-500">
                    YouTube
                  </span>
                </div>

                {/* Example prompts */}
                <div className="mt-8 flex flex-col items-center gap-3">
                  <span className="text-[12px] font-semibold text-text-faint">
                    Try asking:
                  </span>
                  <div className="flex flex-wrap justify-center gap-2">
                    {[
                      { t: "Summarize this document", i: "M12 4.5v15m7.5-7.5h-15" },
                      { t: "What are the key points?", i: "M9 12h6m-6 4h6M9 8h6M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
                      { t: "Explain like I'm 5", i: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" },
                    ].map((s) => (
                      <button
                        key={s.t}
                        onClick={() => handleSubmit(s.t)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-white px-4 py-2 text-[13px] font-semibold text-text-dim transition-colors hover:border-accent hover:bg-accent-soft hover:text-accent"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={s.i} />
                        </svg>
                        {s.t}
                      </button>
                    ))}
                  </div>
                </div>

                <Link
                  href="/architecture"
                  className="mt-8 inline-flex items-center gap-1.5 text-[12px] font-semibold text-text-faint transition-colors hover:text-accent"
                >
                  See how it works
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              </div>
            )}

            {videoMeta && <VideoCard video={videoMeta} />}

            {messages.map((m) => (
              <ChatMessage
                key={m.id}
                message={m}
                onNavigate={handleNavigateSource}
              />
            ))}

            {(loading || summarizing) && (
              <div className="flex gap-3 px-1 py-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-border bg-white px-4 py-3 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-accent thinking-dot" style={{ animationDelay: "0ms" }} />
                  <span className="h-2 w-2 rounded-full bg-accent thinking-dot" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 rounded-full bg-accent thinking-dot" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="shrink-0 border-t border-border bg-white px-4 py-4 sm:px-8">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            disabled={loading || summarizing}
            language={language}
            onLanguageChange={setLanguage}
            onSummarize={handleSummarize}
            summarizing={summarizing}
            hasSources={sessionSources.length > 0}
          />
        </div>
      </main>

      {/* PDF viewer column */}
      {pdfUrl && (
        <section className="hidden w-1/2 shrink-0 flex-col lg:flex">
          <PdfViewer
            key={pdfUrl}
            url={pdfUrl}
            targetPage={navTarget?.page}
            navSignal={navTarget?.signal}
            headers={getAuthHeaders()}
          />
        </section>
      )}
      </div>

      {showModal && (
        <AddDocumentModal
          sessionId={activeSession ?? undefined}
          onClose={() => setShowModal(false)}
          onUploaded={handleUploaded}
        />
      )}
      {showYouTube && (
        <YouTubeModal
          sessionId={activeSession ?? undefined}
          onClose={() => setShowYouTube(false)}
          onIngested={handleUploaded}
        />
      )}
    </div>
  );
}