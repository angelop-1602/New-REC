"use client"

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, Users, Crown, Shield, FileText, UserCog, Check } from 'lucide-react';
import { LoadingSimple, InlineLoading } from "@/components/ui/loading";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { reviewersManagementService, Reviewer, ReviewerRole } from '@/lib/services/reviewers/reviewersManagementService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface MemberManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate?: () => void;
}

export function MemberManagementDialog({ 
  open, 
  onOpenChange,
  onUpdate 
}: MemberManagementDialogProps) {
  const { user } = useAuth();
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // Selected reviewers for each role
  const [chairperson, setChairperson] = useState<string>('');
  const [viceChair, setViceChair] = useState<string>('');
  const [secretary, setSecretary] = useState<string>('');
  const [officeSecretary, setOfficeSecretary] = useState<string>('');
  const [members, setMembers] = useState<string[]>([]); // Checklist of regular members
  

  useEffect(() => {
    if (open) {
      loadData();
    } else {
      // Reset selections when dialog closes
      setChairperson('');
      setViceChair('');
      setSecretary('');
      setOfficeSecretary('');
      setMembers([]);
    }
  }, [open]);

  const loadData = async () => {
    setLoading(true);
    try {
      const reviewersData = await reviewersManagementService.getAllReviewers();
      setReviewers(reviewersData.filter(r => r.isActive));
      
      // Load current assignments from reviewer roles
      const chairReviewer = reviewersData.find(r => r.role === 'chairperson' && r.isActive);
      if (chairReviewer) setChairperson(chairReviewer.id);
      
      const viceChairReviewer = reviewersData.find(r => r.role === 'vice-chair' && r.isActive);
      if (viceChairReviewer) setViceChair(viceChairReviewer.id);
      
      const secretaryReviewer = reviewersData.find(r => r.role === 'secretary' && r.isActive);
      if (secretaryReviewer) setSecretary(secretaryReviewer.id);
      
      const officeSecretaryReviewer = reviewersData.find(r => r.role === 'office-secretary' && r.isActive);
      if (officeSecretaryReviewer) setOfficeSecretary(officeSecretaryReviewer.id);
      
      // Get all reviewers with 'member' role
      const memberReviewers = reviewersData.filter(r => r.role === 'member' && r.isActive);
      setMembers(memberReviewers.map(r => r.id));
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load reviewers data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    // Validate that chairperson is selected
    if (!chairperson) {
      toast.error('Please select a Chairperson');
      return;
    }
    
    setSaving(true);
    try {
      // Get all reviewers that currently have REC member roles
      const allReviewers = await reviewersManagementService.getAllReviewers();
      const memberRoles: ReviewerRole[] = ['chairperson', 'vice-chair', 'secretary', 'office-secretary', 'member'];
      const currentMembers = allReviewers.filter(r => r.role && memberRoles.includes(r.role));
      
      // Get all selected reviewer IDs
      const selectedIds = [
        chairperson,
        viceChair,
        secretary,
        officeSecretary,
        ...members
      ].filter(Boolean) as string[];
      
      // Step 1: Remove roles from reviewers who are no longer selected
      const removeRolePromises = currentMembers
        .filter(r => !selectedIds.includes(r.id))
        .map(async (reviewer) => {
          // Use null to explicitly delete the role field from Firestore
          await reviewersManagementService.updateReviewer(reviewer.id, { 
            role: null
          });
        });
      
      await Promise.all(removeRolePromises);
      
      // Step 2: Update roles for selected reviewers
      const updatePromises = selectedIds.map(async (reviewerId) => {
        const reviewer = reviewers.find(r => r.id === reviewerId);
        if (!reviewer) return;
        
        let newRole: ReviewerRole | undefined;
        
        if (reviewerId === chairperson) newRole = 'chairperson';
        else if (reviewerId === viceChair) newRole = 'vice-chair';
        else if (reviewerId === secretary) newRole = 'secretary';
        else if (reviewerId === officeSecretary) newRole = 'office-secretary';
        else if (members.includes(reviewerId)) newRole = 'member';
        
        // Only update if role changed
        if (newRole && reviewer.role !== newRole) {
          await reviewersManagementService.updateReviewer(reviewerId, { role: newRole });
        }
      });
      
      await Promise.all(updatePromises);
      
      toast.success('Member assignments updated successfully');
      onOpenChange(false);
      onUpdate?.();
    } catch (error) {
      console.error('Error saving member assignments:', error);
      toast.error('Failed to save member assignments');
    } finally {
      setSaving(false);
    }
  };

  // Get available reviewers for dropdowns (exclude already selected ones)
  const getAvailableReviewers = (excludeIds: string[] = []) => {
    return reviewers.filter(r => !excludeIds.includes(r.id));
  };

  // Get selected reviewer IDs for exclusion
  const getSelectedIds = () => {
    return [
      chairperson,
      viceChair,
      secretary,
      officeSecretary
    ].filter(Boolean) as string[];
  };

  // Toggle member selection
  const toggleMember = (reviewerId: string) => {
    if (members.includes(reviewerId)) {
      setMembers(members.filter(id => id !== reviewerId));
    } else {
      // Don't allow if already selected for a specific role
      const selectedIds = getSelectedIds();
      if (!selectedIds.includes(reviewerId)) {
        setMembers([...members, reviewerId]);
      }
    }
  };

  // Get available reviewers for members checklist (exclude those in specific roles)
  const getAvailableMembers = () => {
    const selectedIds = getSelectedIds();
    return reviewers.filter(r => !selectedIds.includes(r.id));
  };



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Member Management
          </DialogTitle>
          <DialogDescription>
            Assign reviewers to REC member positions. All selected reviewers will be added as REC members if they don&apos;t exist yet.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSimple size="md" text="Loading reviewers..." />
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Chairperson */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                Chairperson *
              </Label>
              <Select 
                value={chairperson} 
                onValueChange={setChairperson}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select chairperson..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableReviewers([viceChair, secretary, officeSecretary].filter(Boolean) as string[]).map(reviewer => (
                    <SelectItem key={reviewer.id} value={reviewer.id}>
                      {reviewer.name} {reviewer.role && `(${reviewer.role})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vice Chair */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <Shield className="h-4 w-4 text-blue-600" />
                Vice Chair
              </Label>
              <Select 
                value={viceChair} 
                onValueChange={setViceChair}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select vice chair..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableReviewers([chairperson, secretary, officeSecretary].filter(Boolean) as string[]).map(reviewer => (
                    <SelectItem key={reviewer.id} value={reviewer.id}>
                      {reviewer.name} {reviewer.role && `(${reviewer.role})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Secretary */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-green-600" />
                Secretary
              </Label>
              <Select 
                value={secretary} 
                onValueChange={setSecretary}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select secretary..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableReviewers([chairperson, viceChair, officeSecretary].filter(Boolean) as string[]).map(reviewer => (
                    <SelectItem key={reviewer.id} value={reviewer.id}>
                      {reviewer.name} {reviewer.role && `(${reviewer.role})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Office Secretary */}
            <div>
              <Label className="flex items-center gap-2 mb-2">
                <UserCog className="h-4 w-4 text-purple-600" />
                Office Secretary
              </Label>
              <Select 
                value={officeSecretary} 
                onValueChange={setOfficeSecretary}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select office secretary..." />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableReviewers([chairperson, viceChair, secretary].filter(Boolean) as string[]).map(reviewer => (
                    <SelectItem key={reviewer.id} value={reviewer.id}>
                      {reviewer.name} {reviewer.role && `(${reviewer.role})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Members Checklist */}
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4 text-gray-600" />
                Members (Checklist)
              </Label>
              <div className="border rounded-lg p-4 max-h-64 overflow-y-auto space-y-2">
                {getAvailableMembers().length > 0 ? (
                  getAvailableMembers().map(reviewer => (
                    <div key={reviewer.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`member-${reviewer.id}`}
                        checked={members.includes(reviewer.id)}
                        onCheckedChange={() => toggleMember(reviewer.id)}
                      />
                      <label
                        htmlFor={`member-${reviewer.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {reviewer.name}
                        {reviewer.role && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {reviewer.role}
                          </Badge>
                        )}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No available reviewers (all are assigned to specific roles)
                  </p>
                )}
              </div>
              {members.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {members.length} member{members.length !== 1 ? 's' : ''} selected
                </p>
              )}
            </div>

          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !chairperson}>
            {saving ? (
              <>
                <InlineLoading size="sm" />
                <span className="ml-2">Saving...</span>
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save Assignments
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

