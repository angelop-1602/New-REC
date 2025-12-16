"use client"

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Edit, 
  Save, 
  X, 
  UserCheck, 
  FileText, 
  Clock, 
  TrendingUp,
  Calendar,
  Award,
  Loader2,
  Users
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { reviewersManagementService, Reviewer, ReviewerRole } from '@/lib/services/reviewers/reviewersManagementService';
import { reviewerAuthService } from '@/lib/services/reviewers/reviewerAuthService';
import { recSettingsService } from '@/lib/services/core/recSettingsService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { RECMember, toLocaleDateString, toDate } from '@/types';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';

interface ReviewerAssignment {
  protocolId: string;
  protocolTitle: string;
  spupCode: string;
  researchType: string;
  assessmentType: string;
  assignedAt: Date | string | null;
  deadline: Date | string | null;
  status: string;
  assessmentStatus?: string;
  principalInvestigator: string;
  submissionDate?: Date | string | null;
  protocolStatus?: string;
}

interface ReviewerAnalytics {
  totalAssignments: number;
  completedAssignments: number;
  pendingAssignments: number;
  overdueAssignments: number;
  averageCompletionTime: number; // in days
  completionRate: number; // percentage
  statusBreakdown: { name: string; value: number; color: string }[];
  completionTrend: { month: string; completed: number; total: number }[];
}

export default function ReviewerProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const reviewerNameSlug = params.name as string; // Using name param

  const [reviewer, setReviewer] = useState<Reviewer | null>(null);
  const [recMember, setRecMember] = useState<RECMember | null>(null);
  const [assignments, setAssignments] = useState<ReviewerAssignment[]>([]);
  const [analytics, setAnalytics] = useState<ReviewerAnalytics>({
    totalAssignments: 0,
    completedAssignments: 0,
    pendingAssignments: 0,
    overdueAssignments: 0,
    averageCompletionTime: 0,
    completionRate: 0,
    statusBreakdown: [],
    completionTrend: []
  });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState<{
    name?: string;
    role?: ReviewerRole;
    specialty?: string;
    sex?: string;
    ageCategory?: string;
    highestEducationalAttainment?: string;
    roleInREC?: string;
    birthYear?: number;
    educationalBackground?: string;
    fullTime?: boolean;
    dateOfAppointment?: { month: number; year: number };
    tenure?: { month: number; year: number };
  }>({});

  useEffect(() => {
    if (reviewerNameSlug) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewerNameSlug]);

  const loadData = async () => {
    // Load data in the background without blocking UI
    try {
      // Load reviewer data by name slug
      const reviewerData = await reviewersManagementService.getReviewerByNameSlug(reviewerNameSlug);
      if (!reviewerData) {
        toast.error('Reviewer not found');
        router.push('/rec/chairperson/reviewers');
        return;
      }
      
      setReviewer(reviewerData);
      setEditData({
        name: reviewerData.name,
        role: reviewerData.role,
        specialty: reviewerData.specialty,
        sex: reviewerData.sex,
        ageCategory: reviewerData.ageCategory,
        highestEducationalAttainment: reviewerData.highestEducationalAttainment,
        roleInREC: reviewerData.roleInREC,
        birthYear: reviewerData.birthYear,
        educationalBackground: reviewerData.educationalBackground,
        fullTime: reviewerData.fullTime,
        dateOfAppointment: reviewerData.dateOfAppointment,
        tenure: reviewerData.tenure
      });

      // Load REC member if linked (in background)
      if (reviewerData.recMemberId) {
        recSettingsService.getAllMembers().then(members => {
          const member = members.find(m => m.id === reviewerData.recMemberId);
          setRecMember(member || null);
        }).catch(err => console.error('Error loading REC member:', err));
      }

      // Load assignments (in background) - use reviewer ID for assignments
      reviewerAuthService.getAssignedProtocols(reviewerData.id).then(assignmentsData => {
        setAssignments(assignmentsData);
        // Calculate analytics
        calculateAnalytics(assignmentsData);
      }).catch(err => {
        console.error('Error loading assignments:', err);
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load reviewer profile');
    }
  };

  const calculateAnalytics = (assignmentsData: ReviewerAssignment[]) => {
    const now = new Date();
    const total = assignmentsData.length;

    // Helper function to normalize status consistently
    const normalizeStatus = (status?: string | null): string => {
      if (!status) return 'draft';
      const normalized = status.toString().trim().toLowerCase();
      // Handle variations
      if (normalized === 'in_progress') return 'in-progress';
      return normalized;
    };

    // Helper function to check if a date is valid (not the epoch date)
    const isValidDate = (date: Date | null): boolean => {
      if (!date) return false;
      // Check if date is not the epoch (Jan 1, 1970) which toDate returns for null values
      return date.getTime() > 0;
    };

    // Normalize all statuses
    const assignmentsWithNormalizedStatus = assignmentsData.map(a => ({
      ...a,
      normalizedStatus: normalizeStatus(a.status)
    }));

    const normalizedStatuses = assignmentsWithNormalizedStatus.map(a => a.normalizedStatus);

    const isCompleted = (status: string) =>
      status === 'submitted' || status === 'approved' || status === 'completed' || status === 'disapproved';

    const completed = normalizedStatuses.filter(isCompleted).length;
    const pending = normalizedStatuses.filter(s => s === 'pending').length;
    const draft = normalizedStatuses.filter(s => s === 'draft').length;
    const inProgress = normalizedStatuses.filter(s => s === 'in-progress').length;
    
    // Calculate overdue assignments - use normalized status
    const overdue = assignmentsWithNormalizedStatus.filter(a => {
      const status = a.normalizedStatus;
      // Completed assignments are not overdue
      if (isCompleted(status)) {
        return false;
      }
      // Need a valid deadline to be overdue
      if (!a.deadline) return false;
      const deadline = toDate(a.deadline);
      if (!isValidDate(deadline)) return false;
      return deadline < now;
    }).length;

    // Calculate average completion time
    const completedAssignments = assignmentsWithNormalizedStatus.filter(a => {
      const status = a.normalizedStatus;
      return isCompleted(status) && a.assignedAt;
    });
    
    let totalDays = 0;
    let validCompletionTimes = 0;
    
    completedAssignments.forEach(a => {
      const assignedDate = toDate(a.assignedAt);
      if (!isValidDate(assignedDate)) return;
      
      // Try to get actual completion date from submissionDate, otherwise use now as fallback
      let completedDate: Date | null = null;
      
      // Check if there's a submission date
      if (a.submissionDate) {
        completedDate = toDate(a.submissionDate);
        if (!isValidDate(completedDate)) {
          completedDate = null;
        }
      }
      
      // If no valid submission date, use now as fallback (for recently completed items)
      if (!completedDate) {
        completedDate = now;
      }
      
      const days = Math.ceil((completedDate.getTime() - assignedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Only count positive days (sanity check)
      if (days >= 0) {
        totalDays += days;
        validCompletionTimes++;
      }
    });
    
    const avgCompletionTime = validCompletionTimes > 0 
      ? Math.round(totalDays / validCompletionTimes) 
      : 0;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Status breakdown for pie chart
    const statusCounts: Record<string, number> = {};
    normalizedStatuses.forEach(status => {
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    const statusBreakdown = [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'Pending', value: pending, color: '#f59e0b' },
      { name: 'Draft', value: draft, color: '#6b7280' },
      { name: 'In Progress', value: inProgress, color: '#3b82f6' },
      { name: 'Overdue', value: overdue, color: '#ef4444' },
    ].filter(item => item.value > 0);

    // Completion trend (last 12 months) - includes both total and completed
    const last12Months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    });

    const completionTrend: Record<string, { completed: number; total: number }> = {};
    last12Months.forEach((month: string) => {
      completionTrend[month] = { completed: 0, total: 0 };
    });

    assignmentsWithNormalizedStatus.forEach(a => {
      if (a.assignedAt) {
        const assignedDate = toDate(a.assignedAt);
        if (isValidDate(assignedDate)) {
          const monthKey = assignedDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
          if (completionTrend[monthKey]) {
            completionTrend[monthKey].total++;
            // Use normalized status for completion check
            if (isCompleted(a.normalizedStatus)) {
              completionTrend[monthKey].completed++;
            }
          }
        }
      }
    });

    const completionTrendArray = last12Months.map((month: string) => ({
      month,
      completed: completionTrend[month].completed,
      total: completionTrend[month].total
    }));

    setAnalytics({
      totalAssignments: total,
      completedAssignments: completed,
      pendingAssignments: pending,
      overdueAssignments: overdue,
      averageCompletionTime: avgCompletionTime,
      completionRate: completionRate,
      statusBreakdown,
      completionTrend: completionTrendArray
    });
  };

  const handleUpdateReviewer = async () => {
    if (!reviewer || !user) return;
    
    setSaving(true);
    try {
      const success = await reviewersManagementService.updateReviewer(
        reviewer.id,
        editData
      );
      if (success) {
        toast.success('Reviewer updated successfully');
        setEditing(false);
        await loadData();
      } else {
        toast.error('Failed to update reviewer');
      }
    } catch (error) {
      console.error('Error updating reviewer:', error);
      toast.error('Failed to update reviewer');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (checked: boolean) => {
    if (!reviewer || !user) return;
    
    try {
      const success = await reviewersManagementService.toggleReviewerStatus(reviewer.id);
      if (success) {
        toast.success(`Reviewer ${checked ? 'activated' : 'deactivated'} successfully`);
        await loadData();
      } else {
        toast.error('Failed to update reviewer status');
      }
    } catch (error) {
      console.error('Error toggling reviewer status:', error);
      toast.error('Failed to update reviewer status');
    }
  };

  const handleCancelEdit = () => {
    if (!reviewer) return;
    setEditing(false);
    setEditData({
      name: reviewer.name,
      role: reviewer.role,
      specialty: reviewer.specialty,
      sex: reviewer.sex,
      ageCategory: reviewer.ageCategory,
      highestEducationalAttainment: reviewer.highestEducationalAttainment,
      roleInREC: reviewer.roleInREC,
      birthYear: reviewer.birthYear,
      educationalBackground: reviewer.educationalBackground,
      fullTime: reviewer.fullTime,
      dateOfAppointment: reviewer.dateOfAppointment,
      tenure: reviewer.tenure
    });
  };

  const getRoleBadge = (role?: ReviewerRole) => {
    if (!role) return null;
    
    const roleConfig = {
      'chairperson': { label: 'Chairperson', className: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'vice-chair': { label: 'Vice Chair', className: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400' },
      'member': { label: 'Member', className: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300' },
      'secretary': { label: 'Secretary', className: 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400' },
      'office-secretary': { label: 'Office Secretary', className: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/30 dark:text-purple-400' }
    };
    
    const config = roleConfig[role];
    if (!config) return null;
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      'completed': { label: 'Completed', className: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
      'submitted': { label: 'Submitted', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      'approved': { label: 'Approved', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' },
      'pending': { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' },
      'in-progress': { label: 'In Progress', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
      'draft': { label: 'Draft', className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' },
      'overdue': { label: 'Overdue', className: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' }
    };
    
    const config = statusConfig[status.toLowerCase()] || { label: status, className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300' };
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (!reviewer) {
    // Show placeholder while loading in background
    return (
      <div className="container mx-auto p-4 md:p-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative w-32 h-32">
                    <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 bg-muted animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-6 w-32 bg-muted rounded animate-pulse mx-auto" />
                    <div className="h-4 w-24 bg-muted rounded animate-pulse mx-auto" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                  <div className="h-6 w-full bg-muted rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="h-24 bg-muted animate-pulse" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get member image path
  const getMemberImagePath = (name: string): string | null => {
    const memberImages = [
      { file: 'Allan-Paulo-Blaquera.png', names: ['Allan Paulo Blaquera'] },
      { file: 'Angelo-Peralta.png', names: ['Angelo Peralta'] },
      { file: 'Everett-Laureta.png', names: ['Everett Laureta'] },
      { file: 'Elizabeth-Iquin.png', names: ['Iquin Elizabeth', 'Elizabeth Iquin'] },
      { file: 'Maria-Felina-Agbayani.png', names: ['Maria Felina Agbayani'] },
      { file: 'Marjorie-Bambalan.png', names: ['Marjorie Bambalan'] },
      { file: 'Mark-Klimson-Luyun.png', names: ['Mark Klimson Luyun'] },
      { file: 'Milrose-Tangonan.png', names: ['Milrose Tangonan'] },
      { file: 'Nova-Domingo.png', names: ['Nova Domingo'] },
      { file: 'Rita-Daliwag.jpg', names: ['Rita Daliwag'] },
      { file: 'Vercel-Baccay.png', names: ['Vercel Baccay'] },
      { file: 'Normie-Anne-Tuazon.png', names: ['Normie Anne Tuazon'] },
      { file: 'Kristine-Joy-Cortes.png', names: ['Kristine Joy Cortes'] },
    ];

    const normalizeName = (n: string) => n.toLowerCase().replace(/\s+/g, ' ').trim();
    const normalizedInput = normalizeName(name);

    for (const image of memberImages) {
      for (const mappedName of image.names) {
        if (normalizeName(mappedName) === normalizedInput) {
          return `/members/${image.file}`;
        }
      }
    }
    return null;
  };

  const reviewerImage = reviewer.imageUrl || getMemberImagePath(reviewer.name) || '/SPUP-Logo-with-yellow.png';

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl">
      {/* Bento Box Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Reviewer Details Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 gap-0">
            <CardHeader>
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Profile Image */}
                <div className="relative w-32 h-32">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20">
                    <Image
                      src={reviewerImage || '/SPUP-Logo-with-yellow.png'}
                      alt={reviewer.name}
                      fill
                      className="object-cover"
                      unoptimized={reviewerImage?.startsWith('http') || reviewerImage?.startsWith('blob:')}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (target.src !== '/SPUP-Logo-with-yellow.png') {
                          target.src = '/SPUP-Logo-with-yellow.png';
                        }
                      }}
                    />
                  </div>
                  {/* Edit Button on Edge of Circle */}
                  {!editing && (
                    <Button
                      variant="default"
                      size="icon"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-lg border-2 border-background"
                      onClick={() => setEditing(true)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                
                {/* Name and Role */}
                <div className="space-y-2">
                  {editing ? (
                    <Input
                      value={editData.name || ''}
                      onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                      className="text-center text-lg font-semibold"
                    />
                  ) : (
                    <h2 className="text-2xl font-bold">{reviewer.name}</h2>
                  )}
                  <div className="flex items-center justify-center gap-2">
                    {editing ? (
                      <Select 
                        value={editData.role || undefined} 
                        onValueChange={(value) => setEditData(prev => ({ ...prev, role: value ? (value as ReviewerRole) : undefined }))}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a role..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="chairperson">Chairperson</SelectItem>
                          <SelectItem value="vice-chair">Vice Chair</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="secretary">Secretary</SelectItem>
                          <SelectItem value="office-secretary">Office Secretary</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      getRoleBadge(reviewer.role) || (
                        <span className="text-sm text-muted-foreground">No role assigned</span>
                      )
                    )}
                  </div>
                  
                  {/* Active/Inactive Switch */}
                  <div className="flex items-center justify-center gap-3 mt-2">
                    <Label htmlFor="active-switch" className="text-sm font-medium cursor-pointer">
                      {reviewer.isActive ? 'Active' : 'Inactive'}
                    </Label>
                    <Switch
                      id="active-switch"
                      checked={reviewer.isActive}
                      onCheckedChange={handleToggleActive}
                      disabled={saving}
                    />
                  </div>
                  <p className="mt-1 text-lg font-mono font-semibold">{reviewer.code}</p>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Edit Controls - Save/Cancel when editing */}
              {editing && (
                <div className="flex items-center justify-end gap-2 pb-4 border-b">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelEdit}
                    disabled={saving}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleUpdateReviewer}
                    disabled={saving || !editData.name?.trim()}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* REC Member Status */}
              {recMember && (
                <>
                  <div>
                    <Label className="text-xs text-muted-foreground uppercase tracking-wide">REC Member</Label>
                    <div className="mt-2 flex items-center gap-2">
                      <UserCheck className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Linked to REC Member</span>
                    </div>
                    <Badge variant="outline" className="mt-2">{recMember.position}</Badge>
                    {recMember.department && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {recMember.department}
                      </p>
                    )}
                  </div>
                  <Separator />
                </>
              )}


              {/* Member Profile Information */}
              {(reviewer.role === 'member' || reviewer.role === 'chairperson' || reviewer.role === 'vice-chair' || reviewer.role === 'secretary') && (
                <>
                  <div>
                    <div className="mb-3">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Member Profile</Label>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Specialty</Label>
                        {editing ? (
                          <Input
                            value={editData.specialty || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, specialty: e.target.value }))}
                            className="mt-1 text-sm"
                            placeholder="Enter specialty"
                          />
                        ) : (
                          <p className="text-sm font-medium mt-1">{reviewer.specialty || <span className="text-muted-foreground italic">Not set</span>}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Sex</Label>
                        {editing ? (
                          <Select
                            value={editData.sex || ''}
                            onValueChange={(value) => setEditData(prev => ({ ...prev, sex: value }))}
                          >
                            <SelectTrigger className="mt-1 text-sm">
                              <SelectValue placeholder="Select sex" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm font-medium mt-1">{reviewer.sex || <span className="text-muted-foreground italic">Not set</span>}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Age Category</Label>
                        {editing ? (
                          <Select
                            value={editData.ageCategory || ''}
                            onValueChange={(value) => setEditData(prev => ({ ...prev, ageCategory: value }))}
                          >
                            <SelectTrigger className="mt-1 text-sm">
                              <SelectValue placeholder="Select age category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="≤50">≤50</SelectItem>
                              <SelectItem value=">50">&gt;50</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm font-medium mt-1">{reviewer.ageCategory || <span className="text-muted-foreground italic">Not set</span>}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Highest Educational Attainment</Label>
                        {editing ? (
                          <Input
                            value={editData.highestEducationalAttainment || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, highestEducationalAttainment: e.target.value }))}
                            className="mt-1 text-sm"
                            placeholder="e.g., Ph.D., M.D., M.A., etc."
                          />
                        ) : (
                          <p className="text-sm font-medium mt-1">{reviewer.highestEducationalAttainment || <span className="text-muted-foreground italic">Not set</span>}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Role in REC</Label>
                        {editing ? (
                          <Select
                            value={editData.roleInREC || ''}
                            onValueChange={(value) => setEditData(prev => ({ ...prev, roleInREC: value }))}
                          >
                            <SelectTrigger className="mt-1 text-sm">
                              <SelectValue placeholder="Select role in REC" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Medical/Scientist">Medical/Scientist</SelectItem>
                              <SelectItem value="Non-Scientist">Non-Scientist</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm font-medium mt-1">{reviewer.roleInREC || <span className="text-muted-foreground italic">Not set</span>}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <Separator />
                </>
              )}

              {/* Staff Profile Information */}
              {(reviewer.role === 'secretary' || reviewer.role === 'office-secretary') && (
                <>
                  <div>
                    <div className="mb-3">
                      <Label className="text-xs text-muted-foreground uppercase tracking-wide">Staff Details</Label>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs text-muted-foreground">Birth Year</Label>
                        {editing ? (
                          <Input
                            type="number"
                            value={editData.birthYear || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, birthYear: e.target.value ? parseInt(e.target.value) : undefined }))}
                            className="mt-1 text-sm"
                            placeholder="e.g., 1980"
                            min="1900"
                            max={new Date().getFullYear()}
                          />
                        ) : (
                          <p className="text-sm font-medium mt-1">{reviewer.birthYear || <span className="text-muted-foreground italic">Not set</span>}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Sex</Label>
                        {editing ? (
                          <Select
                            value={editData.sex || ''}
                            onValueChange={(value) => setEditData(prev => ({ ...prev, sex: value }))}
                          >
                            <SelectTrigger className="mt-1 text-sm">
                              <SelectValue placeholder="Select sex" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Male">Male</SelectItem>
                              <SelectItem value="Female">Female</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <p className="text-sm font-medium mt-1">{reviewer.sex || <span className="text-muted-foreground italic">Not set</span>}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Educational Background</Label>
                        {editing ? (
                          <Input
                            value={editData.educationalBackground || ''}
                            onChange={(e) => setEditData(prev => ({ ...prev, educationalBackground: e.target.value }))}
                            className="mt-1 text-sm"
                            placeholder="e.g., Bachelor's Degree, Master's Degree, etc."
                          />
                        ) : (
                          <p className="text-sm font-medium mt-1">{reviewer.educationalBackground || <span className="text-muted-foreground italic">Not set</span>}</p>
                        )}
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Employment Status</Label>
                        {editing ? (
                          <Select
                            value={editData.fullTime !== undefined ? (editData.fullTime ? 'true' : 'false') : ''}
                            onValueChange={(value) => setEditData(prev => ({ ...prev, fullTime: value === 'true' }))}
                          >
                            <SelectTrigger className="mt-1 text-sm">
                              <SelectValue placeholder="Select employment status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="true">Full-time</SelectItem>
                              <SelectItem value="false">Part-time</SelectItem>
                            </SelectContent>
                          </Select>
                        ) : (
                          <div className="mt-1">
                            {reviewer.fullTime !== undefined ? (
                              <Badge variant={reviewer.fullTime ? "default" : "secondary"}>
                                {reviewer.fullTime ? "Full-time" : "Part-time"}
                              </Badge>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">Not set</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {reviewer.role !== 'office-secretary' && (
                    <Separator />
                  )}
                </>
              )}

              {/* Date of Appointment and Tenure */}
              {reviewer.role !== 'office-secretary' && (
                <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block">Date of Appointment</Label>
                  {editing ? (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Month</Label>
                        <Select
                          value={editData.dateOfAppointment?.month?.toString() || ''}
                          onValueChange={(value) => {
                            const month = parseInt(value);
                            const year = editData.dateOfAppointment?.year || new Date().getFullYear();
                            setEditData(prev => ({
                              ...prev,
                              dateOfAppointment: { month, year }
                            }));
                          }}
                        >
                          <SelectTrigger className="mt-1 text-sm">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <SelectItem key={month} value={month.toString()}>
                                {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Year</Label>
                        <Input
                          type="number"
                          value={editData.dateOfAppointment?.year || ''}
                          onChange={(e) => {
                            const year = e.target.value ? parseInt(e.target.value) : undefined;
                            const month = editData.dateOfAppointment?.month || 1;
                            if (year) {
                              setEditData(prev => ({
                                ...prev,
                                dateOfAppointment: { month, year }
                              }));
                            } else {
                              setEditData(prev => ({
                                ...prev,
                                dateOfAppointment: month ? { month, year: new Date().getFullYear() } : undefined
                              }));
                            }
                          }}
                          className="mt-1 text-sm"
                          placeholder="Year"
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium mt-1">
                      {reviewer.dateOfAppointment ? (
                        `${new Date(2000, reviewer.dateOfAppointment.month - 1).toLocaleString('default', { month: 'long' })} ${reviewer.dateOfAppointment.year}`
                      ) : (
                        <span className="text-muted-foreground italic">Not set</span>
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground uppercase tracking-wide mb-3 block">Tenure</Label>
                  {editing ? (
                    <div className="space-y-2">
                      <div>
                        <Label className="text-xs text-muted-foreground">Month</Label>
                        <Select
                          value={editData.tenure?.month?.toString() || ''}
                          onValueChange={(value) => {
                            const month = parseInt(value);
                            const year = editData.tenure?.year || new Date().getFullYear();
                            setEditData(prev => ({
                              ...prev,
                              tenure: { month, year }
                            }));
                          }}
                        >
                          <SelectTrigger className="mt-1 text-sm">
                            <SelectValue placeholder="Month" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                              <SelectItem key={month} value={month.toString()}>
                                {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Year</Label>
                        <Input
                          type="number"
                          value={editData.tenure?.year || ''}
                          onChange={(e) => {
                            const year = e.target.value ? parseInt(e.target.value) : undefined;
                            const month = editData.tenure?.month || 1;
                            if (year) {
                              setEditData(prev => ({
                                ...prev,
                                tenure: { month, year }
                              }));
                            } else {
                              setEditData(prev => ({
                                ...prev,
                                tenure: month ? { month, year: new Date().getFullYear() } : undefined
                              }));
                            }
                          }}
                          className="mt-1 text-sm"
                          placeholder="Year"
                          min="1900"
                          max={new Date().getFullYear()}
                        />
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm font-medium mt-1">
                      {reviewer.tenure ? (
                        `${new Date(2000, reviewer.tenure.month - 1).toLocaleString('default', { month: 'long' })} ${reviewer.tenure.year}`
                      ) : (
                        <span className="text-muted-foreground italic">Not set</span>
                      )}
                    </p>
                  )}
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side - Reviews List and Analytics */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Statistics */}
              {/* Performance Metrics */}
              <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Performance Metrics
                </CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-primary mb-2">
                      {analytics.completionRate}%
                    </div>
                    <p className="text-sm text-muted-foreground">Completion Rate</p>
                    <div className="mt-2 w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${analytics.completionRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-600 mb-2">
                      {analytics.averageCompletionTime}
                    </div>
                    <p className="text-sm text-muted-foreground">Avg. Days to Complete</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics.completedAssignments > 0 
                        ? `Based on ${analytics.completedAssignments} completed assignments`
                        : 'No completed assignments yet'}
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {analytics.totalAssignments > 0 
                        ? Math.round((analytics.completedAssignments / analytics.totalAssignments) * 100)
                        : 0}%
                    </div>
                    <p className="text-sm text-muted-foreground">Success Rate</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {analytics.completedAssignments} of {analytics.totalAssignments} completed
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

          {/* Analytics Graphs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Assignment Activity Over Time */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Assignment Activity & Completion
                </CardTitle>
                <CardDescription>Total assignments and completion rate over the last 12 months</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.completionTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <AreaChart data={analytics.completionTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="month" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        fontSize={12}
                      />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stackId="1" 
                        stroke="#3b82f6" 
                        fill="#3b82f6" 
                        fillOpacity={0.4}
                        name="Total Assigned"
                      />
                      <Area 
                        type="monotone" 
                        dataKey="completed" 
                        stackId="1" 
                        stroke="#10b981" 
                        fill="#10b981" 
                        fillOpacity={0.7}
                        name="Completed"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    No assignment data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Current Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Current Status Distribution
                </CardTitle>
                <CardDescription>Breakdown of all assignments by current status</CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.statusBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={analytics.statusBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {analytics.statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                    No assignment data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Reviews List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Review Assignments
              </CardTitle>
              <CardDescription>
                All protocols assigned to this reviewer
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No assignments yet</p>
                </div>
              ) : (
                <div className="rounded-md border border-[#036635]/10 dark:border-[#FECC07]/20 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-[#036635]/5 dark:bg-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20">
                        <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Protocol Title</TableHead>
                        <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">SPUP Code</TableHead>
                        <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Principal Investigator</TableHead>
                        <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Status</TableHead>
                        <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Assessment Type</TableHead>
                        <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Research Type</TableHead>
                        <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Assigned Date</TableHead>
                        <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Deadline</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assignments.map((assignment) => {
                        // Helper to check if date is valid (not epoch date)
                        const isValidDate = (date: Date | null): boolean => {
                          if (!date) return false;
                          return date.getTime() > 0;
                        };

                        const deadline = toDate(assignment.deadline);
                        const assignedDate = toDate(assignment.assignedAt);
                        const hasValidDeadline = isValidDate(deadline);
                        const hasValidAssignedDate = isValidDate(assignedDate);
                        
                        // Normalize status for overdue check
                        const normalizeStatus = (status?: string | null): string => {
                          if (!status) return 'draft';
                          const normalized = status.toString().trim().toLowerCase();
                          if (normalized === 'in_progress') return 'in-progress';
                          return normalized;
                        };
                        
                        const normalizedStatus = normalizeStatus(assignment.status);
                        const isCompleted = normalizedStatus === 'submitted' || 
                                          normalizedStatus === 'approved' || 
                                          normalizedStatus === 'completed' || 
                                          normalizedStatus === 'disapproved';
                        
                        const now = new Date();
                        const isOverdue = hasValidDeadline && 
                                        deadline < now && 
                                        !isCompleted;
                        
                        return (
                          <TableRow
                            key={assignment.protocolId}
                            className={`hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-colors cursor-pointer ${isOverdue ? 'bg-red-50/50 dark:bg-red-950/20' : ''}`}
                            onClick={() => router.push(`/rec/chairperson/protocol/${assignment.protocolId}`)}
                          >
                            <TableCell className="font-medium">
                              <div className="max-w-xs truncate" title={assignment.protocolTitle}>
                                {assignment.protocolTitle}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <FileText className="h-3 w-3 text-muted-foreground" />
                                {assignment.spupCode || 'N/A'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                {assignment.principalInvestigator || 'Unknown'}
                              </div>
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(assignment.status || 'draft')}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {assignment.assessmentType || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="text-xs">
                                {assignment.researchType || 'N/A'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3 text-muted-foreground" />
                                {hasValidAssignedDate ? toLocaleDateString(assignedDate) : 'Not set'}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className={`flex items-center gap-1 text-sm ${isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}`}>
                                <Clock className="h-3 w-3" />
                                {hasValidDeadline ? toLocaleDateString(deadline) : 'Not set'}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

