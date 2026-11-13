"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { FiDelete } from "react-icons/fi";
import { CustomInputError } from "../ui/input-error";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  createTrack,
  deleteTrack,
  isDefaultReference,
  listTracksAdmin,
} from "@/lib/data/reference-admin";

export default function Tracks() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();

  const { data: tracks = [], isLoading, isError } = useQuery({
    queryKey: ["admin", "tracks"],
    queryFn: async () => {
      const { data, error: err } = await listTracksAdmin();
      if (err) throw err;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: createTrack,
    onSuccess: async () => {
      setName("");
      setError(undefined);
      await qc.invalidateQueries({ queryKey: ["admin", "tracks"] });
      await qc.invalidateQueries({ queryKey: ["ref", "tracks"] });
      toastSuccess("Track added successfully!");
    },
    onError: (err: Error) => toastError(err.message || "Failed to add track. It might already exist."),
  });

  const remove = useMutation({
    mutationFn: deleteTrack,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "tracks"] });
      await qc.invalidateQueries({ queryKey: ["ref", "tracks"] });
      toastSuccess("Track deleted successfully!");
    },
    onError: (err: Error) => toastError(err.message || "Failed to delete track."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Track name is required.");
      return;
    }
    create.mutate({ name });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <section aria-labelledby="add-track" className="h-fit rounded-xl border border-border bg-background p-5 lg:w-1/3">
          <h2 id="add-track" className="mb-4 border-b border-border pb-2 text-lg font-semibold text-foreground">
            Add track
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="track-name" className="mb-1 block text-sm font-medium text-foreground">
                Track name
              </label>
              <input
                id="track-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={Boolean(error)}
                className="w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <CustomInputError error={error} />
            </div>
            <button
              type="submit"
              disabled={create.isPending || !name.trim()}
              className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-sm transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {create.isPending ? "Adding..." : "Add track"}
            </button>
          </form>
        </section>

        <section aria-labelledby="track-list" className="overflow-x-auto rounded-xl border border-border bg-background p-5 lg:w-2/3">
          <h2 id="track-list" className="mb-4 border-b border-border pb-2 text-lg font-semibold text-foreground">
            Tracks
          </h2>
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Loading tracks...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-red-600">Failed to load tracks.</td></tr>
              )}
              {!isLoading && !isError && tracks.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center italic text-muted-foreground">No tracks found.</td></tr>
              )}
              {!isLoading && !isError && tracks.map((track) => {
                const isDefault = isDefaultReference(track.name);
                return (
                  <tr key={track.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{track.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {track.created_at ? dayjs(track.created_at).format("DD-MM-YYYY") : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => remove.mutate(track.id)}
                        disabled={isDefault || remove.isPending}
                        title={isDefault ? "Cannot delete the default track" : "Delete track"}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                      >
                        <FiDelete className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Delete {track.name}</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}