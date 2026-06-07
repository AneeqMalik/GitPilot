import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GitPilot — Setup Guide & Publishing Hub",
  description: "Secure, high-performance GitHub Pull Request management and automated AI code reviews.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
