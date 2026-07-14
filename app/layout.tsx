import type { Metadata } from "next";
import "./globals.css";
import StoreProvider from "./StoreProvider";
import AccessibilityLoader from "@/components/Other/AccessibilityLoader";

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
    <html>
      <body>
        <StoreProvider>
          <AccessibilityLoader />
          {children}
        </StoreProvider>
      </body>
    </html>
  );
}
