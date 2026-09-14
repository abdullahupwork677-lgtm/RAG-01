"use client";

import { useState } from "react";
import type { Source } from "@/lib/types";

export default function SourceList({
  sources,
  onNavigate,
}: {
  sources: Source[];
  onNavigate?: (source: Source) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  const hasPages = sources.some((s) => s.page != null);

  return (
    <div className="mt-3">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-border bg-white px-2.5 py-1.5 text-[12px] font-semibold text-text-dim transition-colors hover:bg-panel-hover"
      >
        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-accent-soft text-accent">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </span>
        <span className="font-mono text-[11px]">{sources.length}</span>
        {sources.length === 1 ? "source" : "sources"}
        <svg
          className={`h-3 w-3 text-text-faint transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="fade-up mt-2 space-y-2 rounded-xl border border-border bg-white p-3 shadow-sm">
          <ol className="space-y-3">
            {sources.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-accent-soft font-mono text-[11px] font-bold text-accent">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[13px] font-semibold text-text">
                      {s.title}
                    </span>
                    {s.locator && (
                      <span className="rounded-md bg-panel-hover px-2 py-0.5 font-mono text-[11px] text-text-faint">
                        {s.locator}
                      </span>
                    )}
                    {s.page != null && onNavigate && (
                      <button
                        onClick={() => onNavigate(s)}
                        className="rounded-lg bg-accent px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-accent-hover"
                      >
                        Open p. {s.page}
                      </button>
                    )}
                    {typeof s.score === "number" && (
                      <span className="rounded-md bg-accent-soft px-2 py-0.5 font-mono text-[11px] font-bold text-accent">
                        {(s.score * 100).toFixed(0)}%
                      </span>
                    )}
                  </div>
                  {s.snippet && (
                    <p className="mt-1 text-[13px] leading-snug text-text-dim line-clamp-3">
                      {s.snippet}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
          {hasPages && onNavigate && (
            <p className="border-t border-border pt-2 text-[12px] text-text-faint">
              Click a page to view it in the PDF panel.
            </p>
          )}
        </div>
      )}
    </div>
  );
}