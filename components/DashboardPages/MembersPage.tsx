"use client";
import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  MdSearch,
  MdAdd,
} from "react-icons/md";
import { PageHeader } from "../parts/PageHeader";
import { Delete, Edit, Eye, MessageCircle, Redo2 } from "lucide-react";
import { EmptyState } from "../parts/EmptyState";
import { Skeleton, TableRowSkeleton } from "../ui/skeleton";
import {
  useDeleteUserMutation,
  useExportUsersMutation,
  useReInviteUserMutation,
  useLazyUsersQuery,
} from "@/lib/features/userSlice";
import {
  useCohortsQuery,
  useTracksQuery,
} from "@/lib/features/otherSlice";
import { FilterDropdown } from "../ui/filter-dropdown";
import { Combobox } from "../ui/combobox";
import { Member, userStatusTypes } from "@/types/user";
import InviteUserModal from "../parts/models/InviteUser";
import ConfirmModal from "../parts/models/confirmModal";
import { toastError, toastSuccess } from "@/lib/toast";
import { getUser } from "@/helpers/auth";
import { BiExport } from "react-icons/bi";
import { USER_STATUSES } from "@/helpers/data";
import { useRouter } from "next/navigation";
import { logout } from "@/helpers/logout";

const MemberRow = React.memo(
  ({
    member,
    isAdmin,
    onDelete,
    onReInvite,
    onView,
    onEdit,
    onMessage,
  }: {
    member: Member;
    isAdmin: boolean;
    onDelete: (id: string) => void;
    onReInvite: (id: string) => void;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onMessage: (id: string) => void;
  }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {member?.firstName + " " + (member?.middleName ? member.middleName + " " : "") + member?.lastName}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {member.email}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {member?.residentCountry?.name ?? "N/A"}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {member?.cohort?.name ?? "N/A"} / {member?.track?.name ?? "N/A"}
      </td>
      {isAdmin && (
        <td className="px-6 py-4 whitespace-nowrap">
          <span
            title={
              member.status === userStatusTypes.ACTIVE
                ? "This user has started using this account."
                : member.status === userStatusTypes?.INACTIVE
                  ? "User's account is created, but the user has not set the password or logged in once."
                  : member.status === userStatusTypes?.INVITED
                    ? "User has been invited to confirm their account, but they have not set the password or logged in once."
                    : "User is deleted."
            }
            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
              member.status === userStatusTypes.ACTIVE
                ? "bg-green-100 text-green-800"
                : member.status === userStatusTypes.INACTIVE
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-red-100 text-red-800"
            }`}
          >
            {member.status}
          </span>
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center space-x-4">
        <button onClick={() => onView(member.id)} className="text-primary hover:text-primary/80">
          <Eye className="w-5 h-5" />
        </button>
        {isAdmin && member.status === userStatusTypes?.ACTIVE && (
          <button onClick={() => onEdit(member.id)} className="text-primary hover:text-primary/80">
            <Edit className="w-5 h-5" />
          </button>
        )}
        {isAdmin && member.status === userStatusTypes?.INVITED && (
          <button onClick={() => onReInvite(member.id)} className="text-primary hover:text-primary/80">
            <Redo2 className="w-5 h-5" />
          </button>
        )}
        {isAdmin && (
          <button onClick={() => onDelete(member.id)} className="text-primary hover:text-primary/80">
            <Delete className="w-5 h-5" />
          </button>
        )}
        <button onClick={() => onMessage(member.id)} className="text-primary hover:text-primary/80">
          <MessageCircle className="w-5 h-5" />
        </button>
      </td>
    </tr>
  )
);

const MembersTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country/Province</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cohort/Track</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
          <th className="px-6 py-3"></th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {Array.from({ length: rows }).map((_, i) => (
          <TableRowSkeleton key={i} />
        ))}
      </tbody>
    </table>
  </div>
);

const MembersPage = () => {
  const router = useRouter();
  const authUser: Member | null = getUser();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    country: "",
    cohort: "",
    track: "",
    status: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reInviteOpen, setReInviteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState("");
  const [itemToReInvite, setItemToReInvite] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [reInviteLoading, setReInviteLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMembers, setTotalMembers] = useState(0);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const MEMBERS_PER_PAGE = 20;
  const isAdmin = authUser?.role?.name === "ADMIN";
  const isDeletingSelf = itemToDelete && itemToDelete === authUser?.id;

  const [deleteUser, { isLoading }] = useDeleteUserMutation();
  const [reInviteUser] = useReInviteUserMutation();
  const [exportUsers] = useExportUsersMutation();

  const [fetchUsers] = useLazyUsersQuery();

  const loadMembers = useCallback(
    async (page: number) => {
      if (loadingMore) return;
      if (page === 1) {
        setIsInitialLoading(true);
      } else {
        setLoadingMore(true);
      }
      try {
        const result = await fetchUsers({
          page,
          limit: MEMBERS_PER_PAGE,
        }).unwrap();
        setMembers(result.data);
        setCurrentPage(page);
        setTotalMembers(result.total ?? result.data.length);
      } catch (error) {
        console.error("Failed to load members:", error);
      } finally {
        setIsInitialLoading(false);
        setLoadingMore(false);
      }
    },
    [fetchUsers, loadingMore]
  );

  const memberDataRefetch = useCallback(() => loadMembers(currentPage), [loadMembers, currentPage]);

  useEffect(() => {
    loadMembers(1);
  }, [loadMembers]);

  const {
    data: cohortsData,
  } = useCohortsQuery("");

  const {
    data: tracksData,
  } = useTracksQuery("");

  const cohorts = cohortsData?.data || [];
  const tracks = tracksData?.data || [];

  const filteredMembers = useMemo(() => {
    return members.filter(
      (member: Member) => {
        const matchesSearch =
          member?.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member?.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesFilters =
          (!filters.country ||
            member?.residentCountry?.name === filters.country) &&
          (!filters.cohort || member?.cohort?.name === filters.cohort) &&
          (!filters.track || member?.track?.name === filters.track) &&
          (!filters.status || member?.status === filters.status);

        return matchesSearch && matchesFilters;
      },
    );
  }, [searchTerm, filters, members]);

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleView = useCallback((id: string) => {
    router.push(`/dashboard/profile?userId=${id}`);
  }, [router]);

  const handleEdit = useCallback((id: string) => {
    router.push(`/dashboard/profile/update?userId=${id}`);
  }, [router]);

  const handleMessage = useCallback((id: string) => {
    router.push(`/dashboard/chat?rid=${id}`);
  }, [router]);

  const handleDelete = async () => {
    setDeleteLoading(true);
    try {
      const data = await deleteUser(itemToDelete).unwrap();
      toastSuccess(data.message);
      if (isDeletingSelf) {
        logout();
        router.push("/");
        return;
      }
      memberDataRefetch();
    } catch (error) {
      console.log(error);
      toastError(
        `There was an error while deleting user, please try again or contact support!`,
      );
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  };

  const handleReInvite = async () => {
    setReInviteLoading(true);
    try {
      const data = await reInviteUser({ id: itemToReInvite }).unwrap();
      toastSuccess(data.message);
      memberDataRefetch();
    } catch (error) {
      console.log(error);
      toastError(
        `There was an error while re-inviting user, please try again or contact support!`,
      );
    } finally {
      setReInviteLoading(false);
      setReInviteOpen(false);
    }
  };

  const exportToExcel = async () => {
    setExporting(true);

    try {
      const res = await exportUsers();
      window.open(res?.data?.downloadUrl);
      toastSuccess("Excel file exported successfully!");
    } catch (error) {
      console.error(error);
      toastError("Failed to export Excel file.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <InviteUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        refetchUsers={memberDataRefetch}
      />

      {deleteOpen && (
        <ConfirmModal
          title={isDeletingSelf ? "DELETE YOUR OWN PROFILE" : "DELETE MEMBER"}
          description={
            isDeletingSelf
              ? "WARNING: You are about to delete your own profile. This will permanently remove your account and log you out. This action is irreversible. Do you want to proceed?"
              : "Are you sure you want to delete this member? Please note that this action is irreversible."
          }
          confirmText={isDeletingSelf ? "Yes, Delete My Account" : "Delete"}
          cancelText="Cancel"
          isLoading={deleteLoading || isLoading}
          action={handleDelete}
          closeModal={() => setDeleteOpen(false)}
        />
      )}

      {reInviteOpen && (
        <ConfirmModal
          title="RE-INVITE MEMBER"
          description="This members account has been created, but they have not accessed it yet. Re-sending the invitation email will allow them to set their password and access their account. Do you want to proceed?"
          confirmText="Proceed"
          cancelText="Cancel"
          isLoading={reInviteLoading}
          action={handleReInvite}
          closeModal={() => setReInviteOpen(false)}
        />
      )}

      <PageHeader
        title="Member Directory"
        description="View and manage all members in the AMS community, or invite new members."
        actionTitle="Invite New Member"
        Icon={MdAdd}
        onAction={() => setIsModalOpen(true)}
        loading={false}
        disabled={!isAdmin}
        second={isAdmin}
        actionTitle2="Export Members"
        onAction2={exportToExcel}
        loading2={exporting}
        disabled2={isAdmin ? false : true}
        Icon2={BiExport}
      />

      <div className="bg-white p-5 rounded-xl shadow-lg mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div className="flex-1 min-w-50">
            <label className="text-sm font-medium text-gray-600 mb-1 flex items-center">
              <MdSearch className="w-5 h-5 mr-1" />
              Search (Name or Email)
            </label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
              }}
              className="p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary shadow-sm w-full"
            />
          </div>

          <FilterDropdown
            title="Cohort"
            options={cohorts}
            onChange={(e) => handleFilterChange("cohort", e.target.value)}
            value={filters.cohort}
          />
          <FilterDropdown
            title="Track"
            options={tracks}
            onChange={(e) => handleFilterChange("track", e.target.value)}
            value={filters.track}
          />
          {isAdmin && (
            <FilterDropdown
              title="Status"
              options={USER_STATUSES || []}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              value={filters.status}
            />
          )}

          <button
            onClick={() => {
              setSearchTerm("");
              setFilters({ country: "", cohort: "", track: "", status: "" });
            }}
            className="p-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors"
          >
            Clear Filters
          </button>
        </div>
        {isInitialLoading ? (
          <Skeleton className="h-5 w-48" />
        ) : (
          <p className="text-sm text-gray-500 mt-2">
            Showing <b>{members.length}</b> of <b>{totalMembers}</b> members.
            {filteredMembers.length !== members.length && (
              <> <b>{filteredMembers.length}</b> match your filters.</>
            )}
          </p>
        )}
      </div>

      {isInitialLoading ? (
        <MembersTableSkeleton rows={10} />
      ) : filteredMembers.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country/Province
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cohort/Track
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member: Member) => (
                <MemberRow
                  key={member.id}
                  member={member}
                  isAdmin={isAdmin}
                  onDelete={(id) => {
                    setDeleteOpen(true);
                    setItemToDelete(id);
                  }}
                  onReInvite={(id) => {
                    setReInviteOpen(true);
                    setItemToReInvite(id);
                  }}
                  onView={handleView}
                  onEdit={handleEdit}
                  onMessage={handleMessage}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState isFiltered={true} />
      )}

      {totalMembers > MEMBERS_PER_PAGE && (
        <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white rounded-xl shadow-lg">
          <p className="text-sm text-gray-500">
            Page <b>{currentPage}</b> of <b>{Math.ceil(totalMembers / MEMBERS_PER_PAGE)}</b>
          </p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => loadMembers(currentPage - 1)}
              disabled={currentPage === 1 || loadingMore}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.ceil(totalMembers / MEMBERS_PER_PAGE) }, (_, i) => i + 1)
              .filter((page) => {
                const totalPages = Math.ceil(totalMembers / MEMBERS_PER_PAGE);
                if (totalPages <= 7) return true;
                if (page === 1 || page === totalPages) return true;
                if (Math.abs(page - currentPage) <= 1) return true;
                return false;
              })
              .reduce<(number | "ellipsis")[]>((acc, page, idx, arr) => {
                if (idx > 0 && page - (arr[idx - 1] as number) > 1) {
                  acc.push("ellipsis");
                }
                acc.push(page);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "ellipsis" ? (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1.5 text-sm text-gray-400">
                    ...
                  </span>
                ) : (
                  <button
                    key={item}
                    onClick={() => loadMembers(item)}
                    disabled={loadingMore}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      item === currentPage
                        ? "bg-primary text-white"
                        : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {item}
                  </button>
                )
              )}
            <button
              onClick={() => loadMembers(currentPage + 1)}
              disabled={currentPage >= Math.ceil(totalMembers / MEMBERS_PER_PAGE) || loadingMore}
              className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
