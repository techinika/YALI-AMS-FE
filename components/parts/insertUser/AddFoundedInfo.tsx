"use client";

import {
  useSectorsByDistrictQuery,
  useStatesByCountryQuery,
} from "@/lib/features/otherSlice";
import React, { useState, ChangeEvent } from "react";
import {
  Country,
  Organization,
  ResidentDistrict,
  ResidentSector,
  State,
  WorkingSector,
} from "@/types/user";
import { FoundedInfoState } from "@/types/company";
import { SelectField } from "@/components/ui/select";
import { InputField } from "@/components/ui/input";
import { Combobox } from "@/components/ui/combobox";
import { useAssociateOrganizationMutation } from "@/lib/features/userSlice";
import { Loader2 } from "lucide-react";

const initialFoundedInfoState: FoundedInfoState = {
  initiativeName: "",
  mainSector: "",
  foundedPosition: "",
  foundedWebsite: "",
  foundedCountry: null,
  foundedState: null,
  foundedDistrictName: null,
  foundedSectorId: null,
};

function AddFoundedInfo({
  districts,
  countries,
  organizations,
  workingSectors,
  onSuccess,
  onError,
  onSkip,
  newId,
}: {
  districts: ResidentDistrict[];
  countries: Country[];
  organizations: Organization[];
  workingSectors: WorkingSector[];
  onSuccess: () => void;
  onError: () => void;
  onSkip: () => void;
  newId: string;
}) {
  const [formData, setFormData] = useState<FoundedInfoState>(
    initialFoundedInfoState
  );
  const [newOrg, setNewOrg] = useState<string | number>("");

  const [foundedCountryId, setFoundedCountryId] = useState("");
  const [selectedDistrictFoundedName, setSelectedDistrictFoundedName] =
    useState("");

  const [associateOrganization, { isLoading }] =
    useAssociateOrganizationMutation();

  const { data: FoundedStatesData } = useStatesByCountryQuery(
    foundedCountryId,
    {
      skip: !foundedCountryId,
    }
  );

  const { data: SectorsDataFounded } = useSectorsByDistrictQuery(
    selectedDistrictFoundedName,
    {
      skip: !selectedDistrictFoundedName,
    }
  );

  const foundedStates = FoundedStatesData?.data || [];
  const sectorsFounded = SectorsDataFounded?.data || [];

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name as keyof FoundedInfoState]: value,
    }));
  };

  const handleCountryChange = (value: string) => {
    const selectedCountry = countries.find((c) => c.id === value);

    setFormData((prev) => ({
      ...prev,
      foundedCountry: selectedCountry || null,
      foundedState: null,
      foundedDistrictName: null,
      foundedSectorId: null,
    }));

    setFoundedCountryId(value);
    setSelectedDistrictFoundedName("");
  };

  const handleDistrictChange = (value: string) => {
    const selectedDistrict = districts.find((d) => d.id === value);

    setFormData((prev) => ({
      ...prev,
      foundedDistrictName: selectedDistrict || null,
      foundedSectorId: null,
    }));

    setSelectedDistrictFoundedName(selectedDistrict?.name || "");
  };

  const handleStateChange = (value: string) => {
    const stateId = value;
    const selectedState = foundedStates.find((s) => s.id === stateId);

    setFormData((prev) => ({
      ...prev,
      foundedState: selectedState || null,
    }));
  };

  const handleSectorChange = (value: string) => {
    const selectedSector = sectorsFounded.find((s) => s.id === value);

    setFormData((prev) => ({
      ...prev,
      foundedSectorId: selectedSector || null,
    }));
  };

  const handleNewOrgSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setNewOrg(value);

    if (value !== "new") {
      const existingOrg = organizations.find((org) => org.id === value);
      setFormData((prev) => ({
        ...prev,
        initiativeName: existingOrg ? existingOrg.name : "",
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      if (!newOrg) {
        onError();
        return;
      }

      if (newOrg !== "new") {
        const payload = {
          userId: newId,
          mode: "existing",
          existingOrganizationId: Number(newOrg),
          associationType: "founded",
        };

        const response = await associateOrganization(payload).unwrap();
        console.log("Existing organization associated:", response);

        onSuccess();
        return;
      }

      const payload = {
        userId: newId,
        mode: "new",
        associationType: "founded",
        newOrganizationData: {
          name: formData.initiativeName,
          workingSectorId: formData.mainSector || null,
          website: formData.foundedWebsite || null,
          countryId: formData.foundedCountry?.id || null,
          stateId: formData.foundedState?.id || null,
          districtId: formData.foundedDistrictName?.id || null,
          sectorId: formData.foundedSectorId?.id || null,
        },
      };

      const response = await associateOrganization(payload).unwrap();
      console.log("New organization created & associated:", response);

      onSuccess();
    } catch (error) {
      console.error("Error submitting founded info:", error);
      onError();
    }
  };

  const isRwanda = formData.foundedCountry?.id === "RW";
  const isNewOrg = newOrg === "new";

  return (
    <div className="bg-white p-6 md:p-8 rounded-2xl shadow-xl space-y-8 border border-gray-100">
      <SelectField
        label="Choose your organization/initiative:"
        name="organizationSelect"
        value={newOrg}
        onChange={handleNewOrgSelect}
      >
        <option value="" disabled>
          Select an option
        </option>
        <option value="new">Add a new employment company</option>
        {organizations.map((item: Organization) => (
          <option key={item?.id} value={item.id}>
            {item?.name}
          </option>
        ))}
      </SelectField>

      {isNewOrg && (
        <div className="space-y-6 p-6 border-4 border-dashed border-blue-200 rounded-xl bg-blue-50 transition-all duration-300">
          <h3 className="text-xl font-bold text-primary border-b border-blue-200 pb-3">
            Enter New Initiative Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Your Initiative Name"
              name="initiativeName"
              value={formData.initiativeName}
              onChange={handleChange}
              placeholder="Name of your initiative"
            />

            <InputField
              label="Your Position"
              name="foundedPosition"
              value={formData.foundedPosition}
              onChange={handleChange}
              placeholder="e.g.: The Founder, Managing Director, etc"
            />

            <SelectField
              label="Main Sector"
              name="mainSector"
              value={formData.mainSector}
              onChange={handleChange}
            >
              <option value="" disabled>
                Select a sector
              </option>
              {workingSectors.map((sector: WorkingSector) => (
                <option key={sector?.id} value={sector?.id}>
                  {sector?.name}
                </option>
              ))}
            </SelectField>

            <InputField
              label="Website"
              name="foundedWebsite"
              value={formData.foundedWebsite}
              onChange={handleChange}
              placeholder="https://example.com"
            />

            <Combobox
              label="Initiative Location: Country"
              value={formData.foundedCountry?.id || ""}
              onChange={handleCountryChange}
              options={countries.map((c) => ({ id: c.id, name: c.name }))}
              placeholder="Select a country"
            />

            {formData.foundedCountry && !isRwanda && (
              <Combobox
                label="State/Province"
                value={formData.foundedState?.id || ""}
                onChange={handleStateChange}
                options={foundedStates.map((s) => ({ id: s.id, name: s.name }))}
                placeholder="Select a state/province"
              />
            )}

            {formData.foundedCountry && isRwanda && (
              <>
                <Combobox
                  label="District (Rwanda)"
                  value={formData.foundedDistrictName?.id || ""}
                  onChange={handleDistrictChange}
                  options={districts.map((d) => ({ id: d.id, name: d.name }))}
                  placeholder="Select a district"
                />
                {formData.foundedDistrictName && (
                  <Combobox
                    label="Sector (Rwanda)"
                    value={formData.foundedSectorId?.id || ""}
                    onChange={handleSectorChange}
                    options={sectorsFounded.map((s) => ({ id: s.id, name: s.name }))}
                    placeholder="Select a sector"
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}

      <div className="pt-6 border-t mt-8">
        <button
          onClick={handleSubmit}
          disabled={!newOrg}
          className={`w-full md:w-auto px-8 py-3 font-bold rounded-lg shadow-lg transition duration-300 focus:outline-none focus:ring-4
            ${
              !newOrg
                ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                : "bg-primary text-white hover:bg-primary/80 focus:ring-blue-300"
            }
          `}
        >
          {isLoading && <Loader2 className="animate-spin mr-2 inline-block" />}
          {isNewOrg
            ? "Validate & Save Initiative Details"
            : "Use Selected Initiative"}
        </button>
      </div>
    </div>
  );
}

export default AddFoundedInfo;
