"use client";

import Link from "next/link";
import type { Session } from "@/lib/types";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function SessionSidebar({
  sessions,
  activeId,
  onSelect,
  onNew,
  onOpenYouTube,
}: {
  sessions: Session[];
  activeId?: string;
  onSelect: (id: string) => void;
  onNew: () => void;
  onOpenYouTube?: () => void;
}) {
  return (
    <aside className="sidebar h-full">
      {/* Logo */}
      <div className="logo-row">
        <Link href="/" className="logo-mark" aria-label="ChatPDF home">
          C
        </Link>
        <Link href="/" className="logo-word">
          ChatPDF
        </Link>
      </div>

      {/* New chat */}
      <button onClick={onNew} className="new-chat-btn">
        <span className="plus-icon">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </span>
        New chat
      </button>

      {/* Chats */}
      <div className="nav-section flex min-h-0 flex-1 flex-col">
        <div className="nav-label">Chats</div>
        {sessions.length === 0 ? (
          <div className="empty-hint">Start your first chat</div>
        ) : (
          <div className="thin-scroll -mx-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto px-1">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelect(s.id)}
                className={`nav-item w-full text-left ${s.id === activeId ? "active" : ""}`}
              >
                <span className="nav-icon">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-semibold">
                    {s.title}
                  </span>
                  <span className="block font-mono text-[10px] opacity-70">
                    {timeAgo(s.updated_at)}
                    {s.message_count != null && s.message_count > 0
                      ? ` · ${s.message_count} msg`
                      : ""}
                  </span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tools */}
      <div className="nav-section">
        <div className="nav-label">Tools</div>
        <button
          className={`nav-item w-full text-left ${onOpenYouTube ? "" : "cursor-default"}`}
          onClick={onOpenYouTube}
        >
          <span className="nav-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </span>
          YouTube Chat
        </button>
        <Link href="/" className="nav-item">
          <span className="nav-icon">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </span>
          Home
        </Link>
      </div>

      {/* Footer */}
      <div className="sidebar-footer">
        <div className="signup-card">
          <p className="inline-flex items-start gap-2">
            <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            <span>
              Tip: paste a YouTube or website link straight into the chat to
              chat with it.
            </span>
          </p>
        </div>
      </div>
    </aside>
  );
}