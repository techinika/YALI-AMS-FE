"use client";

import {
  useAddTrackMutation,
  useDeleteTrackMutation,
  useTracksQuery,
} from "@/lib/features/otherSlice";
import React, { useEffect, useState } from "react";
import dayjs from "dayjs";
import { FiDelete } from "react-icons/fi";
import { CustomInputError } from "../ui/input-error";
import { toastError, toastSuccess } from "@/lib/toast";
import { Track } from "@/types/track";

function Tracks() {
  const [trackName, setTrackName] = useState("");

  const [formErrors, setFormErrors] = useState<{
    name?: string;
  }>({});

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>([]);

  const { data: TracksData, refetch } = useTracksQuery("");
  const [addTrack] = useAddTrackMutation();
  const [deleteTrack] = useDeleteTrackMutation();

  useEffect(() => {
    if (TracksData && TracksData.data) {
      const processedData = TracksData.data
        .map((c: Track) => {
          return {
            id: c.id,
            Name: c?.name,
            CreatedAt: dayjs(new Date()).format("DD-MM-YYYY"),
            isDefault: c?.name === "Not Specified", 
          };
        })
        .sort(
          (a: any, b: any) =>
            new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime()
        );
      setData(processedData);
    }
  }, [TracksData]);

  const handleDelete = async (id: string) => {
    try {
      setLoading(true);
      await deleteTrack(id).unwrap();

      refetch();
      toastSuccess("Track deleted successfully!");
    } catch (error: any) {
      console.error("Delete error:", error);
      toastError("Failed to delete track. Please check permissions.");
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const errors: { name?: string } = {};
    if (!trackName.trim()) {
      errors.name = "Track Name is required.";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toastError("Please provide a track name.");
      return;
    }

    setLoading(true);

    try {
      const res = await addTrack({
        name: trackName,
      }).unwrap();

      if (res) {
        setTrackName("");
        setFormErrors({});
        refetch();
        toastSuccess("Track added successfully!");
      }
    } catch (error: any) {
      console.error("Add track error:", error);
      toastError("Failed to add track. It might already exist.");
    } finally {
      setLoading(false);
    }
  };

  const tableHeaders =
    data.length > 0
      ? Object.keys(data[0]).filter(
          (key) => key !== "id" && key !== "isDefault"
        )
      : ["Name", "CreatedAt", "Action"];

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Section: Add Track Form */}
        <div className="lg:w-1/3 bg-white p-6 rounded-xl shadow-lg border border-gray-100 h-fit">
          <h1 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
            Add Track
          </h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Track Name Input */}
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Track Name:
              </label>
              <input
                type="text"
                id="name"
                value={trackName}
                onChange={(e) => setTrackName(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-primary focus:border-primary transition duration-150"
                required
              />
              <CustomInputError error={formErrors.name} />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className={`w-full px-4 py-2 mt-4 font-bold text-white rounded-lg transition duration-150 shadow-md ${
                loading
                  ? "bg-blue-300 cursor-not-allowed"
                  : "bg-primary hover:bg-primary"
              }`}
              disabled={loading || !trackName.trim()}
            >
              {loading ? "Adding..." : "Add Track"}
            </button>
          </form>
        </div>

        {/* Right Section: Tracks Table */}
        <div className="lg:w-2/3 bg-white p-6 rounded-xl shadow-lg border border-gray-100 overflow-x-auto">
          <h1 className="text-xl font-bold text-gray-800 mb-4 border-b pb-2">
            Tracks List
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
                {data.map((track: any) => (
                  <tr key={track.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {track.Name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {track.CreatedAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        className={`p-2 rounded transition duration-150 ${
                          track.isDefault
                            ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                            : "bg-red-600 text-white hover:bg-red-700"
                        }`}
                        disabled={track.isDefault || loading}
                        onClick={async (e) => {
                          e.preventDefault();
                          await handleDelete(track.id);
                        }}
                        title={
                          track.isDefault
                            ? "Cannot delete default track"
                            : "Delete Track"
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
                      colSpan={3}
                      className="px-6 py-4 text-center text-gray-500 italic"
                    >
                      No tracks found.
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

export default Tracks;
