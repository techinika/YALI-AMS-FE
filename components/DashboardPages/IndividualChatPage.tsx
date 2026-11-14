"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Loader2,
  MessageSquare,
  Search,
  Send,
  Settings,
  User,
  Users,
} from "lucide-react";
import { PageHeader } from "../parts/PageHeader";
import { useCurrentUser } from "@/lib/data/use-current-user";
import {
  getOrCreateDirectConversation,
  listConversationMessages,
  listMyConversations,
  sendMessage,
  subscribeToConversation,
  type ChatMessage,
  type ConversationSummary,
} from "@/lib/data/chat";
import { listProfiles } from "@/lib/data/profiles";
import { toastError } from "@/lib/toast";

dayjs.extend(relativeTime);

const COMMUNITY_FALLBACK_ID = "00000000-0000-0000-0000-000000000001";

type ProfileLite = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_path: string | null;
};

function fullName(profile?: ProfileLite | null) {
  if (!profile) return "Unknown member";
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "Unknown member";
}

function Avatar({ name, src }: { name: string; src?: string | null }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .join("")
    .slice(0, 2)
    .toUpperCase();

  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={src} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground" aria-hidden="true">
      {initials || "?"}
    </span>
  );
}

export default function IndividualChatPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const qc = useQueryClient();
  const { user } = useCurrentUser();

  const initialRecipient = searchParams.get("rid") ?? "all";
  const [currentId, setCurrentId] = useState(initialRecipient);
  const [chatSearch, setChatSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const lastMessageId = useRef<string | null>(null);

  useEffect(() => {
    setCurrentId(searchParams.get("rid") ?? "all");
  }, [searchParams]);

  const { data: conversations = [], isLoading: loadingConversations } = useQuery({
    queryKey: ["chat", "conversations"],
    queryFn: listMyConversations,
  });

  const { data: directory = [], isLoading: loadingDirectory } = useQuery({
    queryKey: ["chat", "directory", userSearch],
    enabled: userSearch.trim().length > 0,
    queryFn: async () => {
      const { data } = await listProfiles({ search: userSearch.trim(), limit: 8 });
      return (data ?? []) as unknown as ProfileLite[];
    },
  });

  const community = conversations.find((c) => c.type === "community") ?? null;
  const activeConversation: ConversationSummary | null =
    currentId === "all"
      ? community
      : conversations.find((c) => c.id === currentId) ?? null;

  const { data: messages = [], isLoading: loadingMessages } = useQuery({
    queryKey: ["chat", "messages", activeConversation?.id ?? currentId],
    enabled: Boolean(activeConversation?.id),
    queryFn: () => listConversationMessages(activeConversation!.id),
  });

  const send = useMutation({
    mutationFn: (content: string) => sendMessage(activeConversation!.id, content),
    onMutate: async (content) => {
      const key = ["chat", "messages", activeConversation?.id ?? currentId];
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<ChatMessage[]>(key);
      const optimistic: ChatMessage = {
        id: `optimistic-${Date.now()}`,
        conversation_id: activeConversation?.id ?? "",
        sender_id: user?.id ?? "",
        content,
        created_at: new Date().toISOString(),
        sender: user
          ? {
              id: user.id,
              first_name: (user.user_metadata?.first_name as string) ?? null,
              last_name: (user.user_metadata?.last_name as string) ?? null,
              avatar_path: null,
            }
          : null,
      };
      qc.setQueryData<ChatMessage[]>(key, [...(previous ?? []), optimistic]);
      return { previous };
    },
    onError: (_error, _content, context) => {
      if (context?.previous) {
        qc.setQueryData(["chat", "messages", activeConversation?.id ?? currentId], context.previous);
      }
      toastError("Failed to send message.");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["chat", "messages"] });
      qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
    },
  });

  // Realtime updates for the open conversation.
  useEffect(() => {
    if (!activeConversation?.id) return;
    const unsubscribe = subscribeToConversation(activeConversation.id, (incoming) => {
      qc.setQueryData<ChatMessage[]>(["chat", "messages", activeConversation.id], (prev) => {
        if (!prev) return [incoming];
        if (prev.some((m) => m.id === incoming.id || m.content === incoming.content && m.sender_id === incoming.sender_id)) return prev;
        return [...prev, incoming];
      });
    });
    return unsubscribe;
  }, [activeConversation?.id, qc]);

  const directConversations = useMemo(
    () => conversations.filter((c) => c.type === "community" || c.type === "private"),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    const term = chatSearch.trim().toLowerCase();
    if (!term) return directConversations;
    return directConversations.filter((c) => (c.name ?? "Community chat").toLowerCase().includes(term));
  }, [directConversations, chatSearch]);

  const displayedMessages = useMemo(() => {
    const sorted = [...messages].sort((a, b) => a.created_at.localeCompare(b.created_at));
    const term = messageSearch.trim().toLowerCase();
    if (!term) return sorted;
    return sorted.filter((m) => m.content.toLowerCase().includes(term));
  }, [messages, messageSearch]);

  useEffect(() => {
    const last = displayedMessages.at(-1);
    if (!last) return;
    if (last.id === lastMessageId.current) return;
    lastMessageId.current = last.id;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [displayedMessages]);

  const startDirectChat = useCallback(
    async (otherUserId: string) => {
      try {
        const conversationId = await getOrCreateDirectConversation(otherUserId);
        setUserSearch("");
        setCurrentId(conversationId);
        router.push(`${pathname}?rid=${conversationId}`);
        await qc.invalidateQueries({ queryKey: ["chat", "conversations"] });
      } catch (error) {
        toastError(error instanceof Error ? error.message : "Could not start the chat.");
      }
    },
    [pathname, qc, router]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body || !activeConversation) return;
    setDraft("");
    send.mutate(body);
  };

  const peerName = activeConversation?.peer
    ? fullName(activeConversation.peer)
    : activeConversation?.name || "Conversation";
  const title = currentId === "all" ? "Community chat" : peerName;
  const subtitle =
    currentId === "all"
      ? `${activeConversation?.member_count ?? 0} members`
      : activeConversation?.type === "group"
        ? `${activeConversation.member_count} members`
        : "Direct message";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-4">
      <PageHeader
        title="Conversations"
        description="Chat with the community and message members privately."
        actionTitle="Settings"
        onAction={() => router.push("/dashboard/settings")}
        loading={false}
        Icon={Settings}
        disabled={false}
      />

      <div className="flex min-h-[75vh] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm lg:flex-row">
        <aside
          aria-label="Conversations"
          className={`w-full shrink-0 flex-col border-b border-border lg:flex lg:w-80 lg:border-b-0 lg:border-r ${
            currentId === "all" ? "hidden lg:flex" : "hidden md:flex"
          }`}
        >
          <div className="border-b border-border bg-primary p-4">
            <h2 className="flex items-center text-lg font-semibold text-primary-foreground">
              <MessageSquare className="mr-2 h-5 w-5" aria-hidden="true" />
              Chats
            </h2>
          </div>

          <div className="relative space-y-2 border-b border-border bg-muted/40 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Search chats..."
                aria-label="Search chats"
                className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="relative">
              <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Start a chat with a member..."
                aria-label="Find a member to message"
                className="w-full rounded-lg border border-input bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {userSearch.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
                  {loadingDirectory && <p className="p-3 text-center text-sm text-muted-foreground">Searching...</p>}
                  {!loadingDirectory && directory.length === 0 && (
                    <p className="p-3 text-center text-sm text-muted-foreground">No members found.</p>
                  )}
                  {directory.map((member) => (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => startDirectChat(member.id)}
                      className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                    >
                      <Avatar name={fullName(member)} src={member.avatar_path} />
                      <span className="truncate text-sm font-medium text-foreground">{fullName(member)}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto">
            {loadingConversations && <li className="p-4 text-center text-sm text-muted-foreground">Loading chats...</li>}
            {!loadingConversations && filteredConversations.length === 0 && (
              <li className="p-4 text-center text-sm text-muted-foreground">No conversations yet.</li>
            )}
            {filteredConversations.map((conversation) => {
              const active = currentId === conversation.id || (currentId === "all" && conversation.type === "community");
              const label = conversation.type === "community" ? "Community chat" : conversation.name || "Conversation";
              return (
                <li key={conversation.id}>
                  <button
                    type="button"
                    onClick={() => {
                      const rid = conversation.type === "community" ? "all" : conversation.id;
                      setCurrentId(rid);
                      router.push(rid === "all" ? pathname : `${pathname}?rid=${rid}`);
                    }}
                    aria-current={active ? "true" : undefined}
                    className={`flex w-full items-start gap-3 border-b border-l-4 border-border p-3 text-left transition last:border-b-0 ${
                      active ? "border-l-primary bg-brand-50" : "hover:bg-accent"
                    }`}
                  >
                    <span className="pt-1">
                      {conversation.type === "community" ? (
                        <Users className="h-5 w-5 text-primary" aria-hidden="true" />
                      ) : (
                        <Avatar name={label} src={conversation.peer?.avatar_path} />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm font-semibold ${active ? "text-primary" : "text-foreground"}`}>{label}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {conversation.last_message?.content ?? (conversation.type === "community" ? "Start the conversation..." : "New conversation.")}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>

        <section aria-label="Messages" className={`min-w-0 flex-1 flex-col ${currentId === "all" ? "hidden md:flex" : "flex"}`}>
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-card p-4">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  setCurrentId("all");
                  router.push(pathname);
                }}
                className="rounded-md p-1 text-primary transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:hidden"
                aria-label="Back to conversations"
              >
                <ChevronLeft className="h-6 w-6" aria-hidden="true" />
              </button>
              <div className="min-w-0">
                <h2 className="truncate text-lg font-bold text-foreground">{title}</h2>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
            </div>
            <div className="relative hidden w-56 sm:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                value={messageSearch}
                onChange={(e) => setMessageSearch(e.target.value)}
                placeholder="Search messages..."
                aria-label="Search messages"
                className="w-full rounded-lg border border-input bg-muted/40 py-2 pl-10 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-muted/30 p-4 sm:p-6">
            {loadingMessages && (
              <p className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading messages...
              </p>
            )}
            {!loadingMessages && displayedMessages.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-3 p-10 text-center text-muted-foreground">
                <MessageSquare className="h-10 w-10 text-primary/40" aria-hidden="true" />
                <p className="text-sm">{messageSearch ? "No messages match your search." : "No messages yet. Send one to start the conversation."}</p>
              </div>
            )}
            {!loadingMessages &&
              displayedMessages.map((message) => {
                const mine = message.sender_id === user?.id;
                const name = mine ? "You" : fullName(message.sender);
                return (
                  <article key={message.id} className={`flex w-full gap-3 ${mine ? "justify-end" : "justify-start"}`}>
                    {!mine && <Avatar name={name} src={message.sender?.avatar_path} />}
                    <div className={`flex max-w-[85%] flex-col sm:max-w-lg ${mine ? "items-end" : "items-start"}`}>
                      {!mine && currentId === "all" && <span className="mb-1 text-xs font-semibold text-primary">{name}</span>}
                      <p
                        className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm shadow-sm ${
                          mine ? "rounded-br-none bg-primary text-primary-foreground" : "rounded-tl-none border border-border bg-card text-foreground"
                        }`}
                      >
                        {message.content}
                      </p>
                      <time dateTime={message.created_at} className="mt-1 text-xs text-muted-foreground">
                        {dayjs(message.created_at).fromNow()}
                      </time>
                    </div>
                    {mine && <Avatar name={name} src={message.sender?.avatar_path} />}
                  </article>
                );
              })}
            <div ref={endRef} />
          </div>

          <form onSubmit={handleSubmit} className="flex shrink-0 items-center gap-3 border-t border-border bg-card p-4">
            <label htmlFor="message-draft" className="sr-only">
              Message
            </label>
            <input
              id="message-draft"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={`Message ${title}...`}
              autoComplete="off"
              className="flex-1 rounded-xl border border-input bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={!draft.trim() || send.isPending || !activeConversation}
              className="rounded-xl bg-primary p-3 text-primary-foreground shadow-sm transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Send message"
            >
              {send.isPending ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : <Send className="h-5 w-5" aria-hidden="true" />}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";