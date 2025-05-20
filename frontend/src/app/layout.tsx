import type { Metadata } from "next";
import "./globals.css";
import { cn } from "@/lib/utils";
import { inter } from "@/lib/fonts";
import AccessibilityFix from "@/components/AccessibilityFix";
import { CacheProvider } from "@/contexts/CacheContext";

// Font đã được cấu hình trong lib/fonts.ts

export const metadata: Metadata = {
  title: "Admin IITS",
  description: "Admin Dashboard for IITS System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <div className="relative flex min-h-screen flex-col overflow-hidden">
          <AccessibilityFix />
          <CacheProvider>
            {children}
          </CacheProvider>
        </div>
      </body>
    </html>
  );
}
