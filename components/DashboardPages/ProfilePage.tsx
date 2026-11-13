"use client";

import { useState } from "react";
import relativeTime from "dayjs/plugin/relativeTime";
import dayjs from "dayjs";
import Loading from "@/app/loading";
import { Member } from "@/types/user";
import { PageHeader } from "../parts/PageHeader";
import { EditIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { RoleChip } from "../ui/role-chip";
import { Personal } from "../parts/profile/ProfilePagePersonal";
import { ShowOrganizationOnProfile } from "../parts/profile/ShowOrganizations";
import { useQuery } from "@tanstack/react-query";
import { getProfileById, getMyProfile, profileToMember } from "@/lib/data/profiles";
import { listOrganizations, listUserOrganizations } from "@/lib/data/organizations";
import { useCurrentUser } from "@/lib/data/use-current-user";

dayjs.extend(relativeTime);

function ProfilePage() {
  const { user: authUser, role } = useCurrentUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");
  const [activeTab, setActiveTab] = useState(0);

  const targetId = userId || authUser?.id || "";

  const { data: profileRes, isLoading: userLoading, isError: userError } = useQuery({
    queryKey: ["profile", targetId || "me"],
    enabled: !!targetId || !userId,
    queryFn: async () => {
      const res = userId ? await getProfileById(userId) : await getMyProfile();
      if (res.error) throw res.error;
      return res.data ? profileToMember(res.data) : null;
    },
  });

  const { data: userOrgsRes } = useQuery({
    queryKey: ["user-organizations", targetId],
    enabled: !!targetId,
    queryFn: async () => {
      const { data, error } = await listUserOrganizations(targetId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: allOrgsRes } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await listOrganizations();
      if (error) throw error;
      return data ?? [];
    },
  });

  const user = profileRes as Member | null;
  const isAdmin = role === "admin";

  if (userError) {
    return (
      <div className="container mx-auto p-8 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Unable to load profile</h2>
        <p className="text-gray-600">The member profile could not be fetched. Please try again later.</p>
      </div>
    );
  }

  if (userLoading || !user) return <Loading />;

  const userOrgRows = (userOrgsRes ?? []) as any[];
  const foundedOrganizations = userOrgRows
    .filter((r) => r.relation_type === "founded" || r.relation === "founded")
    .map((r) => ({ ...(r.organization || {}), ...r, relation: "founded" }));
  const employedOrganizations = userOrgRows
    .filter((r) => r.relation_type === "employed" || r.relation === "employed")
    .map((r) => ({ ...(r.organization || {}), ...r, relation: "employed" }));
  const allOrganizations = (allOrgsRes ?? []) as any[];

  const tabs = [
    { label: "Personal Details", content: <Personal user={user} /> },
    { label: "Initiative / Organization", content: <ShowOrganizationOnProfile orgs={foundedOrganizations} targetId={targetId} allOrganizations={allOrganizations} /> },
    { label: "Employment History", content: <ShowOrganizationOnProfile orgs={employedOrganizations} targetId={targetId} allOrganizations={allOrganizations} /> },
  ];

  const fullName = `${user?.firstName || ""} ${user?.middleName || ""} ${user?.lastName || ""}`.trim();

  return (
    <div className="container mx-auto p-4 sm:p-8">
      <PageHeader
        title={userId ? "Member Profile" : "My Profile"}
        description={userId ? "View member's profile." : "View and manage your profile information."}
        actionTitle="Update Profile"
        Icon={EditIcon}
        onAction={() => router.push(userId ? `/dashboard/profile/update?userId=${userId}` : "/dashboard/profile/update")}
        loading={false}
        disabled={!isAdmin && !!userId && userId !== authUser?.id}
      />

      <div className="bg-white rounded-xl shadow-2xl overflow-hidden p-6 sm:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start border-b border-gray-100 pb-8 mb-8">
          <div className="shrink-0">
            <img
              src={user?.profileImage?.link || "/placeholder.svg"}
              alt={`${user?.firstName}'s profile`}
              className="w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-full shadow-xl border-4 border-primary/50"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h2 className="font-extrabold text-4xl text-gray-900 truncate">{fullName}</h2>
              <RoleChip roleName={user?.role?.name || "USER"} onClick={() => {}} />
            </div>

            <p className="text-gray-700 text-lg italic mb-3">
              {user?.bio || "No biography provided."}
            </p>

            <div className="text-gray-500 text-xs flex flex-wrap gap-4 mt-2">
              <p>Created: <b>{dayjs(user?.createdAt).format("DD MMM YYYY")}</b></p>
              <p>Last updated: <b>{dayjs(user?.updatedAt).fromNow()}</b></p>
            </div>
          </div>
        </div>

        <div className="p-0">
          <div className="border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500">
              {tabs.map((tab, index) => (
                <li key={index} className="mr-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab(index)}
                    className={`inline-block p-4 border-b-2 rounded-t-lg transition-colors duration-200 ease-in-out ${
                      index === activeTab ? "text-primary border-primary font-semibold" : "hover:text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6 p-6 border border-gray-200 rounded-xl bg-gray-50 shadow-inner">
            {tabs[activeTab].content}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
