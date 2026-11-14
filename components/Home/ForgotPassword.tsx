"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { LoaderCircle, Mail } from "lucide-react";
import { z } from "zod";
import { requestPasswordReset } from "@/lib/data/auth";

const schema = z.object({
  email: z.string().trim().min(1, "Email is required.").email("Enter a valid email address."),
});

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setGeneralError("");
    setSuccess("");
    const parsed = schema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.flatten().fieldErrors.email?.[0] || "Enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      const { error: resetError } = await requestPasswordReset(parsed.data.email);
      if (resetError) {
        setGeneralError("We couldn't send a reset email right now. Please try again or contact support.");
        return;
      }
      setSuccess(
        "If an account exists for this email address, a password reset link has been sent. Check your inbox and spam folder."
      );
      setEmail("");
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-background px-4 py-8 outline-none sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/yali.png" alt="YALI Rwanda Chapter logo" width={120} height={120} className="h-auto w-24" priority />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Reset your password</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Enter your email address and we&apos;ll send you a link to reset your password.
          </p>
        </div>

        <div aria-live="polite" aria-atomic="true" className="space-y-3">
          {generalError && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {generalError}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
              {success}
            </div>
          )}
        </div>

        {!success && (
          <form onSubmit={handleSubmit} className="mt-5 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                Email address
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="send"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "email-error" : undefined}
                  disabled={loading}
                  className="block w-full rounded-xl border border-input bg-background py-3 pl-10 pr-4 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="you@example.com"
                />
              </div>
              {error && <p id="email-error" className="mt-1.5 text-sm text-red-700" role="alert">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              aria-busy={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? <><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />Sending...</> : "Send reset link"}
            </button>
          </form>
        )}

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm font-medium text-primary hover:text-brand-800 hover:underline">
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
