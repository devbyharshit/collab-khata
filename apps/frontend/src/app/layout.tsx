import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "sonner"
import { Navigation } from "@/components/navigation"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

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
      <body className={inter.className}>
        <ErrorBoundary>
          <AuthProvider>
            <Navigation />
            {/* Add padding bottom for mobile bottom navigation (72px = 56px nav + 16px safe area) */}
            <div className="pb-20 md:pb-0">
              {children}
            </div>
            <Toaster position="top-center" richColors />
          </AuthProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
