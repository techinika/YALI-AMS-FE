"use client";

import { ModalButton } from "@/components/ui/modal-button";
import { MultiSelectSearch } from "@/components/ui/muti-select-search";
import { TailwindInput } from "@/components/ui/tail-input";
import { TailwindSelect } from "@/components/ui/tail-select";
import { getUser } from "@/helpers/auth";
import { useAddNewOrganizationMutation } from "@/lib/features/orgSlice";
import {
  useCountriesQuery,
  useDistrictsQuery,
  useSectorsByDistrictQuery,
  useStatesByCountryQuery,
  useWorkingSectorQuery,
} from "@/lib/features/otherSlice";
import { useAssociateOrganizationMutation } from "@/lib/features/userSlice";
import { toastError, toastSuccess } from "@/lib/toast";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdSearch } from "react-icons/md";

type Organization = {
  id: string;
  name: string;
};

interface OrganizationLinkModalProps {
  closeModal: () => void;
  organizations?: Organization[];
  userId: string;
}

export default function OrganizationLinkModal({
  closeModal,
  organizations = [],
  userId,
}: OrganizationLinkModalProps) {
  const user = getUser();
  const router = useRouter();
  const initData = {
    orgId: 0,
    relation: "",
    position: "",
  };
  const initData2 = {
    name: "",
    website: "",
    countryId: "",
    districtId: "",
    sectorId: "",
    stateId: "",
    relation: "",
    position: "",
    workingSectors: [],
  };
  const [query, setQuery] = useState("");
  const [associateOrganization] = useAssociateOrganizationMutation();
  const [addNewOrganization] = useAddNewOrganizationMutation();
  const [formData, setFormData] = useState(initData);
  const [formData2, setFormData2] = useState(initData2);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sectors, setSectors] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [countries, setCountries] = useState([]);
  const [workingSectors, setWorkingSectors] = useState([]);
  const [states, setStates] = useState<any>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");

  const { data: CountryData } = useCountriesQuery("");
  const { data: DistrictData } = useDistrictsQuery("");
  const { data: WorkingSectorsData } = useWorkingSectorQuery("");

  const { data: SectorsData } = useSectorsByDistrictQuery(selectedDistrict, {
    skip: !selectedDistrict,
  });

  const { data: StatesData } = useStatesByCountryQuery(selectedCountry, {
    skip: selectedCountry === "RW",
  });

  useEffect(() => {
    if (WorkingSectorsData) {
      setWorkingSectors(WorkingSectorsData?.data || []);
    }
  }, [WorkingSectorsData]);

  useEffect(() => {
    if (SectorsData) {
      setSectors(SectorsData?.data || []);
    }
  }, [SectorsData]);

  useEffect(() => {
    if (CountryData) {
      setCountries(CountryData?.data || []);
    }
  }, [CountryData]);

  useEffect(() => {
    if (DistrictData) {
      setDistricts(DistrictData?.data || []);
    }
  }, [DistrictData]);

  useEffect(() => {
    if (StatesData) {
      setStates(StatesData?.data || []);
    }
  }, [StatesData]);

  const filtered = organizations.filter((org) =>
    org.name.toLowerCase().includes(query.toLowerCase())
  );

  const handleOrgLink = async () => {
    setSaving(true);
    try {
      const res = await associateOrganization({
        organizationId: formData?.orgId,
        userId,
        relation: formData?.relation,
        position: formData?.position,
      }).unwrap();

      toastSuccess("Organization Linked Successfully!");
      router.refresh();
    } catch (error) {
      console.log(error);
      toastError("Failed to add/link an organization.");
    } finally {
      closeModal();
      setSaving(false);
    }
  };

  const handleCreateOrganization = async () => {
    setSaving(true);
    try {
      const res = await addNewOrganization({
        name: formData2?.name,
        website: formData2.website,
        addedById: user?.id,
      }).unwrap();
      const res2 = await associateOrganization({
        organizationId: res?.data?.id,
        userId,
        relation: formData2?.relation,
        position: formData2?.position,
      }).unwrap();
      toastSuccess("Organization created and added Successfully!");
    } catch (error) {
      console.log(error);
      toastError(
        "Failed to create a new organization. Try again or contact support!"
      );
    } finally {
      closeModal();
      setSaving(false);
    }
  };

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  const tabs = [
    {
      label: "Link Organization",
      content: (
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
                  onClick={(e: any) =>
                    setFormData((prev) => ({
                      ...prev,
                      orgId: +org?.id,
                    }))
                  }
                  className={`flex justify-between items-center px-2 ${
                    formData?.orgId === +org?.id ? "bg-gray-100" : ""
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

          {formData.orgId !== 0 && (
            <div className="border-t pt-4 flex flex-col gap-3">
              <label className="block text-sm font-medium mb-1">
                Add Additional Data
              </label>
              <TailwindInput
                label="Your position in this organization?"
                id="position"
                value={formData.position}
                onChange={(e: any) =>
                  setFormData((prev) => ({
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
                  setFormData((prev) => ({
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
          )}
        </div>
      ),
    },
    {
      label: "Create Organization",
      content: (
        <div className="px-6 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <TailwindInput
              label="Organization Name"
              id="org_name"
              value={formData2.name}
              onChange={(e: any) =>
                setFormData2((prev) => ({
                  ...prev,
                  name: e.target.value,
                }))
              }
              placeholder="Name of this organization"
            />

            <TailwindInput
              label="Organization Website"
              id="org_web"
              value={formData2.website}
              onChange={(e: any) =>
                setFormData2((prev) => ({
                  ...prev,
                  website: e.target.value,
                }))
              }
              placeholder="https://..."
            />

            <MultiSelectSearch
              label="Working Sectors"
              options={workingSectors ?? []}
              value={formData2.workingSectors || []}
              onChange={(e: any) =>
                setFormData2((prev) => ({
                  ...prev,
                  WorkingSectors: e.target.value,
                }))
              }
            />

            <TailwindSelect
              label="Country"
              id="org_country"
              value={formData2.countryId}
              onChange={(e: any) => {
                setSelectedCountry(e.target.value);
                setFormData2((prev) => ({
                  ...prev,
                  countryId: e.target.value,
                }));
              }}
              options={countries}
            />

            {formData2.countryId === "RW" && (
              <>
                <TailwindSelect
                  label="District"
                  id="org_district"
                  value={formData2.districtId}
                  onChange={(e: any) => {
                    setSelectedDistrict(e.target.value);
                    setFormData2((prev) => ({
                      ...prev,
                      districtId: e.target.value,
                    }));
                  }}
                  options={districts}
                />
                <TailwindSelect
                  label="Sector"
                  id="org_sector"
                  value={formData2.sectorId}
                  onChange={(e: any) =>
                    setFormData2((prev) => ({
                      ...prev,
                      sectorId: e.target.value,
                    }))
                  }
                  options={sectors}
                />
              </>
            )}

            {formData2.countryId !== "RW" && (
              <>
                <TailwindSelect
                  label="State/Province"
                  id="org_state"
                  value={formData2.districtId}
                  onChange={(e: any) =>
                    setFormData2((prev) => ({
                      ...prev,
                      stateId: e.target.value,
                    }))
                  }
                  options={states}
                />
              </>
            )}

            <TailwindInput
              label="Your position in this organization?"
              id="position"
              value={formData2.position}
              onChange={(e: any) =>
                setFormData2((prev) => ({
                  ...prev,
                  position: e.target.value,
                }))
              }
              placeholder="Your position in this organization?"
            />
            <TailwindSelect
              label="Relationship with this Organization"
              id="relation"
              value={formData2.relation}
              onChange={(e: any) =>
                setFormData2((prev) => ({
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
      ),
    },
  ];

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div
        className="fixed inset-0 bg-gray-900 bg-opacity-70 backdrop-blur-sm"
        onClick={closeModal}
      />

      <div className="relative z-50 w-full max-w-5xl rounded-xl bg-white shadow-2xl">
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <MdClose className="w-6 h-6" />
        </button>

        <div className="px-6 pt-6 pb-4 border-b">
          <h3 className="text-xl font-bold text-gray-900">
            Link or Create Organization
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Search for an existing organization or create a new one.
          </p>
        </div>

        <div className="px-6">
          <div className="border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500">
              {tabs.map((tab, index) => (
                <li key={index + 1} className="mr-2">
                  <button
                    type="button"
                    onClick={() => handleTabClick(index)}
                    className={`inline-block p-4 border-b-2 rounded-t-lg transition-colors duration-200 ease-in-out 
                                    ${
                                      index === activeTab
                                        ? "text-primary border-primary font-semibold"
                                        : "hover:text-gray-600 hover:border-gray-300"
                                    }`}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-1 border border-gray-200 rounded-xl bg-gray-50 shadow-inner">
            {tabs[activeTab].content}
          </div>
        </div>

        <div className="bg-gray-50 flex justify-end gap-3 px-6 py-4 rounded-b-xl">
          <ModalButton variant="cancel" onClick={closeModal}>
            Cancel
          </ModalButton>

          <ModalButton
            variant="confirm"
            onClick={activeTab === 0 ? handleOrgLink : handleCreateOrganization}
          >
            {saving ? "Saving..." : "Save"}
          </ModalButton>
        </div>
      </div>
    </div>,
    document.body
  );
}
