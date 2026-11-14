"use client";

import React, { useMemo, useState } from "react";
import { TailwindInput } from "../ui/TailInput";
import { MultiSelectSearch } from "../ui/multi-select-search";
import { TailwindSelect } from "../ui/tail-select";
import { Combobox } from "../ui/combobox";
import { PageHeader } from "../parts/PageHeader";
import { Building2, Edit, Globe, MapPin, PlusCircle, Save, Search } from "lucide-react";
import { toastError, toastSuccess } from "@/lib/toast";
import Link from "next/link";
import { MdCancel } from "react-icons/md";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "@/lib/data/use-current-user";
import {
  associateUserToOrganization,
  createOrganization,
  listUserOrganizations,
  setOrganizationWorkingSectors,
  setUserOrganizationWorkingSectors,
  updateOrganization,
} from "@/lib/data/organizations";
import {
  listCountries,
  listDistricts,
  listSectorsByDistrict,
  listStatesByCountry,
  listWorkingSectors,
} from "@/lib/data/reference";

const OrganizationCard = React.memo(
  ({
    org,
    editMode,
    selectedOrgId,
    onSelect,
  }: {
    org: any;
    editMode: boolean;
    selectedOrgId: string | null;
    onSelect: () => void;
  }) => (
    <button
      onClick={onSelect}
      className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer text-left
        ${editMode ? "hover:border-primary" : "border-slate-200"}
        ${selectedOrgId === org?.id ? "border-primary ring-2 ring-primary/20" : ""}
      `}
      disabled={!editMode}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-primary">
          <Building2 size={20} />
        </div>
        {org.website && (
          <Link
            href={org.website.startsWith("http") ? org.website : `https://${org.website}`}
            target="_blank"
            className="text-slate-400 hover:text-primary"
            rel="noopener noreferrer"
          >
            <Globe size={16} />
          </Link>
        )}
      </div>
      <h3 className="font-bold text-lg mb-1">{org?.name}</h3>
      <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
        <MapPin size={14} />
        {org?.country?.id || org?.countryId || ""}
        {org?.district?.name ? `, ${org.district.name}` : org?.districtId ? `, ${org.districtId}` : ""}
      </div>
      <div className="flex flex-wrap gap-1">
        {(org.workingSectors || []).map((s: any, index: number) => (
          <span
            key={s?.id || index}
            className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-600 rounded uppercase tracking-tighter"
          >
            {s?.name}
          </span>
        ))}
      </div>
    </button>
  )
);

const initData = {
  name: "",
  website: "",
  countryId: "",
  districtId: "",
  sectorId: "",
  stateId: "",
  relation: "founded",
  position: "",
  workingSectors: [] as string[],
};

function OrganizationsPage() {
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState(initData);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [selectedConnectId, setSelectedConnectId] = useState<string | null>(null);

  const userId = user?.id || "";
  const { data: workingSectorsData } = useQuery({
    queryKey: ["working-sectors"],
    queryFn: async () => {
      const { data, error } = await listWorkingSectors();
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: countriesData } = useQuery({
    queryKey: ["countries"],
    queryFn: async () => {
      const { data, error } = await listCountries();
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: districtsData } = useQuery({
    queryKey: ["districts"],
    queryFn: async () => {
      const { data, error } = await listDistricts();
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: sectorsData } = useQuery({
    queryKey: ["sectors", formData.districtId],
    enabled: !!formData.districtId && formData.countryId === "RW",
    queryFn: async () => {
      const { data, error } = await listSectorsByDistrict(formData.districtId);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: statesData } = useQuery({
    queryKey: ["states", formData.countryId],
    enabled: !!formData.countryId && formData.countryId !== "RW",
    queryFn: async () => {
      const { data, error } = await listStatesByCountry(formData.countryId);
      if (error) throw error;
      return data ?? [];
    },
  });
  const { data: orgData, refetch: orgRefetch } = useQuery({
    queryKey: ["user-organizations", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await listUserOrganizations(userId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const organizations = useMemo(() => orgData || [], [orgData]);
  const filteredOrgs = useMemo(() => {
    if (!searchTerm) return organizations;
    return organizations.filter((o: any) => o?.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [organizations, searchTerm]);

  const countries = countriesData || [];
  const districts = districtsData || [];
  const sectors = sectorsData || [];
  const states = statesData || [];
  const workingSectors = workingSectorsData || [];
  const wsOptions = useMemo(
    () => workingSectors.filter((ws: any) => ws && ws.name).map((ws: any) => ({ id: ws.id, name: ws.name })),
    [workingSectors]
  );

  const saveMutation = useMutation({
    mutationFn: async (mode: "create" | "update") => {
      if (!userId) throw new Error("You must be signed in.");
      if (!formData.name.trim()) throw new Error("Organization name is required.");
      const payload = {
        name: formData.name.trim(),
        website: formData.website?.trim() || null,
        countryId: formData.countryId || null,
        districtId: formData.countryId === "RW" ? formData.districtId || null : null,
        sectorId: formData.countryId === "RW" ? formData.sectorId || null : null,
        stateId: formData.countryId && formData.countryId !== "RW" ? formData.stateId || null : null,
      };
      if (mode === "create") {
        const { data, error } = await createOrganization({ ...payload, addedById: userId });
        if (error || !data) throw error || new Error("Failed to create organization.");
        const orgId = data.id;
        const { error: assocError } = await associateUserToOrganization({
          userId,
          organizationId: orgId,
          relation: formData.relation || "founded",
          position: formData.position || null,
        });
        if (assocError) throw assocError;
        const { error: orgWsError } = await setOrganizationWorkingSectors(orgId, formData.workingSectors);
        if (orgWsError) throw orgWsError;
        const { error: linkWsError } = await setUserOrganizationWorkingSectors(userId, orgId, formData.workingSectors);
        if (linkWsError) throw linkWsError;
        return;
      }
      if (!selectedOrgId) throw new Error("Select an organization to edit.");
      const { error: updError } = await updateOrganization(selectedOrgId, payload);
      if (updError) throw updError;
      const { error: assocError } = await associateUserToOrganization({
        userId,
        organizationId: selectedOrgId,
        relation: formData.relation || "founded",
        position: formData.position || null,
      });
      if (assocError) throw assocError;
      const { error: orgWsError } = await setOrganizationWorkingSectors(selectedOrgId, formData.workingSectors);
      if (orgWsError) throw orgWsError;
      const { error: linkWsError } = await setUserOrganizationWorkingSectors(userId, selectedOrgId, formData.workingSectors);
      if (linkWsError) throw linkWsError;
    },
    onSuccess: async (_data, mode) => {
      toastSuccess(mode === "create" ? "Organization created and added successfully!" : "Organization updated successfully!");
      setFormData(initData);
      setEditMode(false);
      setSelectedOrgId(null);
      setSelectedConnectId(null);
      await queryClient.invalidateQueries({ queryKey: ["user-organizations", userId] });
      await queryClient.invalidateQueries({ queryKey: ["organizations"] });
      await orgRefetch();
    },
    onError: (error: any) => {
      console.log(error);
      toastError(error?.message || "Failed to save organization. Try again or contact support!");
    },
  });

  const populateFormFromOrg = (org: any) => {
    setFormData({
      name: org?.name ?? "",
      website: org?.website ?? "",
      countryId: org?.country?.id ?? org?.countryId ?? "",
      districtId: org?.district?.id ?? org?.districtId ?? "",
      sectorId: org?.sector?.id ?? org?.sectorId ?? "",
      stateId: org?.state?.id ?? org?.stateId ?? "",
      relation: org?.relation ?? "founded",
      position: org?.position ?? "",
      workingSectors: (org?.workingSectors ?? []).map((ws: any) => ws.id),
    });
  };

  const saving = saveMutation.isPending;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <PageHeader
        title="Organizations"
        description="Manage your organizations data."
        actionTitle={editMode ? "Cancel Update" : "Enable Update"}
        Icon={editMode ? MdCancel : Edit}
        onAction={() => {
          if (editMode) {
            setEditMode(false);
            setSelectedOrgId(null);
            setSelectedConnectId(null);
            setFormData(initData);
          } else {
            setEditMode(true);
            toastSuccess("Select an organization to edit");
          }
        }}
        loading={saving}
        disabled={false}
      />
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-5">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <PlusCircle size={18} className="text-primary" />
              <h2 className="font-bold">Register Organization</h2>
            </div>
            {editMode && !selectedOrgId && (
              <p className="text-sm text-amber-600 text-center px-4 py-2 border border-amber-600 rounded shadow m-1 font-semibold">
                Select an organization to edit
              </p>
            )}

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TailwindInput
                  label="Name"
                  value={formData.name}
                  onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <TailwindInput
                  label="Website"
                  value={formData.website}
                  onChange={(e: any) => setFormData({ ...formData, website: e.target.value })}
                />
              </div>

              <MultiSelectSearch
                label="Working Sectors"
                options={wsOptions}
                value={formData.workingSectors}
                onChange={(vals) => setFormData({ ...formData, workingSectors: vals })}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Combobox
                  label="Country"
                  options={countries}
                  value={formData?.countryId}
                  onChange={(value: string) => {
                    setFormData((prev) => ({ ...prev, countryId: value, districtId: "", sectorId: "", stateId: "" }));
                  }}
                  placeholder="Select Country"
                />
                {formData?.countryId === "RW" ? (
                  <>
                    <Combobox
                      label="District"
                      options={districts}
                      value={formData.districtId}
                      onChange={(value: string) => setFormData((prev) => ({ ...prev, districtId: value, sectorId: "" }))}
                      placeholder="Select District"
                    />
                    <Combobox
                      label="Sector"
                      options={sectors}
                      value={formData.sectorId}
                      onChange={(value: string) => setFormData((prev) => ({ ...prev, sectorId: value }))}
                      placeholder="Select Sector"
                    />
                  </>
                ) : (
                  formData.countryId && (
                    <Combobox
                      label="State/Province"
                      options={states}
                      value={formData.stateId}
                      onChange={(value: string) => setFormData((prev) => ({ ...prev, stateId: value }))}
                      placeholder="Select State/Province"
                    />
                  )
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <TailwindInput
                  label="Your Position"
                  value={formData?.position}
                  onChange={(e: any) => setFormData({ ...formData, position: e.target.value })}
                />
                <TailwindSelect
                  label="Relationship"
                  value={formData?.relation}
                  onChange={(e: any) => setFormData({ ...formData, relation: e.target.value })}
                  options={[
                    { id: "founded", name: "Founder" },
                    { id: "employed", name: "Employee" },
                  ]}
                />
              </div>

              <button
                onClick={() => saveMutation.mutate(editMode ? "update" : "create")}
                disabled={saving || (editMode && !selectedOrgId)}
                className="w-full mt-4 bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary/80 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Save size={18} />
                )}
                {editMode ? "Update Organization" : "Save Organization"}
              </button>
            </div>
          </div>
        </div>

        <div className="xl:col-span-7 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[700px] overflow-y-auto pr-2">
            {filteredOrgs.map((org: any, index: number) => (
              <OrganizationCard
                key={org?.connectId || org?.id || index}
                org={org}
                editMode={editMode}
                selectedOrgId={selectedOrgId}
                onSelect={() => {
                  setSelectedOrgId(org?.id);
                  setSelectedConnectId(org?.connectId || null);
                  populateFormFromOrg(org);
                }}
              />
            ))}
            {filteredOrgs.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <p className="text-slate-400">No organizations found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

OrganizationCard.displayName = "OrganizationCard";

export default OrganizationsPage;
