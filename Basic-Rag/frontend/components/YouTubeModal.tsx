"use client";

import { useState } from "react";
import { ingestYouTube, isYouTubeUrl } from "@/lib/api";

interface Props {
  sessionId?: string;
  onClose: () => void;
  onIngested: (meta: {
    filename: string;
    title: string;
    url: string;
    channel?: string;
    thumbnail?: string;
    chunks?: number;
  }) => void;
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

export default function YouTubeModal({
  sessionId,
  onClose,
  onIngested,
}: Props) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleIngest() {
    const trimmed = url.trim();
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
      onIngested({
        filename: result.filename,
        title: result.title,
        url: result.url,
        channel: result.channel,
        thumbnail: result.thumbnail,
        chunks: result.chunks,
      });
      setUrl("");
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
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 00.5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 002.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 002.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z" />
              </svg>
            </span>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/75">
              YouTube chat
            </span>
          </div>

          <h2 className="font-bold leading-tight" style={{ marginLeft: 42, marginTop: -2, fontSize: 22 }}>
            Chat with a YouTube video
          </h2>
          <p className="leading-relaxed text-white/90" style={{ marginLeft: 42, marginTop: 8, fontSize: 14 }}>
            Paste a video link — we&apos;ll grab its transcript and let you chat with it.
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: "24px 32px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <UrlInput
              placeholder="https://www.youtube.com/watch?v=..."
              value={url}
              onChange={setUrl}
              onEnter={handleIngest}
              disabled={busy}
            />
            <button
              onClick={handleIngest}
              disabled={busy || !url.trim()}
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