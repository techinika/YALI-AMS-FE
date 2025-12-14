"use client";

import DisplayField from "../ui/DisplayField";
import { NoOrg } from "./ProfilePageEmployment";

export const Founded = ({ orgs }: { orgs: any[] }) => {
  if (orgs.length === 0) {
    return <NoOrg />;
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
