"use client";

import {
  useAddCohortMutation,
  useCohortsQuery,
  useDeleteCohortMutation,
} from "@/lib/features/otherSlice";
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { FiDelete } from "react-icons/fi";
import { CustomInputError } from "../ui/input-error";
import { toastError, toastSuccess } from "@/lib/toast";
import { Cohort } from "@/types/cohort";

function Cohorts() {
  const [cohortName, setCohortName] = useState("");
  const [cohortDescription, setCohortDescription] = useState("");

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>([]);

  const { data: CohortsData, refetch } = useCohortsQuery();
  const [addCohort] = useAddCohortMutation();
  const [deleteCohort] = useDeleteCohortMutation();

  useEffect(() => {
    if (CohortsData && CohortsData.data) {
      const processedData = CohortsData.data
        .map((c: Cohort) => {
          return {
            id: c.id,
            Name: c?.name,
            Description: c?.description ?? "",
            CreatedAt: c?.createdAt
              ? dayjs(c.createdAt).format("DD-MM-YYYY")
              : "",
            isDefault: c?.name === "Not Specified",
          };
        })
        .sort(
          (a: any, b: any) =>
            new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime()
        );
      setData(processedData);
    }
  }, [CohortsData]);

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await deleteCohort(id).unwrap();

      refetch();
      toastSuccess("Cohort deleted successfully!");
    } catch (error: any) {
      console.error("Delete error:", error);
      toastError("Failed to delete cohort. Please check permissions.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: { name?: string; description?: string } = {};
    if (!cohortName.trim()) {
      errors.name = "Cohort Name is required.";
    }
    if (!cohortDescription.trim()) {
      errors.description = "Description is required.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toastError("Please fix the errors in the form.");
      return;
    }

    setLoading(true);

    try {
      const res = await addCohort({
        name: cohortName,
        description: cohortDescription,
      }).unwrap();

      setCohortName("");
      setCohortDescription("");
      setFormErrors({});
      refetch();
      toastSuccess("Cohort added successfully!");
    } catch (error: any) {
      console.error("Add cohort error:", error);
      toastError(error?.data?.message || "Failed to add cohort.");
    } finally {
      setLoading(false);
    }
  };

  const tableHeaders =
    data.length > 0
      ? Object.keys(data[0]).filter(
          (key) => key !== "id" && key !== "isDefault"
        )
      : ["Name", "Description", "CreatedAt", "Action"];

  return (
    <div className="p-4 sm:p-6 bg-gray-50 max-h-screen overflow-scroll">
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-1/3 bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit">
          <h1 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
            Add Cohort
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Cohort Name:
              </label>
              <input
                type="text"
                id="name"
                value={cohortName}
                onChange={(e) => setCohortName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-150"
                required
              />
              <CustomInputError error={formErrors.name} />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Description:
              </label>
              <textarea
                rows={4}
                id="description"
                value={cohortDescription}
                onChange={(e) => setCohortDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-150 resize-none"
                required
              />
              <CustomInputError error={formErrors.description} />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full px-4 py-2 mt-4 font-bold text-white rounded-lg transition duration-150 shadow-md ${
                loading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-primary hover:bg-primary"
              }`}
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Cohort"}
            </button>
          </form>
        </div>

        <div className="lg:w-2/3 bg-white p-6 rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
          <h1 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
            Cohorts List
          </h1>

          <div className="min-w-full">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {tableHeaders.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((cohort: any) => (
                  <tr key={cohort.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {cohort.Name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs overflow-hidden truncate">
                      {cohort.Description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {cohort.CreatedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className={`p-2 rounded transition duration-150 ${
                          cohort.isDefault
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                        disabled={cohort.isDefault || loading}
                        onClick={async (e) => {
                          e.preventDefault();
                          await handleDelete(cohort.id);
                        }}
                        title={
                          cohort.isDefault
                            ? "Cannot delete default cohort"
                            : "Delete Cohort"
                        }
                      >
                        <FiDelete className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {data.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-4 text-center text-gray-500 italic"
                    >
                      No cohorts found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cohorts;
