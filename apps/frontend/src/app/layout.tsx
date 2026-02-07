import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "sonner"
import { Navigation } from "@/components/navigation"

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
        <AuthProvider>
          <Navigation />
          <div className="pb-16 md:pb-0">
            {children}
          </div>
          <Toaster position="top-center" richColors />
        </AuthProvider>
      </body>
    </html>
  )
}
