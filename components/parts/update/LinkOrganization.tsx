"use client";

import { TailwindInput } from "@/components/ui/TailInput";
import { TailwindSelect } from "@/components/ui/tail-select";
import { MdSearch } from "react-icons/md";

export function LinkOrganization({
  filtered,
  setQuery,
  query,
  formData,
  setFormData,
}: {
  filtered: any[];
  setQuery: any;
  query: string;
  formData: any;
  setFormData: any;
}) {
  return (
    <div className="px-6 py-4 space-y-4">
      <div className="relative">
        <MdSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search organization..."
          className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-primary focus:border-primary"
        />
      </div>

      {filtered.length > 0 ? (
        <div className="border rounded-lg divide-y max-h-40 overflow-auto">
          {filtered.map((org) => (
            <div
              key={org.id}
              onClick={() =>
                setFormData((prev: any) => ({
                  ...prev,
                  orgId: String(org?.id),
                }))
              }
              className={`flex justify-between items-center px-2 cursor-pointer ${
                String(formData?.orgId) === String(org?.id) ? "bg-gray-100" : ""
              }`}
            >
              <button
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-gray-50 transition"
              >
                {org.name}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="border rounded-lg p-4 text-center text-gray-500">
          <p>No organization found.</p>
        </div>
      )}

      {formData.orgId && (
        <div className="border-t pt-4 flex flex-col gap-3">
          <label className="block text-sm font-medium mb-1">
            Add Additional Data
          </label>
          <div className="grid grid-cols-2 gap-3">
            <TailwindInput
              label="Your position in this organization?"
              id="position"
              value={formData.position}
              onChange={(e: any) =>
                setFormData((prev: any) => ({
                  ...prev,
                  position: e.target.value,
                }))
              }
              placeholder="Your position in this organization?"
            />
            <TailwindSelect
              label="Relationship with this Organization"
              id="relation"
              value={formData.relation}
              onChange={(e: any) =>
                setFormData((prev: any) => ({
                  ...prev,
                  relation: e.target.value,
                }))
              }
              options={[
                { id: "founded", name: "Organization You Founded" },
                { id: "employed", name: "Organization that Employs you" },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default LinkOrganization;
