import { getSupabaseBrowserClient } from "./client";

export type ConversationType = "community" | "private" | "group";
export type MembershipStatus =
  | "admin_approval_pending"
  | "member_joining_pending"
  | "approved"
  | "admin_rejected"
  | "member_rejected"
  | "member_left";

export type ConversationSummary = {
  id: string;
  type: ConversationType;
  name: string | null;
  description: string | null;
  interests: string[];
  created_at: string;
  member_count: number;
  my_role: "member" | "admin" | null;
  my_status: MembershipStatus | null;
  peer: { id: string; first_name: string | null; last_name: string | null; avatar_path: string | null } | null;
  last_message: { content: string; created_at: string; sender_id: string } | null;
};

export type ChatMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender: { id: string; first_name: string | null; last_name: string | null; avatar_path: string | null } | null;
};

const MESSAGE_SELECT = `
  id, conversation_id, sender_id, content, created_at,
  sender:profiles!messages_sender_id_fkey(id, first_name, last_name, avatar_path)
`;

export async function listMyConversations() {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("list_my_conversations");
  if (error) throw error;
  return (data ?? []) as ConversationSummary[];
}

export async function listConversationMessages(conversationId: string, limit = 200) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("messages")
    .select(MESSAGE_SELECT)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return ((data ?? []).reverse() as unknown) as ChatMessage[];
}

export async function sendMessage(conversationId: string, content: string) {
  const supabase = getSupabaseBrowserClient();
  const { data: auth } = await supabase.auth.getUser();
  const senderId = auth.user?.id;
  if (!senderId) throw new Error("You must be signed in to send a message.");
  const body = content.trim();
  if (!body) throw new Error("Message cannot be empty.");

  const { data, error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, content: body })
    .select(MESSAGE_SELECT)
    .single();
  if (error) throw error;
  return data as unknown as ChatMessage;
}

export async function getOrCreateDirectConversation(otherUserId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_or_create_direct_conversation", {
    p_other_user: otherUserId,
  });
  if (error) throw error;
  return data as string;
}

export async function createGroupConversation(input: {
  name: string;
  description?: string | null;
  interests?: string[];
  memberIds?: string[];
}) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("create_group_conversation", {
    p_name: input.name,
    p_description: input.description ?? null,
    p_interests: input.interests ?? [],
    p_member_ids: input.memberIds ?? [],
  });
  if (error) throw error;
  return data as string;
}

export async function requestToJoinGroup(conversationId: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.rpc("request_to_join_group", { p_conversation: conversationId });
  if (error) throw error;
}

export async function respondToGroupInvitation(conversationId: string, accept: boolean) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.rpc("respond_to_group_invitation", {
    p_conversation: conversationId,
    p_accept: accept,
  });
  if (error) throw error;
}

export async function reviewGroupMember(conversationId: string, userId: string, approve: boolean) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.rpc("review_group_member", {
    p_conversation: conversationId,
    p_user: userId,
    p_approve: approve,
  });
  if (error) throw error;
}

export async function inviteGroupMember(conversationId: string, userId: string) {
  const supabase = getSupabaseBrowserClient();
  const { error } = await supabase.rpc("invite_group_member", {
    p_conversation: conversationId,
    p_user: userId,
  });
  if (error) throw error;
}

export type GroupMember = {
  user_id: string;
  role: "member" | "admin";
  status: MembershipStatus;
  profile: { id: string; first_name: string | null; last_name: string | null; avatar_path: string | null } | null;
};

export async function listGroupMembers(conversationId: string) {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("conversation_members")
    .select(
      "user_id, role, status, profile:profiles!conversation_members_user_id_fkey(id, first_name, last_name, avatar_path)"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as GroupMember[];
}

export async function listProfilesByIds(ids: string[]) {
  if (ids.length === 0) return new Map<string, { id: string; first_name: string | null; last_name: string | null; avatar_path: string | null }>();
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_path")
    .in("id", ids);
  if (error) throw error;
  return new Map((data ?? []).map((p: any) => [p.id as string, p]));
}

/**
 * Subscribes to new messages in a conversation. Returns an unsubscribe function.
 */
export function subscribeToConversation(conversationId: string, onMessage: (message: ChatMessage) => void) {
  const supabase = getSupabaseBrowserClient();
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "messages", filter: `conversation_id=eq.${conversationId}` },
      (payload) => {
        onMessage(payload.new as ChatMessage);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}