"use client";
import React, { useMemo, useState, useCallback } from "react";
import { MdSearch, MdAdd, MdEmail } from "react-icons/md";
import { PageHeader } from "../parts/PageHeader";
import { Delete, Edit, Eye, MessageCircle } from "lucide-react";
import { EmptyState } from "../parts/EmptyState";
import { TableRowSkeleton } from "../ui/skeleton";
import { FilterDropdown } from "../ui/filter-dropdown";
import { Member, userStatusTypes } from "@/types/user";
import InviteUserModal from "../parts/models/InviteUser";
import ConfirmModal from "../parts/models/confirmModal";
import { toastError, toastSuccess } from "@/lib/toast";
import { BiExport } from "react-icons/bi";
import { USER_STATUSES } from "@/helpers/data";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listProfiles, profileToMember } from "@/lib/data/profiles";
import { deleteMember, exportMembers, reinviteMember } from "@/lib/data/members-admin";
import { getOrCreateDirectConversation } from "@/lib/data/chat";
import { listCohorts, listTracks } from "@/lib/data/reference";
import { useCurrentUser } from "@/lib/data/use-current-user";

function csvCell(value: unknown) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

const MemberRow = React.memo(
  ({
    member,
    isAdmin,
    onDelete,
    onView,
    onEdit,
    onMessage,
    onReinvite,
  }: {
    member: Member;
    isAdmin: boolean;
    onDelete: (id: string) => void;
    onView: (id: string) => void;
    onEdit: (id: string) => void;
    onMessage: (id: string) => void;
    onReinvite: (id: string) => void;
  }) => (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        {member?.firstName + " " + (member?.middleName ? member.middleName + " " : "") + member?.lastName}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member.email}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member?.residentCountry?.name ?? "N/A"}</td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{member?.cohort?.name ?? "N/A"} / {member?.track?.name ?? "N/A"}</td>
      {isAdmin && (
        <td className="px-6 py-4 whitespace-nowrap">
          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
            member.status === userStatusTypes.ACTIVE ? "bg-green-100 text-green-800" : member.status === userStatusTypes.INACTIVE ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"
          }`}>{member.status}</span>
        </td>
      )}
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex items-center space-x-4">
        <button onClick={() => onView(member.id)} className="text-primary hover:text-primary/80"><Eye className="w-5 h-5" /></button>
        {isAdmin && member.status === userStatusTypes?.ACTIVE && (
          <button onClick={() => onEdit(member.id)} className="text-primary hover:text-primary/80"><Edit className="w-5 h-5" /></button>
        )}
        {isAdmin && (
          <button onClick={() => onDelete(member.id)} className="text-primary hover:text-primary/80"><Delete className="w-5 h-5" /></button>
        )}
        <button onClick={() => onMessage(member.id)} className="text-primary hover:text-primary/80" aria-label={`Message ${member.firstName}`}><MessageCircle className="w-5 h-5" /></button>
        {isAdmin && member.status === userStatusTypes.INVITED && (
          <button onClick={() => onReinvite(member.id)} className="text-primary hover:text-primary/80" aria-label={`Re-invite ${member.firstName}`}><MdEmail className="w-5 h-5" /></button>
        )}
      </td>
    </tr>
  )
);
MemberRow.displayName = "MemberRow";

const MembersPage = () => {
  const router = useRouter();
  const qc = useQueryClient();
  const { user, role } = useCurrentUser();
  const isAdmin = role === "admin";
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({ country: "", cohort: "", track: "", status: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const MEMBERS_PER_PAGE = 20;

  const { data: cohortsRes } = useQuery({ queryKey: ["ref", "cohorts"], queryFn: async () => (await listCohorts()).data ?? [] });
  const { data: tracksRes } = useQuery({ queryKey: ["ref", "tracks"], queryFn: async () => (await listTracks()).data ?? [] });
  const cohorts = (cohortsRes ?? []) as any[];
  const tracks = (tracksRes ?? []) as any[];

  const { data: profilesRes, isLoading } = useQuery({
    queryKey: ["profiles", currentPage, searchTerm],
    queryFn: async () => {
      const res = await listProfiles({ page: currentPage, limit: MEMBERS_PER_PAGE, search: searchTerm || undefined });
      if (res.error) throw res.error;
      return { data: (res.data ?? []).map(profileToMember) as Member[], count: res.count ?? 0 };
    },
  });

  const members = profilesRes?.data ?? [];
  const totalMembers = profilesRes?.count ?? 0;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await deleteMember(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["profiles"] });
      toastSuccess("Member deleted.");
    },
    onError: () => toastError("Failed to delete member."),
  });

  const reinviteMutation = useMutation({
    mutationFn: (id: string) => reinviteMember(id),
    onSuccess: async (result) => {
      if (result.inviteLink) {
        try {
          await navigator.clipboard.writeText(result.inviteLink);
          toastSuccess("Invitation link copied to your clipboard.");
          return;
        } catch {
          // clipboard unavailable (insecure context); fall through
        }
      }
      toastSuccess("Invitation renewed.");
    },
    onError: (error: Error) => toastError(error.message || "Failed to re-invite the member."),
  });

  const filteredMembers = useMemo(() => {
    return members.filter((member: Member) => {
      const matchesFilters =
        (!filters.cohort || member?.cohort?.name === filters.cohort) &&
        (!filters.track || member?.track?.name === filters.track) &&
        (!filters.status || member?.status === filters.status) &&
        (!filters.country || member?.residentCountry?.name === filters.country);
      return matchesFilters;
    });
  }, [filters, members]);

  const handleView = useCallback((id: string) => router.push(`/dashboard/profile?userId=${id}`), [router]);
  const handleEdit = useCallback((id: string) => router.push(`/dashboard/profile/update?userId=${id}`), [router]);
  const handleMessage = useCallback(
    async (id: string) => {
      try {
        const conversationId = await getOrCreateDirectConversation(id);
        router.push(`/dashboard/chat?rid=${conversationId}`);
      } catch (error) {
        toastError(error instanceof Error ? error.message : "Could not open the chat.");
      }
    },
    [router]
  );

  const handleDelete = async () => {
    if (!itemToDelete) return;
    await deleteMutation.mutateAsync(itemToDelete);
    setDeleteOpen(false);
    setItemToDelete("");
  };

  const exportToExcel = async () => {
    try {
      const rows = await exportMembers();

      const header = [
        "First name", "Middle name", "Last name", "Email", "Phone", "WhatsApp",
        "Gender", "Country", "Province/State", "District", "Sector", "Track",
        "Cohort", "Nearest Landmark", "Organizations", "Relation", "Position",
        "Status", "Created At", "Updated At",
      ];
      const lines = rows.map((row) => [
        row.first_name, row.middle_name ?? "", row.last_name, row.email,
        row.phone ?? "", row.whatsapp ?? "", row.gender_name ?? "",
        row.country_name ?? "", row.state_name ?? "",
        row.district_name ?? "", row.sector_name ?? "",
        row.track_name ?? "", row.cohort_name ?? "", row.nearest_landmark ?? "",
        row.organization_names, row.organization_relations, row.organization_positions,
        row.status,
        row.created_at ? new Date(row.created_at).toLocaleString() : "",
        row.updated_at ? new Date(row.updated_at).toLocaleString() : "",
      ]);

      const csv = [header, ...lines].map((line) => line.map(csvCell).join(",")).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `members-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
      toastSuccess(`${rows.length} members exported.`);
    } catch (error) {
      toastError(error instanceof Error ? error.message : "Export failed.");
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalMembers / MEMBERS_PER_PAGE));

  return (
    <div className="container mx-auto p-4 md:p-8">
      <InviteUserModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} refetchUsers={() => qc.invalidateQueries({ queryKey: ["profiles"] })} />

      {deleteOpen && (
        <ConfirmModal
          title={itemToDelete === user?.id ? "DELETE YOUR OWN PROFILE" : "DELETE MEMBER"}
          description={itemToDelete === user?.id ? "This will mark your account as deleted. This action may be irreversible." : "Are you sure you want to delete this member?"}
          confirmText="Delete"
          cancelText="Cancel"
          isLoading={deleteMutation.isPending}
          action={handleDelete}
          closeModal={() => setDeleteOpen(false)}
        />
      )}

      <PageHeader
        title="Member Directory"
        description="View and manage all members in the AMS community."
        actionTitle="Invite New Member"
        Icon={MdAdd}
        onAction={() => setIsModalOpen(true)}
        loading={false}
        disabled={!isAdmin}
        second={isAdmin}
        actionTitle2="Export Members"
        onAction2={exportToExcel}
        loading2={false}
        disabled2={!isAdmin}
        Icon2={BiExport}
      />

      <div className="bg-white p-5 rounded-xl shadow-lg mb-6">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <div className="flex-1 min-w-50">
            <label className="text-sm font-medium text-gray-600 mb-1 flex items-center"><MdSearch className="w-5 h-5 mr-1" />Search (Name or Email)</label>
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="p-2 border border-gray-300 rounded focus:ring-primary focus:border-primary shadow-sm w-full"
            />
          </div>
          <FilterDropdown title="Cohort" options={cohorts} onChange={(e) => setFilters((p) => ({ ...p, cohort: e.target.value }))} value={filters.cohort} />
          <FilterDropdown title="Track" options={tracks} onChange={(e) => setFilters((p) => ({ ...p, track: e.target.value }))} value={filters.track} />
          {isAdmin && <FilterDropdown title="Status" options={USER_STATUSES || []} onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))} value={filters.status} />}
          <button onClick={() => { setSearchTerm(""); setFilters({ country: "", cohort: "", track: "", status: "" }); setCurrentPage(1); }} className="p-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg transition-colors">Clear Filters</button>
        </div>
        <p className="text-sm text-gray-500 mt-2">Showing <b>{members.length}</b> of <b>{totalMembers}</b> members.{filteredMembers.length !== members.length && <> <b>{filteredMembers.length}</b> match your filters.</>}</p>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200"><tbody>{Array.from({ length: 8 }).map((_, i) => <TableRowSkeleton key={i} />)}</tbody></table>
        </div>
      ) : filteredMembers.length > 0 ? (
        <div className="bg-white rounded-xl shadow-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Country/Province</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cohort/Track</th>
                {isAdmin && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMembers.map((member: Member) => (
                <MemberRow key={member.id} member={member} isAdmin={isAdmin} onDelete={(id) => { setDeleteOpen(true); setItemToDelete(id); }} onView={handleView} onEdit={handleEdit} onMessage={handleMessage} onReinvite={(id) => reinviteMutation.mutate(id)} />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState isFiltered={true} />
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6 px-4 py-3 bg-white rounded-xl shadow-lg">
          <p className="text-sm text-gray-500">Page <b>{currentPage}</b> of <b>{totalPages}</b></p>
          <div className="flex items-center gap-1">
            <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Previous</button>
            <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembersPage;
