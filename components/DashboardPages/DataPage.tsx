"use client";

import Cohorts from "../Data/Cohorts";
import Tracks from "../Data/Tracks";
import WorkingSector from "../Data/WorkingSector";
import NotificationSetup from "../Data/NotificationSetup";
import { PageHeader } from "../parts/PageHeader";
import { Settings } from "lucide-react";

function DataPage() {
  return (
    <div className="flex flex-col gap-5 container mx-auto">
      <PageHeader
        title="Data Management"
        description="Manage miscellaneous data used in the application."
        Icon={Settings}
        actionTitle="More Settings"
        onAction={() => {}}
        loading={false}
        disabled={false}

      />
      <div>
        <h2 className="font-bold text-2xl">Setup Notifications</h2>
        <NotificationSetup />
      </div>
      <div>
        <h2 className="font-bold text-2xl py-3">Cohorts Information</h2>
        <Cohorts />
      </div>
      <div>
        <h2 className="font-bold mt-3 text-2xl py-3">Tracks Information</h2>
        <Tracks />
      </div>
      <div>
        <h2 className="font-bold mt-3 text-2xl py-3">
          Working Sector Information
        </h2>
        <WorkingSector />
      </div>
    </div>
  );
}

export default DataPage;
