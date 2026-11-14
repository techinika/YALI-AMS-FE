"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { FiDelete } from "react-icons/fi";
import { CustomInputError } from "../ui/input-error";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  createWorkingSector,
  deleteWorkingSector,
  isDefaultReference,
  listWorkingSectorsAdmin,
} from "@/lib/data/reference-admin";

export default function WorkingSector() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();

  const { data: sectors = [], isLoading, isError } = useQuery({
    queryKey: ["admin", "working_sectors"],
    queryFn: async () => {
      const { data, error: err } = await listWorkingSectorsAdmin();
      if (err) throw err;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: createWorkingSector,
    onSuccess: async () => {
      setName("");
      setError(undefined);
      await qc.invalidateQueries({ queryKey: ["admin", "working_sectors"] });
      await qc.invalidateQueries({ queryKey: ["ref", "working_sectors"] });
      toastSuccess("Working sector added successfully!");
    },
    onError: (err: Error) => toastError(err.message || "Failed to add working sector. It might already exist."),
  });

  const remove = useMutation({
    mutationFn: deleteWorkingSector,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "working_sectors"] });
      await qc.invalidateQueries({ queryKey: ["ref", "working_sectors"] });
      toastSuccess("Working sector deleted successfully!");
    },
    onError: (err: Error) => toastError(err.message || "Failed to delete working sector."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Working sector name is required.");
      return;
    }
    create.mutate({ name });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <section aria-labelledby="add-working-sector" className="h-fit rounded-xl border border-border bg-background p-5 lg:w-1/3">
          <h2 id="add-working-sector" className="mb-4 border-b border-border pb-2 text-lg font-semibold text-foreground">
            Add working sector
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="working-sector-name" className="mb-1 block text-sm font-medium text-foreground">
                Working sector name
              </label>
              <input
                id="working-sector-name"
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
              {create.isPending ? "Adding..." : "Add working sector"}
            </button>
          </form>
        </section>

        <section aria-labelledby="working-sector-list" className="overflow-x-auto rounded-xl border border-border bg-background p-5 lg:w-2/3">
          <h2 id="working-sector-list" className="mb-4 border-b border-border pb-2 text-lg font-semibold text-foreground">
            Working sectors
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
                <tr><td colSpan={3} className="px-4 py-6 text-center text-muted-foreground">Loading working sectors...</td></tr>
              )}
              {isError && (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-red-600">Failed to load working sectors.</td></tr>
              )}
              {!isLoading && !isError && sectors.length === 0 && (
                <tr><td colSpan={3} className="px-4 py-6 text-center italic text-muted-foreground">No working sectors found.</td></tr>
              )}
              {!isLoading && !isError && sectors.map((sector) => {
                const isDefault = isDefaultReference(sector.name);
                return (
                  <tr key={sector.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{sector.name}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {sector.created_at ? dayjs(sector.created_at).format("DD-MM-YYYY") : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => remove.mutate(sector.id)}
                        disabled={isDefault || remove.isPending}
                        title={isDefault ? "Cannot delete the default working sector" : "Delete working sector"}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                      >
                        <FiDelete className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Delete {sector.name}</span>
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