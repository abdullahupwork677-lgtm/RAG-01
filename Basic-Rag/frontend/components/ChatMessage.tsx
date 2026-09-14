"use client";

import type { ChatMessage as ChatMessageType, Source } from "@/lib/types";
import SourceList from "./SourceList";

export default function ChatMessage({
  message,
  onNavigate,
}: {
  message: ChatMessageType;
  onNavigate?: (source: Source) => void;
}) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="fade-up flex justify-end">
        <div className="flex max-w-[85%] flex-row-reverse items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-indigo-500 text-white shadow-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex items-center justify-end gap-2">
              <span className="text-[12px] font-bold text-text-dim">You</span>
            </div>
            <p className="break-words text-[14px] leading-relaxed text-text">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-up flex justify-start">
      <div className="flex max-w-[88%] gap-3 sm:max-w-[70ch]">
        {/* Avatar */}
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent to-indigo-500 text-white shadow-sm">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </div>

        <div className="min-w-0 w-full">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-[13px] font-bold text-text">ChatPDF</span>
            {message.isError && (
              <span className="rounded-md bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-500">
                Error
              </span>
            )}
          </div>

          <p
            className={`whitespace-pre-wrap break-words leading-relaxed text-[14px] ${
              message.isError ? "text-red-600" : "text-text"
            }`}
          >
            {message.content}
          </p>

          <SourceList sources={message.sources ?? []} onNavigate={onNavigate} />
        </div>
      </div>
    </div>
  );
}