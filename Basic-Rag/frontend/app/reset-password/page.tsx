"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthShell from "@/components/AuthShell";
import { resetPassword, ChatApiError } from "@/lib/api";

const inputClass =
  "w-full rounded-xl border-[1.5px] border-border bg-white px-5 py-3.5 text-[15px] text-text outline-none transition-colors placeholder:text-text-faint focus:border-accent focus:ring-4 focus:ring-accent/10";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("token");
  });
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(
    token ? null : "This reset link is missing its token. Please request a new one."
  );
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !token) return;
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(
        err instanceof ChatApiError
          ? err.message.replace(/^Backend returned \d+ [^.]*\.\s*/, "")
          : "Could not reset your password. Please try again."
      );
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Pick a strong password for your account."
      footer={
        <Link href="/login" className="font-semibold text-accent hover:underline">
          Back to log in
        </Link>
      }
    >
      {done ? (
        <div className="flex flex-col gap-4">
          <p className="rounded-xl border border-green-200 bg-green-50 px-3.5 py-3 text-[13px] font-medium text-green-700">
            Your password has been updated. You can now log in.
          </p>
          <button
            onClick={() => router.push("/login")}
            className="inline-flex w-full items-center justify-center rounded-xl bg-accent px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-accent-hover"
          >
            Go to log in
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-text-dim">New password</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={inputClass}
            />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-[13px] font-semibold text-text-dim">Confirm password</span>
            <input
              type="password"
              required
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
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
            disabled={loading || !token}
            className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-3 text-[14px] font-bold text-white transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            )}
            {loading ? "Updating..." : "Update password"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}