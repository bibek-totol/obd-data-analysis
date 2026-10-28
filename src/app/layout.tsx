import type { Metadata } from "next";
import React from "react";
import "./globals.css";
import DashboardShell from "@/components/DashboardShell";

export const metadata: Metadata = {
  title: "National Weather, Livestock & Agromet Intelligence Platform",
  description: "DLS, BMD & DAE Bangladesh weather forecast, livestock advisory, and agromet intelligence monitoring platform",
  icons: {
    icon: "https://nlas.dls.gov.bd/assets/images/logo/ic_dls.png"
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Hind+Siliguri:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <React.Suspense fallback={null}>
          <DashboardShell>
            {children}
          </DashboardShell>
        </React.Suspense>
      </body>
    </html>
  );
}
