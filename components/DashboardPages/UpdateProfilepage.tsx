"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { MdCloudUpload, MdClose, MdEdit } from "react-icons/md";
import { Save } from "lucide-react";
import Loading from "@/app/loading";
import { PageHeader } from "../parts/PageHeader";
import { TextAreaField } from "../ui/textarea";
import { TailwindInput } from "../ui/TailInput";
import { Combobox } from "../ui/combobox";
import { PhoneInputTailwind } from "../ui/tail-phone";
import { Button } from "../ui/Button";
import { ShowOrganizationToUpdate } from "../parts/update/ShowOrganizations";
import { useCurrentUser } from "@/lib/data/use-current-user";
import { getProfileById } from "@/lib/data/profiles";
import {
  listCountries,
  listDistricts,
  listSectorsByDistrict,
  listStatesByCountry,
  listCohorts,
  listGenders,
  listTracks,
} from "@/lib/data/reference";
import { listOrganizations, listUserOrganizations } from "@/lib/data/organizations";
import { fileToAvatar, updateMember } from "@/lib/data/members-admin";
import { toastError, toastSuccess } from "@/lib/toast";

type FormValues = {
  firstName: string;
  middleName: string;
  lastName: string;
  phoneNumber: string;
  whatsAppNumber: string;
  bio: string;
  linkedin: string;
  instagram: string;
  twitter: string;
  facebook: string;
  genderId: string;
  countryId: string;
  stateId: string;
  districtId: string;
  sectorId: string;
  cohortId: string;
  trackId: string;
  nearestLandmark: string;
};

const emptyValues: FormValues = {
  firstName: "",
  middleName: "",
  lastName: "",
  phoneNumber: "",
  whatsAppNumber: "",
  bio: "",
  linkedin: "",
  instagram: "",
  twitter: "",
  facebook: "",
  genderId: "",
  countryId: "",
  stateId: "",
  districtId: "",
  sectorId: "",
  cohortId: "",
  trackId: "",
  nearestLandmark: "",
};

const toOption = (row: { id: string | number; name?: string | null }) => ({
  id: String(row.id),
  name: row.name ?? "",
});

function valuesFromProfile(profile: any): FormValues {
  if (!profile) return emptyValues;
  return {
    firstName: profile.first_name ?? "",
    middleName: profile.middle_name ?? "",
    lastName: profile.last_name ?? "",
    phoneNumber: profile.phone ?? "",
    whatsAppNumber: profile.whatsapp ?? "",
    bio: profile.bio ?? "",
    linkedin: profile.linkedin ?? "",
    instagram: profile.instagram ?? "",
    twitter: profile.twitter ?? "",
    facebook: profile.facebook ?? "",
    genderId: profile.gender_id != null ? String(profile.gender_id) : "",
    countryId: profile.country_id ?? "",
    stateId: profile.state_id ?? "",
    districtId: profile.district_id ?? "",
    sectorId: profile.sector_id ?? "",
    cohortId: profile.cohort_id != null ? String(profile.cohort_id) : "",
    trackId: profile.track_id ?? "",
    nearestLandmark: profile.nearest_landmark ?? "",
  };
}

export default function UpdateProfilePage() {
  const qc = useQueryClient();
  const searchParams = useSearchParams();
  const { user, role, loading: authLoading } = useCurrentUser();

  const requestedId = searchParams.get("userId");
  const isAdmin = role === "admin";
  const targetId = isAdmin && requestedId ? requestedId : user?.id ?? "";
  const isSelf = targetId === user?.id;

  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<Partial<Record<keyof FormValues, string>>>({});
  const [activeTab, setActiveTab] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [message, setMessage] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", targetId],
    enabled: Boolean(targetId),
    queryFn: async () => {
      const { data, error } = await getProfileById(targetId);
      if (error) throw error;
      return data;
    },
  });

  const { data: genders = [] } = useQuery({ queryKey: ["ref", "genders"], queryFn: async () => (await listGenders()).data ?? [] });
  const { data: countries = [] } = useQuery({ queryKey: ["ref", "countries"], queryFn: async () => (await listCountries()).data ?? [] });
  const { data: districts = [] } = useQuery({ queryKey: ["ref", "districts"], queryFn: async () => (await listDistricts()).data ?? [] });
  const { data: cohorts = [] } = useQuery({ queryKey: ["ref", "cohorts"], queryFn: async () => (await listCohorts()).data ?? [] });
  const { data: tracks = [] } = useQuery({ queryKey: ["ref", "tracks"], queryFn: async () => (await listTracks()).data ?? [] });

  const { data: states = [] } = useQuery({
    queryKey: ["ref", "states", values.countryId],
    enabled: Boolean(values.countryId) && values.countryId !== "RW",
    queryFn: async () => (await listStatesByCountry(values.countryId)).data ?? [],
  });
  const { data: sectors = [] } = useQuery({
    queryKey: ["ref", "sectors", values.districtId],
    enabled: Boolean(values.districtId) && values.countryId === "RW",
    queryFn: async () => (await listSectorsByDistrict(values.districtId)).data ?? [],
  });

  const { data: userOrganizations = [] } = useQuery({
    queryKey: ["user-organizations", targetId],
    enabled: Boolean(targetId),
    queryFn: async () => {
      const { data, error } = await listUserOrganizations(targetId);
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });
  const { data: organizations = [] } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data, error } = await listOrganizations();
      if (error) throw error;
      return (data ?? []) as any[];
    },
  });

  useEffect(() => {
    if (!profile) return;
    setValues(valuesFromProfile(profile));
    setImagePreview(profile.avatar_path ?? null);
  }, [profile]);

  const founded = userOrganizations.filter((org) => org.relation === "founded");
  const employed = userOrganizations.filter((org) => org.relation === "employed");

  const validate = () => {
    const next: Partial<Record<keyof FormValues, string>> = {};
    if (!values.firstName.trim()) next.firstName = "First name is required.";
    if (!values.lastName.trim()) next.lastName = "Last name is required.";
    if (!values.countryId) next.countryId = "Resident country is required.";
    if (values.countryId === "RW") {
      if (!values.districtId) next.districtId = "District is required.";
      if (!values.sectorId) next.sectorId = "Sector is required.";
    } else if (values.countryId && !values.stateId) {
      next.stateId = "State or province is required.";
    }
    const url = /^(https?:\/\/)[^\s]+$/i;
    if (values.linkedin && !url.test(values.linkedin)) next.linkedin = "Enter a valid URL.";
    if (values.twitter && !url.test(values.twitter)) next.twitter = "Enter a valid URL.";
    if (values.instagram && !url.test(values.instagram)) next.instagram = "Enter a valid URL.";
    if (values.facebook && !url.test(values.facebook)) next.facebook = "Enter a valid URL.";
    if (values.bio.length > 500) next.bio = "Bio cannot exceed 500 characters.";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = useMutation({
    mutationFn: async () => {
      if (!targetId) throw new Error("No member selected.");
      if (!validate()) throw new Error("Please fix the highlighted fields.");
      const avatar = avatarFile ? await fileToAvatar(avatarFile) : undefined;
      const { error } = await updateMember(
        targetId,
        {
          first_name: values.firstName.trim(),
          middle_name: values.middleName.trim(),
          last_name: values.lastName.trim(),
          phone: values.phoneNumber.trim(),
          whatsapp: values.whatsAppNumber.trim(),
          bio: values.bio.trim(),
          linkedin: values.linkedin.trim(),
          instagram: values.instagram.trim(),
          twitter: values.twitter.trim(),
          facebook: values.facebook.trim(),
          gender_id: values.genderId ? Number(values.genderId) : null,
          cohort_id: values.cohortId ? Number(values.cohortId) : null,
          track_id: values.trackId || null,
          country_id: values.countryId || null,
          state_id: values.countryId === "RW" ? null : values.stateId || null,
          district_id: values.countryId === "RW" ? values.districtId || null : null,
          sector_id: values.countryId === "RW" ? values.sectorId || null : null,
          nearest_landmark: values.nearestLandmark.trim(),
        },
        avatar
      );
      if (error) throw new Error("Could not save the profile.");
    },
    onSuccess: async () => {
      setMessage({ kind: "success", text: "Profile updated successfully." });
      setAvatarFile(null);
      await qc.invalidateQueries({ queryKey: ["profile", targetId] });
      await qc.invalidateQueries({ queryKey: ["profiles"] });
    },
    onError: (error: Error) => setMessage({ kind: "error", text: error.message }),
  });

  const update = (id: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const value = e.target.value;
    setValues((prev) => {
      const next = { ...prev, [id]: value };
      if (id === "countryId") {
        next.stateId = "";
        next.districtId = "";
        next.sectorId = "";
      }
      if (id === "districtId") next.sectorId = "";
      return next;
    });
    setErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  const select = (id: keyof FormValues) => (value: string) => {
    setValues((prev) => {
      const next = { ...prev, [id]: value };
      if (id === "countryId") {
        next.stateId = "";
        next.districtId = "";
        next.sectorId = "";
      }
      if (id === "districtId") next.sectorId = "";
      return next;
    });
    setErrors((prev) => ({ ...prev, [id]: undefined }));
  };

  if (authLoading || (profileLoading && !profile)) return <Loading />;
  if (!targetId) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 text-center">
        <h1 className="text-lg font-semibold text-foreground">Profile unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">Sign in again to edit your profile.</p>
      </div>
    );
  }

  const tabs = [
    {
      label: "Personal & social",
      content: (
        <div className="grid gap-4 sm:grid-cols-2">
          <TailwindInput id="firstName" label="First name" value={values.firstName} onChange={update("firstName")} error={!!errors.firstName} helperText={errors.firstName} required />
          <TailwindInput id="middleName" label="Middle name" value={values.middleName} onChange={update("middleName")} />
          <TailwindInput id="lastName" label="Last name" value={values.lastName} onChange={update("lastName")} error={!!errors.lastName} helperText={errors.lastName} required />
          <TailwindInput id="email" label="Email (managed by your account)" value={profile?.email ?? ""} onChange={() => {}} helperText="Contact an administrator to change your login email." />
          <PhoneInputTailwind id="phoneNumber" label="Phone number" value={values.phoneNumber} onChange={update("phoneNumber")} error={!!errors.phoneNumber} helperText={errors.phoneNumber} />
          <PhoneInputTailwind id="whatsAppNumber" label="WhatsApp number" value={values.whatsAppNumber} onChange={update("whatsAppNumber")} error={!!errors.whatsAppNumber} helperText={errors.whatsAppNumber} />
          <Combobox label="Gender" value={values.genderId} onChange={select("genderId")} options={genders.map(toOption)} placeholder="Select gender" />
          <Combobox label="Resident country" value={values.countryId} onChange={select("countryId")} options={countries.map(toOption)} error={errors.countryId} required />
          {values.countryId && values.countryId !== "RW" && (
            <Combobox label="State / province" value={values.stateId} onChange={select("stateId")} options={states.map(toOption)} error={errors.stateId} required />
          )}
          {values.countryId === "RW" && (
            <>
              <Combobox label="District" value={values.districtId} onChange={select("districtId")} options={districts.map(toOption)} error={errors.districtId} required />
              <Combobox label="Sector" value={values.sectorId} onChange={select("sectorId")} options={sectors.map(toOption)} error={errors.sectorId} required />
            </>
          )}
          <Combobox label="Cohort" value={values.cohortId} onChange={select("cohortId")} options={cohorts.map(toOption)} placeholder="Select cohort" />
          <Combobox label="Track" value={values.trackId} onChange={select("trackId")} options={tracks.map(toOption)} placeholder="Select track" />
          <TailwindInput id="nearestLandmark" label="Nearest landmark" value={values.nearestLandmark} onChange={update("nearestLandmark")} />
          <TailwindInput id="linkedin" label="LinkedIn URL" value={values.linkedin} onChange={update("linkedin")} error={!!errors.linkedin} helperText={errors.linkedin} />
          <TailwindInput id="twitter" label="X (Twitter) URL" value={values.twitter} onChange={update("twitter")} error={!!errors.twitter} helperText={errors.twitter} />
          <TailwindInput id="instagram" label="Instagram URL" value={values.instagram} onChange={update("instagram")} error={!!errors.instagram} helperText={errors.instagram} />
          <TailwindInput id="facebook" label="Facebook URL" value={values.facebook} onChange={update("facebook")} error={!!errors.facebook} helperText={errors.facebook} />
        </div>
      ),
    },
    {
      label: "Initiatives (founded)",
      content: <ShowOrganizationToUpdate orgs={founded} userId={targetId} refetch={() => qc.invalidateQueries({ queryKey: ["user-organizations", targetId] })} organizations={organizations} />,
    },
    {
      label: "Employment",
      content: <ShowOrganizationToUpdate orgs={employed} userId={targetId} refetch={() => qc.invalidateQueries({ queryKey: ["user-organizations", targetId] })} organizations={organizations} />,
    },
  ];

  return (
    <div className="mx-auto max-w-7xl p-4 md:p-8">
      <PageHeader
        title={isSelf ? "Update my profile" : "Update member profile"}
        description="Update the member's details, then save your changes."
        actionTitle="Save changes"
        Icon={Save}
        onAction={() => save.mutate()}
        loading={save.isPending}
        disabled={false}
      />

      {message && (
        <div
          role={message.kind === "error" ? "alert" : "status"}
          className={`mb-6 rounded-xl border px-4 py-3 text-sm shadow-sm ${
            message.kind === "error" ? "border-red-300 bg-red-50 text-red-700" : "border-green-300 bg-green-50 text-green-700"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
        <div className="mb-8 flex flex-col gap-6 border-b border-border pb-6 lg:flex-row">
          <div className="flex w-full shrink-0 flex-col items-center lg:w-1/4 lg:items-start">
            <h2 className="mb-4 text-lg font-semibold text-foreground">Profile picture</h2>
            <div className="relative h-40 w-40">
              {imagePreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imagePreview} alt="Profile preview" className="h-40 w-40 rounded-full border-4 border-brand-200 object-cover shadow-sm" />
              ) : (
                <div className="flex h-40 w-40 items-center justify-center rounded-full border-4 border-dashed border-border bg-muted text-sm text-muted-foreground">No picture</div>
              )}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 rounded-full bg-primary p-2 text-primary-foreground shadow-sm transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Change profile picture"
              >
                <MdEdit className="h-5 w-5" aria-hidden="true" />
              </button>
              <input
                ref={fileInputRef}
                id="profile-image-upload"
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  setAvatarFile(file);
                  const reader = new FileReader();
                  reader.onloadend = () => setImagePreview(String(reader.result ?? ""));
                  reader.readAsDataURL(file);
                }}
              />
            </div>
            {avatarFile && (
              <button
                type="button"
                onClick={() => save.mutate()}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700"
              >
                <MdCloudUpload className="h-4 w-4" aria-hidden="true" /> Save picture
              </button>
            )}
            {(imagePreview || profile?.avatar_path) && (
              <button
                type="button"
                onClick={() => {
                  setImagePreview(null);
                  setAvatarFile(null);
                }}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-red-600 transition hover:text-red-700"
              >
                <MdClose className="h-4 w-4" aria-hidden="true" /> Clear selection
              </button>
            )}
          </div>

          <div className="flex-1 lg:w-3/4">
            <TextAreaField
              label="Biography (max 500 characters)"
              placeholder="A short biography: mission, experience, interests."
              value={values.bio}
              onChange={update("bio")}
              name="bio"
            />
            {errors.bio && <p className="mt-1 text-sm text-red-600">{errors.bio}</p>}
          </div>
        </div>

        <div className="mt-4">
          <div className="border-b border-border">
            <ul className="-mb-px flex flex-wrap text-center text-sm font-medium">
              {tabs.map((tab, index) => (
                <li key={tab.label} className="mr-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab(index)}
                    aria-current={index === activeTab ? "page" : undefined}
                    className={`inline-block rounded-t-lg border-b-2 p-3 transition ${
                      index === activeTab ? "border-primary font-semibold text-primary" : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-6">{tabs[activeTab].content}</div>
        </div>

        <div className="mt-8 flex justify-end border-t border-border pt-4">
          <Button onClick={() => save.mutate()} disabled={save.isPending}>
            {save.isPending ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";