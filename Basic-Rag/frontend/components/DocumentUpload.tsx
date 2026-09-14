"use client";

import { useRef, useState, DragEvent, ChangeEvent } from "react";

interface UploadResult {
  filename: string;
  success: boolean;
  message: string;
  chunks: number;
  pages: number;
  files: number;
}

interface Props {
  onComplete: (result: UploadResult) => void;
  disabled?: boolean;
  sessionId?: string;
  multiple?: boolean;
}

const ACCEPT = ".pdf,.txt,.md,.docx,.pptx";

export default function DocumentUpload({
  onComplete,
  disabled,
  sessionId,
  multiple = true,
}: Props) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ?? "https://api.turboturismo.com";

  async function handleFiles(files: FileList | File[]) {
    const list = Array.from(files);
    if (disabled || uploading || list.length === 0) return;

    const supported = /\.(pdf|txt|md|docx|pptx)$/i;
    const bad = list.find((f) => !supported.test(f.name));
    if (bad) {
      setError(
        `"${bad.name}" is not supported. Allowed: PDF, TXT, MD, DOCX, PPTX.`
      );
      return;
    }

    setError(null);
    setFileName(list.length === 1 ? list[0].name : `${list.length} files`);
    setUploading(true);

    try {
      for (const file of list) {
        const form = new FormData();
        form.append("file", file);
        let url = `${API_URL}/rag/upload`;
        if (sessionId) url += `?session_id=${encodeURIComponent(sessionId)}`;

        const res = await fetch(url, { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.detail || `Upload failed (${res.status})`);
        }
        const data = await res.json();
        onComplete({
          filename: data.filename,
          success: true,
          message: data.message || "Upload successful",
          chunks: data.chunks ?? 0,
          pages: data.pages ?? 0,
          files: 1,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
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
    if (e.target.files?.length) handleFiles(e.target.files);
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
          group relative flex cursor-pointer flex-col items-center justify-center
          rounded-xl border-2 border-dashed border-gray-200 bg-gray-50
          px-8 py-12 text-center transition-colors duration-150
          ${
            dragging
              ? "border-indigo-500 bg-indigo-50"
              : "hover:border-indigo-500 hover:bg-indigo-50"
          }
          ${disabled || uploading ? "cursor-not-allowed opacity-50" : ""}
        `}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple={multiple}
          onChange={onChange}
          className="hidden"
          disabled={disabled || uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 thinking-dot" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 thinking-dot" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 thinking-dot" style={{ animationDelay: "300ms" }} />
            </div>
            <span className="text-[13px] font-semibold text-gray-900">
              {fileName ? `Ingesting "${fileName}"...` : "Ingesting..."}
            </span>
          </div>
        ) : (
          <>
            <span className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
              </svg>
            </span>
            <div className="space-y-2">
              <p className="text-[15px] font-bold text-gray-900">
                {fileName ?? "Drop files here or click to browse"}
              </p>
              <p className="text-[12.5px] text-gray-400">
                PDF · TXT · MD · DOCX · PPTX — chunked, embedded &amp; indexed
                automatically
              </p>
            </div>
            <button
              type="button"
              className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-[22px] py-[10px] text-[13.5px] font-bold text-white transition-colors hover:bg-indigo-700"
            >
              <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Browse files
            </button>
          </>
        )}
      </div>

      {error && (
        <p className="mt-3.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}