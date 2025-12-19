"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { PageLoading } from '@/components/ui/loading';
import { toLocaleDateString } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Plus, 
  UserCheck,
  Eye,
  MoreVertical,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Copy,
  CheckCircle2,
  Mail
} from 'lucide-react';
import { reviewersManagementService, Reviewer, CreateReviewerRequest, ReviewerRole, ReviewersManagementService } from '@/lib/services/reviewers/reviewersManagementService';
import { generateReviewerCode } from '@/lib/services/reviewers/reviewerCodeGenerator';
import { EmailService } from '@/lib/services/email/emailService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface ReviewersManagementProps {
  onAddReviewerClick?: () => void;
  addReviewerDialogOpen?: boolean;
  onAddReviewerDialogChange?: (open: boolean) => void;
}

export default function ReviewersManagement({ 
  onAddReviewerClick, 
  addReviewerDialogOpen,
  onAddReviewerDialogChange 
}: ReviewersManagementProps = {}) {
  const router = useRouter();
  const { user } = useAuth();
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Add reviewer dialog - controlled from parent if props provided
  const [internalAddReviewerOpen, setInternalAddReviewerOpen] = useState(false);
  const addReviewerOpen = addReviewerDialogOpen !== undefined ? addReviewerDialogOpen : internalAddReviewerOpen;
  const setAddReviewerOpen = onAddReviewerDialogChange || setInternalAddReviewerOpen;
  const [newReviewer, setNewReviewer] = useState<CreateReviewerRequest>({
    name: '',
    email: '',
    role: undefined
  });
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [codeCopied, setCodeCopied] = useState(false);
  
  
  // Member management dialog - removed, now handled in settings page;
  
  // Delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewerToDelete, setReviewerToDelete] = useState<Reviewer | null>(null);
  
  // Controlled dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  
  // Test email state
  const [sendingTestEmail, setSendingTestEmail] = useState<string | null>(null);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const reviewersData = await reviewersManagementService.getAllReviewers();
      
      // Filter out reviewers with REC member roles (they're displayed on Members page)
      const memberRoles: ReviewerRole[] = ['chairperson', 'vice-chair', 'secretary', 'office-secretary', 'member'];
      const nonMemberReviewers = reviewersData.filter(r => !r.role || !memberRoles.includes(r.role));
      
      setReviewers(nonMemberReviewers);
    } catch (error) {
      console.error('Error loading reviewers data:', error);
      toast.error('Failed to load reviewers data');
    } finally {
      setLoading(false);
    }
  };

  // Generate code preview when name changes
  useEffect(() => {
    const generateCodePreview = async () => {
      if (newReviewer.name.trim()) {
        try {
          const code = await generateReviewerCode(newReviewer.name.trim());
          setGeneratedCode(code);
        } catch (error) {
          console.error('Error generating code preview:', error);
          setGeneratedCode('');
        }
      } else {
        setGeneratedCode('');
      }
    };

    // Debounce code generation
    const timeoutId = setTimeout(generateCodePreview, 500);
    return () => clearTimeout(timeoutId);
  }, [newReviewer.name]);

  const handleAddReviewer = async () => {
    if (!newReviewer.name.trim() || !user) return;
    
    setSaving(true);
    try {
      const reviewerId = await reviewersManagementService.createReviewer(newReviewer);
      if (reviewerId) {
        toast.success(`Reviewer added successfully! Code: ${generatedCode}`);
        setAddReviewerOpen(false);
        setNewReviewer({ name: '', role: undefined });
        setGeneratedCode('');
        setCodeCopied(false);
        await loadData(); // Refresh data
      } else {
        toast.error('Failed to add reviewer');
      }
    } catch (error) {
      console.error('Error adding reviewer:', error);
      toast.error('Failed to add reviewer');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyCode = async () => {
    if (generatedCode) {
      try {
        await navigator.clipboard.writeText(generatedCode);
        setCodeCopied(true);
        toast.success('Code copied to clipboard!');
        setTimeout(() => setCodeCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy code:', error);
        toast.error('Failed to copy code');
      }
    }
  };


  const handleToggleStatus = async (reviewerId: string) => {
    if (!user) return;
    
    // Close dropdown immediately
    setOpenDropdownId(null);
    
    setSaving(true);
    try {
      const success = await reviewersManagementService.toggleReviewerStatus(reviewerId);
      if (success) {
        toast.success('Reviewer status updated successfully');
        await loadData(); // Refresh data
      } else {
        toast.error('Failed to update reviewer status');
      }
    } catch (error) {
      console.error('Error updating reviewer status:', error);
      toast.error('Failed to update reviewer status');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteReviewer = async () => {
    if (!reviewerToDelete || !user) return;
    
    setSaving(true);
    try {
      const success = await reviewersManagementService.deleteReviewer(reviewerToDelete.id);
      if (success) {
        toast.success('Reviewer deleted successfully');
        setDeleteDialogOpen(false);
        setReviewerToDelete(null);
        await loadData(); // Refresh data
      } else {
        toast.error('Failed to delete reviewer');
      }
    } catch (error) {
      console.error('Error deleting reviewer:', error);
      toast.error('Failed to delete reviewer');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestEmail = async (reviewer: Reviewer) => {
    if (!reviewer.email) {
      toast.error('This reviewer does not have an email address configured');
      return;
    }

    setSendingTestEmail(reviewer.id);
    try {
      const result = await EmailService.sendTestNotification(reviewer.email, reviewer.name);
      if (result.success) {
        toast.success(`Test email sent successfully to ${reviewer.email}`);
      } else {
        toast.error(`Failed to send test email: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error sending test email:', error);
      toast.error('Failed to send test email');
    } finally {
      setSendingTestEmail(null);
    }
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <PageLoading text="Loading reviewers..." />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div>
        <h2 className="text-2xl font-bold bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
          Reviewers
        </h2>
        <p className="text-muted-foreground mt-1">
          Manage research ethics reviewers who can be assigned to review protocols
        </p>
      </div>

      {reviewers.length > 0 ? (
        <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-[#036635]/5 dark:bg-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20">
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Name</TableHead>
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Code</TableHead>
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Email</TableHead>
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Status</TableHead>
                  <TableHead className="font-semibold text-[#036635] dark:text-[#FECC07]">Added</TableHead>
                  <TableHead className="text-right font-semibold text-[#036635] dark:text-[#FECC07]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviewers.map((reviewer, index) => {
                  return (
                    <TableRow 
                      key={reviewer.id}
                      className="hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-all duration-200 animate-in fade-in slide-in-from-left-2"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <TableCell className="font-medium">{reviewer.name}</TableCell>
                      <TableCell className="font-mono text-sm">{reviewer.code}</TableCell>
                      <TableCell className="text-sm">
                        {reviewer.email ? (
                          <span className="text-muted-foreground">{reviewer.email}</span>
                        ) : (
                          <span className="text-muted-foreground italic">No email</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={reviewer.isActive ? "default" : "secondary"} 
                          className={cn(
                            "text-xs transition-all duration-300",
                            reviewer.isActive 
                              ? "bg-[#036635] dark:bg-[#FECC07] text-white dark:text-black" 
                              : "bg-gray-500"
                          )}
                        >
                          {reviewer.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {toLocaleDateString(reviewer.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu
                          open={openDropdownId === reviewer.id}
                          onOpenChange={(open) => setOpenDropdownId(open ? reviewer.id : null)}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0"
                              disabled={saving}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()}>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                setOpenDropdownId(null);
                                const nameSlug = ReviewersManagementService.nameToSlug(reviewer.name);
                                router.push(`/rec/chairperson/portfolio/${encodeURIComponent(nameSlug)}`);
                              }}
                              disabled={saving}
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            {reviewer.email && (
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.preventDefault();
                                  setOpenDropdownId(null);
                                  handleSendTestEmail(reviewer);
                                }}
                                disabled={saving || sendingTestEmail === reviewer.id}
                              >
                                <Mail className="h-4 w-4 mr-2" />
                                {sendingTestEmail === reviewer.id ? 'Sending...' : 'Send Test Email'}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                handleToggleStatus(reviewer.id);
                              }}
                              disabled={saving}
                            >
                              {reviewer.isActive ? (
                                <>
                                  <ToggleRight className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <ToggleLeft className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.preventDefault();
                                setOpenDropdownId(null);
                                setReviewerToDelete(reviewer);
                                setDeleteDialogOpen(true);
                              }}
                              disabled={saving}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2 text-red-600" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 transition-all duration-300 hover:shadow-lg animate-in fade-in duration-500">
          <CardContent className="p-12 text-center">
            <UserCheck className="h-12 w-12 mx-auto text-[#036635] dark:text-[#FECC07] mb-4 animate-in fade-in duration-500" />
            <h3 className="text-lg font-semibold mb-2 bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
              No Reviewers Found
            </h3>
            <p className="text-muted-foreground mb-4">
              Click &quot;Add Reviewer&quot; to create the first reviewer.
            </p>
            {onAddReviewerClick ? (
              <Button 
                onClick={onAddReviewerClick}
                className="bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Reviewer
              </Button>
            ) : (
              <Button 
                onClick={() => setAddReviewerOpen(true)}
                className="bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black transition-all duration-300 hover:scale-105"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Reviewer
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Reviewer Dialog */}
      <Dialog open={addReviewerOpen} onOpenChange={setAddReviewerOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Reviewer</DialogTitle>
            <DialogDescription>
              Add a new research ethics reviewer to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={newReviewer.name}
                onChange={(e) => setNewReviewer(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Dr. Janette Fermin"
              />
              <p className="text-xs text-muted-foreground mt-1">
                A unique code will be automatically generated based on the name initials
              </p>
            </div>

            <div>
              <Label htmlFor="email">Email Address (Optional)</Label>
              <Input
                id="email"
                type="email"
                value={newReviewer.email || ''}
                onChange={(e) => setNewReviewer(prev => ({ ...prev, email: e.target.value }))}
                placeholder="reviewer@example.com"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Email address for sending notifications about protocol assignments and updates
              </p>
            </div>
            
            {/* Generated Code Preview - Always visible when name is entered */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Generated Reviewer Code</Label>
              {generatedCode ? (
                <div className="p-4 bg-gradient-to-r from-[#036635]/10 to-[#036635]/5 dark:from-[#FECC07]/20 dark:to-[#FECC07]/10 rounded-lg border-2 border-[#036635]/30 dark:border-[#FECC07]/40">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 font-mono text-xl font-bold text-[#036635] dark:text-[#FECC07] bg-white dark:bg-gray-900 px-4 py-3 rounded border-2 border-[#036635]/40 dark:border-[#FECC07]/50 text-center">
                      {generatedCode}
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleCopyCode}
                      className="flex-shrink-0 h-11"
                      title="Copy code to clipboard"
                    >
                      {codeCopied ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600 mr-1" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4 mr-1" />
                          Copy
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3 text-center">
                    This code will be used by the reviewer to access their account. Copy it before saving.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
                  <p className="text-sm text-muted-foreground text-center">
                    Enter a name above to generate the reviewer code
                  </p>
                </div>
              )}
            </div>
            <div>
              <Label htmlFor="role">Role (Optional)</Label>
              <Select 
                value={newReviewer.role || undefined} 
                onValueChange={(value) => setNewReviewer(prev => ({ ...prev, role: value ? (value as ReviewerRole) : undefined }))}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role (optional)..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chairperson">Chairperson</SelectItem>
                  <SelectItem value="vice-chair">Vice Chair</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="secretary">Secretary</SelectItem>
                  <SelectItem value="office-secretary">Office Secretary</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setAddReviewerOpen(false);
                setNewReviewer({ name: '', role: undefined });
                setGeneratedCode('');
                setCodeCopied(false);
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddReviewer} 
              disabled={saving || !newReviewer.name.trim()}
            >
              {saving ? 'Adding...' : 'Add Reviewer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Reviewer</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {reviewerToDelete?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteReviewer}
              disabled={saving}
            >
              {saving ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
