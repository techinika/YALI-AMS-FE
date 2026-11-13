"use client";

import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MdCheck } from "react-icons/md";
import { Upload } from "lucide-react";
import ImportUsersModal from "../parts/models/ImportMembersModal";
import { PageHeader } from "../parts/PageHeader";
import SectionWrapper from "../parts/SessionWrapper";
import AddPersonalInfo from "../parts/insertUser/AddPersonalInfo";
import { listCountries, listDistricts } from "@/lib/data/reference";

const SECTIONS = [{ id: 1, title: "Personal & Contact Information", mandatory: true }];

function NewProfile() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "success" | "error">("idle");
  const [sectionFeedback, setSectionFeedback] = useState<Record<number, "idle" | "success" | "error" | "skipped">>({});
  const [, setUserId] = useState("");

  const { data: countries = [] } = useQuery({
    queryKey: ["ref", "countries"],
    queryFn: async () => (await listCountries()).data ?? [],
  });
  const { data: districts = [] } = useQuery({
    queryKey: ["ref", "districts"],
    queryFn: async () => (await listDistricts()).data ?? [],
  });

  const isProfileComplete = useMemo(
    () => SECTIONS.every((section) => ["success", "skipped"].includes(sectionFeedback[section.id] ?? "idle")),
    [sectionFeedback]
  );

  const handleResetProfile = useCallback(() => {
    setSectionFeedback({});
    setSubmissionStatus("idle");
  }, []);

  const handleSectionSuccess = useCallback((sectionId: number) => {
    setSectionFeedback((prev) => ({ ...prev, [sectionId]: "success" }));
    const next = sectionId + 1;
    if (next <= SECTIONS.length) {
      // all sections complete
      setSubmissionStatus("success");
    }
  }, []);

  const handleSectionError = useCallback((sectionId: number) => {
    setSectionFeedback((prev) => ({ ...prev, [sectionId]: "error" }));
  }, []);

  if (submissionStatus === "success") {
    return (
      <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
        <MdCheck className="mx-auto mb-4 h-12 w-12 text-green-600" aria-hidden="true" />
        <p className="mb-2 text-xl font-bold text-green-700">Member profile saved</p>
        <p className="mb-6 text-sm text-green-800">
          The new member has been created and invited to set their password.
        </p>
        <button
          type="button"
          onClick={handleResetProfile}
          className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-foreground transition hover:bg-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Add another member
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl p-4 sm:p-8">
      <PageHeader
        title="Add new member"
        description="Create a member profile and invite them to set their password."
        actionTitle="Import members"
        Icon={Upload}
        onAction={() => setIsImportModalOpen(true)}
        loading={false}
        disabled={false}
      />

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <SectionWrapper key={section.id} id={section.id} title={section.title} mandatory={section.mandatory}>
            {section.id === 1 && (
              <AddPersonalInfo
                countries={countries}
                districts={districts}
                onSuccess={() => handleSectionSuccess(1)}
                onError={() => handleSectionError(1)}
                setUserId={setUserId}
              />
            )}
          </SectionWrapper>
        ))}

        {sectionFeedback[1] === "success" && isProfileComplete && (
          <div className="pt-4 text-center">
            <button
              type="button"
              onClick={handleResetProfile}
              className="rounded-xl bg-green-600 px-8 py-3 font-semibold text-white shadow-sm transition hover:bg-green-700"
            >
              Add another member
            </button>
          </div>
        )}
      </div>

      {isImportModalOpen && <ImportUsersModal closeModal={() => setIsImportModalOpen(false)} />}
    </div>
  );
}

export default NewProfile;