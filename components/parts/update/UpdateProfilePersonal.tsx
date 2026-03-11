import {
  Country,
  Member,
  ResidentDistrict,
  ResidentSector,
} from "@/types/user";
import { Cohort } from "@/types/cohort";
import { Track } from "@/types/track";
import { TailwindSelect } from "@/components/ui/tail-select";
import { PhoneInputTailwind } from "@/components/ui/tail-phone";
import { TailwindInput } from "@/components/ui/tail-input";
import { getUser } from "@/helpers/auth";

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
        // disabled={!changeEmail}
        error={errors.email}
        // helperText={
        //   <span className="text-primary text-xs italic mt-1">
        //     <b>Note:</b> Updating the email will change the login credentials,
        //     so it can only be changed by the account owner! Proceed with
        //     caution.
        //   </span>
        // }
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
      <TailwindSelect
        label="Gender"
        id="gender"
        value={values.gender}
        onChange={handleSelectChange}
        options={genders}
        placeholder="Select a gender"
        disabled={auth}
        error={errors.gender}
      />
      <TailwindSelect
        label="Resident Country"
        id="residentCountryId"
        value={values.residentCountryId}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
          handleSelectChange(e);
          const selectedCountry = e.target.value;
          setCountry(selectedCountry);
        }}
        options={countries}
        placeholder="Select a country"
        disabled={auth}
        error={errors.residentCountryId}
      />
      {values.residentCountryId && values.residentCountryId !== "RW" && (
        <TailwindSelect
          label="State"
          id="state"
          value={values.state}
          onChange={handleSelectChange}
          options={states}
          placeholder="Select a state"
          disabled={auth}
          error={errors.state}
        />
      )}
      {values.residentCountryId && values.residentCountryId === "RW" && (
        <TailwindSelect
          label="District"
          id="districtName"
          value={values.districtName}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
            handleSelectChange(e);
            const selectedDistrict = e.target.value;
            setSelectedDistrict(selectedDistrict);
          }}
          options={districts}
          placeholder="Select a district"
          disabled={auth}
          error={errors.districtName}
        />
      )}
      {values.residentCountryId && values.residentCountryId === "RW" && (
        <TailwindSelect
          label="Sector"
          id="sectorId"
          value={values.sectorId}
          onChange={handleSelectChange}
          options={sectors}
          placeholder="Select a sector"
          disabled={auth}
          error={errors.sectorId}
        />
      )}
      <TailwindSelect
        label="Cohort"
        id="cohortId"
        value={values.cohortId}
        onChange={handleSelectChange}
        options={cohorts}
        placeholder="Select a cohort"
        disabled={auth}
        error={errors.cohortId}
      />
      <TailwindSelect
        label="Track"
        id="track"
        value={values.track}
        onChange={handleSelectChange}
        options={tracks}
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
