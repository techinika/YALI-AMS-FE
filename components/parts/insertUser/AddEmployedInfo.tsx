"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import {
  Country,
  Organization,
  ResidentDistrict,
  ResidentSector,
  State,
  WorkingSector,
} from "@/types/user";
import { EmployedInfoState } from "@/types/company";
import { InputField } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select";
import { useAssociateOrganizationMutation } from "@/lib/features/userSlice";
import {
  useSectorsByDistrictQuery,
  useStatesByCountryQuery,
} from "@/lib/features/otherSlice";
import { Loader2 } from "lucide-react";
import { toastSuccess } from "@/lib/toast";

const initialEmployedInfoState: EmployedInfoState = {
  companyName: "",
  companySector: "",
  companyPosition: "",
  companyWebsite: "",
  companyCountry: null,
  companyState: null,
  companyDistrictName: null,
  companySectorId: null,
};

function AddEmployedInfo({
  organizations,
  workingSectors,
  countries,
  districts,
  onSuccess,
  onError,
  onSkip,
  newId,
}: {
  organizations: Organization[];
  workingSectors: WorkingSector[];
  districts: ResidentDistrict[];
  countries: Country[];
  onSuccess: () => void;
  onError: () => void;
  onSkip: () => void;
  newId: string;
}) {
  const [formData, setFormData] = useState<EmployedInfoState>(
    initialEmployedInfoState
  );
  const [newOrg, setNewOrg] = useState<string | number>("");

  const [employedCountryId, setEmployedCountryId] = useState("");
  const [selectedDistrictEmployedName, setSelectedDistrictEmployedName] =
    useState("");

  const [employedStates, setEmployedStates] = useState<State[]>([]);
  const [sectorsEmployed, setSectorsEmployed] = useState<ResidentSector[]>([]);

  const [associateOrganization, { isLoading }] =
    useAssociateOrganizationMutation();

  const { data: StatesData } = useStatesByCountryQuery(employedCountryId, {
    skip: !employedCountryId,
  });

  const { data: SectorsData } = useSectorsByDistrictQuery(
    selectedDistrictEmployedName,
    {
      skip: !selectedDistrictEmployedName,
    }
  );

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  useEffect(() => {
    if (StatesData?.data) setEmployedStates(StatesData.data);
  }, [StatesData]);

  useEffect(() => {
    if (SectorsData?.data) setSectorsEmployed(SectorsData.data);
  }, [SectorsData]);

  const handleCountryChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const countryId = e.target.value;
    const selectedCountry = countries.find((c) => c.id === countryId);

    setFormData((prev) => ({
      ...prev,
      companyCountry: selectedCountry || null,
      companyState: null,
      companyDistrictName: null,
      companySectorId: null,
    }));

    setEmployedCountryId(countryId);
    setSelectedDistrictEmployedName("");
  };

  const handleDistrictChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const districtId = e.target.value;
    const selectedDistrict = districts.find((d) => d.id === districtId);

    setFormData((prev) => ({
      ...prev,
      companyDistrictName: selectedDistrict || null,
      companySectorId: null,
    }));

    setSelectedDistrictEmployedName(selectedDistrict?.name || "");
  };

  const handleStateChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const stateId = e.target.value;
    const selectedState = employedStates.find((s) => s.id === stateId);

    setFormData((prev) => ({
      ...prev,
      companyState: selectedState || null,
    }));
  };

  const handleNewOrgSelect = (e: ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setNewOrg(value);

    if (value !== "new") {
      const existingOrg = organizations.find((org) => org.id === value);
      console.log("Existing organization selected:", existingOrg);
    }
  };

  const handleSectorChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const sectorId = e.target.value;
    const selectedSector = sectorsEmployed.find((s) => s.id === sectorId);

    setFormData((prev) => ({
      ...prev,
      companySectorId: selectedSector || null,
    }));
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
        toastSuccess("Existing organization associated:"),
          console.log(response);

        onSuccess();
        return;
      }

      const payload = {
        userId: newId,
        mode: "new",
        associationType: "founded",
        newOrganizationData: {
          name: formData?.companyName,
          workingSectorId: formData?.companySector || null,
          website: formData?.companyWebsite || null,
          countryId: formData.companyCountry?.id || null,
          stateId: formData.companyState?.id || null,
          districtId: formData.companyDistrictName?.id || null,
          sectorId: formData.companySectorId?.id || null,
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

  const isRwanda = formData.companyCountry?.id === "RW";
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
        <option value="new">Add a new company/initiative</option>
        {organizations.map((item: Organization) => (
          <option key={item?.id} value={item.id}>
            {item?.name}
          </option>
        ))}
      </SelectField>

      {isNewOrg && (
        <div className="space-y-6 p-6 border-4 border-dashed border-blue-200 rounded-xl bg-blue-50 transition-all duration-300">
          <h3 className="text-xl font-bold text-primary border-b border-blue-200 pb-3">
            Enter Employment Info
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              placeholder="Name of company you work for"
            />

            <InputField
              label="Your Position"
              name="companyPosition"
              value={formData.companyPosition}
              onChange={handleChange}
              placeholder="e.g.: Consultant, Executive, etc."
            />

            <SelectField
              label="Working Sector"
              name="companySector"
              value={formData.companySector}
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
              name="companyWebsite"
              value={formData.companyWebsite}
              onChange={handleChange}
              placeholder="https://example.com"
            />

            <SelectField
              label="Company Location: Country"
              name="companyCountry"
              value={formData.companyCountry?.id || ""}
              onChange={handleCountryChange}
            >
              <option value="" disabled>
                Select a country
              </option>
              {countries.map((country: Country) => (
                <option key={country?.id} value={country?.id}>
                  {country?.name}
                </option>
              ))}
            </SelectField>

            {formData.companyCountry && !isRwanda && (
              <SelectField
                label="State/Province"
                name="companyState"
                value={formData.companyState?.id || ""}
                onChange={handleStateChange}
              >
                <option value="" disabled>
                  Select a state/province
                </option>
                {employedStates.map((state: State) => (
                  <option key={state?.id} value={state?.id}>
                    {state?.name}
                  </option>
                ))}
              </SelectField>
            )}

            {formData.companyCountry && isRwanda && (
              <>
                <SelectField
                  label="District (Rwanda)"
                  name="companyDistrictName"
                  value={formData.companyDistrictName?.id || ""}
                  onChange={handleDistrictChange}
                >
                  <option value="" disabled>
                    Select a district
                  </option>
                  {districts.map((district: ResidentDistrict) => (
                    <option key={district?.id} value={district?.id}>
                      {district?.name}
                    </option>
                  ))}
                </SelectField>
                {formData.companyDistrictName && (
                  <SelectField
                    label="Sector (Rwanda)"
                    name="companySectorId"
                    value={formData.companySectorId?.id || ""}
                    onChange={handleSectorChange}
                  >
                    <option value="" disabled>
                      Select a sector
                    </option>
                    {sectorsEmployed.map((sector: ResidentSector) => (
                      <option key={sector?.id} value={sector?.id}>
                        {sector?.name}
                      </option>
                    ))}
                  </SelectField>
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

export default AddEmployedInfo;
