"use client";

import React, { useEffect, useMemo, useState } from "react";
import { TailwindInput } from "../ui/tail-input";
import { MultiSelectSearch } from "../ui/multi-select-search";
import { TailwindSelect } from "../ui/tail-select";
import {
  useAddNewOrganizationMutation,
  useAddWStoOrgMutation,
  useGetOrganizationsForUserQuery,
  useUpdateOrganizationMutation,
} from "@/lib/features/orgSlice";
import {
  useCountriesQuery,
  useDistrictsQuery,
  useSectorsByDistrictQuery,
  useStatesByCountryQuery,
  useWorkingSectorQuery,
} from "@/lib/features/otherSlice";
import { PageHeader } from "../parts/PageHeader";
import {
  Building2,
  Edit,
  Globe,
  Loader2,
  MapPin,
  PlusCircle,
  Save,
  Search,
} from "lucide-react";
import { toastError, toastSuccess } from "@/lib/toast";
import { getUser } from "@/helpers/auth";
import { useAssociateOrganizationMutation } from "@/lib/features/userSlice";
import { Organization } from "@/types/user";
import Link from "next/link";
import { MdCancel } from "react-icons/md";
import Loading from "@/app/loading";

function OrganizationsPage() {
  const user = getUser();
  const initData = {
    name: "",
    website: "",
    countryId: "",
    districtId: "",
    sectorId: "",
    stateId: "",
    relation: "",
    position: "",
    workingSectors: [] as string[],
  };
  const [addNewOrganization] = useAddNewOrganizationMutation();
  const [associateOrganization] = useAssociateOrganizationMutation();
  const [updateOrganization] = useUpdateOrganizationMutation();

  const [addWStoOrg] = useAddWStoOrgMutation();
  const [formData, setFormData] = useState(initData);
  const [sectors, setSectors] = useState([]);
  const [states, setStates] = useState<any>([]);
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [saving, setSaving] = useState(false);
  const [workingSectors, setWorkingSectors] = useState<any>([]);
  const [countries, setCountries] = useState<any>([]);
  const [districts, setDistricts] = useState<any>([]);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedConnectId, setSelectedConnectId] = useState("");

  const { data: WorkingSectorsData } = useWorkingSectorQuery("");
  const { data: CountryData } = useCountriesQuery("");
  const { data: DistrictData } = useDistrictsQuery("");
  const { data: orgData, refetch: orgRefetch } =
    useGetOrganizationsForUserQuery(user?.id);

  const { data: SectorsData } = useSectorsByDistrictQuery(selectedDistrict, {
    skip: !selectedDistrict,
  });

  const { data: StatesData } = useStatesByCountryQuery(selectedCountry, {
    skip: selectedCountry === "RW",
  });

  const filteredOrgs = useMemo(() => {
    if (!searchTerm) return organizations;
    return organizations.filter((o: any) =>
      o?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [organizations, searchTerm]);

  useEffect(() => {
    if (SectorsData) {
      setSectors(SectorsData?.data || []);
    }
  }, [SectorsData]);

  useEffect(() => {
    if (orgData) {
      setOrganizations(orgData?.data || []);
    }
  }, [orgData]);

  useEffect(() => {
    if (StatesData) {
      setStates(StatesData?.data || []);
    }
  }, [StatesData]);

  useEffect(() => {
    if (DistrictData) {
      setDistricts(DistrictData?.data || []);
    }
  }, [DistrictData]);

  useEffect(() => {
    if (CountryData) {
      setCountries(CountryData?.data || []);
    }
  }, [CountryData]);

  const wsOptions = React.useMemo(() => {
    if (!workingSectors) return [];
    return workingSectors
      .filter((ws: any) => ws && ws.name)
      .map((ws: any) => ({
        id: ws?.id,
        name: ws?.name,
      }));
  }, [workingSectors]);

  useEffect(() => {
    if (WorkingSectorsData) {
      setWorkingSectors(WorkingSectorsData?.data || []);
    }
  }, [WorkingSectorsData]);

  const handleCreateOrganization = async () => {
    setSaving(true);
    try {
      const res = await addNewOrganization({
        name: formData?.name,
        website: formData?.website,
        addedById: user?.id,
        countryId: formData?.countryId ?? undefined,
        districtId: formData?.districtId ?? undefined,
        sectorId: formData?.sectorId ?? undefined,
        stateId: formData?.stateId ?? undefined,
      }).unwrap();
      await associateOrganization({
        organizationId: res?.data?.id,
        userId: user?.id,
        relation: formData?.relation,
        position: formData?.position,
      }).unwrap();
      await Promise.all(
        formData.workingSectors.map((v) =>
          addWStoOrg({
            userId: user?.id,
            organizationId: res.data.id,
            wsId: v,
          }).unwrap(),
        ),
      );

      toastSuccess("Organization created and added Successfully!");
      orgRefetch();
      setFormData(initData);
    } catch (error) {
      console.log(error);
      toastError(
        "Failed to create a new organization. Try again or contact support!",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateOrganization = async () => {
    setSaving(true);

    try {
      if (editMode && selectedOrgId) {
        await updateOrganization({
          organizationId: selectedOrgId,
          userId: user?.id,
          name: formData.name,
          website: formData.website,
          countryId: formData.countryId || null,
          districtId: formData.districtId || null,
          sectorId: formData.sectorId || null,
          stateId: formData.stateId || null,
          relation: formData.relation,
          position: formData.position,
          workingSectors: formData.workingSectors,
          connectionId: selectedConnectId,
        }).unwrap();

        toastSuccess("Organization updated successfully!");
      }

      orgRefetch();
      setFormData(initData);
      setEditMode(false);
      setSelectedOrgId(null);
    } catch (err) {
      console.error(err);
      toastError("Failed to save organization.");
    } finally {
      setSaving(false);
    }
  };

  const populateFormFromOrg = (org: any) => {
    setFormData({
      name: org.name ?? "",
      website: org.website ?? "",
      countryId: org.country?.id ?? "",
      districtId: org.districtId ?? "",
      sectorId: org.sectorId ?? "",
      stateId: org.state?.id ?? "",
      relation: org?.relation ?? "",
      position: org?.position ?? "",
      workingSectors: org.workingSectors?.map((ws: any) => ws.id) ?? [],
    });

    setSelectedCountry(org.country?.id ?? "");
    setSelectedDistrict(org.district?.id ?? "");
  };

  if (loading) return <Loading />;

  return (
    <div className="container mx-auto p-4 md:p-8">
      <PageHeader
        title={"Organizations"}
        description={"Manage your organizations data."}
        actionTitle={editMode ? "Cancel Update" : "Enable Update"}
        Icon={editMode ? MdCancel : Edit}
        onAction={() => {
          if (editMode) {
            setEditMode(false);
            setSelectedOrgId(null);
            setFormData(initData);
          } else {
            setEditMode(true);
            toastSuccess("Select an organization to edit");
          }
        }}
        loading={saving}
        disabled={false}
        second={false}
        actionTitle2=""
        onAction2={() => console.log("ff")}
        loading2={false}
        disabled2={false}
        Icon2={Save}
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
                  onChange={(e: any) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
                <TailwindInput
                  label="Website"
                  value={formData.website}
                  onChange={(e: any) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                />
              </div>

              <MultiSelectSearch
                label="Working Sectors"
                options={wsOptions}
                value={formData.workingSectors}
                onChange={(vals) =>
                  setFormData({ ...formData, workingSectors: vals })
                }
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TailwindSelect
                  label="Country"
                  options={countries}
                  value={formData.countryId}
                  onChange={(e: any) => {
                    setFormData({ ...formData, countryId: e.target.value });
                    setSelectedCountry(e.target.value);
                  }}
                />
                {formData.countryId === "RW" ? (
                  <>
                    <TailwindSelect
                      label="District"
                      options={districts}
                      value={formData.districtId}
                      onChange={(e: any) => {
                        setFormData({
                          ...formData,
                          districtId: e.target.value,
                        });
                        setSelectedDistrict(e.target.value);
                      }}
                    />
                    <TailwindSelect
                      label="Sector"
                      options={sectors}
                      value={formData.sectorId}
                      onChange={(e: any) =>
                        setFormData({ ...formData, sectorId: e.target.value })
                      }
                    />
                  </>
                ) : (
                  formData.countryId && (
                    <TailwindSelect
                      label="State/Province"
                      options={states}
                      value={formData.stateId}
                      onChange={(e: any) =>
                        setFormData({ ...formData, stateId: e.target.value })
                      }
                    />
                  )
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <TailwindInput
                  label="Your Position"
                  value={formData.position}
                  onChange={(e: any) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                />
                <TailwindSelect
                  label="Relationship"
                  value={formData.relation}
                  onChange={(e: any) =>
                    setFormData({ ...formData, relation: e.target.value })
                  }
                  options={[
                    { id: "founded", name: "Founder" },
                    { id: "employed", name: "Employee" },
                  ]}
                />
              </div>

              <button
                onClick={
                  editMode ? handleUpdateOrganization : handleCreateOrganization
                }
                disabled={saving}
                className="w-full mt-4 bg-primary text-white py-2.5 rounded-xl font-bold hover:bg-primary/80 disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={18} />
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
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-primary/20"
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[700px] overflow-y-auto pr-2">
            {filteredOrgs.map((org: any) => (
              <button
                key={org?.id}
                onClick={() => {
                  if (!editMode) return;
                  setLoading(true);

                  setSelectedOrgId(org.id);
                  setSelectedConnectId(org?.connectId);
                  populateFormFromOrg(org);
                  setLoading(false);
                }}
                className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer text-left
    ${editMode ? "hover:border-primary" : "border-slate-200"}
    ${selectedOrgId === org.id ? "border-primary ring-2 ring-primary/20" : ""}
  `}
                disabled={!editMode}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Building2 size={20} />
                  </div>
                  {org.website && (
                    <Link
                      href={org.website}
                      target="_blank"
                      className="text-slate-400 hover:text-primary"
                    >
                      <Globe size={16} />
                    </Link>
                  )}
                </div>
                <h3 className="font-bold text-lg mb-1">{org.name}</h3>
                <div className="flex items-center gap-1.5 text-sm text-slate-500 mb-4">
                  <MapPin size={14} />
                  {org.country?.id}
                  {org.districtId ? `, ${org.districtId}` : ""}
                </div>
                <div className="flex flex-wrap gap-1">
                  {org.workingSectors?.map((s: any) => (
                    <span
                      key={s.id}
                      className="px-2 py-0.5 bg-slate-100 text-[10px] font-bold text-slate-600 rounded uppercase tracking-tighter"
                    >
                      {s?.name}
                    </span>
                  ))}
                </div>
              </button>
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

export default OrganizationsPage;
