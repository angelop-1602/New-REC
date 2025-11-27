"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/rec/chairperson/components/navbar/app-sidebar"
import { AppTopbar } from "@/components/rec/chairperson/components/navbar/app-topbar"
import { useAuth } from "@/hooks/useAuth"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { PageLoading } from "@/components/ui/loading"
import { getAuth, signOut as firebaseSignOut } from "firebase/auth"
import firebaseApp from "@/lib/firebaseConfig"
import { usePresence } from "@/hooks/usePresence"

const CHAIRPERSON_EMAIL = "rec@spup.edu.ph"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const auth = getAuth(firebaseApp)
  
  // Initialize presence tracking for chairperson
  usePresence()

  useEffect(() => {
    const checkChairpersonAuth = async () => {
      // If still loading, wait
      if (loading) {
        return
      }

      // If no user is logged in, redirect to sign-in
      if (!user) {
        router.push(`/auth/signin?redirect=${encodeURIComponent(pathname)}&role=chairperson`)
        return
      }

      // If user is logged in but NOT the chairperson, sign them out and redirect
      if (user.email !== CHAIRPERSON_EMAIL) {
        console.log('⚠️ User is logged in but not the chairperson. Signing out and redirecting...')
        try {
          await firebaseSignOut(auth)
          router.push(`/auth/signin?redirect=${encodeURIComponent(pathname)}&role=chairperson`)
        } catch (error) {
          console.error('Error signing out:', error)
          router.push(`/auth/signin?redirect=${encodeURIComponent(pathname)}&role=chairperson`)
        }
        return
      }

      // User is authenticated as chairperson, allow access
      console.log('✅ Chairperson authenticated:', user.email)
    }

    checkChairpersonAuth()
  }, [user, loading, router, pathname, auth])

  // Show loading while checking auth
  if (loading) {
    return <PageLoading />
  }

  // If user is not authenticated or not the chairperson, show nothing (redirect will happen)
  if (!user || user.email !== CHAIRPERSON_EMAIL) {
    return <PageLoading />
  }

  return (
    <SidebarProvider className="min-h-screen">
      <AppSidebar />
      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <AppTopbar className="flex-shrink-0" />
        <div className="flex-1 min-h-0 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}