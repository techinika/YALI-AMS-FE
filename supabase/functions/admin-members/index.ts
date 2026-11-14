// Admin-only member administration for the AMS.
//
// The browser never holds the service role key: this function verifies the
// caller's Supabase JWT, checks that the caller is an AMS admin, and then uses
// the service role client to provision auth users and profiles.
//
// Actions:
//   invite  { firstName, email }
//   create  { member fields, avatar? }
//   update  { userId, fields }
//   set-role { userId, role }
//   delete  { userId }
//   reinvite { userId }
//   import  { rows: [member fields], sendEmails? }
//   send-test-email { email? }
//
// Invitations are sent directly through Resend (`RESEND_API_KEY`,
// `EMAIL_FROM`), not Supabase Auth's invite email. Set `APP_URL` so generated
// links point at the deployed app.
//
// `avatar` is { name, type, data } where data is base64 without a data URL
// prefix.

import { createClient } from "npm:@supabase/supabase-js@2";
import { invitationEmail, testEmail } from "../_shared/email-templates.ts";
import { resendConfigured, sendEmail, sendEmailBatch } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function randomPassword() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function clean(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

function toInt(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function resolveAppUrl(req: Request): string {
  const configured = Deno.env.get("APP_URL")?.trim() || Deno.env.get("SITE_URL")?.trim();
  const origin = configured || req.headers.get("origin") || "http://localhost:3000";
  return origin.replace(/\/+$/, "");
}

function decodeAvatar(avatar: unknown): { bytes: Uint8Array; type: string; ext: string } | null {
  if (!avatar || typeof avatar !== "object") return null;
  const { data, type, name } = avatar as { data?: string; type?: string; name?: string };
  if (!data || typeof data !== "string") return null;
  const contentType = type && type.startsWith("image/") ? type : "image/jpeg";
  const ext = contentType === "image/png" ? "png" : contentType === "image/webp" ? "webp" : contentType === "image/gif" ? "gif" : "jpg";
  const base64 = data.includes(",") ? data.slice(data.indexOf(",") + 1) : data;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  if (bytes.byteLength === 0 || bytes.byteLength > 3 * 1024 * 1024) return null;
  return { bytes, type: contentType, ext: name?.includes(".") ? name.split(".").pop()! : ext };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) return json({ error: "Server is not configured" }, 500);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) return json({ error: "Unauthorized" }, 401);

    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData.user) return json({ error: "Unauthorized" }, 401);

    const { data: caller, error: callerError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (callerError) return json({ error: "Could not verify your role" }, 500);
    const isAdmin = caller?.role === "admin";
    const me = userData.user.id;
    const appUrl = resolveAppUrl(req);

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (!isAdmin && action !== "update") {
      return json({ error: "Admin access required" }, 403);
    }
    if (action === "update" && !isAdmin && clean(body.userId) !== me) {
      return json({ error: "You can only update your own profile" }, 403);
    }

    const findProfileByEmail = async (email: string) => {
      const { data } = await admin.from("profiles").select("id, status").ilike("email", email).maybeSingle();
      return data as { id: string; status: string } | null;
    };

    const notificationFor = async (firstName: string) => {
      const { data: template } = await admin
        .from("notification_templates")
        .select("message")
        .eq("usage", "signup")
        .maybeSingle();
      const message = (template?.message as string | undefined)?.replace(/\[name\]/g, firstName) ??
        `Hi ${firstName}, your YALI AMS account has been created!`;
      return { title: "ACCOUNT: Your new account has been created!", message, opened: false };
    };

    const createMember = async (
      input: Record<string, unknown>,
      options?: { inviteLink?: boolean; sendEmail?: boolean }
    ) => {
      const email = clean(input.email)?.toLowerCase();
      const firstName = clean(input.firstName);
      const lastName = clean(input.lastName) ?? "";

      if (!email || !isEmail(email)) throw new Error("A valid email is required.");
      if (!firstName) throw new Error("First name is required.");

      const existing = await findProfileByEmail(email);
      if (existing && existing.status !== "deleted") {
        throw new Error("A member with this email already exists.");
      }

      const lookupId = async (table: string, value: unknown): Promise<string | number | null> => {
        const term = clean(value);
        if (!term) return null;
        const { data } = await admin.from(table).select("id").ilike("name", term).limit(1).maybeSingle();
        return (data?.id as string | number | undefined) ?? null;
      };

      const genderId = toInt(input.genderId) ?? (await lookupId("genders", input.genderName));
      const cohortId = toInt(input.cohortId) ?? (await lookupId("cohorts", input.cohortName));
      const trackId = clean(input.trackId) ?? (await lookupId("tracks", input.trackName));
      const countryId = clean(input.countryId) ?? (await lookupId("countries", input.countryName));
      const districtId = clean(input.districtId) ?? (await lookupId("districts", input.districtName));
      const sectorId = clean(input.sectorId) ?? (await lookupId("sectors", input.sectorName));
      const stateId = clean(input.stateId) ?? (await lookupId("states", input.stateName));

      const avatar = decodeAvatar(input.avatar);
      const avatarUrl = clean(input.avatarUrl);
      let userId = existing?.id ?? null;

      if (existing?.status === "deleted") {
        // Re-invite: restore the existing profile.
        const { error: updateError } = await admin
          .from("profiles")
          .update({
            first_name: firstName,
            last_name: lastName,
            middle_name: clean(input.middleName),
            status: "invited",
          } as never)
          .eq("id", existing.id);
        if (updateError) throw new Error(updateError.message);
      } else {
        // Confirm the email so Supabase does not send its own confirmation or
        // invite message; the branded Resend invitation is sent below.
        const { data: created, error: createError } = await admin.auth.admin.createUser({
          email,
          password: randomPassword(),
          email_confirm: true,
          user_metadata: { first_name: firstName, last_name: lastName, role: "user" },
        });
        if (createError || !created.user) {
          throw new Error(createError?.message ?? "Could not create the member account.");
        }
        userId = created.user.id;

        // `handle_new_user` already created the profile row from the auth
        // metadata, so this fills in the rest instead of inserting a duplicate.
        const { error: profileError } = await admin.from("profiles").update({
          first_name: firstName,
          middle_name: clean(input.middleName),
          last_name: lastName,
          email,
          phone: clean(input.phoneNumber),
          whatsapp: clean(input.whatsAppNumber),
          bio: clean(input.bio),
          linkedin: clean(input.linkedin),
          instagram: clean(input.instagram),
          facebook: clean(input.facebook),
          twitter: clean(input.twitter),
          gender_id: genderId as number | null,
          country_id: countryId as string | null,
          state_id: stateId as string | null,
          district_id: districtId as string | null,
          sector_id: sectorId as string | null,
          nearest_landmark: clean(input.nearlestLandmark ?? input.nearestLandmark),
          cohort_id: cohortId as number | null,
          track_id: trackId as string | null,
          role: "user",
          status: "invited",
        } as never).eq("id", userId);
        if (profileError) {
          await admin.auth.admin.deleteUser(userId);
          throw new Error(profileError.message);
        }
      }

      if (avatarUrl && /^https?:\/\//i.test(avatarUrl) && userId) {
        await admin.from("profiles").update({ avatar_path: avatarUrl } as never).eq("id", userId);
      }

      if (avatar && userId) {
        const path = `${userId}/avatar-${Date.now()}.${avatar.ext}`;
        const { error: uploadError } = await admin.storage
          .from("avatars")
          .upload(path, avatar.bytes, { contentType: avatar.type, upsert: true });
        if (uploadError) throw new Error(uploadError.message);
        const { data: publicUrl } = admin.storage.from("avatars").getPublicUrl(path);
        await admin.from("profiles").update({ avatar_path: publicUrl.publicUrl } as never).eq("id", userId);
      }

      let inviteLink: string | null = null;
      let linkError: string | null = null;
      if (options?.inviteLink !== false) {
        const { data: invite, error } = await admin.auth.admin.generateLink({
          type: "recovery",
          email,
        });
        if (error) linkError = error.message;
        const properties = (invite as {
          properties?: { action_link?: string; hashed_token?: string };
        } | null)?.properties;
        // The default action_link is an implicit-flow URL, which the PKCE
        // browser client rejects. Send the one-time token hash to our own page
        // and verify it there instead.
        inviteLink = properties?.hashed_token
          ? `${appUrl}/reset-password/recover?token_hash=${encodeURIComponent(properties.hashed_token)}&type=recovery`
          : properties?.action_link ?? null;
      }

      await admin.from("notifications").insert({
        receiver_id: userId,
        ...(await notificationFor(firstName)),
      } as never);

      let emailSent = false;
      let emailError: string | null = linkError;
      if (options?.sendEmail !== false && inviteLink) {
        const result = await sendEmail({
          to: email,
          ...invitationEmail({ firstName, actionUrl: inviteLink }),
        });
        emailSent = result.ok;
        emailError = result.ok ? null : result.error ?? "Could not send the invitation email.";
      }

      return { userId, email, firstName, inviteLink, emailSent, emailError };
    };

    if (action === "invite" || action === "create") {
      const result = await createMember(body);
      return json({
        user: { id: result.userId, email: result.email },
        inviteLink: result.inviteLink,
        emailSent: result.emailSent,
        emailError: result.emailError,
      });
    }

    if (action === "update") {
      const userId = clean(body.userId);
      if (!userId) return json({ error: "userId is required" }, 400);
      const fields = (body.fields ?? {}) as Record<string, unknown>;
      const patch: Record<string, unknown> = {};
      const textColumns = [
        "first_name", "middle_name", "last_name", "phone", "whatsapp", "bio",
        "linkedin", "instagram", "facebook", "twitter", "country_id", "state_id",
        "district_id", "sector_id", "track_id",
      ];
      for (const column of textColumns) {
        if (column in fields) patch[column] = clean((fields as Record<string, unknown>)[column]);
      }
      for (const column of ["gender_id", "cohort_id"]) {
        if (column in fields) patch[column] = toInt(fields[column]);
      }
      if ("nearest_landmark" in fields) {
        patch.nearest_landmark = clean(fields.nearest_landmark);
      }
      if ("nearlestLandmark" in fields) {
        patch.nearest_landmark = clean(fields.nearlestLandmark);
      }
      if (isAdmin && "status" in fields && ["invited", "active", "inactive", "deleted"].includes(String(fields.status))) {
        patch.status = fields.status;
      }
      const avatar = decodeAvatar(body.avatar);
      if (avatar) {
        const path = `${userId}/avatar-${Date.now()}.${avatar.ext}`;
        const { error: uploadError } = await admin.storage
          .from("avatars")
          .upload(path, avatar.bytes, { contentType: avatar.type, upsert: true });
        if (uploadError) return json({ error: uploadError.message }, 400);
        const { data: publicUrl } = admin.storage.from("avatars").getPublicUrl(path);
        patch.avatar_path = publicUrl.publicUrl;
      }
      const { data, error } = await admin.from("profiles").update(patch as never).eq("id", userId).select("id").maybeSingle();
      if (error) return json({ error: error.message }, 400);
      if (!data) return json({ error: "Member not found" }, 404);

      const { data: updatedProfile } = await admin
        .from("profiles")
        .select("first_name")
        .eq("id", userId)
        .maybeSingle();
      const { data: updatedTemplate } = await admin
        .from("notification_templates")
        .select("message, link")
        .eq("usage", "updated")
        .maybeSingle();
      if (updatedTemplate?.message) {
        await admin.from("notifications").insert({
          receiver_id: userId,
          title: "PROFILE: Your profile was updated",
          message: String(updatedTemplate.message).replace(/\[name\]/g, updatedProfile?.first_name ?? "there"),
          link: updatedTemplate.link ?? null,
        } as never);
      }

      return json({ user: { id: userId } });
    }

    if (action === "set-role") {
      const userId = clean(body.userId);
      const role = clean(body.role);
      if (!userId || !role || !["admin", "user"].includes(role)) {
        return json({ error: "userId and role (admin or user) are required." }, 400);
      }
      if (userId === me) {
        return json({ error: "You cannot change your own role." }, 400);
      }
      const { data, error } = await admin
        .from("profiles")
        .update({ role } as never)
        .eq("id", userId)
        .select("id, role")
        .maybeSingle();
      if (error) return json({ error: error.message }, 400);
      if (!data) return json({ error: "Member not found" }, 404);

      await admin.from("activity_logs").insert({
        model: "profile",
        action: `role:${role}`,
        record_id: userId,
        user_id: me,
      } as never);

      return json({ user: data });
    }

    if (action === "delete") {
      const userId = clean(body.userId);
      if (!userId) return json({ error: "userId is required" }, 400);
      const { error } = await admin.from("profiles").update({ status: "deleted" } as never).eq("id", userId);
      if (error) return json({ error: error.message }, 400);
      return json({ user: { id: userId } });
    }

    if (action === "reinvite") {
      const userId = clean(body.userId);
      if (!userId) return json({ error: "userId is required" }, 400);
      const { data: target, error: targetError } = await admin
        .from("profiles")
        .select("id, email, status, first_name")
        .eq("id", userId)
        .maybeSingle();
      if (targetError) return json({ error: targetError.message }, 400);
      if (!target?.email) return json({ error: "Member not found" }, 404);
      if (target.status !== "invited") {
        return json({ error: "Only invited members can be re-invited." }, 400);
      }
      const { data: invite, error: linkError } = await admin.auth.admin.generateLink({
        type: "recovery",
        email: target.email,
      });
      if (linkError) return json({ error: linkError.message }, 400);
      const properties = (invite as {
        properties?: { action_link?: string; hashed_token?: string };
      } | null)?.properties;
      const inviteLink = properties?.hashed_token
        ? `${appUrl}/reset-password/recover?token_hash=${encodeURIComponent(properties.hashed_token)}&type=recovery`
        : properties?.action_link ?? null;

      let emailSent = false;
      let emailError: string | null = null;
      if (inviteLink) {
        const result = await sendEmail({
          to: target.email,
          ...invitationEmail({ firstName: target.first_name ?? "there", actionUrl: inviteLink }),
        });
        emailSent = result.ok;
        emailError = result.ok ? null : result.error ?? "Could not send the invitation email.";
      }

      return json({ inviteLink, emailSent, emailError });
    }

    if (action === "import") {
      const rows = Array.isArray(body.rows) ? body.rows : [];
      if (rows.length === 0) return json({ error: "No rows to import" }, 400);
      if (rows.length > 500) return json({ error: "Import is limited to 500 members per batch." }, 400);
      const sendEmails = body?.sendEmails !== false;
      const created: { row: number; userId: string; email: string }[] = [];
      const failed: { row: number; error: string }[] = [];
      const pendingEmails: { to: string; subject: string; html: string; text: string }[] = [];
      const emailFailures: { email: string; error: string }[] = [];

      for (let index = 0; index < rows.length; index++) {
        try {
          const row = rows[index] as Record<string, unknown>;
          const result = await createMember(row, { inviteLink: sendEmails, sendEmail: false });
          created.push({ row: index + 1, userId: result.userId as string, email: result.email });
          if (sendEmails) {
            if (result.inviteLink) {
              pendingEmails.push({
                to: result.email,
                ...invitationEmail({ firstName: result.firstName, actionUrl: result.inviteLink }),
              });
            } else if (result.emailError) {
              emailFailures.push({ email: result.email, error: result.emailError });
            }
          }
        } catch (error) {
          failed.push({ row: index + 1, error: error instanceof Error ? error.message : String(error) });
        }
      }

      let emailsSent = 0;
      if (sendEmails && pendingEmails.length > 0) {
        if (resendConfigured()) {
          const batch = await sendEmailBatch(pendingEmails);
          emailsSent = batch.sent;
          emailFailures.push(...batch.failed.map((failure) => ({ email: failure.to, error: failure.error })));
        } else {
          for (const message of pendingEmails) {
            emailFailures.push({ email: message.to, error: "RESEND_API_KEY is not configured." });
          }
        }
      }

      return json({
        created: created.length,
        failed,
        results: created,
        emailsRequested: sendEmails,
        emailsSent,
        emailFailures,
        emailConfigured: resendConfigured(),
      });
    }

    if (action === "send-test-email") {
      const to = clean(body.email) ?? userData.user.email;
      if (!to) return json({ error: "email is required" }, 400);
      if (!resendConfigured()) {
        return json({ error: "RESEND_API_KEY is not configured for this project." }, 500);
      }
      const result = await sendEmail({ to, ...testEmail() });
      if (!result.ok) return json({ error: result.error ?? "Could not send the test email." }, 502);
      return json({ sent: true, id: result.id ?? null });
    }

    return json({ error: `Unknown action: ${String(action)}` }, 400);
  } catch (error) {
    console.error("admin-members error", error);
    return json({ error: error instanceof Error ? error.message : "Unexpected error" }, 500);
  }
});