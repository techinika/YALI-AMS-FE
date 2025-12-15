"use client";

import DisplayField from "@/components/ui/DisplayField";
import { Member } from "@/types/user";

export const Personal = ({ user }: { user: Member }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-500 mb-1">
          Email:
        </label>
        <DisplayField text={user?.email ?? ""} />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-500 mb-1">
          Phone Number:
        </label>
        <DisplayField text={user?.phoneNumber} />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-500 mb-1">
          WhatsApp Number:
        </label>
        <DisplayField text={user?.whatsappNumber} />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-500 mb-1">
          Gender:
        </label>
        <DisplayField text={user?.genderName} />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-500 mb-1">
          Resident Country:
        </label>
        <DisplayField text={user?.residentCountry?.name} />
      </div>
      {user?.residentCountry && user?.residentCountry?.id === "RW" && (
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-500 mb-1">
            Resident District:
          </label>
          <DisplayField text={user?.residentDistrict?.name} />
        </div>
      )}
      {user?.residentCountry && user?.residentCountry?.id === "RW" && (
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-500 mb-1">
            Resident Sector:
          </label>
          <DisplayField text={user?.residentSector?.name} />
        </div>
      )}
      {user?.residentCountry && user?.residentCountry?.id !== "RW" && (
        <div className="flex flex-col">
          <label className="text-sm font-semibold text-gray-500 mb-1">
            State:
          </label>
          <DisplayField text={user?.state?.name} />
        </div>
      )}
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-500 mb-1">
          Cohort:
        </label>
        <DisplayField text={user?.cohort?.name} />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-500 mb-1">
          Nearest Landmark:
        </label>
        <DisplayField
          text={user?.nearestLandmark ? user?.nearestLandmark : "--"}
        />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-500 mb-1">
          Track:
        </label>
        <DisplayField text={user?.track ? user?.track?.name : "--"} />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-500 mb-1">
          Facebook Account:
        </label>
        <DisplayField text={user?.facebook ? user?.facebook : "--"} />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-500 mb-1">
          Instagram Account:
        </label>
        <DisplayField text={user?.instagram ? user?.instagram : "--"} />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-500 mb-1">
          LinkedIn Account:
        </label>
        <DisplayField text={user?.linkedin ? user?.linkedin : "--"} />
      </div>
      <div className="flex flex-col">
        <label className="text-sm font-semibold text-gray-500 mb-1">
          Twitter Account:
        </label>
        <DisplayField text={user?.twitter ? user?.twitter : "--"} />
      </div>
    </div>
  );
};
