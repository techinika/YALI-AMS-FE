"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import {
  Hash,
  Info,
  MessageCircle,
  MessageSquare,
  Plus,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { PageHeader } from "../parts/PageHeader";
import CreateGroupChat from "../parts/models/CreateGroupChat";
import Modal from "../parts/models/Modal";
import { useCurrentUser } from "@/lib/data/use-current-user";
import { listProfiles } from "@/lib/data/profiles";
import {
  inviteGroupMember,
  listConversationMessages,
  listGroupMembers,
  listMyConversations,
  requestToJoinGroup,
  respondToGroupInvitation,
  reviewGroupMember,
  sendMessage,
  subscribeToConversation,
  type ChatMessage,
  type ConversationSummary,
  type GroupMember,
} from "@/lib/data/chat";
import { toastError, toastSuccess } from "@/lib/toast";

const statusLabel: Record<string, string> = {
  admin_approval_pending: "Awaiting approval",
  member_joining_pending: "Invitation pending",
  approved: "Member",
  admin_rejected: "Request declined",
  member_rejected: "Invitation declined",
  member_left: "Left",
};

function memberName(profile?: GroupMember["profile"] | ChatMessage["sender"]) {
  if (!profile) return "Member";
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Member";
}

export const GroupChatsPage = () => {
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useCurrentUser();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [pendingGroup, setPendingGroup] = useState<ConversationSummary | null>(null);
  const [showManage, setShowManage] = useState(false);
  const [inviteSearch, setInviteSearch] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const lastMessageId = useRef<string | null>(null);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: listMyConversations,
  });

  const groups = useMemo(
    () =>
      conversations
        .filter((c) => c.type === "group")
        .filter((c) => (c.name ?? "").toLowerCase().includes(search.trim().toLowerCase())),
    [conversations, search]
  );

  const activeGroup = conversations.find((c) => c.id === activeId) ?? null;

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["chat", "messages", activeId],
    enabled: Boolean(activeId),
    queryFn: () => listConversationMessages(activeId!),
  });

  const { data: groupMembers = [] } = useQuery({
    queryKey: ["chat", "group-members", activeId],
    enabled: Boolean(activeId),
    queryFn: () => listGroupMembers(activeId!),
  });

  const { data: inviteCandidates = [] } = useQuery({
    queryKey: ["chat", "directory", "invite", inviteSearch],
    enabled: showManage && inviteSearch.trim().length > 0,
    queryFn: async () => {
      const { data } = await listProfiles({ search: inviteSearch.trim(), limit: 8 });
      return data ?? [];
    },
  });

  const send = useMutation({
    mutationFn: (content: string) => sendMessage(activeId!, content),
    onSuccess: (message) => {
      qc.setQueryData<ChatMessage[]>(["chat", "messages", activeId], (prev) => {
        const list = prev ?? [];
        return list.some((m) => m.id === message.id) ? list : [...list, message];
      });
      setDraft("");
    },
    onError: () => toastError("Failed to send message."),
    onSettled: () => qc.invalidateQueries({ queryKey: ["chat", "messages"] }),
  });

  useEffect(() => {
    if (!activeId) return;
    const unsubscribe = subscribeToConversation(activeId, (incoming) => {
      qc.setQueryData<ChatMessage[]>(["chat", "messages", activeId], (prev) => {
        const list = prev ?? [];
        if (list.some((m) => m.id === incoming.id)) return list;
        return [...list, incoming];
      });
      qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
    });
    return unsubscribe;
  }, [activeId, qc]);

  useEffect(() => {
    const last = messages.at(-1);
    if (!last || last.id === lastMessageId.current) return;
    lastMessageId.current = last.id;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const requestJoin = useMutation({
    mutationFn: (conversationId: string) => requestToJoinGroup(conversationId),
    onSuccess: async () => {
      toastSuccess("Join request sent.");
      setPendingGroup(null);
      await qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
    onError: (error: Error) => toastError(error.message || "Could not send the request."),
  });

  const respond = useMutation({
    mutationFn: ({ conversationId, accept }: { conversationId: string; accept: boolean }) =>
      respondToGroupInvitation(conversationId, accept),
    onSuccess: async (_data, variables) => {
      toastSuccess(variables.accept ? "Invitation accepted." : "Invitation declined.");
      setPendingGroup(null);
      await qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
    onError: (error: Error) => toastError(error.message || "Could not update the invitation."),
  });

  const review = useMutation({
    mutationFn: ({ userId, approve }: { userId: string; approve: boolean }) =>
      reviewGroupMember(activeId!, userId, approve),
    onSuccess: async () => {
      toastSuccess("Membership updated.");
      await qc.invalidateQueries({ queryKey: ["chat", "group-members"] });
      await qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
    onError: (error: Error) => toastError(error.message || "Could not update membership."),
  });

  const invite = useMutation({
    mutationFn: (userId: string) => inviteGroupMember(activeId!, userId),
    onSuccess: async () => {
      toastSuccess("Invitation sent.");
      await qc.invalidateQueries({ queryKey: ["chat", "group-members"] });
    },
    onError: (error: Error) => toastError(error.message || "Could not invite the member."),
  });

  const joinRequests = groupMembers.filter((m) => m.status === "admin_approval_pending");
  const memberIds = new Set(groupMembers.map((m) => m.user_id));
  const canChat = activeGroup ? activeGroup.my_status === "approved" || !activeGroup.my_status : false;

  const openGroup = (group: ConversationSummary) => {
    if (group.my_status === "approved") {
      setActiveId(group.id);
      return;
    }
    setPendingGroup(group);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeId) return;
    send.mutate(body);
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <PageHeader
        title="Group chats"
        description="Join communities and collaborate with like-minded members."
        actionTitle="Single chats"
        Icon={MessageCircle}
        onAction={() => router.push("/dashboard/chat")}
        loading={false}
        disabled={false}
      />

      <div className="flex min-h-[75vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:flex-row">
        <aside
          aria-label="Groups"
          className={`w-full shrink-0 flex-col border-b border-border lg:flex lg:w-80 lg:border-b-0 lg:border-r ${activeId ? "hidden md:flex" : "flex"}`}
        >
          <div className="border-b border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Communities</h2>
              <button
                type="button"
                onClick={() => setShowCreate(true)}
                className="rounded-lg bg-brand-100 p-2 text-primary transition hover:bg-brand-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Create group"
              >
                <Plus className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Explore groups..."
                aria-label="Search groups"
                className="w-full rounded-xl border border-input bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto p-2">
            {isLoading && <li className="p-4 text-center text-sm text-muted-foreground">Loading groups...</li>}
            {!isLoading && groups.length === 0 && (
              <li className="p-6 text-center text-sm italic text-muted-foreground">No groups yet. Create one to get started.</li>
            )}
            {groups.map((group) => {
              const active = group.id === activeId;
              const status = group.my_status;
              return (
                <li key={group.id}>
                  <button
                    type="button"
                    onClick={() => openGroup(group)}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl border-l-4 p-3 text-left transition ${
                      active ? "border-l-primary bg-brand-50" : "border-l-transparent hover:bg-accent"
                    }`}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Hash className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-foreground">{group.name}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {group.member_count} members · {group.last_message?.content ?? "No messages"}
                      </span>
                      {status !== "approved" && (
                        <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                          {status ? statusLabel[status] ?? status : "Not joined"}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <main aria-label="Group messages" className={`min-w-0 flex-1 flex-col ${activeId ? "flex" : "hidden md:flex"}`}>
          {activeGroup ? (
            <>
              <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="rounded-md p-1 text-primary transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
                    aria-label="Back to groups"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold text-foreground">{activeGroup.name}</h2>
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Users className="h-3.5 w-3.5" aria-hidden="true" />
                      {activeGroup.member_count} members
                    </p>
                  </div>
                </div>
                {activeGroup.my_role === "admin" && (
                  <button
                    type="button"
                    onClick={() => setShowManage(true)}
                    className="rounded-lg p-2 text-muted-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label="Manage members"
                  >
                    <UserPlus className="h-5 w-5" aria-hidden="true" />
                  </button>
                )}
                {activeGroup.description && (
                  <span className="hidden rounded-lg p-2 text-muted-foreground sm:block" title={activeGroup.description}>
                    <Info className="h-5 w-5" aria-hidden="true" />
                  </span>
                )}
              </header>

              <div className="flex-1 space-y-5 overflow-y-auto bg-muted/30 p-4 sm:p-6">
                {loadingMessages && <p className="py-10 text-center text-sm text-muted-foreground">Loading messages...</p>}
                {!loadingMessages && messages.length === 0 && (
                  <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center text-muted-foreground">
                    <MessageSquare className="h-10 w-10 text-primary/40" aria-hidden="true" />
                    <p className="text-sm">{canChat ? "No messages yet. Start the conversation." : "You cannot post in this group yet."}</p>
                  </div>
                )}
                {!loadingMessages &&
                  messages.map((message) => {
                    const mine = message.sender_id === user?.id;
                    return (
                      <article key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[85%] sm:max-w-[70%] ${mine ? "text-right" : ""}`}>
                          {!mine && <p className="mb-1 ml-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{memberName(message.sender)}</p>}
                          <p className={`inline-block whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-left text-sm shadow-sm ${mine ? "rounded-tr-none bg-primary text-primary-foreground" : "rounded-tl-none border border-border bg-card text-foreground"}`}>
                            {message.content}
                          </p>
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            <time dateTime={message.created_at}>{dayjs(message.created_at).format("HH:mm")}</time>
                          </p>
                        </div>
                      </article>
                    );
                  })}
                <div ref={endRef} />
              </div>

              <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-3 border-t border-border p-4">
                <label htmlFor="group-draft" className="sr-only">Message</label>
                <input
                  id="group-draft"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  disabled={!canChat}
                  placeholder={canChat ? `Message ${activeGroup.name}...` : "You are not a member of this group"}
                  className="flex-1 rounded-xl border border-input bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!draft.trim() || send.isPending || !canChat}
                  className="rounded-xl bg-primary p-3 text-primary-foreground shadow-sm transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Send message"
                >
                  <MessageSquare className="h-5 w-5" aria-hidden="true" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-muted/20 p-12 text-center">
              <MessageSquare className="h-10 w-10 text-primary/40" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-foreground">Select a group</h2>
              <p className="max-w-sm text-sm text-muted-foreground">Pick a community on the left, request to join a new one, or create your own.</p>
            </div>
          )}
        </main>
      </div>

      {showCreate && (
        <CreateGroupChat
          setShowCreateModal={setShowCreate}
          onCreated={(id) => {
            setActiveId(id);
            qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
          }}
        />
      )}

      {pendingGroup && (
        <Modal onClose={() => setPendingGroup(null)} title={pendingGroup.name ?? "Group"}>
          {(pendingGroup.my_status === null ||
            pendingGroup.my_status === "member_rejected" ||
            pendingGroup.my_status === "admin_rejected" ||
            pendingGroup.my_status === "member_left") && (
            <>
              <h3 className="text-lg font-bold text-foreground">Join {pendingGroup.name}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {pendingGroup.my_status === null
                  ? "You are not a member yet. Send a request and a group admin will review it."
                  : "You are not currently a member. Send a new request to rejoin."}
              </p>
              <button
                type="button"
                onClick={() => requestJoin.mutate(pendingGroup.id)}
                disabled={requestJoin.isPending}
                className="mt-5 rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-brand-800 disabled:opacity-60"
              >
                {requestJoin.isPending ? "Sending..." : "Request to join"}
              </button>
            </>
          )}

          {pendingGroup.my_status === "admin_approval_pending" && (
            <>
              <h3 className="text-lg font-bold text-foreground">Approval pending</h3>
              <p className="mt-2 text-sm text-muted-foreground">Your request to join <strong>{pendingGroup.name}</strong> is waiting for an admin.</p>
            </>
          )}

          {pendingGroup.my_status === "member_joining_pending" && (
            <>
              <h3 className="text-lg font-bold text-foreground">Group invitation</h3>
              <p className="mt-2 text-sm text-muted-foreground">You have been invited to join <strong>{pendingGroup.name}</strong>.</p>
              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => respond.mutate({ conversationId: pendingGroup.id, accept: true })}
                  disabled={respond.isPending}
                  className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-brand-800 disabled:opacity-60"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={() => respond.mutate({ conversationId: pendingGroup.id, accept: false })}
                  disabled={respond.isPending}
                  className="rounded-xl border-2 border-primary px-5 py-2 text-sm font-semibold text-primary transition hover:bg-accent disabled:opacity-60"
                >
                  Decline
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {showManage && activeGroup && (
        <Modal onClose={() => setShowManage(false)} title="Manage members">
          <section aria-labelledby="join-requests">
            <h3 id="join-requests" className="text-sm font-semibold text-muted-foreground">
              Join requests ({joinRequests.length})
            </h3>
            {joinRequests.length === 0 && <p className="mt-2 text-sm italic text-muted-foreground">No pending requests.</p>}
            <ul className="mt-2 space-y-2">
              {joinRequests.map((member) => (
                <li key={member.user_id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2">
                  <span className="text-sm font-medium text-foreground">{memberName(member.profile)}</span>
                  <span className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => review.mutate({ userId: member.user_id, approve: true })}
                      className="rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => review.mutate({ userId: member.user_id, approve: false })}
                      className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white transition hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="invite-members" className="mt-6 border-t border-border pt-4">
            <h3 id="invite-members" className="text-sm font-semibold text-muted-foreground">Invite members</h3>
            <div className="relative mt-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={inviteSearch}
                onChange={(e) => setInviteSearch(e.target.value)}
                placeholder="Search members by name..."
                aria-label="Search members to invite"
                className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <ul className="mt-2 max-h-56 space-y-2 overflow-y-auto">
              {inviteCandidates.length === 0 && <li className="text-sm italic text-muted-foreground">No members found.</li>}
              {inviteCandidates.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-2">
                  <span className="text-sm text-foreground">{memberName(member as GroupMember["profile"])}</span>
                  <button
                    type="button"
                    onClick={() => invite.mutate(member.id)}
                    disabled={memberIds.has(member.id) || invite.isPending}
                    className="rounded-full border border-primary px-3 py-1 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {memberIds.has(member.id) ? "Already a member" : "Invite"}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </Modal>
      )}
    </div>
  );
};