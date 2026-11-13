export const en = {
  common: {
    appName: "YALI Alumni Management System",
    skipToContent: "Skip to main content",
    loading: "Loading...",
    cancel: "Cancel",
    save: "Save",
    backToLogin: "Back to sign in",
  },
  auth: {
    signInTitle: "Sign in",
    signInSubtitle: "Access your alumni community account.",
    invitedHelp:
      "If you were invited, check your email for instructions to set or reset your password before signing in.",
    email: "Email address",
    emailPlaceholder: "you@example.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    forgotPassword: "Forgot password?",
    signIn: "Sign in",
    signingIn: "Signing in...",
    showPassword: "Show password",
    hidePassword: "Hide password",
    capsLockOn: "Caps Lock is on.",
    invalidCredentials: "Invalid email or password.",
    unexpectedError: "An unexpected error occurred. Please try again.",
    sessionExpired: "Your session expired. Please sign in again.",
    passwordResetSuccess: "Your password was updated. You can sign in now.",
  },
} as const;

export type Messages = typeof en;
