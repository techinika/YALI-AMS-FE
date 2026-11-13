"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { createGroupConversation } from "@/lib/data/chat";
import { listProfiles } from "@/lib/data/profiles";
import { toastError, toastSuccess } from "@/lib/toast";

type MemberLike = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

function memberName(member: MemberLike) {
  return [member.firstName ?? member.first_name, member.lastName ?? member.last_name].filter(Boolean).join(" ") || "Member";
}

function CreateGroupChat({
  setShowCreateModal,
  members = [],
  onCreated,
}: {
  setShowCreateModal: React.Dispatch<React.SetStateAction<boolean>>;
  user?: unknown;
  members?: MemberLike[];
  source?: string;
  groupRefetching?: unknown;
  onCreated?: (conversationId: string) => void;
}) {
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setSelected(members.map((m) => m.id));
  }, [members]);

  const { data: directory = [] } = useQuery({
    queryKey: ["chat", "directory", "group", search],
    enabled: search.trim().length > 0,
    queryFn: async () => {
      const { data } = await listProfiles({ search: search.trim(), limit: 8 });
      return data ?? [];
    },
  });

  const candidates = useMemo(() => {
    const map = new Map<string, MemberLike>();
    for (const member of members) map.set(member.id, member);
    for (const profile of directory as unknown as MemberLike[]) map.set(profile.id, profile);
    return Array.from(map.values());
  }, [members, directory]);

  const create = useMutation({
    mutationFn: () =>
      createGroupConversation({
        name,
        memberIds: selected,
      }),
    onSuccess: (conversationId) => {
      toastSuccess("Group created successfully!");
      setShowCreateModal(false);
      onCreated?.(conversationId);
    },
    onError: (error: Error) => toastError(error.message || "Failed to create the group."),
  });

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="create-group-title">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="flex items-start justify-between border-b border-border p-5">
          <div>
            <h3 id="create-group-title" className="text-lg font-bold text-foreground">New group</h3>
            <p className="text-xs text-muted-foreground">Bring members together around shared interests.</p>
          </div>
          <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-full p-2 text-muted-foreground transition hover:bg-accent" aria-label="Close">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div>
            <label htmlFor="group-name" className="mb-2 block text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Group name
            </label>
            <input
              id="group-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Next-Gen SaaS Founders"
              className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label htmlFor="group-member-search" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Members
              </label>
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-primary">{selected.length} selected</span>
            </div>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input
                id="group-member-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members..."
                className="w-full rounded-xl border border-input bg-background py-2 pl-10 pr-3 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
              {candidates.length === 0 && <li className="py-3 text-center text-xs italic text-muted-foreground">No members found.</li>}
              {candidates.map((member) => {
                const isSelected = selected.includes(member.id);
                return (
                  <li key={member.id}>
                    <button
                      type="button"
                      onClick={() => setSelected((prev) => (isSelected ? prev.filter((id) => id !== member.id) : [...prev, member.id]))}
                      aria-pressed={isSelected}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        isSelected ? "border-primary bg-brand-50" : "border-border hover:bg-accent"
                      }`}
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground" aria-hidden="true">
                        {memberName(member).charAt(0)}
                      </span>
                      <span className="flex-1 text-xs font-semibold text-foreground">{memberName(member)}</span>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full border text-[10px] ${isSelected ? "border-primary bg-primary text-primary-foreground" : "border-border"}`} aria-hidden="true">
                        {isSelected ? "✓" : ""}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-border p-5">
          <button type="button" onClick={() => setShowCreateModal(false)} className="rounded-xl border border-border px-4 py-2 text-xs font-bold text-muted-foreground transition hover:bg-accent">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => create.mutate()}
            disabled={!name.trim() || create.isPending}
            className="rounded-xl bg-primary px-6 py-2 text-xs font-bold text-primary-foreground shadow-sm transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {create.isPending ? "Creating..." : "Create group"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateGroupChat;