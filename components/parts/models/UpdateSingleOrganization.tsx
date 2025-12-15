"use client";

import React, { useEffect, useState } from "react";
import { TailwindInput } from "@/components/ui/tail-input";
import { TailwindSelect } from "@/components/ui/tail-select";
import { MultiSelectSearch } from "@/components/ui/muti-select-search";

import {
  useSectorsByDistrictQuery,
  useStatesByCountryQuery,
} from "@/lib/features/otherSlice";
import { MdClose } from "react-icons/md";
import { ModalButton } from "@/components/ui/modal-button";
import {
  useGetOrganizationByIdQuery,
  useUpdateOrganizationMutation,
} from "@/lib/features/orgSlice";
import { toastError, toastSuccess } from "@/lib/toast";
import { useRouter } from "next/navigation";

interface UpdateOrgProps {
  closeModal: () => void;
  workingSectors: any[];
  countries: any[];
  districts: any[];
  idToEdit: number;
  connectionId: string;
  userId: string;
}

export const UpdateOrgForm: React.FC<UpdateOrgProps> = ({
  closeModal,
  workingSectors,
  countries,
  districts,
  idToEdit,
  connectionId,
  userId,
}) => {
  const router = useRouter();
  const initData2 = {
    orgId: 0,
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

  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData2, setFormData2] = useState(initData2);
  const [sectors, setSectors] = useState([]);
  const [states, setStates] = useState<any>([]);
  const [updateOrganization] = useUpdateOrganizationMutation();

  const { data: SectorsData } = useSectorsByDistrictQuery(selectedDistrict, {
    skip: !selectedDistrict,
  });

  const { data: StatesData } = useStatesByCountryQuery(selectedCountry, {
    skip: !selectedCountry,
  });

  const { data: CurrentOrg } = useGetOrganizationByIdQuery(idToEdit);

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

  useEffect(() => {
    if (!CurrentOrg?.data) return;

    const org = CurrentOrg.data;

    setSelectedCountry(org.countryId);
    setSelectedDistrict(org.districtId);

    setFormData2({
      orgId: org?.id,
      name: org.name ?? "",
      website: org.website ?? "",
      countryId: org.countryId ?? "",
      districtId: org.districtId ?? "",
      sectorId: org.sectorId ?? "",
      stateId: org.stateId ?? "",
      workingSectors: org.workingSectors?.map((v: any) => v.id) ?? [],
      relation: org.relation ?? "",
      position: org.position ?? "",
    });
  }, [CurrentOrg]);

  const handleUpdateOrg = async () => {
    setIsUpdating(true);
    try {
      const res = await updateOrganization({
        name: formData2?.name,
        website: formData2?.website,
        countryId: formData2?.countryId,
        districtId: formData2?.districtId,
        sectorId: formData2?.sectorId,
        stateId: formData2?.stateId,
        relation: formData2?.relation,
        position: formData2?.position,
        userId,
        organizationId: formData2?.orgId,
        connectionId,
      }).unwrap();

      toastSuccess("Organization updated successfully!");
      router.refresh();
    } catch (error) {
      console.log(error);
      toastError(
        "Failed to update organization. Try again or contact support!"
      );
    } finally {
      setIsUpdating(false);
      closeModal();
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

  const handleMultiChange = (key: string) => (values: string[]) => {
    setFormData2((prev) => ({
      ...prev,
      [key]: values,
    }));
  };

  if (!CurrentOrg?.data) {
    return <div className="p-6">Loading...</div>;
  }

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
              options={wsOptions}
              value={formData2.workingSectors || []}
              onChange={handleMultiChange("workingSectors")}
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
                  value={formData2.stateId}
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

        <div className="bg-gray-50 flex justify-end gap-3 px-6 py-4 rounded-b-xl">
          <ModalButton
            onClick={closeModal}
            variant="cancel"
            disabled={isUpdating}
          >
            Cancel
          </ModalButton>

          <ModalButton
            onClick={handleUpdateOrg}
            variant="confirm"
            disabled={isUpdating}
          >
            {isUpdating ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Updating...
              </span>
            ) : (
              "Update"
            )}
          </ModalButton>
        </div>
      </div>
    </div>
  );
};
