"use client";

import Link from "next/link";
import { ReactNode } from "react";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-panel px-4 py-10">
      <Link href="/" className="mb-6 flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent text-base font-extrabold text-white shadow-sm shadow-accent/25">
          C
        </span>
        <span className="text-lg font-extrabold tracking-tight text-text">
          ChatPDF
        </span>
      </Link>

      <div className="card w-full max-w-[520px] p-12 sm:p-16">
        <h1 className="text-[28px] font-extrabold tracking-tight text-text">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2.5 text-[15px] leading-relaxed text-text-2">
            {subtitle}
          </p>
        )}
        <div className="mt-8">{children}</div>
      </div>

      {footer && (
        <div className="mt-5 text-center text-[13px] text-text-2">{footer}</div>
      )}
    </div>
  );
}
