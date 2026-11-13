"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useRef, useState } from "react";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import { z } from "zod";
import { signInWithPassword } from "@/lib/data/auth";
import { getMessages } from "@/lib/i18n";

const t = getMessages("en");

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Email is required.")
    .email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

type FieldErrors = { email?: string; password?: string };

function safeNextPath(next: string | null): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;
  return next;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);

  const notice = useMemo(() => {
    const error = searchParams.get("error");
    const reset = searchParams.get("reset");
    if (error === "session_expired") return t.auth.sessionExpired;
    if (reset === "success") return t.auth.passwordResetSuccess;
    return "";
  }, [searchParams]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGeneralError("");
    const parsed = loginSchema.safeParse(formData);
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      const nextErrors: FieldErrors = {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      };
      setErrors(nextErrors);
      if (nextErrors.email) emailRef.current?.focus();
      else if (nextErrors.password) passwordRef.current?.focus();
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await signInWithPassword(
        parsed.data.email,
        parsed.data.password
      );
      if (error || !data.user) {
        setGeneralError(t.auth.invalidCredentials);
        passwordRef.current?.focus();
        return;
      }
      const role =
        (data.user?.user_metadata?.role as string | undefined)?.toLowerCase() ||
        (data.user?.app_metadata?.role as string | undefined)?.toLowerCase();
      const nextPath = safeNextPath(searchParams.get("next"));
      const fallback = role === "admin" ? "/dashboard" : "/dashboard/profile";
      router.push(nextPath || fallback);
      router.refresh();
    } catch {
      setGeneralError(t.auth.unexpectedError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid min-h-screen bg-background lg:grid-cols-2">
      <main id="main-content" tabIndex={-1} className="flex min-h-screen items-center justify-center px-4 py-8 outline-none sm:px-6 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-8 flex flex-col items-center text-center">
            <Image
              src="/yali.png"
              alt="YALI Rwanda Chapter logo"
              width={160}
              height={160}
              priority
              className="h-auto w-28 sm:w-36"
            />
            <p className="mt-4 text-sm font-semibold uppercase tracking-wide text-brand-700">
              YALI Rwanda Chapter
            </p>
            <h1 className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">
              {t.common.appName}
            </h1>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">{t.auth.signInTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{t.auth.signInSubtitle}</p>
            </div>

            <p className="mb-5 rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-900">
              {t.auth.invitedHelp}
            </p>

            <div aria-live="polite" aria-atomic="true" className="space-y-3">
              {notice && (
                <div className="rounded-lg border border-brand-200 bg-accent px-4 py-3 text-sm text-accent-foreground" role="status">
                  {notice}
                </div>
              )}
              {generalError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                  {generalError}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5" noValidate>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-foreground">
                  {t.auth.email}
                </label>
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  enterKeyHint="next"
                  autoCapitalize="none"
                  spellCheck={false}
                  value={formData.email}
                  onChange={handleInputChange}
                  aria-invalid={Boolean(errors.email)}
                  aria-describedby={errors.email ? "email-error" : undefined}
                  disabled={isLoading}
                  className="block w-full rounded-xl border border-input bg-background px-4 py-3 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
                  placeholder={t.auth.emailPlaceholder}
                />
                {errors.email && (
                  <p id="email-error" className="mt-1.5 text-sm text-red-700" role="alert">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between gap-3">
                  <label htmlFor="password" className="block text-sm font-medium text-foreground">
                    {t.auth.password}
                  </label>
                  <Link
                    href="/forgot-password"
                    className="text-sm font-medium text-primary hover:text-brand-800 hover:underline"
                  >
                    {t.auth.forgotPassword}
                  </Link>
                </div>
                <div className="relative">
                  <input
                    ref={passwordRef}
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    enterKeyHint="done"
                    value={formData.password}
                    onChange={handleInputChange}
                    onKeyUp={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                    onKeyDown={(e) => setCapsLockOn(e.getModifierState("CapsLock"))}
                    onBlur={() => setCapsLockOn(false)}
                    aria-invalid={Boolean(errors.password)}
                    aria-describedby={[errors.password ? "password-error" : null, capsLockOn ? "caps-lock-hint" : null].filter(Boolean).join(" ") || undefined}
                    disabled={isLoading}
                    className="block w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder={t.auth.passwordPlaceholder}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
                    aria-label={showPassword ? t.auth.hidePassword : t.auth.showPassword}
                    aria-pressed={showPassword}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
                  </button>
                </div>
                {capsLockOn && (
                  <p id="caps-lock-hint" className="mt-1.5 text-sm text-amber-700">
                    {t.auth.capsLockOn}
                  </p>
                )}
                {errors.password && (
                  <p id="password-error" className="mt-1.5 text-sm text-red-700" role="alert">
                    {errors.password}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                aria-busy={isLoading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isLoading ? (
                  <>
                    <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
                    {t.auth.signingIn}
                  </>
                ) : (
                  t.auth.signIn
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      <aside className="hidden min-h-screen items-center justify-center bg-brand-950 px-12 py-16 text-white lg:flex" aria-hidden="true">
        <div className="max-w-md">
          <p className="text-sm font-semibold uppercase tracking-wider text-brand-200">Connect. Grow. Lead.</p>
          <h2 className="mt-4 text-3xl font-bold leading-tight">A trusted space for the YALI Rwanda alumni community.</h2>
          <p className="mt-4 text-base leading-relaxed text-brand-100">
            Stay connected with fellows, discover opportunities, manage your profile, and collaborate across cohorts and sectors.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-brand-100">
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-300" />Member directory and profiles</li>
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-300" />Community chat and collaboration</li>
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-300" />Opportunities, events, and updates</li>
          </ul>
        </div>
      </aside>
    </div>
  );
}
