import './globals.css'
import { Inter } from 'next/font/google'
import type { Metadata } from 'next'
import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import ClientInit from '@/components/ClientInit'
import Layout from '@/components/layout/Layout'
import dynamic from "next/dynamic"
import { Toaster } from 'react-hot-toast'
const ClientProtect = dynamic(() => import("@/components/shared/ClientProtect"), { ssr: false })

// Import global Tailwind CSS styles for the entire app
import '../styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Health Care Appointment System',
  description: 'Schedule and manage healthcare appointments online',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.className} suppressHydrationWarning>
      <head />
      <body className={`min-h-screen bg-background text-foreground ${inter.className}`}>
        <ThemeProvider>
          <AuthProvider>
            {/* Removed MultiAccountAuthProvider: per-tab session is now handled by browserSessionPersistence in firebaseClient.ts */}
            <Toaster position="top-center" />
            <ClientInit />
            <Layout>
              <ClientProtect>{children}</ClientProtect>
            </Layout>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
