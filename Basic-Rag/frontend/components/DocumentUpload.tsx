"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";

interface UploadResult {
  filename: string;
  success: boolean;
  message: string;
  chunks: number;
  files: number;
}

interface Props {
  onComplete: (result: UploadResult) => void;
  disabled?: boolean;
}

export default function DocumentUpload({ onComplete, disabled }: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  async function handleFile(file: File) {
    if (disabled || uploading) return;
    setError(null);
    setFileName(file.name);

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (ext !== "pdf" && ext !== "txt") {
      setError("Only PDF and TXT files are supported.");
      setFileName(null);
      return;
    }

    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const res = await fetch(`${API_URL}/rag/upload`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Upload failed (${res.status})`);
      }

      const data: UploadResult = await res.json();
      onComplete(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function onDragLeave(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
  }

  function onClick() {
    if (!uploading) inputRef.current?.click();
  }

  function onChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="w-full">
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onClick={onClick}
        className={`
          relative flex flex-col items-center justify-center gap-3
          rounded-[6px] border-2 border-dashed px-8 py-10 text-center
          cursor-pointer transition-colors duration-150
          ${
            dragging
              ? "border-accent bg-black/[0.04] ring-2 ring-accent/20"
              : "border-black/20 hover:border-black/50 hover:bg-black/[0.02]"
          }
          ${disabled || uploading ? "cursor-not-allowed opacity-50" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.txt"
          onChange={onChange}
          className="hidden"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-accent thinking-dot" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent thinking-dot" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-accent thinking-dot" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="font-mono text-xs uppercase tracking-wide text-text-faint">
              {fileName ? `Ingesting "${fileName}"…` : "Ingesting…"}
            </span>
          </div>
        ) : (
          <>
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-white">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-text">
                {fileName ?? "Drop a file here or click to browse"}
              </p>
              <p className="text-xs text-text-faint">
                PDF or TXT · chunked, embedded &amp; indexed automatically
              </p>
            </div>
            <span className="mt-1 inline-flex items-center rounded-[3px] border border-black/15 bg-white px-4 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-text transition-colors hover:border-black/40">
              {fileName ? "Choose a different file" : "Browse files"}
            </span>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 font-mono text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}