import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TownOps Skill — Agent-Usable Town Operations for NANDA Town",
  description: "Report, triage, assign, and resolve NANDA Town issues through live endpoints and a strong SKILL.md.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
