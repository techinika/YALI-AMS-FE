import { getSupabaseBrowserClient } from "./client";

export type MemberAvatar = { name: string; type: string; data: string };

export type NewMemberInput = {
  firstName: string;
  middleName?: string;
  lastName?: string;
  email: string;
  bio?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  genderId?: string | number | null;
  genderName?: string | null;
  phoneNumber?: string;
  whatsAppNumber?: string;
  countryId?: string;
  countryName?: string | null;
  stateId?: string;
  stateName?: string | null;
  districtId?: string;
  districtName?: string | null;
  sectorId?: string;
  sectorName?: string | null;
  nearlestLandmark?: string;
  cohortId?: string | number | null;
  cohortName?: string | null;
  trackId?: string;
  trackName?: string | null;
  avatar?: MemberAvatar;
  avatarUrl?: string | null;
};

type FunctionResult<T> = T & { error?: string };

async function invoke<T>(body: Record<string, unknown>): Promise<FunctionResult<T>> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.functions.invoke("admin-members", { body });

  if (error) {
    let message = error.message;
    const context = (error as { context?: { json?: () => Promise<unknown> } }).context;
    if (context?.json) {
      try {
        const payload = (await context.json()) as { error?: string };
        if (payload?.error) message = payload.error;
      } catch {
        // keep the original message
      }
    }
    throw new Error(message);
  }

  const result = data as FunctionResult<T> | null;
  if (!result) throw new Error("The server returned an empty response.");
  if (result.error) throw new Error(result.error);
  return result;
}

export async function inviteMember(input: { firstName: string; email: string }) {
  return invoke<{ user: { id: string; email: string }; inviteLink: string | null }>({
    action: "invite",
    ...input,
  });
}

export async function createMember(input: NewMemberInput) {
  return invoke<{ user: { id: string; email: string }; inviteLink: string | null }>({
    action: "create",
    ...input,
  });
}

export type MemberUpdateFields = {
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  phone?: string;
  whatsapp?: string;
  bio?: string;
  linkedin?: string;
  instagram?: string;
  twitter?: string;
  facebook?: string;
  gender_id?: number | null;
  cohort_id?: number | null;
  track_id?: string | null;
  country_id?: string | null;
  state_id?: string | null;
  district_id?: string | null;
  sector_id?: string | null;
  nearest_landmark?: string | null;
  status?: "invited" | "active" | "inactive" | "deleted";
};

export async function updateMember(userId: string, fields: MemberUpdateFields, avatar?: MemberAvatar) {
  return invoke<{ user: { id: string } }>({ action: "update", userId, fields, avatar });
}

export async function reinviteMember(userId: string) {
  return invoke<{ inviteLink: string | null }>({ action: "reinivite", userId });
}

export async function deleteMember(userId: string) {
  return invoke<{ user: { id: string } }>({ action: "delete", userId });
}

export async function importMembers(rows: NewMemberInput[]) {
  return invoke<{ created: number; failed: { row: number; error: string }[] }>({
    action: "import",
    rows,
  });
}

export async function fileToAvatar(file: File): Promise<MemberAvatar> {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Could not read the selected image."));
    reader.readAsDataURL(file);
  });
  return { name: file.name, type: file.type || "image/jpeg", data };
}