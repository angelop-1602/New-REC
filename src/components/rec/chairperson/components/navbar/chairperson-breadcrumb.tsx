"use client"

import React, { useMemo } from "react"
import { usePathname, useParams } from "next/navigation"
import Link from "next/link"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Home,
  MessageSquare,
  Calendar,
  UserCheck,
  Users,
  FileText,
  Settings,
  FileEdit,
  Clock,
  Inbox,
  Check,
  Archive,
  Download,
} from "lucide-react"
import { useRealtimeProtocol } from "@/hooks/useRealtimeProtocol"
import { SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore"
import { toChairpersonProtocol, getProtocolTitle, getProtocolCode } from '@/types'
import { reviewersManagementService, Reviewer, ReviewerRole } from '@/lib/services/reviewers/reviewersManagementService'
import { useState, useEffect } from 'react'

interface BreadcrumbItem {
  label: string
  href: string
  icon?: React.ReactNode
  isCurrent?: boolean
}

// Route mapping for breadcrumbs
const ROUTE_MAP: Record<string, { label: string; icon: React.ReactNode }> = {
  "": { label: "Dashboard", icon: <Home className="h-4 w-4" /> },
  messages: { label: "Messages", icon: <MessageSquare className="h-4 w-4" /> },
  calendar: { label: "Calendar", icon: <Calendar className="h-4 w-4" /> },
  reviewers: { label: "Reviewers", icon: <UserCheck className="h-4 w-4" /> },
  "rec-members": { label: "REC Members", icon: <Users className="h-4 w-4" /> },
  "pending-protocols": { label: "Pending", icon: <Clock className="h-4 w-4" /> },
  "accepted-protocols": { label: "Accepted", icon: <Inbox className="h-4 w-4" /> },
  "under-review-protocols": { label: "Under Review", icon: <FileText className="h-4 w-4" /> },
  "approved-protocols": { label: "Approved", icon: <Check className="h-4 w-4" /> },
  "archived-protocols": { label: "Archived", icon: <Archive className="h-4 w-4" /> },
  "submitted-protocols": { label: "Submitted", icon: <FileText className="h-4 w-4" /> },
  protocol: { label: "Protocols", icon: <FileText className="h-4 w-4" /> },
  "generate-documents": { label: "Generate Documents", icon: <FileEdit className="h-4 w-4" /> },
  extraction: { label: "Extraction", icon: <Download className="h-4 w-4" /> },
  settings: { label: "Settings", icon: <Settings className="h-4 w-4" /> },
}

// REC member roles - these should show "REC Members" as parent breadcrumb
const REC_MEMBER_ROLES: ReviewerRole[] = ['chairperson', 'vice-chair', 'secretary', 'office-secretary', 'member']

export function ChairpersonBreadcrumb() {
  const pathname = usePathname()
  const params = useParams()
  const protocolId = params?.id as string | undefined
  const reviewerNameSlug = params?.name as string | undefined
  const [reviewerName, setReviewerName] = useState<string | null>(null)
  const [reviewer, setReviewer] = useState<Reviewer | null>(null)

  // Fetch protocol data if we're on a protocol detail page
  const { protocol: rawProtocol } = useRealtimeProtocol({
    protocolId: protocolId || "",
    collectionName: SUBMISSIONS_COLLECTION,
    enabled: !!protocolId && pathname.includes("/protocol/"),
  })
  
  // Convert to typed protocol
  const protocol = rawProtocol ? toChairpersonProtocol(rawProtocol) : null

  // Fetch reviewer data if we're on a reviewer profile page
  useEffect(() => {
    if (pathname.includes("/portfolio/") && reviewerNameSlug && !pathname.includes("/protocol/")) {
      reviewersManagementService.getReviewerByNameSlug(reviewerNameSlug)
        .then(reviewerData => {
          if (reviewerData) {
            setReviewerName(reviewerData.name)
            setReviewer(reviewerData)
          }
        })
        .catch(err => console.error('Error fetching reviewer for breadcrumb:', err))
    } else {
      setReviewerName(null)
      setReviewer(null)
    }
  }, [pathname, reviewerNameSlug])

  const breadcrumbItems = useMemo(() => {
    const items: BreadcrumbItem[] = []
    const segments = pathname.split("/").filter(Boolean)

    // Remove "rec" and "chairperson" segments
    const relevantSegments = segments.slice(2)

    // Always add Dashboard as the first item (unless we're already on dashboard)
    if (relevantSegments.length === 0) {
      // Dashboard
      items.push({
        label: "Dashboard",
        href: "/rec/chairperson",
        icon: <Home className="h-4 w-4" />,
        isCurrent: true,
      })
      return items
    }

    // Add Dashboard as first breadcrumb item
    items.push({
      label: "Dashboard",
      href: "/rec/chairperson",
      icon: <Home className="h-4 w-4" />,
      isCurrent: false,
    })

    let currentPath = "/rec/chairperson"

    relevantSegments.forEach((segment, index) => {
      const isLast = index === relevantSegments.length - 1
      const nextSegment = relevantSegments[index + 1]
      
      // Handle reviewer profile pages - check if current segment is "portfolio" and next is the name slug
      if (segment === "portfolio" && nextSegment === reviewerNameSlug && reviewerName) {
        // Determine if this is an REC member or regular reviewer
        const isRECMember = reviewer && reviewer.role && REC_MEMBER_ROLES.includes(reviewer.role)
        
        // Add appropriate parent breadcrumb
        if (isRECMember) {
          items.push({
            label: "REC Members",
            href: "/rec/chairperson/rec-members",
            icon: <Users className="h-4 w-4" />,
          })
        } else {
        items.push({
          label: "Reviewers",
          href: "/rec/chairperson/reviewers",
          icon: <UserCheck className="h-4 w-4" />,
        })
        }
        
        // Add reviewer name (skip the "portfolio" and name slug segments)
        currentPath += `/${segment}/${nextSegment}`
        items.push({
          label: reviewerName,
          href: currentPath,
          icon: isRECMember ? <Users className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />,
          isCurrent: true,
        })
        return
      }

      // Skip the name slug segment if we already handled it above
      if (segment === reviewerNameSlug && index > 0 && relevantSegments[index - 1] === "portfolio") {
        return
      }

      currentPath += `/${segment}`

      // Handle protocol detail pages
      if (segment === "protocol" && protocolId) {
        // Add "Protocols" parent
        if (index === 0) {
          items.push({
            label: "Protocols",
            href: "/rec/chairperson/pending-protocols",
            icon: <FileText className="h-4 w-4" />,
          })
        }

        // Determine protocol status and add status breadcrumb
        const protocolStatus = protocol?.status || "pending"
        const statusMap: Record<string, { label: string; href: string; icon: React.ReactNode }> = {
          pending: { label: "Pending", href: "/rec/chairperson/pending-protocols", icon: <Clock className="h-4 w-4" /> },
          accepted: { label: "Accepted", href: "/rec/chairperson/accepted-protocols", icon: <Inbox className="h-4 w-4" /> },
          "under-review": { label: "Under Review", href: "/rec/chairperson/under-review-protocols", icon: <FileText className="h-4 w-4" /> },
          approved: { label: "Approved", href: "/rec/chairperson/approved-protocols", icon: <Check className="h-4 w-4" /> },
          archived: { label: "Archived", href: "/rec/chairperson/archived-protocols", icon: <Archive className="h-4 w-4" /> },
        }

        const statusInfo = statusMap[protocolStatus] || statusMap.pending
        items.push({
          label: statusInfo.label,
          href: statusInfo.href,
          icon: statusInfo.icon,
        })

        // Add protocol name/code - prioritize SPUP code, fallback to temp code or application ID
        // Only use title if no code is available (never show title if SPUP code exists)
        const protocolCode = protocol ? getProtocolCode(protocol) : null;
        const protocolName = protocolCode 
          ? protocolCode
          : (protocol?.applicationID as string) || (protocol ? getProtocolTitle(protocol) : "Protocol Details")

        items.push({
          label: protocolName,
          href: currentPath,
          isCurrent: !relevantSegments.includes("generate-documents"),
        })

        return
      }

      // Handle generate documents
      if (segment === "generate-documents") {
        items.push({
          label: "Generate Documents",
          href: currentPath,
          icon: <FileEdit className="h-4 w-4" />,
          isCurrent: true,
        })
        return
      }

      // Handle protocol list pages (add "Protocols" parent)
      if (
        segment.includes("protocols") &&
        segment !== "protocol" &&
        !items.some((item) => item.label === "Protocols")
      ) {
        items.push({
          label: "Protocols",
          href: "/rec/chairperson/pending-protocols",
          icon: <FileText className="h-4 w-4" />,
        })
      }

      // Get route info
      const routeInfo = ROUTE_MAP[segment] || {
        label: segment.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        icon: null,
      }

      // Ensure rec-members always uses the correct href
      const href = segment === "rec-members" 
        ? "/rec/chairperson/rec-members" 
        : currentPath

      items.push({
        label: routeInfo.label,
        href: href,
        icon: routeInfo.icon,
        isCurrent: isLast,
      })
    })

    return items
  }, [pathname, protocol, protocolId, reviewerNameSlug, reviewerName, reviewer])

  if (breadcrumbItems.length === 0) {
    return null
  }

  return (
    <Breadcrumb className="flex-1 min-w-0 mx-4">
      <BreadcrumbList className="flex-nowrap items-center whitespace-nowrap overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {breadcrumbItems.map((item, index) => (
          <React.Fragment key={`${item.href}-${index}`}>
            <BreadcrumbItem className="flex-shrink-0">
              {item.isCurrent ? (
                <BreadcrumbPage>
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    {item.icon && (
                      <span className="text-[#036635] dark:text-[#FECC07] flex-shrink-0">
                        {item.icon}
                      </span>
                    )}
                    <span className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent font-medium truncate max-w-[200px]">
                      {item.label}
                    </span>
                  </div>
                </BreadcrumbPage>
              ) : (
                <BreadcrumbLink asChild>
                  <Link
                    href={item.href}
                    className="flex items-center gap-1.5 text-[#036635] dark:text-[#FECC07] hover:underline transition-colors duration-200 whitespace-nowrap"
                  >
                    {item.icon && <span className="flex-shrink-0">{item.icon}</span>}
                    <span className="truncate max-w-[200px]">{item.label}</span>
                  </Link>
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
            {!item.isCurrent && (
              <BreadcrumbSeparator className="text-[#036635]/50 dark:text-[#FECC07]/50 flex-shrink-0" />
            )}
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

