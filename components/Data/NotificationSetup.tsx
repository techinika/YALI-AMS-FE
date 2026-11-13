"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { Button } from "../ui/Button";
import { toastError, toastSuccess, toastWarning } from "@/lib/toast";
import RichTextEditor from "../ui/rich-text-editor";
import {
  listNotificationTemplates,
  updateNotificationTemplate,
  type NotificationTemplateRow,
} from "@/lib/data/reference-admin";

dayjs.extend(relativeTime);

export const actionOptions = [
  { id: "confirm", action: "Confirm to update" },
  { id: "decline", action: "Decline to update" },
  { id: "login", action: "Login" },
];

export default function NotificationSetup() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [linkIds, setLinkIds] = useState<string[]>([]);

  const { data: templates = [], isLoading, isError } = useQuery({
    queryKey: ["admin", "notification_templates"],
    queryFn: async () => {
      const { data, error } = await listNotificationTemplates();
      if (error) throw error;
      return (data ?? []) as NotificationTemplateRow[];
    },
  });

  const selected = useMemo(
    () => templates.find((t) => t.id === selectedId) ?? null,
    [templates, selectedId]
  );

  useEffect(() => {
    if (selectedId && templates.some((t) => t.id === selectedId)) return;
    const first = templates[0] ?? null;
    setSelectedId(first?.id ?? null);
  }, [templates, selectedId]);

  useEffect(() => {
    if (!selected) return;
    setMessage(selected.message || "Add the notification here");
    setLinkIds(selected.link ? selected.link.split("+").filter(Boolean) : []);
  }, [selected]);

  const update = useMutation({
    mutationFn: (input: { id: string; message: string; link: string }) =>
      updateNotificationTemplate(input.id, { message: input.message, link: input.link }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "notification_templates"] });
      toastSuccess("Notification updated successfully!");
    },
    onError: (error: Error) => toastError(error.message || "An error occurred while updating."),
  });

  const onActionChange = (e: React.ChangeEvent<HTMLInputElement>, actionId: string) => {
    setLinkIds((prev) =>
      e.target.checked ? (prev.includes(actionId) ? prev : [...prev, actionId]) : prev.filter((id) => id !== actionId)
    );
  };

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (!selectedId) {
      toastWarning("Please select a notification to update.");
      return;
    }
    update.mutate({ id: selectedId, message, link: linkIds.join("+") });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex h-[70vh] min-h-[28rem] flex-col gap-6 lg:flex-row">
        <section aria-labelledby="notification-types" className="shrink-0 overflow-y-auto rounded-xl border border-border bg-background lg:w-1/3">
          <h2 id="notification-types" className="sticky top-0 z-10 border-b border-border bg-background p-4 text-lg font-semibold text-foreground">
            Notification type
          </h2>
          <ul className="flex flex-col">
            {isLoading && <li className="px-4 py-6 text-center text-sm text-muted-foreground">Loading templates...</li>}
            {isError && <li className="px-4 py-6 text-center text-sm text-red-600">Failed to load templates.</li>}
            {!isLoading && !isError && templates.length === 0 && (
              <li className="px-4 py-6 text-center text-sm italic text-muted-foreground">No notification templates found.</li>
            )}
            {!isLoading &&
              !isError &&
              templates.map((template) => {
                const active = template.id === selectedId;
                return (
                  <li key={template.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(template.id)}
                      aria-current={active ? "true" : undefined}
                      className={`w-full border-b border-l-4 border-border px-4 py-3 text-left transition last:border-b-0 ${
                        active ? "border-l-primary bg-brand-50 font-semibold" : "hover:bg-muted/50"
                      }`}
                    >
                      <span className="mb-1 block text-xs text-primary">
                        {template.updated_at ? dayjs(template.updated_at).fromNow() : "Never updated"}
                      </span>
                      <span className="block text-sm capitalize text-foreground">{template.usage}</span>
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>

        <section aria-labelledby="notification-editor" className="flex flex-col rounded-xl border border-border bg-background lg:w-2/3">
          <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-background p-4">
            <h2 id="notification-editor" className="text-lg font-semibold capitalize text-foreground">
              {selected?.usage ?? "No notification selected"}
            </h2>
            <Button size="md" onClick={handleSubmit} disabled={update.isPending || !selected}>
              {update.isPending ? "Saving..." : "Save"}
            </Button>
          </div>

          {selected ? (
            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-6">
                <label htmlFor="notification-message" className="mb-2 block text-sm font-semibold text-foreground">
                  Message
                </label>
                <RichTextEditor message={message} setMessage={setMessage} />
              </div>
              <fieldset>
                <legend className="mb-2 block text-sm font-semibold text-foreground">Actions</legend>
                <div className="flex flex-wrap gap-4 rounded-lg border border-border bg-muted/40 p-3">
                  {actionOptions.map((action) => (
                    <div key={action.id} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`action-${action.id}`}
                        name={action.id}
                        value={action.id}
                        checked={linkIds.includes(action.id)}
                        onChange={(e) => onActionChange(e, action.id)}
                        className="h-4 w-4 rounded border-input text-primary focus:ring-ring"
                      />
                      <label htmlFor={`action-${action.id}`} className="ml-2 text-sm text-foreground">
                        {action.action}
                      </label>
                    </div>
                  ))}
                </div>
              </fieldset>
            </div>
          ) : (
            <div className="flex flex-1 items-center justify-center p-10 text-center text-sm italic text-muted-foreground">
              Select a notification type to edit its content and actions.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}