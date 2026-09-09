"use client";

import { ModalButton } from "@/components/ui/modal-button";
import { useAssociateOrganizationMutation } from "@/lib/features/userSlice";
import { toastError, toastSuccess } from "@/lib/toast";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { MdClose } from "react-icons/md";
import LinkOrganization from "../update/LinkOrganization";

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
  const router = useRouter();
  const initData = {
    orgId: "",
    relation: "",
    position: "",
  };
  const [formData, setFormData] = useState(initData);
  const [associateOrganization] = useAssociateOrganizationMutation();
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = React.useMemo(() => {
    return organizations.filter((org) =>
      org.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [organizations, query]);

  const handleOrgLink = async () => {
    setSaving(true);
    try {
      await associateOrganization({
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

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
      onClick={closeModal}
    >
      <div
        className="relative w-full max-w-5xl rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeModal}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
        >
          <MdClose className="w-6 h-6" />
        </button>

        <div className="px-6 pt-6 pb-4 border-b">
          <h3 className="text-xl font-bold text-gray-900">Link Organization</h3>
          <p className="text-sm text-gray-600 mt-1">
            Search for an existing organization.
          </p>
        </div>

        <div className="px-6">
          <div className="border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500">
              <li className="mr-2">
                <button
                  type="button"
                  className={`inline-block p-4 border-b-2 rounded-t-lg transition-colors duration-200 ease-in-out text-primary border-primary font-semibold`}
                >
                  Link Organization
                </button>
              </li>
            </ul>
          </div>

          <div className="mt-1 border border-gray-200 rounded-xl bg-gray-50 shadow-inner">
            <LinkOrganization
              filtered={filtered}
              formData={formData}
              setFormData={setFormData}
              query={query}
              setQuery={setQuery}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 pb-6">
          <ModalButton variant="cancel" onClick={closeModal}>
            Cancel
          </ModalButton>

          <ModalButton variant="confirm" onClick={handleOrgLink}>
            {saving ? "Saving..." : "Save"}
          </ModalButton>
        </div>
      </div>
    </div>,
    document.body
  );
}
