// Transactional email templates. Keep the markup simple and inline-styled so
// it renders consistently across mail clients (including Outlook).

const APP_NAME = "YALI AMS";
const APP_DESCRIPTION = "YALI Rwanda Chapter Alumni Management System";
const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      default:
        return "&#39;";
    }
  });
}

function shell({
  title,
  preheader,
  body,
}: {
  title: string;
  preheader: string;
  body: string;
}): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${escapeHtml(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f6f5;font-family:${FONT_STACK};color:#1f2937;-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">
      ${escapeHtml(preheader)}
    </div>
    <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="background:#f4f6f5;padding:28px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="580" border="0" cellpadding="0" cellspacing="0" style="width:100%;max-width:580px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#0f3d2e;padding:24px 32px;">
                <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#a7f3d0;">${APP_NAME}</p>
                <h1 style="margin:8px 0 0;font-size:24px;line-height:1.3;color:#ffffff;font-weight:700;">${escapeHtml(title)}</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;font-family:${FONT_STACK};">
                ${body}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-family:${FONT_STACK};">
                <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#374151;">${APP_DESCRIPTION}</p>
                <p style="margin:0;font-size:12px;line-height:1.6;color:#6b7280;">
                  This is an automated message. Please contact your chapter administrator if you need help.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#6b7280;">
            Sent by ${APP_NAME}.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function invitationEmail({ firstName, actionUrl }: { firstName: string; actionUrl: string }) {
  const name = firstName.trim() || "there";
  const url = escapeHtml(actionUrl);
  const safeName = escapeHtml(name);

  return {
    subject: "You're invited to YALI AMS — set your password",
    html: shell({
      title: "Set your YALI AMS password",
      preheader: "Your YALI AMS account is ready. Choose a password to sign in.",
      body: `
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;">Hi ${safeName},</p>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.65;">
          An account has been created for you in the <strong>${APP_DESCRIPTION}</strong>.
          Choose a password to sign in and complete your profile.
        </p>

        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
          <tr>
            <td align="center" bgcolor="#0f3d2e" style="border-radius:10px;background:#0f3d2e;">
              <a href="${url}" style="display:inline-block;padding:14px 28px;font-family:${FONT_STACK};font-size:15px;font-weight:700;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:10px;">
                Set your password
              </a>
            </td>
          </tr>
        </table>

        <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#6b7280;">
          Or use this link instead
        </p>
        <p style="margin:0 0 24px;padding:12px 14px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;font-size:12px;line-height:1.6;word-break:break-all;color:#0f3d2e;">
          <a href="${url}" style="color:#0f3d2e;text-decoration:underline;word-break:break-all;">${url}</a>
        </p>

        <table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 20px;background:#f0fdf4;border-left:4px solid #0f3d2e;border-radius:6px;">
          <tr>
            <td style="padding:12px 14px;font-size:13px;line-height:1.6;color:#14532d;">
              This link can only be used once. If it has expired, ask a YALI AMS
              administrator to resend your invitation.
            </td>
          </tr>
        </table>

        <p style="margin:0;font-size:13px;line-height:1.6;color:#4b5563;">
          If you were not expecting this invitation, you can ignore this email.
          Your account will stay inactive until you set a password.
        </p>`,
    }),
    text: `Hi ${name},

An account has been created for you in the ${APP_DESCRIPTION}.

Set your password:
${actionUrl}

This link can only be used once. If it has expired, ask a YALI AMS administrator to resend your invitation.

If you were not expecting this invitation, you can ignore this email. Your account will stay inactive until you set a password.`,
  };
}

export function testEmail() {
  const sentAt = new Date().toISOString();
  return {
    subject: "YALI AMS email test",
    html: shell({
      title: "Email delivery works",
      preheader: "This is a test email from the YALI AMS Edge Function.",
      body: `
        <p style="margin:0 0 16px;font-size:15px;line-height:1.65;">
          This is a test email from the <strong>${APP_NAME}</strong> Edge Function.
          If you received it, Resend is configured correctly.
        </p>
        <p style="margin:0;font-size:13px;line-height:1.6;color:#4b5563;">
          Sent at ${escapeHtml(sentAt)}.
        </p>`,
    }),
    text: `This is a test email from the ${APP_NAME} Edge Function. If you received it, Resend is configured correctly. Sent at ${sentAt}.`,
  };
}
