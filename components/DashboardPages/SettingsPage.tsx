"use client";

import React, { useState, useMemo } from "react";
import { Lock, Download, Trash2, ShieldCheck } from "lucide-react";
import { ToggleSwitch } from "../ui/toggle-switch";
import { TailwindInput } from "../ui/TailInput";
import { PageHeader } from "../parts/PageHeader";
import { CgPassword } from "react-icons/cg";
import { Button } from "../ui/Button";
import { useAppSelector } from "@/lib/hooks";
import {
  useDeleteMyAccountMutation,
  useExportMyDataMutation,
} from "@/lib/features/userSlice";
import { getUserOrCache, AUTH_STORED_DATA } from "@/helpers/auth";
import { deleteCookie } from "cookies-next";
import { toastSuccess, toastError } from "@/lib/toast";

const AccountSecurity = () => {
  return (
    <div className="space-y-8 p-6">
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <Lock className="w-5 h-5 mr-2 text-primary" />
          Security
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl">
          <ToggleSwitch
            labelText="Two-Factor Authentication (2FA)"
            checked={false}
            onChange={() => {}}
            disabled
          />
          <p className="text-xs text-gray-500 pt-2">
            2FA is coming soon. Once enabled, you will be asked for an
            additional code when signing in.
          </p>
        </div>
      </section>
    </div>
  );
};

const DeleteAccountModal = ({
  onClose,
  onDeleted,
}: {
  onClose: () => void;
  onDeleted: () => void;
}) => {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmFirstName, setConfirmFirstName] = useState("");
  const [deleteMyAccount, { isLoading }] = useDeleteMyAccountMutation();

  const user = useAppSelector((state) => state.auth.user) ?? getUserOrCache();

  const matches =
    !!user &&
    confirmEmail.trim().toLowerCase() === user.email?.toLowerCase() &&
    confirmFirstName.trim().toLowerCase() === user.firstName?.toLowerCase();

  const handleDelete = async () => {
    if (!matches) return;

    try {
      await deleteMyAccount({
        email: confirmEmail.trim(),
        firstName: confirmFirstName.trim(),
      }).unwrap();

      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_STORED_DATA.USER);
      }
      deleteCookie(AUTH_STORED_DATA.TOKEN, { path: "/" });
      deleteCookie(AUTH_STORED_DATA.USER, { path: "/" });
      onDeleted();
      window.location.href = "/";
    } catch (error: any) {
      toastError(
        error?.data?.message ||
          "Failed to delete your account. Please try again."
      );
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg transform rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="flex items-center text-xl font-bold text-red-700">
          <Trash2 className="w-5 h-5 mr-2" />
          Delete account & all data
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          This action is permanent and irreversible. All of your profile
          information, messages, organizations, groups, and notifications will
          be removed. Type your <strong>email address</strong> and{" "}
          <strong>first name</strong> below to confirm.
        </p>

        <div className="mt-4 space-y-3">
          <TailwindInput
            label="Your email address"
            type="email"
            value={confirmEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              setConfirmEmail(e.target.value)
            }
            placeholder="Email address"
          />
          <TailwindInput
            label="Your first name"
            type="text"
            value={confirmFirstName}
            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
              setConfirmFirstName(e.target.value)
            }
            placeholder="First name"
          />
          {!matches && (
            <p className="text-xs text-red-500">
              Enter your account email and first name exactly as they appear on
              your profile.
            </p>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button size="md" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="md"
            variant="danger"
            onClick={handleDelete}
            disabled={!matches || isLoading}
          >
            {isLoading ? "Deleting..." : "Permanently delete"}
          </Button>
        </div>
      </div>
    </div>
  );
};

const DataPrivacy = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exportMyData, { isLoading: exporting }] = useExportMyDataMutation();

  const handleExport = async () => {
    let response: any;

    try {
      response = await exportMyData().unwrap();
    } catch (error: any) {
      console.error("Export request failed:", error);
      toastError(
        error?.data?.message ||
          (error?.status
            ? `Failed to export your data (${error.status}). Please try again.`
            : "Failed to export your data. Please try again.")
      );
      return;
    }

    try {
      const blob = new Blob([JSON.stringify(response ?? {}, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `yali-ams-my-data-${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error: any) {
      console.error("Export download failed:", error);
      toastError("Failed to download your data. Please try again.");
      return;
    }

    toastSuccess("Your data has been downloaded.");
  };

  return (
    <div className="space-y-8 p-6">
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <ShieldCheck className="w-5 h-5 mr-2 text-primary" />
          Data Management
        </h2>
        <p className="text-sm text-gray-500">
          Download everything associated with your account, or permanently
          delete it.
        </p>

        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div>
            <p className="font-medium text-gray-700">Download my data</p>
            <p className="text-xs text-gray-500 mt-1">
              Export your profile, messages, organizations, and more as a JSON
              file.
            </p>
          </div>
          <Button size="md" onClick={handleExport} disabled={exporting}>
            <Download className="inline w-4 h-4 mr-2" />
            {exporting ? "Preparing..." : "Export"}
          </Button>
        </div>

        <div className="flex justify-between items-center bg-red-50 p-4 rounded-xl border border-red-200">
          <div>
            <p className="font-medium text-red-700">
              Delete account & all data
            </p>
            <p className="text-xs text-red-500 mt-1">
              This action is permanent and irreversible.
            </p>
          </div>
          <Button
            size="md"
            variant="danger"
            onClick={() => setShowDeleteModal(true)}
          >
            Delete
          </Button>
        </div>
      </section>

      {showDeleteModal && (
        <DeleteAccountModal
          onClose={() => setShowDeleteModal(false)}
          onDeleted={() => {
            toastSuccess("Your account has been deleted.");
            setShowDeleteModal(false);
          }}
        />
      )}
    </div>
  );
};

const settingsTabs = [
  {
    id: "account",
    name: "Account & Security",
    icon: Lock,
    component: AccountSecurity,
  },
  { id: "data", name: "Data & Privacy", icon: ShieldCheck, component: DataPrivacy },
];

const SettingsPage = () => {
  const [activeTabId, setActiveTabId] = useState(settingsTabs[0].id);

  const ActiveContent = useMemo(() => {
    const tab = settingsTabs.find((t) => t.id === activeTabId);
    return tab ? tab.component : null;
  }, [activeTabId]);

  return (
    <div className="p-4 sm:p-6 lg:p-10 bg-gray-50 min-h-screen font-sans">
      <PageHeader
        title="User Settings"
        description="Manage your security preferences and account data."
        Icon={CgPassword}
        actionTitle="Password Settings"
        onAction={() => {}}
        loading={false}
        disabled={false}
      />
      <div className="container mx-auto bg-white rounded-3xl shadow-2xl overflow-hidden">
        <nav className="bg-white border-b border-gray-200 p-4 px-6 sm:px-10">
          <div className="flex flex-wrap space-x-2 sm:space-x-4">
            {settingsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTabId(tab.id)}
                className={`
                  flex items-center px-4 py-2.5 rounded-xl font-semibold transition duration-200 text-sm sm:text-base
                  ${
                    activeTabId === tab.id
                      ? "bg-primary text-white shadow-md"
                      : "text-gray-600 hover:bg-gray-100 hover:text-primary"
                  }
                `}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            ))}
          </div>
        </nav>

        <div className="min-h-[500px]">
          {ActiveContent && <ActiveContent />}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;