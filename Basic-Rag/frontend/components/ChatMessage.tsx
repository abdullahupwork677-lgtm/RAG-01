import { ChatMessage as ChatMessageType } from "@/lib/types";
import SourceList from "./SourceList";

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="inline-block max-w-[75ch] bg-accent text-white rounded-[3px] px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-[75ch] bg-black/5 p-3 rounded-sm border-l-2 border-black">
        <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-accent mb-1">
          Turbo Turismo
        </div>
        <p
          className={`whitespace-pre-wrap leading-relaxed text-[14px] ${
            message.isError ? "text-red-600" : "text-text"
          }`}
        >
          {message.content}
        </p>
        <SourceList sources={message.sources ?? []} />
      </div>
    </div>
  );
}
