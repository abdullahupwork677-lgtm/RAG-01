import type { Metadata } from "next";
import Link from "next/link";
import ArchitectureDiagram from "@/components/ArchitectureDiagram";

export const metadata: Metadata = {
  title: "Architecture - ChatPDF",
  description:
    "Grounded RAG pipeline behind the ChatPDF document assistant.",
};

export default function ArchitecturePage() {
  return (
    <div className="arch-page w-full">
      <div className="mx-auto w-full max-w-[1440px] px-5 py-6 sm:px-8">
        <Link
          href="/"
          className="back-link inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-colors"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
            />
          </svg>
          Back to chat
        </Link>

        <ArchitectureDiagram />
      </div>
    </div>
  );
}