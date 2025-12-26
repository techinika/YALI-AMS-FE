"use client";

import { Building2, PlusCircle } from "lucide-react";
import DisplayField from "../../ui/DisplayField";
import { useState } from "react";
import OrganizationLinkModal from "../models/OrganizationLinkModal";
import { getUser } from "@/helpers/auth";

export const NoOrg = ({
  organizations,
  targetId,
  districts,
  countries,
  workingSectors,
}: {
  organizations: any[];
  targetId: string;
  districts: any[];
  countries: any[];
  workingSectors: any[];
}) => {
  const user = getUser();
  const [orgLinkModalOpen, setOrgLinkModalOpen] = useState(false);
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-gray-300 rounded-xl bg-gray-50">
      {orgLinkModalOpen && (
        <OrganizationLinkModal
          closeModal={() => setOrgLinkModalOpen(false)}
          organizations={organizations ?? []}
          userId={targetId}
          districts={districts}
          countries={countries}
          workingSectors={workingSectors}
        />
      )}
      <Building2 className="w-12 h-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-700">
        No organizations yet
      </h3>
      <p className="text-sm text-gray-500 mt-1 mb-4 max-w-sm">
        You haven’t added or been linked to any organization. Click button below
        to create or add an organization so it appears here.
      </p>
      {targetId === user?.id && (
        <button
          onClick={() => setOrgLinkModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Add or Link an Organization
        </button>
      )}
    </div>
  );
};

export const ShowOrganizationOnProfile = ({
  orgs,
  targetId,
  allOrganizations,
  districts,
  countries,
  workingSectors,
}: {
  orgs: any[];
  targetId: string;
  allOrganizations: any[];
  districts: any[];
  countries: any[];
  workingSectors: any[];
}) => {
  if (orgs.length === 0) {
    return (
      <NoOrg
        districts={districts}
        countries={countries}
        workingSectors={workingSectors}
        organizations={allOrganizations}
        targetId={targetId}
      />
    );
  }

  return (
    <div className="space-y-10">
      {orgs.map((org, index) => (
        <div
          key={org?.id}
          className="p-6 rounded-xl border border-gray-200 bg-white shadow-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-base font-semibold text-gray-800">
              Organization {index + 1}
            </h3>
            {org?.relation && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600 capitalize">
                {org.relation}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-500 mb-1">
                Company Name:
              </label>
              <DisplayField text={org?.name} />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-500 mb-1">
                Company Sectors:
              </label>
              <DisplayField
                text={(org?.workingSectors ?? [])
                  .map((v: any) => v.name)
                  .join(", ")}
              />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-500 mb-1">
                Your Position:
              </label>
              <DisplayField text={org?.position} />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-500 mb-1">
                Website:
              </label>
              <DisplayField text={org?.website} />
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-semibold text-gray-500 mb-1">
                Country:
              </label>
              <DisplayField text={org?.country?.name} />
            </div>

            {org?.country?.id === "RW" && (
              <>
                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-500 mb-1">
                    District:
                  </label>
                  <DisplayField text={org?.district?.name} />
                </div>

                <div className="flex flex-col">
                  <label className="text-sm font-semibold text-gray-500 mb-1">
                    Sector:
                  </label>
                  <DisplayField text={org?.sector?.name} />
                </div>
              </>
            )}

            {org?.country?.id !== "RW" && (
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-500 mb-1">
                  State:
                </label>
                <DisplayField text={org?.state?.name} />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
