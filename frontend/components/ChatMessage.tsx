import { ChatMessage as ChatMessageType } from "@/lib/types";
import SourceList from "./SourceList";

export default function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75ch] w-full ${isUser ? "flex justify-end" : ""}`}>
        <div
          className={
            isUser
              ? "inline-block bg-archive text-paper rounded-2xl rounded-br-sm px-4 py-2.5"
              : "w-full"
          }
        >
          {!isUser && (
            <div className="font-mono text-[11px] uppercase tracking-wider text-archive mb-1">
              Archive
            </div>
          )}
          <p
            className={`whitespace-pre-wrap leading-relaxed ${
              message.isError ? "text-red-700" : ""
            } ${isUser ? "" : "text-ink"}`}
          >
            {message.content}
          </p>
          {!isUser && <SourceList sources={message.sources ?? []} />}
        </div>
      </div>
    </div>
  );
}
