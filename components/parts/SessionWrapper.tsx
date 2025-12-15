"use client";

import React from "react";
import { Briefcase, User2 } from "lucide-react";

interface SectionWrapperProps {
  id: number;
  title: string;
  mandatory: boolean;
  children: React.ReactNode;
}

const SectionWrapper: React.FC<SectionWrapperProps> = ({
  id,
  title,
  mandatory,
  children,
}) => {
  const headerIcon =
    id === 1 ? (
      <User2 className="inline w-5 h-5 mr-2" />
    ) : (
      <Briefcase className="inline w-5 h-5 mr-2" />
    );

  return (
    <section className="bg-white p-6 sm:p-8 rounded-xl shadow-lg border border-primary ring-2 ring-blue-100">
      <h2 className="text-xl font-bold text-primary mb-4 border-b pb-2">
        {headerIcon} {id}. {title}
        {mandatory && <span className="text-red-500">*</span>}
      </h2>
      {children}
    </section>
  );
};

export default SectionWrapper;
