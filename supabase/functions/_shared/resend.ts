// Minimal Resend client for Edge Functions.
//
// Configure these secrets with:
//   npx supabase secrets set RESEND_API_KEY=re_... EMAIL_FROM="YALI AMS <no-reply@your-domain>" APP_URL="https://your-app"
//
// `EMAIL_FROM` must use a domain verified in Resend (or onboarding@resend.dev
// while testing, which only delivers to the Resend account owner).

const EMAIL_API = "https://api.resend.com/emails";
const EMAIL_BATCH_API = "https://api.resend.com/emails/batch";
const MAX_BATCH_SIZE = 100;

export type EmailMessage = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  tags?: { name: string; value: string }[];
};

export type SendResult = { ok: boolean; id?: string; error?: string };

export function resendConfigured(): boolean {
  return Boolean(Deno.env.get("RESEND_API_KEY")?.trim());
}

export function emailFrom(): string {
  return Deno.env.get("EMAIL_FROM")?.trim() || "YALI AMS <no-reply@yalirwandachapter.org>";
}

function toArray(to: string | string[]): string[] {
  return Array.isArray(to) ? to : [to];
}

function payload(message: EmailMessage) {
  return {
    from: message.from ?? emailFrom(),
    to: toArray(message.to),
    subject: message.subject,
    html: message.html,
    ...(message.text ? { text: message.text } : {}),
    ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    ...(message.tags ? { tags: message.tags } : {}),
  };
}

async function parseError(response: Response): Promise<string> {
  const body = (await response.json().catch(() => null)) as
    | { message?: string; error?: string; name?: string }
    | null;
  return body?.message ?? body?.error ?? `Resend responded with HTTP ${response.status}`;
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const key = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!key) return { ok: false, error: "RESEND_API_KEY is not configured." };

  const response = await fetch(EMAIL_API, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload(message)),
  });

  if (!response.ok) {
    return { ok: false, error: await parseError(response) };
  }

  const body = (await response.json().catch(() => null)) as { id?: string } | null;
  return { ok: true, id: body?.id };
}

export async function sendEmailBatch(
  messages: EmailMessage[]
): Promise<{ sent: number; failed: { to: string; error: string }[] }> {
  const key = Deno.env.get("RESEND_API_KEY")?.trim();
  if (!key) {
    return {
      sent: 0,
      failed: messages.map((message) => ({
        to: toArray(message.to).join(", "),
        error: "RESEND_API_KEY is not configured.",
      })),
    };
  }

  let sent = 0;
  const failed: { to: string; error: string }[] = [];

  for (let index = 0; index < messages.length; index += MAX_BATCH_SIZE) {
    const chunk = messages.slice(index, index + MAX_BATCH_SIZE);
    const response = await fetch(EMAIL_BATCH_API, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(chunk.map(payload)),
    });

    if (!response.ok) {
      const error = await parseError(response);
      for (const message of chunk) {
        failed.push({ to: toArray(message.to).join(", "), error });
      }
      continue;
    }

    sent += chunk.length;
  }

  return { sent, failed };
}
