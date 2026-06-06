import { ErrorBoundary } from "@/components/error-boundary";
import { Navigation } from "@/components/navigation";
import { TopHeader } from "@/components/top-header";
import { AuthProvider } from "@/contexts/auth-context";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Collab Khata - Brand Collaboration Tracker",
  description: "Manage your brand partnerships efficiently",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${jakarta.className} bg-background text-foreground antialiased overflow-hidden`}
      >
        <ErrorBoundary>
          <AuthProvider>
            <div className="flex flex-col md:flex-row h-screen overflow-hidden">
              <Navigation />

              <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <TopHeader />
                <main className="flex-1 px-6 pt-4 pb-28 md:px-8 md:pt-6 md:pb-8 w-full max-w-7xl mx-auto">
                  {children}
                </main>
              </div>
            </div>
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
