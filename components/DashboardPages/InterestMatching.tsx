"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { MessageSquare, Sparkles, UserPlus } from "lucide-react";
import { PageHeader } from "../parts/PageHeader";
import { AVAILABLE_INTERESTS } from "@/helpers/data";
import { getOrCreateDirectConversation } from "@/lib/data/chat";
import {
  listMatchmakingHistory,
  runMatchmaking,
  type MatchResult,
} from "@/lib/data/matchmaking";
import { toastError } from "@/lib/toast";

dayjs.extend(relativeTime);

function displayName(user: MatchResult["user"]) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || "Member";
}

export const InterestMatching = () => {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [description, setDescription] = useState("");

  const { data: history = [] } = useQuery({
    queryKey: ["matchmaking", "history"],
    queryFn: () => listMatchmakingHistory(6),
  });

  const match = useMutation({
    mutationFn: () =>
      runMatchmaking(
        selected.map((id) => AVAILABLE_INTERESTS.find((interest) => interest.id === id)?.label ?? id),
        description
      ),
    onError: (error: Error) => toastError(error.message || "Matching failed. Try again."),
  });

  const message = useMutation({
    mutationFn: (userId: string) => getOrCreateDirectConversation(userId),
    onSuccess: (conversationId) => router.push(`/dashboard/chat?rid=${conversationId}`),
    onError: (error: Error) => toastError(error.message || "Could not open the chat."),
  });

  const matches = match.data?.matches ?? [];
  const selectedLabels = useMemo(
    () => selected.map((id) => AVAILABLE_INTERESTS.find((i) => i.id === id)?.label ?? id),
    [selected]
  );

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4 sm:p-8">
      <PageHeader
        title="Interest matching"
        description="Find members and groups that share your interests."
        actionTitle="Browse members"
        Icon={Sparkles}
        onAction={() => router.push("/dashboard/members")}
        loading={false}
        disabled={false}
      />

      <section aria-labelledby="match-form" className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <h2 id="match-form" className="text-lg font-semibold text-foreground">
          What are you interested in?
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a few interests and add a short description of what you are looking for.
        </p>

        <fieldset className="mt-4">
          <legend className="sr-only">Interests</legend>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_INTERESTS.map((interest) => {
              const active = selected.includes(interest.id);
              return (
                <button
                  key={interest.id}
                  type="button"
                  onClick={() => toggle(interest.id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                    active ? "border-primary bg-brand-100 text-primary" : "border-border bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  <span aria-hidden="true">{interest.icon}</span>
                  {interest.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="mt-5">
          <label htmlFor="match-description" className="mb-1 block text-sm font-medium text-foreground">
            What are you hoping to find? (optional)
          </label>
          <textarea
            id="match-description"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Looking for co-founders working on clean energy in Kigali."
            className="w-full resize-none rounded-xl border border-input bg-background p-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{selectedLabels.length} selected</p>
          <button
            type="button"
            onClick={() => match.mutate()}
            disabled={match.isPending || (selected.length === 0 && description.trim().length < 8)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {match.isPending ? "Matching..." : "Find matches"}
          </button>
        </div>

        {match.data && (
          <p className="mt-3 text-sm text-muted-foreground" role="status">
            {match.data.summary} {matches.length} possible {matches.length === 1 ? "match" : "matches"}.
          </p>
        )}
      </section>

      {matches.length > 0 && (
        <section aria-labelledby="match-results">
          <h2 id="match-results" className="mb-3 text-lg font-semibold text-foreground">
            Suggested members
          </h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {matches.map((entry) => (
              <li key={entry.user.id} className="flex flex-col rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  {entry.user.avatar_path ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={entry.user.avatar_path} alt="" className="h-11 w-11 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-primary" aria-hidden="true">
                      {displayName(entry.user).charAt(0)}
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{displayName(entry.user)}</p>
                    <p className="text-xs text-muted-foreground">{entry.score}% match</p>
                  </div>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted" role="presentation">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${entry.score}%` }} />
                </div>
                <p className="mt-3 flex-1 text-xs text-muted-foreground">{entry.reason || "Shared interests and profile details."}</p>
                <button
                  type="button"
                  onClick={() => message.mutate(entry.user.id)}
                  disabled={message.isPending}
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-xl border border-primary px-3 py-2 text-xs font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:opacity-60"
                >
                  <MessageSquare className="h-4 w-4" aria-hidden="true" /> Message
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="match-history">
        <h2 id="match-history" className="mb-3 text-lg font-semibold text-foreground">
          Recent matches
        </h2>
        {history.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
            No match requests yet. Pick a few interests to get started.
          </p>
        ) : (
          <ul className="space-y-3">
            {history.map((request) => (
              <li key={request.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <p className="truncate text-sm font-semibold text-foreground">{request.interests || "Interests"}</p>
                  <time dateTime={request.created_at} className="shrink-0 text-xs text-muted-foreground">
                    {dayjs(request.created_at).fromNow()}
                  </time>
                </div>
                {request.ai_summary && <p className="mt-1 text-xs text-muted-foreground">{request.ai_summary}</p>}
                {request.items.length > 0 && (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {request.items.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          onClick={() => item.profile && message.mutate(item.profile.id)}
                          disabled={!item.profile || message.isPending}
                          className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition hover:bg-accent disabled:opacity-60"
                        >
                          <UserPlus className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
                          {item.profile ? displayName(item.profile) : "Member"}
                          {item.score != null && <span className="text-muted-foreground">· {item.score}%</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};