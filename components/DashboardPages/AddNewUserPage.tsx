"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { MdCheck } from "react-icons/md";
import ImportUsersModal from "../parts/models/ImportMembersModal";
import { PageHeader } from "../parts/PageHeader";
import { Upload } from "lucide-react";
import { Country, ResidentDistrict } from "@/types/user";
import {
  useCountriesQuery,
  useDistrictsQuery,
} from "@/lib/features/otherSlice";
import SectionWrapper from "../parts/SessionWrapper";
import AddPersonalInfo from "../parts/insertUser/AddPersonalInfo";

const SECTIONS = [
  {
    id: 1,
    title: "Personal & Contact Information",
    component: AddPersonalInfo,
    mandatory: true,
    canRevisit: true,
    skip: false,
    props: (districts: ResidentDistrict[], countries: Country[]) => ({
      districts,
      countries,
    }),
  },
];

function NewProfile() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [districts, setDistricts] = useState<ResidentDistrict[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [activeSection, setActiveSection] = useState<number>(1);
  const [sectionFeedback, setSectionFeedback] = useState<{
    [key: number]: "idle" | "success" | "error" | "skipped";
  }>({});
  const [userId, setUserId] = useState("");

  const newUserId = `AMS-MEM-${Date.now()}`;

  const { data: CountryData } = useCountriesQuery("");
  const { data: DistrictData } = useDistrictsQuery("");

  useEffect(() => {
    if (DistrictData?.data) {
      setDistricts(DistrictData.data);
    }
    if (CountryData?.data) {
      setCountries(CountryData.data);
    }
  }, [DistrictData, CountryData]);
  const isProfileComplete = useMemo(() => {
    return SECTIONS.every((section) =>
      ["success", "skipped"].includes(sectionFeedback[section.id])
    );
  }, [sectionFeedback]);

  const handleResetProfile = useCallback(() => {
    setActiveSection(1);
    setSectionFeedback({});
    setSubmissionStatus("idle");
  }, []);

  const handleSectionSuccess = useCallback((sectionId: number) => {
    setSectionFeedback((prev) => ({ ...prev, [sectionId]: "success" }));
    const nextSection = sectionId + 1;
    if (nextSection <= SECTIONS.length) {
      setActiveSection(nextSection);
    } else {
      setSubmissionStatus("success");
    }
  }, []);

  const handleSectionError = useCallback((sectionId: number) => {
    setSectionFeedback((prev) => ({ ...prev, [sectionId]: "error" }));
    setActiveSection(sectionId);
  }, []);

  if (submissionStatus === "success") {
    return (
      <div className="mt-8 p-8 bg-green-50 rounded-xl shadow-lg border border-green-200 text-center max-w-lg mx-auto">
        <MdCheck className="w-12 h-12 text-green-600 mx-auto mb-4" />
        <p className="text-xl font-bold text-green-700 mb-2">
          Success! Member Profile Saved.
        </p>
        <p className="text-gray-700 mb-6">
          The new member has been successfully created.
        </p>
        <button
          onClick={handleResetProfile}
          className="px-6 py-3 text-white font-medium bg-primary rounded-xl hover:bg-primary/80 transition duration-150 shadow-md"
        >
          Start New Member Profile
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 container mx-auto">
      <PageHeader
        title="Add New Member"
        description="Create a new member profile by filling out the sections below."
        actionTitle={"Import Members"}
        Icon={Upload}
        onAction={() => setIsImportModalOpen(true)}
        loading={false}
        disabled={false}

      />
      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <SectionWrapper
            key={section.id}
            id={section.id}
            title={section.title}
            mandatory={section.mandatory}
          >
            {section.id === 1 && (
              <AddPersonalInfo
                countries={countries}
                districts={districts}
                onSuccess={() => handleSectionSuccess(1)}
                onError={() => handleSectionError(1)}
                newId={newUserId}
                setUserId={setUserId}
              />
            )}
          </SectionWrapper>
        ))}
        {sectionFeedback[1] === "success" && isProfileComplete && (
          <div className="text-center pt-4">
            <button
              onClick={handleResetProfile}
              className="px-8 py-3 text-white font-semibold bg-green-600 rounded-xl hover:bg-green-700 transition duration-150 shadow-lg"
            >
              Finish User, Add New Member Profile
            </button>
          </div>
        )}
      </div>
      {isImportModalOpen && (
        <ImportUsersModal closeModal={() => setIsImportModalOpen(false)} />
      )}
    </div>
  );
}

export default NewProfile;
