import type { Metadata } from "next";
import "./globals.css";
import AccessibilityLoader from "@/components/Other/AccessibilityLoader";
import { QueryProvider } from "@/lib/data/query-provider";

export const metadata: Metadata = {
  title: "YALI Alumni Management System",
  description: "One place to manage all alumni data and interactions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
        >
          Skip to main content
        </a>
        <QueryProvider>
          <AccessibilityLoader />
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
