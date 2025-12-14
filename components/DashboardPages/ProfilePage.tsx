"use client";

import { useEffect, useState } from "react";
import relativeTime from "dayjs/plugin/relativeTime";
import dayjs from "dayjs";
import {
  useChangeMutation,
  useGetOneUserQuery,
} from "@/lib/features/userSlice";
import { Personal } from "../parts/ProfilePagePersonal";
import { Founded } from "../parts/ProfilePageFounded";
import { Employment } from "../parts/ProfilePageEmployment";
import Loading from "@/app/loading";
import ConfirmModal from "../parts/models/confirmModal";
import { Member } from "@/types/user";
import { toastError, toastSuccess } from "@/lib/toast";
import { PageHeader } from "../parts/PageHeader";
import { EditIcon, Nut } from "lucide-react";
import { getUser } from "@/helpers/auth";
import { useRouter, useSearchParams } from "next/navigation";
import { RoleChip } from "../ui/role-chip";
import { useGetOrganizationsForUserQuery } from "@/lib/features/orgSlice";

function ProfilePage() {
  dayjs.extend(relativeTime);
  const authUser: Member = getUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get("userId");

  const [activeTab, setActiveTab] = useState(0);
  const [roleModal, setRoleModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [foundedOrganizations, setFoundedOrganizations] = useState<any[]>([]);
  const [employedOrganizations, setEmployedOrganizations] = useState<any[]>([]);

  const targetId = userId ?? authUser?.id;
  const userProfile = useGetOneUserQuery(targetId, {
    skip: !targetId,
  });

  const { data: organizations, isLoading } =
    useGetOrganizationsForUserQuery(targetId);

  const [change] = useChangeMutation();
  const user: Member = userProfile?.data;

  const isAdmin = authUser?.role?.name === "ADMIN";

  const handleTabClick = (index: number) => {
    setActiveTab(index);
  };

  useEffect(() => {
    if (organizations?.data?.length) {
      const foundedOrgs = organizations.data.filter(
        (org: any) => org.relation === "founded"
      );

      const employedOrgs = organizations.data.filter(
        (org: any) => org.relation === "employed"
      );

      setFoundedOrganizations(foundedOrgs);
      setEmployedOrganizations(employedOrgs);
    }
  }, [organizations]);

  const tabs = [
    {
      label: "Personal Details",
      content: <Personal user={user} />,
    },
    {
      label: "Initiative / Organization",
      content: <Founded orgs={foundedOrganizations} />,
    },
    {
      label: "Employment History",
      content: <Employment orgs={employedOrganizations} />,
    },
  ];

  if (loading || !authUser || isLoading) {
    return <Loading />;
  }

  const handleChangeRole = async () => {
    if (isAdmin) {
      setRoleModal(true);
    } else {
      toastError("You can not change user's role. Contact ADMIN!");
    }
  };

  const changeRole = async () => {
    setLoading(true);
    try {
      if (!targetId) throw new Error("User ID not found for role change.");

      await change(targetId).unwrap();

      toastSuccess("You have changed the user's role.");
      userProfile.refetch();
    } catch (error: any) {
      console.error("Change role error:", error);
      toastError(error?.data?.message || "Failed to change user's role.");
    } finally {
      setLoading(false);
      setRoleModal(false);
    }
  };

  const fullName = `${user?.firstName || ""} ${user?.middleName || ""} ${
    user?.lastName || ""
  }`;

  return (
    <div className="container mx-auto p-4 sm:p-8">
      {roleModal && (
        <ConfirmModal
          cancelText="Cancel"
          confirmText={loading ? "Changing..." : "Change"}
          title="Changing a user's role"
          description="Are you sure you want to change the user's role? Note that if the user was the ADMIN, the user will become a normal USER, and vice-versa."
          closeModal={() => setRoleModal(false)}
          action={changeRole}
        />
      )}

      <PageHeader
        title={userId ? "Member Profile" : "My Profile"}
        description={
          userId
            ? "View member's profile."
            : "View and manage your profile information."
        }
        actionTitle="Update Profile"
        Icon={EditIcon}
        onAction={() => router.push(`/dashboard/profile/update`)}
        loading={false}
        disabled={userId ? true : false}
        second={false}
        actionTitle2=""
        onAction2={() => console.log("ff")}
        loading2={false}
        disabled2={false}
        Icon2={Nut}
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
              <h2 className="font-extrabold text-4xl text-gray-900 truncate">
                {fullName}
              </h2>
              <RoleChip
                roleName={user?.role?.name || "USER"}
                onClick={handleChangeRole}
              />
            </div>

            <p className="text-gray-700 text-lg italic mb-3">
              {user?.bio || "No biography provided. Tell us about yourself!"}
            </p>

            <div className="text-gray-500 text-xs flex flex-wrap gap-4 mt-2">
              <p>
                Created: <b>{dayjs(user?.createdAt).format("DD MMM YYYY")}</b>
              </p>
              <p>
                Last updated: <b>{dayjs(user?.updatedAt).fromNow()}</b>
              </p>
            </div>
          </div>
        </div>

        <div className="p-0">
          <div className="border-b border-gray-200">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-500">
              {tabs.map((tab, index) => (
                <li key={index + 1} className="mr-2">
                  <button
                    type="button"
                    onClick={() => handleTabClick(index)}
                    className={`inline-block p-4 border-b-2 rounded-t-lg transition-colors duration-200 ease-in-out 
                                    ${
                                      index === activeTab
                                        ? "text-primary border-primary font-semibold"
                                        : "hover:text-gray-600 hover:border-gray-300"
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
