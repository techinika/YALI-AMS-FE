"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { z } from "zod";
import { getSupabaseBrowserClient } from "@/lib/data/client";
import { updatePassword } from "@/lib/data/auth";

const schema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

type Errors = { password?: string; confirmPassword?: string };

export default function ResetPassword() {
  const passwordRef = useRef<HTMLInputElement>(null);
  const confirmRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError("");
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      const next: Errors = { password: fe.password?.[0], confirmPassword: fe.confirmPassword?.[0] };
      setErrors(next);
      if (next.password) passwordRef.current?.focus();
      else if (next.confirmPassword) confirmRef.current?.focus();
      return;
    }
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setGeneralError("This password reset link is invalid or has expired. Please request a new one.");
        return;
      }
      const { error } = await updatePassword(parsed.data.password);
      if (error) {
        setGeneralError("Could not update your password. The link may have expired. Please request a new one.");
        return;
      }
      await supabase.auth.signOut();
      setSuccess(true);
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center bg-background px-4 py-8 outline-none sm:px-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image src="/yali.png" alt="YALI Rwanda Chapter logo" width={120} height={120} className="h-auto w-24" priority />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Set a new password</h1>
          <p className="mt-2 text-sm text-muted-foreground">Choose a strong password with at least 8 characters.</p>
        </div>

        <div aria-live="polite" aria-atomic="true">
          {generalError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
              {generalError}
            </div>
          )}
        </div>

        {success ? (
          <div className="space-y-4">
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">
              Your password has been updated successfully. Please sign in with your new password.
            </div>
            <Link
              href="/?reset=success"
              className="inline-flex w-full items-center justify-center rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Continue to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-foreground">New password</label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  enterKeyHint="next"
                  value={form.password}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? "password-error" : undefined}
                  disabled={isLoading}
                  className="block w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="At least 8 characters"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground" aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>
                  {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.password && <p id="password-error" className="mt-1.5 text-sm text-red-700" role="alert">{errors.password}</p>}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-foreground">Confirm new password</label>
              <div className="relative">
                <input
                  ref={confirmRef}
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  autoComplete="new-password"
                  enterKeyHint="done"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  aria-invalid={Boolean(errors.confirmPassword)}
                  aria-describedby={errors.confirmPassword ? "confirm-error" : undefined}
                  disabled={isLoading}
                  className="block w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder="Repeat new password"
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground" aria-label={showConfirm ? "Hide password confirmation" : "Show password confirmation"} aria-pressed={showConfirm}>
                  {showConfirm ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              {errors.confirmPassword && <p id="confirm-error" className="mt-1.5 text-sm text-red-700" role="alert">{errors.confirmPassword}</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              aria-busy={isLoading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? <><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />Updating password...</> : "Update password"}
            </button>

            <div className="text-center">
              <Link href="/" className="text-sm font-medium text-primary hover:text-brand-800 hover:underline">Back to sign in</Link>
            </div>
          </form>
        )}
      </div>
    </main>
  );
}
