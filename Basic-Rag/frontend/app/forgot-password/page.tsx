"use client";

import { useState } from "react";
import Link from "next/link";
import AuthShell from "@/components/AuthShell";
import { forgotPassword, ChatApiError } from "@/lib/api";

const inputClass =
  "w-full rounded-xl border-[1.5px] border-border bg-white px-5 py-3.5 text-[15px] text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent focus:ring-4 focus:ring-accent/10";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [resetLink, setResetLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await forgotPassword(email.trim());
      setResetLink(res.reset_link ?? null);
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ChatApiError
          ? err.message.replace(/^Backend returned \d+ [^.]*\.\s*/, "")
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Back to log in
        </Link>
      }
    >
      {sent ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-[13px] font-medium text-green-700">
            If that email exists, a reset link has been sent.
          </p>
          {resetLink && (
            <p className="text-[12.5px] leading-relaxed text-text-2">
              Email delivery isn&apos;t configured on this server, so use this
              link directly:
              <br />
              <Link
                href={resetLink}
                className="mt-1 inline-block break-all font-semibold text-accent hover:underline"
              >
                {resetLink}
              </Link>
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-text-dim">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className={inputClass}
            />
          </label>

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
