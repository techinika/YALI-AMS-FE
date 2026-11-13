"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { FiDelete } from "react-icons/fi";
import { CustomInputError } from "../ui/input-error";
import { toastError, toastSuccess } from "@/lib/toast";
import {
  createCohort,
  deleteCohort,
  isDefaultReference,
  listCohortsAdmin,
} from "@/lib/data/reference-admin";

export default function Cohorts() {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ name?: string; description?: string }>({});

  const { data: cohorts = [], isLoading, isError } = useQuery({
    queryKey: ["admin", "cohorts"],
    queryFn: async () => {
      const { data, error } = await listCohortsAdmin();
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: createCohort,
    onSuccess: async () => {
      setName("");
      setDescription("");
      setErrors({});
      await qc.invalidateQueries({ queryKey: ["admin", "cohorts"] });
      await qc.invalidateQueries({ queryKey: ["ref", "cohorts"] });
      toastSuccess("Cohort added successfully!");
    },
    onError: (error: Error) => toastError(error.message || "Failed to add cohort."),
  });

  const remove = useMutation({
    mutationFn: deleteCohort,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["admin", "cohorts"] });
      await qc.invalidateQueries({ queryKey: ["ref", "cohorts"] });
      toastSuccess("Cohort deleted successfully!");
    },
    onError: (error: Error) => toastError(error.message || "Failed to delete cohort."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: { name?: string; description?: string } = {};
    if (!name.trim()) next.name = "Cohort name is required.";
    if (!description.trim()) next.description = "Description is required.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    create.mutate({ name, description });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-6 lg:flex-row">
        <section aria-labelledby="add-cohort" className="h-fit rounded-xl border border-border bg-background p-5 lg:w-1/3">
          <h2 id="add-cohort" className="mb-4 border-b border-border pb-2 text-lg font-semibold text-foreground">
            Add cohort
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="cohort-name" className="mb-1 block text-sm font-medium text-foreground">
                Cohort name
              </label>
              <input
                id="cohort-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-invalid={Boolean(errors.name)}
                className="w-full rounded-lg border border-input bg-background p-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <CustomInputError error={errors.name} />
            </div>
            <div>
              <label htmlFor="cohort-description" className="mb-1 block text-sm font-medium text-foreground">
                Description
              </label>
              <textarea
                id="cohort-description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                aria-invalid={Boolean(errors.description)}
                className="w-full resize-none rounded-lg border border-input bg-background p-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring"
                required
              />
              <CustomInputError error={errors.description} />
            </div>
            <button
              type="submit"
              disabled={create.isPending}
              className="w-full rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground shadow-sm transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {create.isPending ? "Adding..." : "Add cohort"}
            </button>
          </form>
        </section>

        <section aria-labelledby="cohort-list" className="overflow-x-auto rounded-xl border border-border bg-background p-5 lg:w-2/3">
          <h2 id="cohort-list" className="mb-4 border-b border-border pb-2 text-lg font-semibold text-foreground">
            Cohorts
          </h2>
          <table className="min-w-full divide-y divide-border text-sm">
            <thead>
              <tr>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Name</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                <th scope="col" className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
                <th scope="col" className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-muted-foreground">Loading cohorts...</td>
                </tr>
              )}
              {isError && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-red-600">Failed to load cohorts.</td>
                </tr>
              )}
              {!isLoading && !isError && cohorts.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center italic text-muted-foreground">No cohorts found.</td>
                </tr>
              )}
              {!isLoading && !isError && cohorts.map((cohort) => {
                const isDefault = isDefaultReference(cohort.name);
                return (
                  <tr key={cohort.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-medium text-foreground">{cohort.name}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-muted-foreground">{cohort.description || "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                      {cohort.created_at ? dayjs(cohort.created_at).format("DD-MM-YYYY") : "—"}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => remove.mutate(cohort.id)}
                        disabled={isDefault || remove.isPending}
                        title={isDefault ? "Cannot delete the default cohort" : "Delete cohort"}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-red-600 text-white transition hover:bg-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
                      >
                        <FiDelete className="h-4 w-4" aria-hidden="true" />
                        <span className="sr-only">Delete {cohort.name}</span>
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