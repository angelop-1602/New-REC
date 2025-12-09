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
import { useChairpersonPermission } from "@/hooks/useChairpersonPermission"

export default function Layout({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const { isChairperson, loading: permissionLoading, error: permissionError } = useChairpersonPermission()
  const router = useRouter()
  const pathname = usePathname()
  const auth = getAuth(firebaseApp)
  
  // Initialize presence tracking for chairperson
  usePresence()

  useEffect(() => {
    const checkChairpersonAuth = async () => {
      // If still loading, wait
      if (authLoading || permissionLoading) {
        return
      }

      // If no user is logged in, redirect to sign-in
      if (!user) {
        router.push(`/auth/signin?redirect=${encodeURIComponent(pathname)}&role=chairperson`)
        return
      }

      // If user is logged in but NOT the chairperson, sign them out and redirect
      if (!isChairperson) {
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
    }

    checkChairpersonAuth()
  }, [user, authLoading, isChairperson, permissionLoading, router, pathname, auth])

  // Show loading while checking auth or permissions
  if (authLoading || permissionLoading) {
    return <PageLoading />
  }

  // If there was an error checking permissions, show error and redirect
  if (permissionError) {
    console.error('Permission check error:', permissionError)
    // Still redirect to sign-in for safety
    router.push(`/auth/signin?redirect=${encodeURIComponent(pathname)}&role=chairperson`)
    return <PageLoading />
  }

  // If user is not authenticated or not the chairperson, show nothing (redirect will happen)
  if (!user || !isChairperson) {
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