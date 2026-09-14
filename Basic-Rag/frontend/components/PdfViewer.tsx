"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";

if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
}

interface PdfViewerProps {
  url: string;
  targetPage?: number;
  navSignal?: number;
  headers?: Record<string, string>;
}

export default function PdfViewer({
  url,
  targetPage,
  navSignal = 0,
  headers,
}: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1.1);
  const docRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null);
  const taskRef = useRef<pdfjsLib.PDFDocumentLoadingTask | null>(null);

  const renderPage = useCallback(
    async (doc: pdfjsLib.PDFDocumentProxy, pageNum: number) => {
      const canvas = containerRef.current?.querySelector<HTMLCanvasElement>(
        `canvas[data-page="${pageNum}"]`
      );
      if (!canvas) return;
      const page = await doc.getPage(pageNum);
      const viewport = page.getViewport({ scale: zoom });
      const outputScale = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * outputScale);
      canvas.height = Math.floor(viewport.height * outputScale);
      canvas.style.width = `${Math.floor(viewport.width)}px`;
      canvas.style.height = `${Math.floor(viewport.height)}px`;
      const ctx = canvas.getContext("2d")!;
      ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0);
      await page.render({ canvas, viewport }).promise;
    },
    [zoom]
  );

  const renderAll = useCallback(
    async (doc: pdfjsLib.PDFDocumentProxy) => {
      for (let i = 1; i <= doc.numPages; i++) {
        await renderPage(doc, i);
      }
    },
    [renderPage]
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const task = pdfjsLib.getDocument({
          url,
          httpHeaders: headers,
          cMapUrl: "/cmaps/",
          cMapPacked: true,
        });
        taskRef.current = task;
        const doc = await task.promise;
        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
        requestAnimationFrame(() => renderAll(doc));
      } catch (e) {
        if (cancelled) return;
        const msg =
          e instanceof Error ? e.message : "Could not load the PDF.";
        setError(`Could not load PDF: ${msg}`);
        setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
      taskRef.current?.destroy?.();
      taskRef.current = null;
      docRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  useEffect(() => {
    if (loading || !docRef.current) return;
    const t = setTimeout(() => renderAll(docRef.current!), 150);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zoom]);

  useEffect(() => {
    if (!targetPage || navSignal === 0) return;
    const target = Math.min(Math.max(targetPage, 1), numPages || targetPage);
    document
      .getElementById(`pdf-page-${target}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [targetPage, navSignal, numPages]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || numPages === 0) return;
    const onScroll = () => {
      const pages = el.querySelectorAll("canvas[data-page]");
      let visible = 1;
      const mid = el.scrollTop + el.clientHeight / 2;
      pages.forEach((c) => {
        const top = (c as HTMLElement).offsetTop;
        if (top <= mid) {
          visible = Number(c.getAttribute("data-page"));
        }
      });
      setCurrentPage(visible);
    };
    el.addEventListener("scroll", onScroll);
    return () => el.removeEventListener("scroll", onScroll);
  }, [numPages]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center p-6 text-[14px] text-red-500">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center gap-3 text-text-faint">
        <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-accent" />
        <span className="text-[14px] font-semibold">Loading document...</span>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-panel-alt">
      {/* Toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-border bg-white px-4 py-2.5">
        <div className="flex items-center gap-2 rounded-xl border border-border bg-panel-hover px-2 py-1">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.15).toFixed(2)))}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white hover:shadow-sm"
            aria-label="Zoom out"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM13.5 10.5H6" />
            </svg>
          </button>
          <span className="min-w-[52px] text-center font-mono text-[12px] font-semibold text-text-dim">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.min(3, +(z + 0.15).toFixed(2)))}
            className="flex h-7 w-7 items-center justify-center rounded-lg transition-colors hover:bg-white hover:shadow-sm"
            aria-label="Zoom in"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6m3-3H7.5" />
            </svg>
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-white px-3 py-1.5">
          <svg className="h-3.5 w-3.5 text-text-faint" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <span className="font-mono text-[12px] font-bold text-accent">
            {currentPage}
          </span>
          <span className="text-[12px] text-text-faint">/</span>
          <span className="font-mono text-[12px] text-text-faint">{numPages}</span>
        </div>
      </div>
      {/* Pages */}
      <div className="thin-scroll flex-1 overflow-auto p-4">
        <div className="mx-auto flex w-fit flex-col items-center gap-5">
          {Array.from({ length: numPages }, (_, i) => i + 1).map((pg) => (
            <canvas
              key={pg}
              id={`pdf-page-${pg}`}
              data-page={pg}
              className="rounded-lg bg-white shadow-lg shadow-black/10"
              style={{ maxWidth: "100%" }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}