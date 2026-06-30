"use client";

import { useEffect, useRef, useState } from "react";
import ChatMessage from "@/components/ChatMessage";
import ChatInput from "@/components/ChatInput";
import { sendChatMessage, ChatApiError } from "@/lib/api";
import { ChatMessage as ChatMessageType } from "@/lib/types";

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, loading]);

  const handleSubmit = async () => {
    const query = input.trim();
    if (!query || loading) return;

    const userMessage: ChatMessageType = { id: uid(), role: "user", content: query };
    const history = messages;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { answer, sources } = await sendChatMessage(query, history);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: answer, sources },
      ]);
    } catch (err) {
      const message =
        err instanceof ChatApiError
          ? err.message
          : "Something went wrong reaching the backend.";
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: message, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => setMessages([]);

  return (
    <div className="flex flex-col h-screen">
      <header className="border-b border-rule bg-paper-raised">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Archive
            </h1>
            <p className="text-xs text-ink-soft font-mono mt-0.5">
              grounded answers from your ingested documents
            </p>
          </div>
          {messages.length > 0 && (
            <button
              onClick={handleReset}
              className="text-xs font-mono uppercase tracking-wide text-ink-soft hover:text-archive transition-colors"
            >
              New conversation
            </button>
          )}
        </div>
      </header>

      <main ref={scrollRef} className="flex-1 overflow-y-auto paper-grain">
        <div className="max-w-3xl mx-auto px-5 py-6 flex flex-col gap-6">
          {messages.length === 0 && (
            <div className="text-center py-20">
              <div className="font-display text-3xl text-ink-soft mb-2">
                What would you like to know?
              </div>
              <p className="text-sm text-ink-soft">
                Questions are answered using only what&apos;s in your indexed
                documents.
              </p>
            </div>
          )}

          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} />
          ))}

          {loading && (
            <div className="flex gap-1 px-1">
              <span className="w-1.5 h-1.5 rounded-full bg-archive thinking-dot" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-archive thinking-dot" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-archive thinking-dot" style={{ animationDelay: "300ms" }} />
            </div>
          )}
        </div>
      </main>

      <footer className="border-t border-rule bg-paper-raised">
        <div className="max-w-3xl mx-auto px-5 py-4">
          <ChatInput
            value={input}
            onChange={setInput}
            onSubmit={handleSubmit}
            disabled={loading}
          />
          <p className="text-[11px] text-ink-soft text-center mt-2 font-mono">
            Enter to send · Shift+Enter for a new line
          </p>
        </div>
      </footer>
    </div>
  );
}
