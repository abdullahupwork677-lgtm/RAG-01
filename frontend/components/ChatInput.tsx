"use client";

import { useRef, KeyboardEvent } from "react";

export default function ChatInput({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  disabled: boolean;
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
      el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
    }
  };

  return (
    <div className="flex items-end gap-2 bg-paper-raised border border-rule rounded-2xl px-3 py-2 shadow-sm focus-within:border-archive transition-colors">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        rows={1}
        placeholder="Ask something about your documents…"
        className="flex-1 resize-none bg-transparent outline-none py-1.5 text-[15px] leading-relaxed placeholder:text-ink-soft disabled:opacity-50"
      />
      <button
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        aria-label="Send message"
        className="shrink-0 rounded-full bg-archive text-paper w-9 h-9 flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-archive/90 transition-colors"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path
            d="M2 8h11M8 2.5L13.5 8 8 13.5"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  );
}
