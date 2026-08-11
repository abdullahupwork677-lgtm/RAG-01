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
      el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end gap-2.5">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder="Ask a question about Turbo Turismo…"
          className="flex-1 resize-none appearance-none rounded-[3px] border border-border bg-panel-alt px-3.5 py-[11px] text-[14px] text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent focus:bg-panel-hover disabled:cursor-not-allowed disabled:opacity-50"
        />
        <button
          onClick={onSubmit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="shrink-0 rounded-[3px] bg-accent px-6 py-[11px] font-mono text-[12px] font-semibold tracking-[0.1em] text-white uppercase transition-colors hover:bg-accent-hover active:translate-y-px disabled:cursor-not-allowed disabled:bg-text-faint"
        >
          Send
        </button>
      </div>
      <p className="text-[11px] text-text-faint text-right font-mono">
        Enter to send · Shift+Enter for a new line
      </p>
    </div>
  );
}
