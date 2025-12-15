"use client";

import { PlusCircle } from "lucide-react";
import DisplayField from "../../ui/DisplayField";
import { NoOrg } from "../profile/ShowOrganizations";
import { useRemoveUserOrganizationMutation } from "@/lib/features/userSlice";
import { toastError, toastSuccess } from "@/lib/toast";
import { useState } from "react";
import ConfirmModal from "../models/confirmModal";
import { useRouter } from "next/navigation";
import OrganizationLinkModal from "../models/OrganizationLinkModal";
import { UpdateOrgForm } from "../models/UpdateSingleOrganization";

export const ShowOrganizationToUpdate = ({
  orgs,
  userId,
  refetch,
  organizations,
}: {
  orgs: any[];
  userId: string;
  refetch: any;
  organizations: any[];
}) => {
  const router = useRouter();
  const initDeleteData = {
    orgId: 0,
    userId: "",
    connectionId: "",
    relation: "",
  };
  const [deleteData, setDeleteData] = useState(initDeleteData);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [idToEdit, setIdToEdit] = useState(0);
  const [orgLinkModalOpen, setOrgLinkModalOpen] = useState(false);

  const [removeUserOrganization] = useRemoveUserOrganizationMutation();

  const handleRemoveOrganization = async () => {
    try {
      const res = await removeUserOrganization({
        id: deleteData?.connectionId,
        organizationId: deleteData?.orgId,
        userId: userId,
        relation: deleteData?.relation,
      }).unwrap();
      console.log(res);
      setDeleteData(initDeleteData);
      toastSuccess("Organization removed successfully!");
      router.refresh();
    } catch (error) {
      console.log(error);
      toastError(
        "Error removing the organization, please try again or contact support."
      );
    } finally {
      refetch();
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  };

  if (orgs.length === 0) {
    return <NoOrg organizations={organizations} targetId={userId} />;
  }

  return (
    <div className="space-y-10">
      {deleteOpen && (
        <ConfirmModal
          title="REMOVE ORGANIZATION"
          description="Are you sure you want to delete this organization, please not that this organization will only be removed from your profile. You can add it again later if you wish."
          confirmText="Remove"
          cancelText="Cancel"
          isLoading={deleteLoading}
          action={handleRemoveOrganization}
          closeModal={() => setDeleteOpen(false)}
        />
      )}
      {orgLinkModalOpen && (
        <OrganizationLinkModal
          closeModal={() => setOrgLinkModalOpen(false)}
          organizations={organizations ?? []}
          userId={userId}
        />
      )}

      {editOpen && <UpdateOrgForm closeModal={() => setEditOpen(false)} />}
      <div className="flex items-center justify-center">
        <button
          onClick={() => setOrgLinkModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary/90 transition cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Add or Link a new Organization
        </button>
      </div>
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIdToEdit(org?.id);
                  setEditOpen(true);
                }}
                className="text-xs px-2 py-1 rounded-full bg-green-600 text-white capitalize"
              >
                Edit
              </button>
              <button
                onClick={() => {
                  setDeleteData({
                    orgId: org?.id,
                    userId: org?.user,
                    connectionId: org?.connectId,
                    relation: org?.relation,
                  });
                  setDeleteOpen(true);
                }}
                className="cursor-pointer text-xs px-2 py-1 rounded-full bg-red-600 text-white capitalize"
              >
                Remove
              </button>
            </div>
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
