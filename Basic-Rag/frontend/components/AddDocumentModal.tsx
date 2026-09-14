"use client";

import { useState } from "react";
import DocumentUpload from "./DocumentUpload";
import { ingestUrl, ingestYouTube, isYouTubeUrl } from "@/lib/api";

interface Props {
  sessionId?: string;
  onClose: () => void;
  onUploaded: (meta: {
    filename: string;
    title?: string;
    url?: string;
    channel?: string;
    thumbnail?: string;
    chunks?: number;
  }) => void;
}

type Tab = "file" | "url" | "youtube";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "file", label: "Upload file", icon: "file" },
  { id: "url", label: "From URL", icon: "globe" },
  { id: "youtube", label: "YouTube", icon: "youtube" },
];

const HEADER_COPY: Record<Tab, { eyebrow: string; title: string; desc: string }> = {
  file: {
    eyebrow: "Add content",
    title: "Upload documents",
    desc: "Drop PDF, Word, Markdown, PPT or text files — we chunk and index them so you can chat with them.",
  },
  url: {
    eyebrow: "Add content",
    title: "Add from a URL",
    desc: "Paste a website URL — auto chunked & indexed. YouTube links work here too.",
  },
  youtube: {
    eyebrow: "Add content",
    title: "Chat with a YouTube video",
    desc: "Paste a video link — we'll grab its transcript and let you chat with it.",
  },
};

function TabIcon({ kind }: { kind: string }) {
  if (kind === "file") {
    return (
      <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
      </svg>
    );
  }
  if (kind === "globe") {
    return (
      <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
      </svg>
    );
  }
  return (
    <svg className="mr-1.5 h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 002.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
    </svg>
  );
}

function UrlInput({
  placeholder,
  value,
  onChange,
  onEnter,
  disabled,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onEnter: () => void;
  disabled: boolean;
}) {
  return (
    <div className="flex h-12 items-center overflow-hidden rounded-xl border border-gray-200 bg-white px-4 transition-shadow focus-within:border-indigo-500 focus-within:shadow-md focus-within:shadow-indigo-500/10">
      <svg className="mr-3 h-4 w-4 shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && !disabled && onEnter()}
        placeholder={placeholder}
        disabled={disabled}
        className="h-full min-w-0 flex-1 bg-transparent text-[14px] text-gray-900 outline-none placeholder:text-gray-400 disabled:opacity-50"
      />
    </div>
  );
}

export default function AddDocumentModal({
  sessionId,
  onClose,
  onUploaded,
}: Props) {
  const [tab, setTab] = useState<Tab>("file");
  const [url, setUrl] = useState("");
  const [ytUrl, setYtUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const copy = HEADER_COPY[tab];

  async function handleUrl() {
    const trimmed = url.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("Enter a valid URL starting with http:// or https://");
      return;
    }
    setError(null);
    setBusy(true);
    try {
      if (isYouTubeUrl(trimmed)) {
        const result = await ingestYouTube(trimmed, sessionId);
        onUploaded({
          filename: result.filename,
          title: result.title,
          url: result.url,
          channel: result.channel,
          thumbnail: result.thumbnail,
          chunks: result.chunks,
        });
      } else {
        const result = await ingestUrl(trimmed, sessionId);
        onUploaded({ filename: result.filename, title: result.title });
      }
      setUrl("");
      onClose();
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message.replace(/^Backend returned \d+.*?\.\s*/, "")
          : "Ingestion failed";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  async function handleYouTube() {
    const trimmed = ytUrl.trim();
    if (!/^https?:\/\//i.test(trimmed)) {
      setError("Enter a valid YouTube link (http/https).");
      return;
    }
    if (!isYouTubeUrl(trimmed)) {
      setError(
        "That does not look like a YouTube video link. Try youtube.com/watch?v=... or youtu.be/..."
      );
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const result = await ingestYouTube(trimmed, sessionId);
      onUploaded({
        filename: result.filename,
        title: result.title,
        url: result.url,
        channel: result.channel,
        thumbnail: result.thumbnail,
        chunks: result.chunks,
      });
      setYtUrl("");
      onClose();
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message.replace(/^Backend returned \d+.*?\.\s*/, "")
          : "Could not fetch the video";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-5 sm:p-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gradient header */}
        <div
          className="relative bg-gradient-to-br from-indigo-500 to-violet-600 text-white"
          style={{ padding: "28px 32px 24px" }}
        >
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute flex items-center justify-center rounded-full bg-white/15 transition-colors hover:bg-white/25"
            style={{ top: 20, right: 20, width: 30, height: 30 }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="flex items-center gap-2.5" style={{ marginBottom: 6 }}>
            <span className="flex items-center justify-center bg-white/20" style={{ width: 32, height: 32, borderRadius: 10 }}>
              {tab === "youtube" ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 002.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              )}
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/75">
              {copy.eyebrow}
            </span>
          </div>

          <h2 className="font-bold leading-tight" style={{ marginLeft: 42, marginTop: -2, fontSize: 22 }}>
            {copy.title}
          </h2>
          <p className="leading-relaxed text-white/90" style={{ marginLeft: 42, marginTop: 8, fontSize: 14 }}>
            {copy.desc}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                setError(null);
              }}
              className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 text-[13px] font-semibold transition-colors ${
                tab === t.id
                  ? "border-indigo-600 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
              style={{ padding: "14px 8px" }}
            >
              <TabIcon kind={t.icon} />
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding: "24px 32px" }}>
          {tab === "file" ? (
            <DocumentUpload
              sessionId={sessionId}
              onComplete={(r) => {
                if (r.success) {
                  onUploaded({ filename: r.filename });
                  onClose();
                }
              }}
            />
          ) : tab === "url" ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <UrlInput
                placeholder="https://example.com/article"
                value={url}
                onChange={setUrl}
                onEnter={handleUrl}
                disabled={busy}
              />
              <button
                onClick={handleUrl}
                disabled={busy || !url.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-[14px] font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ padding: "14px 0" }}
              >
                {busy ? (
                  <>
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Fetching &amp; indexing...
                  </>
                ) : (
                  "Chat with this URL"
                )}
              </button>
              <p className="text-[12px] text-gray-400">
                YouTube video links are detected automatically.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <UrlInput
                placeholder="https://www.youtube.com/watch?v=..."
                value={ytUrl}
                onChange={setYtUrl}
                onEnter={handleYouTube}
                disabled={busy}
              />
              <button
                onClick={handleYouTube}
                disabled={busy || !ytUrl.trim()}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 text-[14px] font-bold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40"
                style={{ padding: "14px 0" }}
              >
                {busy ? (
                  <>
                    <span className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Fetching transcript...
                  </>
                ) : (
                  "Chat with this video"
                )}
              </button>
              <p className="text-[12px] text-gray-400">
                Supports youtube.com/watch?v=..., youtu.be/..., shorts and live links.
              </p>
            </div>
          )}
          {error && (
            <p
              className="rounded-xl border border-red-200 bg-red-50 text-[13px] text-red-600"
              style={{ marginTop: 16, padding: "12px 16px" }}
            >
              {error}
            </p>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-gray-100" style={{ padding: "14px 32px" }}>
          <p className="text-center text-[12px] leading-relaxed text-gray-400">
            Files, pages and transcripts are stored locally and used only to answer your questions.
          </p>
        </div>
      </div>
    </div>
  );
}