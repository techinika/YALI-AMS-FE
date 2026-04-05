"use client";

import React from "react";

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "" }) => (
  <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
);

export const TableRowSkeleton: React.FC = () => (
  <tr className="border-b border-gray-100">
    <td className="px-6 py-4">
      <Skeleton className="h-4 w-32" />
    </td>
    <td className="px-6 py-4">
      <Skeleton className="h-4 w-40" />
    </td>
    <td className="px-6 py-4">
      <Skeleton className="h-4 w-24" />
    </td>
    <td className="px-6 py-4">
      <Skeleton className="h-4 w-32" />
    </td>
    <td className="px-6 py-4">
      <Skeleton className="h-4 w-20" />
    </td>
  </tr>
);

export const CardSkeleton: React.FC = () => (
  <div className="bg-white p-5 rounded-2xl border border-slate-200">
    <div className="flex justify-between items-start mb-4">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <Skeleton className="h-4 w-4" />
    </div>
    <Skeleton className="h-5 w-3/4 mb-2" />
    <Skeleton className="h-4 w-1/2 mb-4" />
    <div className="flex gap-1">
      <Skeleton className="h-5 w-16" />
      <Skeleton className="h-5 w-20" />
    </div>
  </div>
);

export const NotificationSkeleton: React.FC = () => (
  <div className="flex items-start p-4 border-b border-gray-50">
    <Skeleton className="h-5 w-5 rounded" />
    <div className="ml-4 min-w-0 grow">
      <div className="flex justify-between items-center mb-1">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-2 w-2 rounded-full" />
      </div>
      <Skeleton className="h-3 w-20" />
    </div>
  </div>
);

export const StatsCardSkeleton: React.FC = () => (
  <div className="bg-white border-l-4 border-blue-500 p-6 rounded-2xl">
    <div className="flex items-center space-x-4">
      <Skeleton className="h-12 w-12 rounded-full" />
      <div className="grow">
        <Skeleton className="h-3 w-24 mb-2" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  </div>
);

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div className="h-screen w-full flex justify-center items-center flex-col gap-2">
    <div className="w-12 h-12 border-4 border-primary border-t-transparent border-solid rounded-full animate-spin"></div>
    <p className="text-primary font-bold">Loading...</p>
  </div>
);