"use client";

import { useState } from "react";
import { Source } from "@/lib/types";

export default function SourceList({ sources }: { sources: Source[] }) {
  const [open, setOpen] = useState(false);

  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-3 border-t border-rule pt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-mono uppercase tracking-wide text-ink-soft hover:text-archive transition-colors"
      >
        <span
          className={`inline-block transition-transform ${
            open ? "rotate-90" : ""
          }`}
        >
          ›
        </span>
        {sources.length} {sources.length === 1 ? "source" : "sources"}
      </button>

      {open && (
        <ol className="mt-2 space-y-2">
          {sources.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-sm">
              <span className="font-mono text-xs text-gold mt-0.5 shrink-0">
                [{i + 1}]
              </span>
              <div className="min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <span className="font-medium text-ink truncate">
                    {s.title}
                  </span>
                  {s.locator && (
                    <span className="text-xs text-ink-soft font-mono">
                      {s.locator}
                    </span>
                  )}
                  {typeof s.score === "number" && (
                    <span className="text-xs text-archive font-mono">
                      {(s.score * 100).toFixed(0)}% match
                    </span>
                  )}
                </div>
                {s.snippet && (
                  <p className="text-ink-soft mt-0.5 leading-snug line-clamp-3">
                    {s.snippet}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
