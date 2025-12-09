"use client"

import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarIcon, FileText, CheckCircle, Clock, AlertCircle, ChevronLeft, ChevronRight } from "lucide-react"
import { LoadingSkeleton } from "@/components/ui/loading"
import { getAllSubmissionsByStatus } from "@/lib/firebase/firestore"
import { format, addMonths, addDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameMonth, isToday, isPast, startOfDay } from "date-fns"
import { 
  ChairpersonProtocol, 
  toChairpersonProtocols,
  getProtocolTitle,
  getProtocolCode,
  toDate,
  FirestoreDate
} from '@/types'
import { cn } from "@/lib/utils"

// Calendar event types
type EventType = 
  | "submission" 
  | "resubmission"
  | "certificate" 
  | "progress_report_due" 
  | "final_report_due" 
  | "review_completion"

interface CalendarEvent {
  id: string
  date: Date
  type: EventType
  title: string
  protocolCode: string
  submissionId: string
  description?: string
}


export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date())
  const [allSubmissions, setAllSubmissions] = useState<ChairpersonProtocol[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedFilters, setSelectedFilters] = useState<Set<EventType | "all">>(new Set(["all"]))

  useEffect(() => {
    fetchCalendarEvents()
  }, [])

  const fetchCalendarEvents = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch all submissions from all statuses in parallel
      const [pending, accepted, approved, archived] = await Promise.all([
        getAllSubmissionsByStatus('pending'),
        getAllSubmissionsByStatus('accepted'),
        getAllSubmissionsByStatus('approved'),
        getAllSubmissionsByStatus('archived')
      ])

      const combinedSubmissions = [...pending, ...accepted, ...approved, ...archived]
      const typedSubmissions = toChairpersonProtocols(combinedSubmissions)
      setAllSubmissions(typedSubmissions)
    } catch (err) {
      console.error('Error fetching calendar events:', err)
      setError('Failed to load calendar events')
    } finally {
      setLoading(false)
    }
  }

  // Memoize event generation - only recompute when submissions or currentMonth changes
  const events = useMemo(() => {
    if (allSubmissions.length === 0) return []

    // Calculate date range for filtering events (current month ± 6 months buffer)
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const filterStart = addMonths(monthStart, -6) // 6 months before
    const filterEnd = addMonths(monthEnd, 6) // 6 months after

    const calendarEvents: CalendarEvent[] = []

    // Helper function to check if date is within filter range
    const isDateInRange = (date: Date): boolean => {
      return date >= filterStart && date <= filterEnd
    }

    allSubmissions.forEach((submission: ChairpersonProtocol) => {
      const submissionId = String(submission.id)
      const protocolCode = getProtocolCode(submission) || String(submission.applicationID || submission.id)
      const title = getProtocolTitle(submission)

        // 1. Submission date
        const submissionDate = toDate(submission.createdAt);
        if (submissionDate && !isNaN(submissionDate.getTime()) && isDateInRange(submissionDate)) {
          calendarEvents.push({
            id: `${submissionId}-submission`,
            date: submissionDate,
            type: "submission",
            title: `Protocol Submitted: ${title}`,
            protocolCode,
            submissionId,
            description: "Protocol was submitted for review"
          });
        }

        // 1.5. Resubmission date
        if ((submission.status as string) === 'resubmitted') {
          const resubmissionDate = toDate(submission.updatedAt);
          const submissionDate = toDate(submission.createdAt);
          
          // Only add resubmission event if updatedAt is significantly different from createdAt (at least 1 day)
          if (resubmissionDate && submissionDate && !isNaN(resubmissionDate.getTime()) && !isNaN(submissionDate.getTime())) {
            const daysDifference = Math.abs((resubmissionDate.getTime() - submissionDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysDifference >= 1 && isDateInRange(resubmissionDate)) {
              calendarEvents.push({
                id: `${submissionId}-resubmission`,
                date: resubmissionDate,
                type: "resubmission",
                title: `Protocol Resubmitted: ${title}`,
                protocolCode,
                submissionId,
                description: "Protocol was resubmitted after revision"
              })
            }
          }
        } else if (submission.decision && submission.updatedAt && submission.decisionDate) {
          // Check if protocol was updated after a revision decision (indicating resubmission)
          const decisionDate = toDate(submission.decisionDate)
          const updatedDate = toDate(submission.updatedAt)
          
          const requiresRevision = submission.decision === 'approved_minor_revisions' || 
                                   submission.decision === 'major_revisions_deferred' ||
                                   submission.decision === 'returned'
          
          if (requiresRevision && decisionDate && updatedDate && !isNaN(decisionDate.getTime()) && !isNaN(updatedDate.getTime())) {
            // If updated after decision date, it's likely a resubmission
            if (updatedDate.getTime() > decisionDate.getTime()) {
              const daysDifference = Math.abs((updatedDate.getTime() - decisionDate.getTime()) / (1000 * 60 * 60 * 24))
              if (daysDifference >= 1 && isDateInRange(updatedDate)) {
                calendarEvents.push({
                  id: `${submissionId}-resubmission-after-decision`,
                  date: updatedDate,
                  type: "resubmission",
                  title: `Protocol Resubmitted: ${title}`,
                  protocolCode,
                  submissionId,
                  description: `Protocol was resubmitted after ${submission.decision} decision`
                })
              }
            }
          }
        }

        // 2. Certificate date (when approved)
        if (submission.approvedAt && (submission.status === 'approved' || submission.status === 'archived')) {
          const approvedDate = toDate(submission.approvedAt)
          if (approvedDate && !isNaN(approvedDate.getTime()) && isDateInRange(approvedDate)) {
            calendarEvents.push({
              id: `${submissionId}-certificate`,
              date: approvedDate,
              type: "certificate",
              title: `Certificate Issued: ${title}`,
              protocolCode,
              submissionId,
              description: "Certificate of approval issued"
            })
          }
        }

        // 3. Progress report due dates (for approved protocols)
        if (submission.approvedAt && (submission.status === 'approved' || submission.status === 'archived')) {
          const approvedDate = toDate(submission.approvedAt)
          if (approvedDate && !isNaN(approvedDate.getTime())) {
            // First progress report due 6 months after approval
            const firstProgressDue = addMonths(approvedDate, 6)
            if (isDateInRange(firstProgressDue)) {
              calendarEvents.push({
                id: `${submissionId}-progress-1`,
                date: firstProgressDue,
                type: "progress_report_due",
                title: `Progress Report Due: ${title}`,
                protocolCode,
                submissionId,
                description: "First progress report due (6 months after approval)"
              })
            }

            // Second progress report due 12 months after approval (if not archived)
            if (submission.status === 'approved') {
              const secondProgressDue = addMonths(approvedDate, 12)
              if (isDateInRange(secondProgressDue)) {
                calendarEvents.push({
                  id: `${submissionId}-progress-2`,
                  date: secondProgressDue,
                  type: "progress_report_due",
                  title: `Progress Report Due: ${title}`,
                  protocolCode,
                  submissionId,
                  description: "Second progress report due (12 months after approval)"
                })
              }
            }

            // Check deadlines array if it exists
            if (submission.deadlines && Array.isArray(submission.deadlines)) {
              submission.deadlines.forEach((deadline: Record<string, unknown>, index: number) => {
                if (deadline.type === 'progress_report' && deadline.dueDate) {
                  const dueDate = toDate(deadline.dueDate as FirestoreDate)
                  if (dueDate && !isNaN(dueDate.getTime()) && isDateInRange(dueDate)) {
                    calendarEvents.push({
                      id: `${submissionId}-progress-deadline-${index}`,
                      date: dueDate,
                      type: "progress_report_due",
                      title: `Progress Report Due: ${title}`,
                      protocolCode,
                      submissionId,
                      description: deadline.status === 'overdue' ? 'Overdue progress report' : 'Progress report deadline'
                    })
                  }
                }
              })
            }
          }
        }

        // 4. Final report due date
        if (submission.approvalValidUntil) {
          const finalReportDue = toDate(submission.approvalValidUntil)
          if (finalReportDue && !isNaN(finalReportDue.getTime()) && isDateInRange(finalReportDue)) {
            calendarEvents.push({
              id: `${submissionId}-final-report`,
              date: finalReportDue,
              type: "final_report_due",
              title: `Final Report Due: ${title}`,
              protocolCode,
              submissionId,
              description: "Final report due date (research end date)"
            })
          }
        } else if (submission.approvedAt && submission.status === 'approved') {
          // If no explicit end date, assume 1 year from approval
          const approvedDate = toDate(submission.approvedAt)
          if (approvedDate && !isNaN(approvedDate.getTime())) {
            const estimatedEndDate = addMonths(approvedDate, 12)
            if (isDateInRange(estimatedEndDate)) {
              calendarEvents.push({
                id: `${submissionId}-final-report-estimated`,
                date: estimatedEndDate,
                type: "final_report_due",
                title: `Final Report Due (Estimated): ${title}`,
                protocolCode,
                submissionId,
                description: "Estimated final report due date (1 year after approval)"
              })
            }
          }
        }

        // Check deadlines array for final report
        if (submission.deadlines && Array.isArray(submission.deadlines)) {
            submission.deadlines.forEach((deadline: Record<string, unknown>, index: number) => {
            if (deadline.type === 'final_report' && deadline.dueDate) {
              const dueDate = toDate(deadline.dueDate as FirestoreDate)
              if (dueDate && !isNaN(dueDate.getTime()) && isDateInRange(dueDate)) {
                calendarEvents.push({
                  id: `${submissionId}-final-deadline-${index}`,
                  date: dueDate,
                  type: "final_report_due",
                  title: `Final Report Due: ${title}`,
                  protocolCode,
                  submissionId,
                  description: deadline.status === 'overdue' ? 'Overdue final report' : 'Final report deadline'
                })
              }
            }
          })
        }

        // 5. Review completion date
        if (submission.estimatedCompletionDate) {
          const completionDate = toDate(submission.estimatedCompletionDate)
          if (completionDate && !isNaN(completionDate.getTime()) && isDateInRange(completionDate)) {
            calendarEvents.push({
              id: `${submissionId}-review-completion`,
              date: completionDate,
              type: "review_completion",
              title: `Review Completion: ${title}`,
              protocolCode,
              submissionId,
              description: "Estimated review completion date"
            })
          }
        } else if (submission.acceptedAt && submission.status === 'accepted') {
          // Estimate 30 days from acceptance for review completion
          const acceptedDate = toDate(submission.acceptedAt)
          if (acceptedDate && !isNaN(acceptedDate.getTime())) {
            const estimatedCompletion = addDays(acceptedDate, 30)
            if (isDateInRange(estimatedCompletion)) {
              calendarEvents.push({
                id: `${submissionId}-review-completion-estimated`,
                date: estimatedCompletion,
                type: "review_completion",
                title: `Review Completion (Estimated): ${title}`,
                protocolCode,
                submissionId,
                description: "Estimated review completion (30 days from acceptance)"
              })
            }
          }
        }
      })

      return calendarEvents
    }, [allSubmissions, currentMonth])

  // Filter events by selected types
  const filteredEvents = useMemo(() => {
    if (selectedFilters.has("all")) return events
    return events.filter(event => selectedFilters.has(event.type))
  }, [events, selectedFilters])

  // Get event counts by type
  const eventCounts = useMemo(() => {
    const counts: Record<EventType | "all", number> = {
      all: events.length,
      submission: 0,
      resubmission: 0,
      certificate: 0,
      progress_report_due: 0,
      final_report_due: 0,
      review_completion: 0
    }
    events.forEach(event => {
      counts[event.type] = (counts[event.type] || 0) + 1
    })
    return counts
  }, [events])

  // Toggle filter selection
  const toggleFilter = (type: EventType | "all") => {
    setSelectedFilters(prev => {
      const newFilters = new Set(prev)
      if (type === "all") {
        // If "all" is clicked, clear all other filters and toggle "all"
        if (newFilters.has("all")) {
          newFilters.clear()
          // If "all" was the only one selected, keep it selected
          if (prev.size === 1) {
            return prev
          }
        } else {
          // Select only "all"
          newFilters.clear()
          newFilters.add("all")
        }
      } else {
        // If a specific filter is clicked, remove "all" if it's selected
        if (newFilters.has("all")) {
          newFilters.clear()
        }
        // Toggle the specific filter
        if (newFilters.has(type)) {
          newFilters.delete(type)
          // If no filters are selected, select "all"
          if (newFilters.size === 0) {
            newFilters.add("all")
          }
        } else {
          newFilters.add(type)
        }
      }
      return newFilters
    })
  }

  // Get events grouped by date
  const eventsByDate = useMemo(() => {
    const grouped: { [key: string]: CalendarEvent[] } = {}
    filteredEvents.forEach(event => {
      const dateKey = format(event.date, 'yyyy-MM-dd')
      if (!grouped[dateKey]) {
        grouped[dateKey] = []
      }
      grouped[dateKey].push(event)
    })
    return grouped
  }, [filteredEvents])

  // Get calendar days for current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth)
    const monthEnd = endOfMonth(currentMonth)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd })
  }, [currentMonth])

  // Get events for a specific date
  const getEventsForDate = (date: Date): CalendarEvent[] => {
    const dateKey = format(date, 'yyyy-MM-dd')
    return eventsByDate[dateKey] || []
  }

  const previousMonth = () => {
    setCurrentMonth(addMonths(currentMonth, -1))
  }

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1))
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const getEventTypeColor = (type: EventType) => {
    switch (type) {
      case "submission":
        return "bg-blue-500"
      case "resubmission":
        return "bg-cyan-500"
      case "certificate":
        return "bg-green-500"
      case "progress_report_due":
        return "bg-yellow-500"
      case "final_report_due":
        return "bg-orange-500"
      case "review_completion":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  const getEventTypeDotColor = (type: EventType | "all") => {
    if (type === "all") return "bg-gray-500"
    return getEventTypeColor(type)
  }

  const getEventTypeIcon = (type: EventType) => {
    switch (type) {
      case "submission":
        return <FileText className="h-4 w-4" />
      case "resubmission":
        return <FileText className="h-4 w-4" />
      case "certificate":
        return <CheckCircle className="h-4 w-4" />
      case "progress_report_due":
        return <Clock className="h-4 w-4" />
      case "final_report_due":
        return <AlertCircle className="h-4 w-4" />
      case "review_completion":
        return <CalendarIcon className="h-4 w-4" />
      default:
        return null
    }
  }

  const getEventTypeLabel = (type: EventType | "all") => {
    switch (type) {
      case "all":
        return "All Events"
      case "submission":
        return "Submission"
      case "resubmission":
        return "Resubmission"
      case "certificate":
        return "Certificate"
      case "progress_report_due":
        return "Progress Report Due"
      case "final_report_due":
        return "Final Report Due"
      case "review_completion":
        return "Review Completion"
      default:
        return type
    }
  }

  // Filter options in order
  const filterOptions: (EventType | "all")[] = [
    "all",
    "submission",
    "resubmission",
    "certificate",
    "progress_report_due",
    "final_report_due",
    "review_completion"
  ]


  if (loading) {
    return (
      <div className="flex flex-col w-full min-h-full p-4 gap-4 animate-in fade-in duration-500">
        <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20 pt-6 pb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <LoadingSkeleton className="h-9 w-9 rounded-full" />
                <LoadingSkeleton className="h-6 w-40 rounded-md" />
                <LoadingSkeleton className="h-9 w-9 rounded-full" />
              </div>
              <LoadingSkeleton className="h-9 w-20 rounded-md" />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <LoadingSkeleton key={idx} className="h-7 w-32 rounded-full" />
              ))}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-7 border-t border-l border-[#036635]/20 dark:border-[#FECC07]/30">
              {/* Weekday headers skeleton */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div
                  key={day}
                  className="border-r border-b border-[#036635]/20 dark:border-[#FECC07]/30 p-2 bg-muted/40"
                >
                  <span className="text-xs font-medium text-muted-foreground">{day}</span>
                </div>
              ))}
              {/* Day cells skeleton */}
              {Array.from({ length: 35 }).map((_, idx) => (
                <div
                  key={idx}
                  className="border-r border-b border-[#036635]/20 dark:border-[#FECC07]/30 min-h-[120px] p-2 flex flex-col"
                >
                  <LoadingSkeleton className="h-4 w-6 mb-2 rounded-md" />
                  <div className="space-y-1 mt-1">
                    <LoadingSkeleton className="h-3 w-20 rounded-md" />
                    <LoadingSkeleton className="h-3 w-16 rounded-md" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 animate-in fade-in duration-500 overflow-hidden p-0">
        <CardHeader className="bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20 rounded-t-lg pt-6 pb-6">
          <CardTitle className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
            Error
          </CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={fetchCalendarEvents}
            className="bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black transition-all duration-300 hover:scale-105"
          >
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col w-full min-h-full p-4 gap-4 animate-in fade-in duration-500">
      {/* Calendar */}
      <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 overflow-hidden p-0">
        <CardHeader className="bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20 rounded-t-lg pt-6 pb-6">
          {/* Top Row: Calendar Navigation */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="icon" 
                onClick={previousMonth}
                className="border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 hover:border-[#036635] dark:hover:border-[#FECC07] transition-all duration-300 hover:scale-105"
              >
                <ChevronLeft className="h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
              </Button>
              <h2 className="text-2xl font-semibold bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
                {format(currentMonth, 'MMMM yyyy')}
              </h2>
              <Button 
                variant="outline" 
                size="icon" 
                onClick={nextMonth}
                className="border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 hover:border-[#036635] dark:hover:border-[#FECC07] transition-all duration-300 hover:scale-105"
              >
                <ChevronRight className="h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
              </Button>
            </div>
            <Button 
              variant="outline" 
              onClick={goToToday}
              className="border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635] dark:hover:bg-[#FECC07] hover:text-white dark:hover:text-black transition-all duration-300 hover:scale-105"
            >
              Today
            </Button>
          </div>
          
          {/* Filter Tags: Event Types */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-semibold text-[#036635] dark:text-[#FECC07]">Types:</span>
            <div className="flex flex-wrap items-center gap-2">
              {filterOptions.map((type, index) => {
                const isSelected = selectedFilters.has(type)
                const count = eventCounts[type]
                
                return (
                  <button
                    key={type}
                    onClick={() => toggleFilter(type)}
                    className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-200 text-sm font-medium",
                      "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2",
                      isSelected
                        ? "bg-[#036635]/10 dark:bg-[#FECC07]/20 border-[#036635] dark:border-[#FECC07] text-[#036635] dark:text-[#FECC07] shadow-sm"
                        : "bg-background border-[#036635]/20 dark:border-[#FECC07]/30 text-foreground hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 hover:border-[#036635]/30 dark:hover:border-[#FECC07]/40"
                    )}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className={cn(
                      "w-2.5 h-2.5 rounded-full flex-shrink-0",
                      getEventTypeDotColor(type)
                    )} />
                    <span>{getEventTypeLabel(type)}</span>
                    <span className={cn(
                      "text-xs",
                      isSelected 
                        ? "text-[#036635]/70 dark:text-[#FECC07]/70" 
                        : "text-muted-foreground"
                    )}>
                      ({count})
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 border-t border-l border-[#036635]/20 dark:border-[#FECC07]/30">
            {/* Weekday Headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
              <div
                key={day}
                className="border-r border-b border-[#036635]/20 dark:border-[#FECC07]/30 p-2 bg-gradient-to-br from-[#036635]/10 to-[#036635]/5 dark:from-[#FECC07]/20 dark:to-[#FECC07]/10 font-semibold text-center text-sm text-[#036635] dark:text-[#FECC07] animate-in fade-in duration-300"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                {day}
              </div>
            ))}

            {/* Calendar Days */}
            {calendarDays.map((day, idx) => {
              const dayEvents = getEventsForDate(day)
              const isCurrentMonth = isSameMonth(day, currentMonth)
              const isCurrentDay = isToday(day)
              const isPastDay = isPast(startOfDay(day)) && !isCurrentDay

              return (
                <div
                  key={idx}
                  className={cn(
                    "border-r border-b border-[#036635]/20 dark:border-[#FECC07]/30 min-h-[150px] p-2 flex flex-col transition-all duration-300 animate-in fade-in zoom-in-95",
                    !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                    isCurrentDay && "bg-gradient-to-br from-[#036635]/20 to-[#036635]/10 dark:from-[#FECC07]/30 dark:to-[#FECC07]/20 border-[#036635] dark:border-[#FECC07] border-2 ring-2 ring-[#036635]/20 dark:ring-[#FECC07]/30",
                    isPastDay && isCurrentMonth && "bg-gray-100/50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 opacity-60",
                    !isPastDay && !isCurrentDay && "hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 hover:border-[#036635]/30 dark:hover:border-[#FECC07]/40"
                  )}
                  style={{ animationDelay: `${idx * 10}ms` }}
                >
                  {/* Day Number */}
                  <div className={cn(
                    "text-sm font-medium mb-1 flex-shrink-0 transition-colors duration-300",
                    isCurrentDay && "text-[#036635] dark:text-[#FECC07] font-bold text-base",
                    isPastDay && isCurrentMonth && "text-gray-400 dark:text-gray-500",
                    !isPastDay && !isCurrentDay && isCurrentMonth && "text-foreground"
                  )}>
                    {format(day, 'd')}
                  </div>

                  {/* Events List */}
                  <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
                    {dayEvents.length === 0 ? (
                      <div className={cn(
                        "text-xs text-center py-2",
                        isPastDay ? "text-gray-400" : "text-muted-foreground"
                      )}>
                        No events
                      </div>
                    ) : (
                      <>
                        {dayEvents.slice(0, 4).map((event, eventIdx) => (
                          <div
                            key={event.id}
                            className={cn(
                              "text-xs p-1.5 rounded transition-all duration-300 shadow-sm border border-white/20",
                              getEventTypeColor(event.type),
                              "text-white cursor-pointer",
                              isPastDay ? "opacity-70 hover:opacity-90 hover:scale-[1.05] hover:shadow-md hover:ring-2 hover:ring-white/30" : "hover:opacity-90 hover:scale-[1.05] hover:shadow-md hover:ring-2 hover:ring-white/30"
                            )}
                            title={`${getEventTypeLabel(event.type)}: ${event.title}`}
                            onClick={() => (window.location.href = `/rec/chairperson/protocol/${event.submissionId}`)}
                            style={{ animationDelay: `${eventIdx * 50}ms` }}
                          >
                            <div className="flex items-center gap-1 mb-0.5">
                              <div className="flex-shrink-0">
                                {getEventTypeIcon(event.type)}
                              </div>
                              <span className="font-medium truncate text-[10px]">
                                {getEventTypeLabel(event.type)}
                              </span>
                            </div>
                            <div className="truncate text-white/95 font-medium text-[11px] leading-tight">
                              {event.title.replace(/^(Protocol Submitted|Protocol Resubmitted|Certificate Issued|Progress Report Due|Final Report Due|Review Completion):\s*/, '')}
                            </div>
                            <div className="text-[9px] text-white/80 truncate mt-0.5">
                              {event.protocolCode}
                            </div>
                          </div>
                        ))}
                        {dayEvents.length > 4 && (
                          <div className={cn(
                            "text-xs font-medium p-1 text-center bg-[#036635]/10 dark:bg-[#FECC07]/20 rounded border border-[#036635]/20 dark:border-[#FECC07]/30 transition-all duration-300",
                            isPastDay ? "text-gray-400 dark:text-gray-500" : "text-[#036635] dark:text-[#FECC07] hover:bg-[#036635]/20 dark:hover:bg-[#FECC07]/30"
                          )}>
                            +{dayEvents.length - 4} more
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

