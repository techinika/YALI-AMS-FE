"use client";

import React, { useEffect, useState } from "react";
import { TailwindInput } from "@/components/ui/tail-input";
import { TailwindSelect } from "@/components/ui/tail-select";
import { MultiSelectSearch } from "@/components/ui/muti-select-search";

import {
  useCountriesQuery,
  useDistrictsQuery,
  useSectorsByDistrictQuery,
  useStatesByCountryQuery,
  useWorkingSectorQuery,
} from "@/lib/features/otherSlice";
import { MdClose } from "react-icons/md";

interface UpdateOrgProps {
  closeModal: () => void;
}

export const UpdateOrgForm: React.FC<UpdateOrgProps> = ({ closeModal }) => {
  const [form, setForm] = useState<any>({
    initiativeName: "",
    workingSectors: [],
    foundedPosition: "",
    foundedWebsite: "",
    foundedCountry: "",
    foundedDistrictName: "",
    foundedSectorId: "",
  });

  const [country, setCountry] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const { data: workingSectorsData } = useWorkingSectorQuery("");
  const { data: countryData } = useCountriesQuery("");
  const { data: districtData } = useDistrictsQuery("");

  const { data: sectorsData } = useSectorsByDistrictQuery(selectedDistrict, {
    skip: !selectedDistrict,
  });

  const { data: statesData } = useStatesByCountryQuery(country, {
    skip: !country,
  });

  const workingSectors = workingSectorsData?.data ?? [];
  const countries = countryData?.data ?? [];
  const districts = districtData?.data ?? [];
  const sectors = sectorsData?.data ?? [];

  const handleChange = (e: any) => {
    const { id, value } = e.target;
    setForm((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleUpdateOrg = () => {
    setIsUpdating(true)
    try {
    } catch (error) {}
    finally{
        setIsUpdating(false)
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center p-4"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm"
        onClick={closeModal}
      ></div>

      <div className="relative z-50 w-full max-w-4xl transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all">
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            Update Organization
          </h3>
          <button
            onClick={closeModal}
            className="text-gray-400 hover:text-gray-600"
          >
            <MdClose className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <TailwindInput
            label="Your Initiative Name"
            id="initiativeName"
            value={form.initiativeName}
            onChange={handleChange}
          />

          {/* <MultiSelectSearch
            label="Working Sectors"
            options={workingSectors}
            value={form.workingSectors}
            onChange={(vals) =>
              setForm((prev: any) => ({
                ...prev,
                workingSectors: vals,
              }))
            }
          /> */}

          <TailwindInput
            label="Your Position"
            id="foundedPosition"
            value={form.foundedPosition}
            onChange={handleChange}
          />

          <TailwindInput
            label="Website"
            id="foundedWebsite"
            value={form.foundedWebsite}
            onChange={handleChange}
          />

          <TailwindSelect
            label="Country"
            id="foundedCountry"
            value={form.foundedCountry}
            onChange={(e: any) => {
              handleChange(e);
              setCountry(e.target.value);
            }}
            options={countries}
          />

          {form.foundedCountry === "RW" && (
            <>
              <TailwindSelect
                label="District"
                id="foundedDistrictName"
                value={form.foundedDistrictName}
                onChange={(e: any) => {
                  handleChange(e);
                  setSelectedDistrict(e.target.value);
                }}
                options={districts}
              />

              <TailwindSelect
                label="Sector"
                id="foundedSectorId"
                value={form.foundedSectorId}
                onChange={handleChange}
                options={sectors}
              />
            </>
          )}

          <div className="p-6 bg-gray-50 flex justify-end space-x-3 rounded-b-xl">
            <button
              onClick={closeModal}
              disabled={isUpdating}
              className="px-6 py-2 font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdateOrg}
              disabled={isUpdating}
              className={`px-6 py-2 font-medium text-white rounded-lg transition duration-150 flex items-center`}
            >
              {isUpdating ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-3"
                    viewBox="0 0 24 24"
                  >
                    ...
                  </svg>
                  Updating...
                </>
              ) : (
                "Update"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
