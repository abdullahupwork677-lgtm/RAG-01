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
    <div className="hero-bg flex min-h-screen w-full items-stretch p-0 md:h-screen md:overflow-hidden md:p-12">
      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col gap-8 md:flex-row">
        <div className="flex w-full flex-col gap-6 md:w-[58%]">
          <header className="flex w-full shrink-0 items-center justify-center bg-[#f5f5f5] px-4 py-1.5">
            <div className="flex w-full items-center justify-between">
              <div className="flex-1"></div>
              <div className="flex flex-col items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/tt-navbar.png"
                  alt="Turbo Turismo"
                  className="h-8 max-w-full"
                />
              </div>
              <div className="flex flex-1 justify-end">
                {messages.length > 0 && (
                  <button
                    onClick={handleReset}
                    className="text-xs font-mono uppercase tracking-wide text-text-faint hover:text-accent transition-colors"
                  >
                    New conversation
                  </button>
                )}
              </div>
            </div>
          </header>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto border border-black/10 bg-[#f5f5f5] p-6 sm:p-10 thin-scroll"
          >
            <div className="text-sm font-bold uppercase tracking-[0.2em] text-black mb-6 border-b border-black/10 pb-2">
              Turbo Turismo AI Assistant
            </div>

            <div className="space-y-4">
              {messages.length === 0 && !loading && (
                <div className="text-center py-10">
                  <div className="font-mono text-xs uppercase tracking-[0.2em] text-text-faint">
                    Ask us anything
                  </div>
                  <p className="text-sm text-text-dim mt-1">
                    Answers are grounded in Turbo Turismo&apos;s documents.
                  </p>
                </div>
              )}

              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}

              {loading && (
                <div className="flex gap-1 px-1">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-accent thinking-dot"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-accent thinking-dot"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-accent thinking-dot"
                    style={{ animationDelay: "300ms" }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <ChatInput
              value={input}
              onChange={setInput}
              onSubmit={handleSubmit}
              disabled={loading}
            />
          </div>
        </div>

        <div className="hidden w-full flex-col items-center justify-center overflow-hidden md:flex md:w-[42%]">
          <div className="flex h-full w-full flex-col items-center justify-center gap-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/tt-car-logos.png"
              alt="Car Logos"
              className="w-full max-w-[420px] h-auto max-h-full object-contain"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
