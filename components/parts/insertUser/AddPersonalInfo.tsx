"use client";

import React, { useState, useCallback } from "react";
import {
  Country,
  Gender,
  ResidentDistrict,
  ResidentSector,
  State,
} from "@/types/user";
import { useQuery } from "@tanstack/react-query";
import {
  listCohorts,
  listGenders,
  listSectorsByDistrict,
  listStatesByCountry,
  listTracks,
} from "@/lib/data/reference";
import { createMember, fileToAvatar } from "@/lib/data/members-admin";
import { Track } from "@/types/track";
import { Cohort } from "@/types/cohort";
import { TailwindInput } from "@/components/ui/TailInput";
import { PhoneInputTailwind } from "@/components/ui/tail-phone";
import { TailwindSelect } from "@/components/ui/tail-select";
import { Combobox } from "@/components/ui/combobox";
import { Button } from "@/components/ui/Button";
import { TailwindAlert } from "@/components/ui/tail0alert";

const CloudUploadIcon = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5"
  >
    <path
      fillRule="evenodd"
      d="M10.5 3.75a6 6 0 0 0-5.61 8.845 3.75 3.75 0 0 0-4.162-4.162 6 6 0 0 0 8.845-5.61Z"
      clipRule="evenodd"
    />
    <path d="M11.875 14.125a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0ZM12 18H5.625a3.375 3.375 0 1 1-3.375-3.375V11.25A4.5 4.5 0 0 1 6.375 6.75h11.25A4.5 4.5 0 0 1 22.125 11.25v3.375a3.375 3.375 0 0 1-3.375 3.375H12Z" />
  </svg>
);

interface FormValues {
  bio: string;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  linkedin: string;
  instagram: string;
  twitter: string;
  facebook: string;
  genderId: string;
  phoneNumber: string;
  districtId: string;
  sectorId: string;
  countryId: string;
  whatsAppNumber: string;
  nearlestLandmark: string;
  trackId: string;
  cohortId: string;
  stateId: string;
}

interface FormErrors {
  [key: string]: string;
}

const initialValues: FormValues = {
  bio: "",
  firstName: "",
  middleName: "",
  lastName: "",
  email: "",
  linkedin: "",
  instagram: "",
  twitter: "",
  facebook: "",
  genderId: "",
  phoneNumber: "",
  districtId: "",
  sectorId: "",
  countryId: "",
  whatsAppNumber: "",
  nearlestLandmark: "",
  trackId: "",
  cohortId: "",
  stateId: "",
};

const validate = (values: FormValues) => {
  const errors: FormErrors = {};

  if (!values.firstName) {
    errors.firstName = "First name is required";
  }
  if (!values.lastName) {
    errors.lastName = "Last name is required";
  }
  if (!values.email) {
    errors.email = "Email is required";
  } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(values.email)) {
    errors.email = "Invalid email address";
  }
  if (values.bio.length > 500) {
    errors.bio = "Bio cannot exceed 500 characters";
  }
  if (
    values.linkedin &&
    !/^https?:\/\/(www\.)?linkedin\.com\//i.test(values.linkedin)
  ) {
    errors.linkedin = "Invalid LinkedIn URL";
  }
  if (
    values.instagram &&
    !/^https?:\/\/(www\.)?instagram\.com\//i.test(values.instagram)
  ) {
    errors.instagram = "Invalid Instagram URL";
  }
  if (
    values.twitter &&
    !/^https?:\/\/(www\.)?twitter\.com\//i.test(values.twitter) &&
    !/^https?:\/\/(www\.)?x\.com\//i.test(values.twitter)
  ) {
    errors.twitter = "Invalid Twitter/X URL";
  }
  if (
    values.facebook &&
    !/^https?:\/\/(www\.)?facebook\.com\//i.test(values.facebook)
  ) {
    errors.facebook = "Invalid Facebook URL";
  }
  if (values.phoneNumber && !/^\+?[0-9]+$/i.test(values.phoneNumber)) {
    errors.phoneNumber = "Phone number must be digits only";
  }
  if (values.whatsAppNumber && !/^\+?[0-9]+$/i.test(values.whatsAppNumber)) {
    errors.whatsAppNumber = "WhatsApp number must be digits only";
  }
  if (!values.genderId) {
    errors.genderId = "Gender is required";
  }
  if (!values.trackId) {
    errors.trackId = "Track is required";
  }
  if (!values.countryId) {
    errors.countryId = "Resident Country is required";
  }

  if (values.countryId === "RW") {
    if (!values.districtId) errors.districtId = "District is required";
    if (!values.sectorId) errors.sectorId = "Sector is required";
  } else if (values.countryId && !values.stateId) {
    errors.stateId = "State/Province is required";
  }

  return errors;
};

type Option = { id: string; name: string };
const toOption = (row: { id: string | number; name?: string | null }): Option => ({
  id: String(row.id),
  name: row.name ?? "",
});
const genderToOption = toOption;
const countryToOption = toOption;
const stateToOption = toOption;
const districtToOption = toOption;
const sectorToOption = toOption;
const trackToOption = toOption;
const cohortToOption = toOption;

function AddPersonalInfo({
  districts,
  countries,
  onSuccess,
  onError,
  setUserId,
}: {
  districts: ResidentDistrict[];
  countries: Country[];
  onSuccess: () => void;
  onError: () => void;
  setUserId: (v: string) => void;
}) {

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageData, setImageData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const [formValues, setFormValues] = useState<FormValues>(initialValues);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<{ [key: string]: boolean }>({});

  const countryId = formValues.countryId;
  const districtId = formValues.districtId;

  const { data: genders = [] } = useQuery({
    queryKey: ["ref", "genders"],
    queryFn: async () => (await listGenders()).data ?? [],
  });
  const { data: cohorts = [] } = useQuery({
    queryKey: ["ref", "cohorts"],
    queryFn: async () => (await listCohorts()).data ?? [],
  });
  const { data: tracks = [] } = useQuery({
    queryKey: ["ref", "tracks"],
    queryFn: async () => (await listTracks()).data ?? [],
  });
  const { data: states = [] } = useQuery({
    queryKey: ["ref", "states", countryId],
    enabled: Boolean(countryId) && countryId !== "RW",
    queryFn: async () => (await listStatesByCountry(countryId)).data ?? [],
  });
  const { data: sectors = [] } = useQuery({
    queryKey: ["ref", "sectors", districtId],
    enabled: Boolean(districtId) && countryId === "RW",
    queryFn: async () => (await listSectorsByDistrict(districtId)).data ?? [],
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({ ...prev, [id]: value }));

    if (touched[id]) {
      const newValues = { ...formValues, [id]: value };
      const newErrors = validate(newValues);
      setFormErrors((prev) => ({ ...prev, [id]: newErrors[id] || "" }));
    }

    if (id === "countryId") {
      setFormValues((prev) => ({
        ...prev,
        districtId: "",
        sectorId: "",
        stateId: "",
      }));
      setFormErrors((prev) => ({
        ...prev,
        districtId: "",
        sectorId: "",
        stateId: "",
      }));
    }
    if (id === "districtId") {
      setFormValues((prev) => ({ ...prev, sectorId: "" }));
      setFormErrors((prev) => ({ ...prev, sectorId: "" }));
    }
  };

  const handleComboboxChange = useCallback(
    (id: keyof FormValues) => (value: string) => {
      setFormValues((prev) => {
        const next = { ...prev, [id]: value };
        if (id === "countryId") {
          next.districtId = "";
          next.sectorId = "";
          next.stateId = "";
        }
        if (id === "districtId") {
          next.sectorId = "";
        }
        return next;
      });
      setTouched((prev) => ({ ...prev, [id]: true }));
      if (touched[id]) {
        const updated = { ...formValues, [id]: value };
        const errs = validate(updated);
        setFormErrors((prev) => ({ ...prev, [id]: errs[id] || "" }));
      }
    },
    [formValues, touched],
  );

  const handleBlur = (
    e: React.FocusEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { id } = e.target;
    setTouched((prev) => ({ ...prev, [id]: true }));
    const newErrors = validate(formValues);
    setFormErrors((prev) => ({ ...prev, [id]: newErrors[id] || "" }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageData(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    const errors = validate(formValues);
    setFormErrors(errors);

    const newTouched: { [key: string]: boolean } = {};
    Object.keys(formValues).forEach((key) => {
      newTouched[key] = true;
    });
    setTouched(newTouched);

    if (Object.keys(errors).length > 0) {
      setError("Please fix the validation errors before submitting.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    const values = formValues;

    try {
      const avatar = imageData ? await fileToAvatar(imageData as File) : undefined;

      const res = await createMember({
        firstName: values.firstName,
        middleName: values.middleName,
        lastName: values.lastName,
        email: values.email,
        bio: values.bio,
        linkedin: values.linkedin,
        instagram: values.instagram,
        twitter: values.twitter,
        facebook: values.facebook,
        phoneNumber: values.phoneNumber,
        whatsAppNumber: values.whatsAppNumber,
        nearlestLandmark: values.nearlestLandmark,
        genderId: values.genderId,
        cohortId: values.cohortId,
        trackId: values.trackId,
        countryId: values.countryId,
        districtId: values.countryId === "RW" ? values.districtId : undefined,
        sectorId: values.countryId === "RW" ? values.sectorId : undefined,
        stateId: values.countryId === "RW" ? undefined : values.stateId,
        avatar,
      });

      setUserId(res.user.id);
      setSuccess("Member profile created successfully!");
      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not create the member.");
      onError();
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChange =
    (id: keyof FormValues) => (e: React.ChangeEvent<HTMLSelectElement>) => {
      const value = e.target.value;
      setFormValues((prev) => ({ ...prev, [id]: value }));
      setTouched((prev) => ({ ...prev, [id]: true }));

      if (id === "countryId") {
        setFormValues((prev) => ({
          ...prev,
          districtId: "",
          sectorId: "",
          stateId: "",
        }));
      }
      if (id === "districtId") {
        setFormValues((prev) => ({ ...prev, sectorId: "" }));
      }

      const newValues = { ...formValues, [id]: value };
      const newErrors = validate(newValues);
      setFormErrors((prev) => ({ ...prev, [id]: newErrors[id] || "" }));
    };

  return (
    <div className="p-4">
      {success && <TailwindAlert severity="success">{success}</TailwindAlert>}
      {error && <TailwindAlert severity="error">{error}</TailwindAlert>}
      <div className="relative border-b pb-4 mb-4">
        <div className="flex items-start justify-between p-2">
          <div className="flex flex-col items-start">
            <label
              htmlFor="profileImage"
              className="flex items-center px-4 py-2 font-semibold text-white bg-green-600 hover:bg-green-700 rounded-md cursor-pointer transition duration-150 ease-in-out"
            >
              <CloudUploadIcon className="w-5 h-5 mr-2" /> Upload Profile
              Picture
              <input
                id="profileImage"
                type="file"
                className="sr-only"
                onChange={handleFileChange}
                accept="image/*"
              />
            </label>
            {imagePreview && (
              <>
                <img
                  src={imagePreview}
                  alt="Image Preview"
                  className="mt-4 h-40 rounded-md w-40 object-cover border border-gray-300 shadow-md"
                />
                <div className="my-2 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => {
                      setImagePreview(null);
                      setImageData(null);
                    }}
                    className="bg-red-500 px-3 py-1 text-sm hover:bg-red-600"
                  >
                    Clear
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    The picture is saved when you submit.
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="space-y-4"
      >
        <TailwindInput
          id="bio"
          label="Biography"
          multiline
          rows={5}
          value={formValues.bio}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter the user's BIO..."
          error={!!formErrors.bio}
          helperText={formErrors.bio}
        />
        <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4">
          <TailwindInput
            id="firstName"
            label="First Name:"
            value={formValues.firstName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="First Name"
            required
            error={!!formErrors.firstName}
            helperText={formErrors.firstName}
          />
          <TailwindInput
            id="middleName"
            label="Middle Name:"
            value={formValues.middleName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Middle Name"
            error={!!formErrors.middleName}
            helperText={formErrors.middleName}
          />
          <TailwindInput
            id="lastName"
            label="Last Name:"
            value={formValues.lastName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Last Name"
            required
            error={!!formErrors.lastName}
            helperText={formErrors.lastName}
          />
          <TailwindInput
            id="email"
            label="Email:"
            type="email"
            value={formValues.email}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Email"
            required
            error={!!formErrors.email}
            helperText={formErrors.email}
          />
          <PhoneInputTailwind
            id="phoneNumber"
            label="Phone Number:"
            value={formValues.phoneNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g. +1 555 123 4567"
            error={!!formErrors.phoneNumber}
            helperText={formErrors.phoneNumber}
          />
          <PhoneInputTailwind
            id="whatsAppNumber"
            label="WhatsApp Number:"
            value={formValues.whatsAppNumber}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="e.g. +1 555 123 4567"
            error={!!formErrors.whatsAppNumber}
            helperText={formErrors.whatsAppNumber}
          />
          <Combobox
            label="Gender"
            value={formValues.genderId}
            onChange={handleComboboxChange("genderId")}
            options={genders.map(genderToOption)}
            required
            placeholder="Select Gender"
            error={formErrors.genderId}
          />
          <Combobox
            label="Resident Country"
            value={formValues.countryId}
            onChange={handleComboboxChange("countryId")}
            options={countries.map(countryToOption)}
            required
            placeholder="Select Country"
            error={formErrors.countryId}
          />
          {formValues.countryId && formValues.countryId !== "RW" && (
            <Combobox
              label="State / Province"
              value={formValues.stateId}
              onChange={handleComboboxChange("stateId")}
              options={states.map(stateToOption)}
              required
              placeholder="Select State/Province"
              error={formErrors.stateId}
            />
          )}
          {formValues.countryId === "RW" && (
            <Combobox
              label="District"
              value={formValues.districtId}
              onChange={handleComboboxChange("districtId")}
              options={districts.map(districtToOption)}
              required
              placeholder="Select District"
              error={formErrors.districtId}
            />
          )}
          {formValues.countryId === "RW" && (
            <Combobox
              label="Sector"
              value={formValues.sectorId}
              onChange={handleComboboxChange("sectorId")}
              options={sectors.map(sectorToOption)}
              placeholder="Select Sector"
              error={formErrors.sectorId}
            />
          )}
          <Combobox
            label="Cohort"
            value={formValues.cohortId}
            onChange={handleComboboxChange("cohortId")}
            options={cohorts.map(cohortToOption)}
            placeholder="Select Cohort (Optional)"
            required={false}
            error={formErrors.cohortId}
          />
          <Combobox
            label="Track"
            value={formValues.trackId}
            onChange={handleComboboxChange("trackId")}
            options={tracks.map(trackToOption)}
            required
            placeholder="Select Track"
            error={formErrors.trackId}
          />
          <TailwindInput
            id="nearlestLandmark"
            label="Nearest Landmark:"
            value={formValues.nearlestLandmark}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="What's the popular place near you?"
            error={!!formErrors.nearlestLandmark}
            helperText={formErrors.nearlestLandmark}
          />
          <TailwindInput
            id="linkedin"
            label="LinkedIn Account (URL):"
            value={formValues.linkedin}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="https://linkedin.com/in/..."
            error={!!formErrors.linkedin}
            helperText={formErrors.linkedin}
          />
          <TailwindInput
            id="twitter"
            label="X (Twitter) Account (URL):"
            value={formValues.twitter}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="https://x.com/..."
            error={!!formErrors.twitter}
            helperText={formErrors.twitter}
          />
          <TailwindInput
            id="instagram"
            label="Instagram Account (URL):"
            value={formValues.instagram}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="https://instagram.com/..."
            error={!!formErrors.instagram}
            helperText={formErrors.instagram}
          />
          <TailwindInput
            id="facebook"
            label="Facebook Account (URL):"
            value={formValues.facebook}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="https://facebook.com/..."
            error={!!formErrors.facebook}
            helperText={formErrors.facebook}
          />
        </div>
      </form>
      <div className="flex justify-end pt-4 mt-4 border-t">
        <Button
          onClick={handleSubmit}
          className="bg-primary hover:bg-primary/80"
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Personal Data"}
        </Button>
      </div>
    </div>
  );
}

export default AddPersonalInfo;
