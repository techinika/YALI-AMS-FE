import {
  Country,
  Member,
  ResidentDistrict,
  ResidentSector,
} from "@/types/user";
import { Cohort } from "@/types/cohort";
import { Track } from "@/types/track";
import { TailwindSelect } from "@/components/ui/tail-select";
import { Combobox } from "@/components/ui/combobox";
import { PhoneInputTailwind } from "@/components/ui/tail-phone";
import { TailwindInput } from "@/components/ui/TailInput";
import { getUser } from "@/helpers/auth";
import { useCallback } from "react";

export const Personal = ({
  values,
  handleChange,
  handleSelectChange,
  errors,
  sectors,
  cohorts,
  districts,
  genders,
  setSelectedDistrict,
  tracks,
  countries,
  usr,
  auth,
  states,
  setCountry,
  changeEmail,
  setChangeEmail,
}: {
  values: any;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  errors: any;
  sectors: ResidentSector[];
  cohorts: Cohort[];
  districts: ResidentDistrict[];
  genders: any;
  setSelectedDistrict: (districtName: string) => void;
  tracks: Track[];
  countries: Country[];
  usr: Member;
  auth: boolean;
  states: any;
  setCountry: (country: string) => void;
  changeEmail: boolean;
  setChangeEmail: (value: boolean) => void;
}) => {
  const member = getUser();

  const handleCountryChange = useCallback(
    (value: string) => {
      setCountry(value);
      handleSelectChange({
        target: { id: "residentCountryId", value },
      } as any);
    },
    [setCountry, handleSelectChange],
  );

  const handleDistrictChange = useCallback(
    (value: string) => {
      setSelectedDistrict(value);
      handleSelectChange({
        target: { id: "districtName", value },
      } as any);
    },
    [setSelectedDistrict, handleSelectChange],
  );

  const handleStateChange = useCallback(
    (value: string) => {
      handleSelectChange({
        target: { id: "state", value },
      } as any);
    },
    [handleSelectChange],
  );

  const handleSectorChange = useCallback(
    (value: string) => {
      handleSelectChange({
        target: { id: "sectorId", value },
      } as any);
    },
    [handleSelectChange],
  );

  const handleGenderChange = useCallback(
    (value: string) => {
      handleSelectChange({
        target: { id: "gender", value },
      } as any);
    },
    [handleSelectChange],
  );

  const handleCohortChange = useCallback(
    (value: string) => {
      handleSelectChange({
        target: { id: "cohortId", value },
      } as any);
    },
    [handleSelectChange],
  );

  const handleTrackChange = useCallback(
    (value: string) => {
      handleSelectChange({
        target: { id: "track", value },
      } as any);
    },
    [handleSelectChange],
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <TailwindInput
        label="First Name"
        id="firstName"
        value={values.firstName}
        onChange={handleChange}
        placeholder="First Name"
        disabled={auth}
        error={errors.firstName}
      />
      <TailwindInput
        label="Middle Name"
        id="middleName"
        value={values.middleName}
        onChange={handleChange}
        placeholder="Middle Name"
        disabled={auth}
        error={errors.middleName}
      />
      <TailwindInput
        label="Last Name"
        id="lastName"
        value={values.lastName}
        onChange={handleChange}
        placeholder="Last Name"
        disabled={auth}
        error={errors.lastName}
      />
      <TailwindInput
        label="Email"
        id="email"
        value={values.email}
        onChange={handleChange}
        placeholder="Email"
        error={errors.email}
      />
      <PhoneInputTailwind
        label="Phone Number"
        id="phoneNumber"
        value={values.phoneNumber}
        onChange={handleChange}
        placeholder="Edit phone number (e.g., +25078...)"
        error={errors.phoneNumber}
      />
      <PhoneInputTailwind
        label="WhatsApp Number"
        id="whatsAppNumber"
        value={values.whatsAppNumber}
        onChange={handleChange}
        placeholder="Edit WhatsApp number (e.g., +25078...)"
        error={errors.whatsAppNumber}
      />
      <Combobox
        label="Gender"
        id="gender"
        value={values.gender}
        onChange={handleGenderChange}
        options={genders.map((g: any) => ({ id: g.id, name: g.name }))}
        placeholder="Select a gender"
        disabled={auth}
        error={errors.gender}
      />
      <Combobox
        label="Resident Country"
        id="residentCountryId"
        value={values.residentCountryId}
        onChange={handleCountryChange}
        options={countries.map((c: Country) => ({ id: c.id, name: c.name }))}
        placeholder="Select a country"
        disabled={auth}
        error={errors.residentCountryId}
      />
      {values.residentCountryId && values.residentCountryId !== "RW" && (
        <Combobox
          label="State"
          id="state"
          value={values.state}
          onChange={handleStateChange}
          options={states.map((s: any) => ({ id: s.id, name: s.name }))}
          placeholder="Select a state"
          disabled={auth}
          error={errors.state}
        />
      )}
      {values.residentCountryId && values.residentCountryId === "RW" && (
        <Combobox
          label="District"
          id="districtName"
          value={values.districtName}
          onChange={handleDistrictChange}
          options={districts.map((d: ResidentDistrict) => ({ id: d.id, name: d.name }))}
          placeholder="Select a district"
          disabled={auth}
          error={errors.districtName}
        />
      )}
      {values.residentCountryId && values.residentCountryId === "RW" && (
        <Combobox
          label="Sector"
          id="sectorId"
          value={values.sectorId}
          onChange={handleSectorChange}
          options={sectors.map((s: ResidentSector) => ({ id: s.id, name: s.name }))}
          placeholder="Select a sector"
          disabled={auth}
          error={errors.sectorId}
        />
      )}
      <Combobox
        label="Cohort"
        id="cohortId"
        value={values.cohortId}
        onChange={handleCohortChange}
        options={cohorts.map((c: Cohort) => ({ id: c.id, name: c.name }))}
        placeholder="Select a cohort"
        disabled={auth}
        error={errors.cohortId}
      />
      <Combobox
        label="Track"
        id="track"
        value={values.track}
        onChange={handleTrackChange}
        options={tracks.map((t: Track) => ({ id: t.id, name: t.name }))}
        placeholder="Select a track"
        disabled={auth}
        error={errors.track}
      />
      <TailwindInput
        label="Nearest Landmark"
        id="nearlestLandmark"
        value={values.nearlestLandmark}
        onChange={handleChange}
        placeholder="What's the popular place near you?"
        disabled={auth}
        error={errors.nearlestLandmark}
      />
      <TailwindInput
        label="LinkedIn Account"
        id="linkedin"
        value={values.linkedin}
        onChange={handleChange}
        placeholder="https://linkedin.com/in/..."
        disabled={auth}
        error={errors.linkedin}
      />
      <TailwindInput
        label="X (Twitter) Account"
        id="twitter"
        value={values.twitter}
        onChange={handleChange}
        placeholder="https://x.com/..."
        disabled={auth}
        error={errors.twitter}
      />
      <TailwindInput
        label="Instagram Account"
        id="instagram"
        value={values.instagram}
        onChange={handleChange}
        placeholder="https://instagram.com/..."
        disabled={auth}
        error={errors.instagram}
      />
      <TailwindInput
        label="Facebook Account"
        id="facebook"
        value={values.facebook}
        onChange={handleChange}
        placeholder="https://facebook.com/..."
        disabled={auth}
        error={errors.facebook}
      />
    </div>
  );
};
