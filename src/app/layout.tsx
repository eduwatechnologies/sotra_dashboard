import type { Metadata } from "next";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sotra Signals | Dashboard",
  description:
    "A private workspace for Sotra Signals market monitoring and analysis.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <DashboardShell>{children}</DashboardShell>
      </body>
    </html>
  );
}
