"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, KeyRound, LoaderCircle } from "lucide-react";
import { z } from "zod";
import { PageHeader } from "../parts/PageHeader";
import { getSupabaseBrowserClient } from "@/lib/data/client";

const schema = z
  .object({
    currentPassword: z.string().min(1, "Your current password is required."),
    newPassword: z.string().min(8, "New password must be at least 8 characters."),
    confirmPassword: z.string().min(1, "Please confirm your new password."),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  })
  .refine((d) => d.newPassword !== d.currentPassword, {
    path: ["newPassword"],
    message: "New password must be different from your current password.",
  });

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

export default function ChangePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState({ current: false, next: false, confirm: false });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  };

  const handleSubmit = async () => {
    setGeneralError("");
    setMessage("");
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      setErrors({
        currentPassword: fe.currentPassword?.[0],
        newPassword: fe.newPassword?.[0],
        confirmPassword: fe.confirmPassword?.[0],
      });
      return;
    }
    setLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.email) {
        setGeneralError("Your session is unavailable. Please sign in again.");
        return;
      }
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: parsed.data.currentPassword,
      });
      if (signInError) {
        setErrors({ currentPassword: "Current password is incorrect." });
        return;
      }
      const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.newPassword });
      if (updateError) {
        setGeneralError("Could not update password. Please try again.");
        return;
      }
      setMessage("Password updated successfully. Signing you out for security...");
      await supabase.auth.signOut();
      router.push("/?reset=success");
      router.refresh();
    } catch {
      setGeneralError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const Field = ({
    id, label, autoComplete, showKey, value, error,
  }: { id: keyof typeof form; label: string; autoComplete: string; showKey: "current" | "next" | "confirm"; value: string; error?: string }) => (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">{label}</label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={show[showKey] ? "text" : "password"}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          disabled={loading}
          className="block w-full rounded-xl border border-input bg-background px-4 py-3 pr-12 text-foreground shadow-sm placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => setShow((s) => ({ ...s, [showKey]: !s[showKey] }))}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-foreground"
          aria-label={show[showKey] ? `Hide ${label}` : `Show ${label}`}
          aria-pressed={show[showKey]}
        >
          {show[showKey] ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
        </button>
      </div>
      {error && <p id={`${id}-error`} className="mt-1.5 text-sm text-red-700" role="alert">{error}</p>}
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8">
      <PageHeader
        title="Change Password"
        description="Update your account password to keep your profile secure."
        actionTitle={loading ? "Saving..." : "Save password"}
        Icon={KeyRound}
        onAction={handleSubmit}
        loading={loading}
        disabled={loading}
      />
      <div className="mx-auto mt-4 w-full max-w-lg rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <div aria-live="polite" aria-atomic="true" className="space-y-3 mb-5">
          {message && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800" role="status">{message}</div>}
          {generalError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{generalError}</div>}
        </div>
        <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} noValidate>
          <Field id="currentPassword" label="Current password" autoComplete="current-password" showKey="current" value={form.currentPassword} error={errors.currentPassword} />
          <Field id="newPassword" label="New password (min 8 characters)" autoComplete="new-password" showKey="next" value={form.newPassword} error={errors.newPassword} />
          <Field id="confirmPassword" label="Confirm new password" autoComplete="new-password" showKey="confirm" value={form.confirmPassword} error={errors.confirmPassword} />
          <button
            type="submit"
            disabled={loading}
            aria-busy={loading}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-base font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? <><LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />Updating...</> : "Update password"}
          </button>
        </form>
      </div>
    </div>
  );
}
