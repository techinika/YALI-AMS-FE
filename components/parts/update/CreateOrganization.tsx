"use client";

import { MultiSelectSearch } from "@/components/ui/multi-select-search";
import { TailwindInput } from "@/components/ui/tail-input";
import { TailwindSelect } from "@/components/ui/tail-select";
import React from "react";

function CreateOrganization({
  formData2,
  setFormData2,
  wsOptions,
  countries,
  districts,
  sectors,
  states,
  setSelectedCountry,
  setSelectedDistrict,
}: {
  formData2: any;
  setFormData2: any;
  wsOptions: any[];
  countries: any[];
  districts: any[];
  sectors: any[];
  states: any[];
  setSelectedCountry: any;
  setSelectedDistrict: any;
}) {
  const handleWorkingSectorsChange = React.useCallback(
    (values: string[]) => {
      setFormData2((prev: any) => ({
        ...prev,
        workingSectors: values,
      }));
    },
    [setFormData2]
  );

  const handleInputChange = React.useCallback(
    (field: string, value: any) => {
      setFormData2((prev: any) => ({
        ...prev,
        [field]: value,
      }));
    },
    [setFormData2]
  );

  const handleCountryChange = React.useCallback(
    (value: string) => {
      setSelectedCountry(value);
      setFormData2((prev: any) => ({
        ...prev,
        countryId: value,
      }));
    },
    [setFormData2, setSelectedCountry]
  );

  const handleDistrictChange = React.useCallback(
    (value: string) => {
      setSelectedDistrict(value);
      setFormData2((prev: any) => ({
        ...prev,
        districtId: value,
      }));
    },
    [setFormData2, setSelectedDistrict]
  );
  return (
    <div className="px-6 py-4 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <TailwindInput
          label="Organization Name"
          id="org_name"
          value={formData2.name}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleInputChange("name", e.target.value)
          }
          placeholder="Name of this organization"
        />

        <TailwindInput
          label="Organization Website"
          id="org_web"
          value={formData2.website}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleInputChange("website", e.target.value)
          }
          placeholder="https://..."
        />

        <MultiSelectSearch
          label="Working Sectors"
          options={wsOptions}
          value={formData2.workingSectors || []}
          onChange={handleWorkingSectorsChange}
        />

        <TailwindSelect
          label="Country"
          id="org_country"
          value={formData2.countryId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleCountryChange(e.target.value)
          }
          options={countries}
        />

        {formData2.countryId === "RW" && (
          <>
            <TailwindSelect
              label="District"
              id="org_district"
              value={formData2.districtId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleDistrictChange(e.target.value)
              }
              options={districts}
            />
            <TailwindSelect
              label="Sector"
              id="org_sector"
              value={formData2.sectorId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handleInputChange("sectorId", e.target.value)
              }
              options={sectors}
            />
          </>
        )}

        {formData2.countryId !== "RW" && (
          <TailwindSelect
            label="State/Province"
            id="org_state"
            value={formData2.stateId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              handleInputChange("stateId", e.target.value)
            }
            options={states}
          />
        )}

        <TailwindInput
          label="Your position in this organization?"
          id="position"
          value={formData2.position}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleInputChange("position", e.target.value)
          }
          placeholder="Your position in this organization?"
        />
        <TailwindSelect
          label="Relationship with this Organization"
          id="relation"
          value={formData2.relation}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            handleInputChange("relation", e.target.value)
          }
          options={[
            { id: "founded", name: "Organization You Founded" },
            { id: "employed", name: "Organization that Employs you" },
          ]}
        />
      </div>
    </div>
  );
}

export default CreateOrganization;
