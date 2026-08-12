"use client";

import React, { useState, useMemo } from "react";
import {
  Lock,
  Eye,
  Zap,
  Shield,
  Globe,
  Bell,
  Accessibility,
  Trash,
  LogOut,
  Settings as SettingsIcon,
} from "lucide-react";
import { ToggleSwitch } from "../ui/toggle-switch";
import { TailwindInput } from "../ui/TailInput";
import { PageHeader } from "../parts/PageHeader";
import { CgPassword } from "react-icons/cg";
import { Button } from "../ui/Button";

const AccountSecurity = () => {
  const [name, setName] = useState("John Doe");
  const [email, setEmail] = useState("john.doe@example.com");

  const handleSave = () => {
    console.log("Account info saved:", { name, email });
  };

  return (
    <div className="space-y-8 p-6">
      <section className="border-t border-gray-100 pt-6 space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <Lock className="w-5 h-5 mr-2 text-primary" />
          Security
        </h2>

        <div className="bg-gray-50 p-4 rounded-xl">
          <ToggleSwitch
            labelText="Two-Factor Authentication (2FA) via App"
            checked={false}
            onChange={() => console.log("Toggle 2FA")}
          />
        </div>

        <div className="pt-4">
          <Button size="md" onClick={() => console.log("Log out all sessions")}>
            <LogOut className="inline w-4 h-4 mr-2" />
            Log Out All Other Sessions
          </Button>
        </div>
      </section>
    </div>
  );
};

const DataPrivacy = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(false);
  const [activityTracking, setActivityTracking] = useState(true);

  return (
    <div className="space-y-8 p-6">
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center mb-2">
          <Bell className="w-5 h-5 mr-2 text-primary" />
          Communication
        </h2>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <ToggleSwitch
            labelText="In-App Notifications (Updates & Alerts)"
            checked={notificationsEnabled}
            onChange={() => setNotificationsEnabled(!notificationsEnabled)}
          />
          <ToggleSwitch
            labelText="Marketing and Promotional Emails"
            checked={emailAlerts}
            onChange={() => setEmailAlerts(!emailAlerts)}
          />
        </div>
      </section>

      {/* Data Usage */}
      <section className="space-y-4 border-t border-gray-100 pt-6">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <Eye className="w-5 h-5 mr-2 text-primary" />
          Data Usage
        </h2>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <ToggleSwitch
            labelText="Allow anonymized activity tracking for improvements"
            checked={activityTracking}
            onChange={() => setActivityTracking(!activityTracking)}
          />
          <p className="text-xs text-gray-500 pt-2">
            Used to optimize performance and features. Your data remains
            anonymous.
          </p>
        </div>
      </section>

      {/* Data Management Actions */}
      <section className="border-t border-gray-100 pt-6 space-y-4">
        <h2 className="text-2xl font-semibold text-gray-800 flex items-center">
          <Trash className="w-5 h-5 mr-2 text-red-500" />
          Data Management
        </h2>
        <p className="text-sm text-gray-500">
          Permanently manage and export your data.
        </p>

        <div className="flex justify-between items-center bg-red-50 p-4 rounded-xl border border-red-200">
          <p className="font-medium text-gray-700">
            Request Data Export (GDPR/CCPA)
          </p>
          <Button size="md" onClick={() => console.log("Request Data Export")}>
            Export My Data
          </Button>
        </div>

        <div className="flex justify-between items-center bg-red-50 p-4 rounded-xl border border-red-200">
          <div className="flex flex-col">
            <p className="font-medium text-red-700">
              Delete Account & All Data
            </p>
            <p className="text-xs text-red-500 mt-1">
              This action is permanent and irreversible.
            </p>
          </div>
          <Button size="md" variant="danger" onClick={() => console.log("Confirm Account Deletion")}>
            Delete
          </Button>
        </div>
      </section>
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
  { id: "data", name: "Data & Privacy", icon: Shield, component: DataPrivacy },
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
        description="Manage your profile, security preferences, and application experience."
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
