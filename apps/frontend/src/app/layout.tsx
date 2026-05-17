import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "sonner"
import { Navigation } from "@/components/navigation"
import { ErrorBoundary } from "@/components/error-boundary"

const jakarta = Plus_Jakarta_Sans({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700"] })

export const metadata: Metadata = {
  title: "Collab Khata - Brand Collaboration Tracker",
  description: "Manage your brand partnerships efficiently",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${jakarta.className} bg-gradient-to-br from-[#FDF2F8] via-[#ffffff] to-[#FFF1F2] text-foreground min-h-screen antialiased dark:from-background dark:via-background dark:to-background`}>
        <ErrorBoundary>
          <AuthProvider>
            <div className="flex flex-col min-h-screen">
              <Navigation />
              {/* Add padding bottom for mobile bottom navigation */}
              <main className="flex-1 pb-28 md:pb-8 w-full relative">
                {/* Decorative blob for background */}
                <div className="absolute top-0 right-0 -z-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 -z-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl opacity-50 mix-blend-multiply pointer-events-none"></div>
                {children}
              </main>
            </div>
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
