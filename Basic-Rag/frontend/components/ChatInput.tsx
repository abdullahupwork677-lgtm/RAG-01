"use client";

import { useRef, KeyboardEvent } from "react";

const LANGUAGES = [
  { value: "", label: "Auto" },
  { value: "English", label: "English" },
  { value: "Urdu", label: "Urdu" },
  { value: "Hindi", label: "Hindi" },
  { value: "Spanish", label: "Spanish" },
  { value: "French", label: "French" },
  { value: "Arabic", label: "Arabic" },
  { value: "German", label: "German" },
  { value: "Chinese", label: "Chinese" },
];

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
  language,
  onLanguageChange,
  onSummarize,
  summarizing,
  hasSources,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
  language?: string;
  onLanguageChange?: (v: string) => void;
  onSummarize?: () => void;
  summarizing?: boolean;
  hasSources?: boolean;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !disabled) onSubmit();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl flex flex-col gap-2.5">
      <div className="input-pill">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder="Ask a question about your documents..."
          className="flex-1 resize-none appearance-none bg-transparent px-0 pb-2.5 pt-2.5 text-[14px] text-text outline-none placeholder:text-text-faint disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="rounded-full bg-accent text-white transition-all hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-40"
        >
          <span className="flex h-9 w-9 items-center justify-center">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
          </span>
        </button>
      </div>
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          {onLanguageChange && (
            <select
              value={language ?? ""}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-[12px] text-text-dim outline-none transition-colors hover:border-accent focus:border-accent"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label === "Auto" ? "🌐 Auto" : l.label}
                </option>
              ))}
            </select>
          )}
          {onSummarize && (
            <button
              onClick={onSummarize}
              disabled={disabled || summarizing || !hasSources}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-1.5 text-[12px] font-semibold text-text-dim transition-colors hover:border-accent hover:bg-panel-hover disabled:cursor-not-allowed disabled:opacity-40"
            >
              <svg
                className="h-3.5 w-3.5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
              </svg>
              {summarizing ? "Summarizing..." : "Summarize"}
            </button>
          )}
        </div>
        <p className="hidden text-[11px] text-text-faint sm:block">
          Enter to send · Shift+Enter for a new line
        </p>
      </div>
    </div>
  );
}