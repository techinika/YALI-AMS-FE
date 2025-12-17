"use client";

import { ModalButton } from "@/components/ui/modal-button";
import { MultiSelectSearch } from "@/components/ui/multi-select-search";
import { TailwindInput } from "@/components/ui/tail-input";
import { TailwindSelect } from "@/components/ui/tail-select";
import { getUser } from "@/helpers/auth";
import {
  useAddNewOrganizationMutation,
  useAddWStoOrgMutation,
} from "@/lib/features/orgSlice";
import {
  useSectorsByDistrictQuery,
  useStatesByCountryQuery,
} from "@/lib/features/otherSlice";
import { useAssociateOrganizationMutation } from "@/lib/features/userSlice";
import { toastError, toastSuccess } from "@/lib/toast";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MdClose, MdSearch } from "react-icons/md";
import LinkOrganization from "../update/LinkOrganization";
import CreateOrganization from "../update/CreateOrganization";

type Organization = {
  id: string;
  name: string;
};

interface OrganizationLinkModalProps {
  closeModal: () => void;
  organizations?: Organization[];
  userId: string;
  workingSectors: any[];
  countries: any[];
  districts: any[];
}

export default function OrganizationLinkModal({
  closeModal,
  organizations = [],
  userId,
  workingSectors,
  countries,
  districts,
}: OrganizationLinkModalProps) {
  const user = getUser();
  const router = useRouter();
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
  const initData = {
    orgId: 0,
    relation: "",
    position: "",
  };
  const [formData, setFormData] = useState(initData);
  const [associateOrganization] = useAssociateOrganizationMutation();
  const [addNewOrganization] = useAddNewOrganizationMutation();
  const [addWStoOrg] = useAddWStoOrgMutation();
  const [formData2, setFormData2] = useState(initData2);
  const [activeTab, setActiveTab] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sectors, setSectors] = useState([]);
  const [states, setStates] = useState<any>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [query, setQuery] = useState("");

  const { data: SectorsData } = useSectorsByDistrictQuery(selectedDistrict, {
    skip: !selectedDistrict,
  });

  const { data: StatesData } = useStatesByCountryQuery(selectedCountry, {
    skip: selectedCountry === "RW",
  });

  useEffect(() => {
    if (SectorsData) {
      setSectors(SectorsData?.data || []);
    }
  }, [SectorsData]);

  useEffect(() => {
    if (StatesData) {
      setStates(StatesData?.data || []);
    }
  }, [StatesData]);

  const filtered = React.useMemo(() => {
    return organizations.filter((org) =>
      org.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [organizations, query]);

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
        website: formData2?.website,
        addedById: user?.id,
        countryId: formData2?.countryId ?? undefined,
        districtId: formData2?.districtId ?? undefined,
        sectorId: formData2?.sectorId ?? undefined,
        stateId: formData2?.stateId ?? undefined,
      }).unwrap();
      const res2 = await associateOrganization({
        organizationId: res?.data?.id,
        userId,
        relation: formData2?.relation,
        position: formData2?.position,
      }).unwrap();
      const addWS = await Promise.all(
        formData2.workingSectors.map((v) =>
          addWStoOrg({
            userId,
            organizationId: res.data.id,
            wsId: v,
          }).unwrap()
        )
      );

      console.log(addWS);
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

  const wsOptions = React.useMemo(
    () =>
      (workingSectors ?? []).map((ws: any) => ({
        id: ws.id,
        name: ws.name,
      })),
    [workingSectors]
  );

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

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
              {["Link Organization", "Create Organization"].map(
                (tab, index) => (
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
                      {tab}
                    </button>
                  </li>
                )
              )}
            </ul>
          </div>

          <div className="mt-1 border border-gray-200 rounded-xl bg-gray-50 shadow-inner">
            {activeTab === 0 && (
              <LinkOrganization
                filtered={filtered}
                formData={formData}
                setFormData={setFormData}
                query={query}
                setQuery={setQuery}
              />
            )}
            {activeTab === 1 && (
              <React.Suspense
                fallback={<div className="text-center p-4">Loading...</div>}
              >
                <CreateOrganization
                  formData2={formData2}
                  setFormData2={setFormData2}
                  wsOptions={wsOptions}
                  countries={countries}
                  districts={districts}
                  setSelectedCountry={setSelectedCountry}
                  setSelectedDistrict={setSelectedDistrict}
                  sectors={sectors}
                  states={states}
                />
              </React.Suspense>
            )}
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
