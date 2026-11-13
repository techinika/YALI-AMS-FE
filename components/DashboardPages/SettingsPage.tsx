"use client";

import React, { useState } from "react";
import { Lock, Download, Trash2, ShieldCheck } from "lucide-react";
import { ToggleSwitch } from "../ui/toggle-switch";
import { TailwindInput } from "../ui/TailInput";
import { PageHeader } from "../parts/PageHeader";
import { CgPassword } from "react-icons/cg";
import { Button } from "../ui/Button";
import { getSupabaseBrowserClient } from "@/lib/data/client";
import { toastSuccess, toastError } from "@/lib/toast";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
            2FA is coming soon.
          </p>
        </div>
      </section>
    </div>
  );
};

const DeleteAccountModal = ({
  onClose,
}: {
  onClose: () => void;
}) => {
  const [confirmEmail, setConfirmEmail] = useState("");
  const [confirmFirstName, setConfirmFirstName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirmEmail.trim() || !confirmFirstName.trim()) return;
    setIsLoading(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      const email = data.user?.email?.toLowerCase();
      const first = (data.user?.user_metadata?.first_name as string | undefined)?.toLowerCase();
      if (email !== confirmEmail.trim().toLowerCase() || first !== confirmFirstName.trim().toLowerCase()) {
        toastError("Confirmation details do not match your account.");
        return;
      }
      const { error } = await supabase.rpc("delete_own_account");
      if (error) throw error;
      await supabase.auth.signOut();
      toastSuccess("Your account has been deleted.");
      onClose();
      router.push("/");
      router.refresh();
    } catch {
      toastError("Failed to process request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="relative w-full max-w-lg transform rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="flex items-center text-xl font-bold text-red-700">
          <Trash2 className="w-5 h-5 mr-2" />
          Delete account & all data
        </h3>
        <p className="mt-2 text-sm text-gray-600">
          Type your <strong>email address</strong> and <strong>first name</strong> to confirm.
        </p>
        <div className="mt-4 space-y-3">
          <TailwindInput label="Your email address" type="email" value={confirmEmail} onChange={(e: any) => setConfirmEmail(e.target.value)} placeholder="Email address" />
          <TailwindInput label="Your first name" type="text" value={confirmFirstName} onChange={(e: any) => setConfirmFirstName(e.target.value)} placeholder="First name" />
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button size="md" onClick={onClose}>Cancel</Button>
          <Button size="md" variant="danger" onClick={handleDelete} disabled={isLoading}>{isLoading ? "Processing..." : "Confirm"}</Button>
        </div>
      </div>
    </div>
  );
};

const DataPrivacy = () => {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;

      let profile = null;
      let organizations: unknown[] = [];
      let notifications: unknown[] = [];

      if (userId) {
        const [profileRes, orgsRes, notificationsRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
          supabase
            .from("user_organizations")
            .select("id, relation, position, created_at, organization:organizations(id, name, sector)")
            .eq("user_id", userId),
          supabase
            .from("notifications")
            .select("id, title, message, link, opened, created_at")
            .eq("receiver_id", userId)
            .order("created_at", { ascending: false }),
        ]);
        profile = profileRes.data ?? null;
        organizations = orgsRes.data ?? [];
        notifications = notificationsRes.data ?? [];
      }

      const blob = new Blob(
        [
          JSON.stringify(
            {
              exportedAt: new Date().toISOString(),
              auth: data.user ? { id: data.user.id, email: data.user.email } : null,
              profile,
              organizations,
              notifications,
            },
            null,
            2
          ),
        ],
        { type: "application/json" }
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `yali-ams-my-data-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toastSuccess("Your data has been downloaded.");
    } catch {
      toastError("Failed to export your data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-8 p-6">
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <ShieldCheck className="w-5 h-5 mr-2 text-primary" />
          Data Management
        </h2>
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <div>
            <p className="font-medium text-gray-700">Download my data</p>
            <p className="text-xs text-gray-500 mt-1">Export available account data as JSON.</p>
          </div>
          <Button size="md" onClick={handleExport} disabled={exporting}>
            <Download className="inline w-4 h-4 mr-2" />
            {exporting ? "Preparing..." : "Export"}
          </Button>
        </div>
        <div className="flex justify-between items-center bg-red-50 p-4 rounded-xl border border-red-200">
          <div>
            <p className="font-medium text-red-700">Delete account & all data</p>
            <p className="text-xs text-red-500 mt-1">This action is permanent and irreversible.</p>
          </div>
          <Button size="md" variant="danger" onClick={() => setShowDeleteModal(true)}>Delete</Button>
        </div>
      </section>
      {showDeleteModal && <DeleteAccountModal onClose={() => setShowDeleteModal(false)} />}
    </div>
  );
};

const settingsTabs = [
  { id: "account", name: "Account & Security", icon: Lock, component: AccountSecurity },
  { id: "data", name: "Data & Privacy", icon: ShieldCheck, component: DataPrivacy },
  {
    id: "password",
    name: "Password",
    icon: CgPassword,
    component: () => (
      <div className="space-y-4 p-6">
        <p className="text-sm text-gray-600">Password changes are handled by Supabase Auth.</p>
        <Link
          href="/dashboard/change-password"
          className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Change password
        </Link>
      </div>
    ),
  },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(settingsTabs[0].id);
  const ActiveComponent = settingsTabs.find((tab) => tab.id === activeTab)?.component || AccountSecurity;
  return (
    <div className="min-h-screen bg-gray-100">
      <PageHeader
        title="Settings"
        description="Manage your account preferences and privacy."
        actionTitle=""
        Icon={ShieldCheck}
        loading={false}
        disabled={true}
      />
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[70vh]">
        <nav className="md:w-64 p-4 border-b md:border-b-0 md:border-r border-gray-100 bg-gray-50 flex-shrink-0">
          <ul className="space-y-1 flex md:flex-col overflow-x-auto md:overflow-x-visible">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <li key={tab.id} className="min-w-max md:min-w-full">
                  <button onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center px-4 py-3 rounded-xl text-sm font-medium transition ${isActive ? "bg-primary text-white" : "text-gray-700 hover:bg-gray-100"}`}>
                    <Icon className="w-5 h-5 mr-3" />
                    {tab.name}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
        <main className="flex-1 p-4 md:p-8 overflow-y-auto">
          <ActiveComponent />
        </main>
      </div>
    </div>
  );
}
