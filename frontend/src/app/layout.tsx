import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Meridian — On-Premise AI Workbench",
  description:
    "Sovereign on-premise agentic AI workbench for confidential industrial operations. Local inference, zero external APIs.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} dark h-screen w-screen overflow-hidden`}>
      <body className="h-screen w-screen m-0 p-0 overflow-hidden bg-[var(--m-bg-primary)] text-[var(--m-text-primary)] antialiased font-[var(--font-sans)]">
        {children}
      </body>
    </html>
  );
}
