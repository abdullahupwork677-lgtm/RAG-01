"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import DocumentUpload from "@/components/DocumentUpload";
import { sendChatMessage, ChatApiError } from "@/lib/api";
import { ChatMessage as ChatMessageType } from "@/lib/types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSubmit = async () => {
    const query = input.trim();
    if (!query || loading) return;

    const userMessage: ChatMessageType = { id: uid(), role: "user", content: query };
    const history = messages;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { answer, sources } = await sendChatMessage(query, history);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: answer, sources },
      ]);
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

  const handleReset = () => {
    setMessages([]);
    setShowUpload(false);
  };

  const handleUploadComplete = (result: {
    filename: string;
    success: boolean;
    message: string;
    chunks: number;
    files: number;
  }) => {
    setShowUpload(false);
    const status = result.success ? "Upload successful" : "Upload failed";
    const detail = result.success
      ? `Ingested "${result.filename}" — ${result.chunks} chunks across your knowledge base.`
      : result.message;
    setMessages((prev) => [
      ...prev,
      {
        id: uid(),
        role: "assistant",
        content: `${status}. ${detail}`,
        isError: !result.success,
      },
    ]);
  };

  return (
    <div className="hero-bg flex min-h-screen w-full items-stretch p-0 lg:h-screen lg:overflow-hidden lg:p-12">
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-10 px-6 py-10 lg:flex-row lg:gap-14 lg:px-0 lg:py-0">
        {/* Intro / purpose */}
        <aside className="flex w-full flex-col lg:w-[42%]">
          <div className="flex flex-col justify-center lg:min-h-full">
            <div className="space-y-6">
              <div className="font-mono text-[11px] font-semibold uppercase tracking-[0.24em] text-accent">
                Turbo Turismo · AI Assistant
              </div>
              <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight text-text lg:text-[2.75rem]">
                Instant Answers From Your Own Documents
              </h1>
              <div className="space-y-4 text-[15px] leading-relaxed text-text-dim">
                <p>
                  Upload your documents, and get accurate, grounded answers in
                  seconds. No more digging through PDFs, contracts, or reports
                  to find what you need — just ask in plain language, and the
                  system retrieves the exact information from your files and
                  gives you a clear, sourced answer.
                </p>
                <p>
                  Every response is based strictly on your uploaded content —
                  no guessing, no hallucination. You can ingest as many
                  documents as you like — manuals, policies, research papers,
                  internal wikis, whatever you work with — and query them
                  anytime through a simple chat interface. It&apos;s like having
                  a personal assistant that&apos;s read everything you own and
                  always tells you the truth about it.
                </p>
              </div>
            </div>

            <div className="mt-10 flex max-w-md flex-col gap-3 sm:flex-row">
              <button
                onClick={() => setShowUpload(true)}
                className="group flex flex-1 items-center justify-center gap-2.5 rounded-[4px] bg-accent px-6 py-3.5 font-mono text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-accent-hover active:translate-y-px"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                  />
                </svg>
                Upload documents
              </button>
              <button
                onClick={handleReset}
                className="flex flex-1 items-center justify-center gap-2.5 rounded-[4px] border border-black/15 px-6 py-3.5 font-mono text-[13px] font-semibold uppercase tracking-[0.12em] text-text transition-colors hover:border-black/40 hover:bg-black/[0.03] active:translate-y-px"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                New chat
              </button>
            </div>

            <Link
              href="/architecture"
              className="group mt-6 flex w-full max-w-md items-center justify-between gap-3 rounded-[6px] border-2 border-accent bg-accent px-7 py-6 font-mono text-[15px] font-semibold uppercase tracking-[0.16em] text-white transition-all hover:bg-accent-hover hover:border-accent-hover active:translate-y-px"
            >
              <span className="flex items-center gap-3">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z"
                  />
                </svg>
                View AI architecture
              </span>
              <svg
                className="h-5 w-5 shrink-0 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>

            <div className="mt-10 max-w-md border-t border-black/10 pt-6">
              <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] text-text-faint">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                Grounded answers only
              </div>
              <p className="mt-1.5 text-[13px] text-text-faint">
                No hallucinations — every response cites the source files it
                comes from.
              </p>
            </div>
          </div>
        </aside>

        {/* Chat */}
        <main className="flex w-full flex-col overflow-hidden rounded-[6px] border border-black/10 bg-panel lg:w-[58%]">
          <header className="flex w-full shrink-0 items-center justify-between border-b border-black/10 bg-white px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-white">
                <svg
                  className="h-4.5 w-4.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                  />
                </svg>
              </span>
              <div>
                <div className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-text">
                  Turbo Turismo
                </div>
                <div className="text-[11px] text-text-faint">
                  Document assistant
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 rounded-[3px] border border-black/15 px-3 py-1.5 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-text transition-colors hover:border-black/40 hover:bg-black/[0.03]"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              Upload
            </button>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto p-6 sm:p-8 thin-scroll"
          >
            <div className="space-y-4">
              {messages.length === 0 && !loading && (
                <div className="py-12 text-center">
                  <div className="font-mono text-xs uppercase tracking-[0.2em] text-text-faint">
                    Ask us anything
                  </div>
                  <p className="mt-1 text-sm text-text-dim">
                    Answers are grounded strictly in your uploaded documents.
                  </p>
                  <Link
                    href="/architecture"
                    className="mt-4 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-text-faint transition-colors hover:text-accent"
                  >
                    See how it works on the architecture page
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                      />
                    </svg>
                  </Link>
                </div>
              )}

              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}

              {loading && (
                <div className="flex gap-1 px-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-accent thinking-dot"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-accent thinking-dot"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-accent thinking-dot"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0 border-t border-black/10 bg-white p-4">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              disabled={loading}
            />
          </div>
        </main>
      </div>

      {/* Upload modal */}
      {showUpload && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowUpload(false)}
        >
          <div
            className="w-full max-w-md rounded-[6px] border border-black/10 bg-white p-7 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-text">
                  Upload documents
                </h2>
                <p className="mt-1 text-[13px] text-text-dim">
                  PDF or TXT — chunked, embedded, and indexed automatically.
                </p>
              </div>
              <button
                onClick={() => setShowUpload(false)}
                aria-label="Close upload dialog"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-faint transition-colors hover:bg-black/5 hover:text-text"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.8}
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="mt-5">
              <DocumentUpload
                onComplete={handleUploadComplete}
                disabled={loading}
              />
            </div>

            <div className="mt-4 flex items-start gap-2.5 rounded-[3px] bg-black/[0.03] px-3 py-2.5 text-[12px] leading-relaxed text-text-dim">
              <svg
                className="mt-0.5 h-4 w-4 shrink-0 text-text-faint"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.8}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                />
              </svg>
              Documents are stored locally and used only to answer your
              questions.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}