"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";

interface ToolLink {
  label: string;
  desc: string;
  onClick: () => void;
  soon?: boolean;
  red?: boolean;
}

export default function TopNav({
  onOpenYouTube,
  onAddDocuments,
}: {
  onOpenYouTube: () => void;
  onAddDocuments: () => void;
}) {
  const [toolsOpen, setToolsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setToolsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const tools: ToolLink[] = [
    { label: "AI Writer", desc: "Draft long-form content", soon: true, onClick: () => {} },
    { label: "AI Detector", desc: "Check text originality", soon: true, onClick: () => {} },
    { label: "YouTube Chat", desc: "Chat with any video", red: true, onClick: onOpenYouTube },
    { label: "Research", desc: "Explore a topic", soon: true, onClick: () => {} },
  ];

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-4 sm:px-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <Link href="/" className="logo-mark" aria-label="ChatPDF home">
          C
        </Link>
        <div className="leading-tight">
          <Link href="/" className="logo-word">
            ChatPDF
          </Link>
          <div className="text-[11px] text-text-faint">
            Chat with your documents
          </div>
        </div>
      </div>

      {/* Center nav */}
      <nav className="hidden items-center gap-1 md:flex">
        <Link
          href="/"
          className="rounded-lg px-4 py-2 text-[13px] font-semibold text-text-dim transition-colors hover:bg-panel-hover hover:text-text"
        >
          Home
        </Link>
        <button
          onClick={() => setToolsOpen((v) => !v)}
          className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-semibold text-text-dim transition-colors hover:bg-panel-hover hover:text-text"
        >
          Tools
          <svg
            className={`h-3.5 w-3.5 transition-transform ${toolsOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </button>
      </nav>

      <div ref={menuRef} className="relative flex items-center gap-2">
        <button
          onClick={onAddDocuments}
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-3.5 py-2 text-[13px] font-semibold text-text transition-colors hover:border-accent hover:bg-panel-hover"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          Upload
        </button>

        {toolsOpen && (
          <div className="fade-up absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-2xl border border-border bg-white py-1.5 shadow-xl shadow-black/10">
            <div className="px-4 pb-2 pt-3 font-mono text-[10px] font-semibold uppercase tracking-widest text-text-faint">
              Tools
            </div>
            {tools.map((t) => (
              <div
                key={t.label}
                onClick={t.soon ? undefined : t.onClick}
                className={`flex items-center justify-between gap-3 px-4 py-2.5 ${
                  t.soon
                    ? "cursor-not-allowed opacity-55"
                    : "cursor-pointer hover:bg-panel-hover"
                }`}
              >
                <div>
                  <div className="text-[13px] font-semibold text-text">
                    {t.label}
                  </div>
                  <div className="text-[12px] text-text-faint">{t.desc}</div>
                </div>
                {t.soon ? (
                  <span className="rounded-md bg-panel-hover px-2 py-1 font-mono text-[10px] font-semibold uppercase text-text-faint">
                    Soon
                  </span>
                ) : (
                  <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-accent text-white">
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2.5}
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}