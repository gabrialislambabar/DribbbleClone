import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { SiteHeader } from "@/components/layout/site-header";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DribbbleClone — Discover design work",
    template: "%s · DribbbleClone",
  },
  description:
    "A place for designers to share shots, build a profile, and discover work from the community.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <SiteHeader />
        <main className="flex flex-1 flex-col">{children}</main>
        <footer className="border-t border-border bg-white">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-6 text-xs text-muted">
            <span>DribbbleClone</span>
            <span>Show your work.</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
