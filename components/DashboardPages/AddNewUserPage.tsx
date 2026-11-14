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
import { toastError, toastSuccess } from "@/lib/toast";

const SECTIONS = [{ id: 1, title: "Personal & Contact Information", mandatory: true }];

function NewProfile() {
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<"idle" | "success" | "error">("idle");
  const [sectionFeedback, setSectionFeedback] = useState<Record<number, "idle" | "success" | "error" | "skipped">>({});
  const [inviteResult, setInviteResult] = useState<{
    inviteLink: string | null;
    emailSent: boolean;
    emailError: string | null;
    email: string;
  } | null>(null);
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
    setInviteResult(null);
  }, []);

  const handleSectionSuccess = useCallback(
    (
      sectionId: number,
      result?: {
        inviteLink: string | null;
        emailSent: boolean;
        emailError: string | null;
        email: string;
      }
    ) => {
      const nextFeedback = { ...sectionFeedback, [sectionId]: "success" as const };
      setSectionFeedback(nextFeedback);
      if (result) setInviteResult(result);
      if (SECTIONS.every((section) => ["success", "skipped"].includes(nextFeedback[section.id] ?? "idle"))) {
        setSubmissionStatus("success");
      }
    },
    [sectionFeedback]
  );

  const handleSectionError = useCallback((sectionId: number) => {
    setSectionFeedback((prev) => ({ ...prev, [sectionId]: "error" }));
  }, []);

  if (submissionStatus === "success") {
    return (
      <div className="mx-auto mt-8 max-w-lg rounded-2xl border border-green-200 bg-green-50 p-8 text-center shadow-sm">
        <MdCheck className="mx-auto mb-4 h-12 w-12 text-green-600" aria-hidden="true" />
        <p className="mb-2 text-xl font-bold text-green-700">Member profile saved</p>
        <p className="mb-4 text-sm text-green-800">
          {inviteResult?.emailSent
            ? <>An invitation email was sent to <strong>{inviteResult.email}</strong>.</>
            : inviteResult && !inviteResult.inviteLink
              ? "The new member has been created, but the set-password link could not be generated."
              : "The new member has been created. Send them the link below so they can set a password."}
        </p>
        {inviteResult && !inviteResult.emailSent && inviteResult.emailError && (
          <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm text-amber-900">
            The email could not be sent: {inviteResult.emailError}
          </p>
        )}
        {inviteResult?.inviteLink && (
          <div className="mb-6 text-left">
            <label htmlFor="invite-link" className="mb-1 block text-sm font-medium text-green-900">
              Set-password link
            </label>
            <div className="flex gap-2">
              <input
                id="invite-link"
                readOnly
                value={inviteResult.inviteLink}
                onFocus={(event) => event.currentTarget.select()}
                className="min-w-0 flex-1 rounded-lg border border-green-300 bg-white px-3 py-2 text-xs text-gray-700"
              />
              <button
                type="button"
                onClick={async () => {
                  const link = inviteResult?.inviteLink;
                  if (!link) return;
                  try {
                    await navigator.clipboard.writeText(link);
                    toastSuccess("Set-password link copied.");
                  } catch {
                    toastError("Could not copy the link. Select it and copy manually.");
                  }
                }}
                className="rounded-lg bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
              >
                Copy
              </button>
            </div>
            <p className="mt-2 text-xs text-green-800">
              The member uses this link to choose a password. If it expires, use the re-invite button on the Members page.
            </p>
          </div>
        )}
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
                onSuccess={(result) => handleSectionSuccess(1, result)}
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