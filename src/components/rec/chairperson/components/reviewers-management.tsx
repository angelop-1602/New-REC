"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Users, 
  Plus, 
  Edit, 
  ToggleLeft, 
  ToggleRight,
  UserCheck,
  UserX,
  Loader2,
  AlertCircle,
  CheckCircle,
  Trash2
} from 'lucide-react';
import { reviewersManagementService, Reviewer, CreateReviewerRequest } from '@/lib/services/reviewersManagementService';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function ReviewersManagement() {
  const { user } = useAuth();
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  
  // Add reviewer dialog
  const [addReviewerOpen, setAddReviewerOpen] = useState(false);
  const [newReviewer, setNewReviewer] = useState<CreateReviewerRequest>({
    name: ''
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reviewersData, statsData] = await Promise.all([
        reviewersManagementService.getAllReviewers(),
        reviewersManagementService.getReviewerStats()
      ]);
      
      setReviewers(reviewersData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading reviewers data:', error);
      toast.error('Failed to load reviewers data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReviewer = async () => {
    if (!newReviewer.name.trim() || !user) return;
    
    setSaving(true);
    try {
      const reviewerId = await reviewersManagementService.createReviewer(newReviewer);
      if (reviewerId) {
        toast.success('Reviewer added successfully');
        setAddReviewerOpen(false);
        setNewReviewer({ name: '' });
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

  const handleToggleStatus = async (reviewerId: string) => {
    if (!user) return;
    
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

  const handleDeleteReviewer = async (reviewerId: string) => {
    if (!user) return;
    
    setSaving(true);
    try {
      const success = await reviewersManagementService.deleteReviewer(reviewerId);
      if (success) {
        toast.success('Reviewer deleted successfully');
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading reviewers...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reviewers Management</h1>
          <p className="text-muted-foreground">Manage research ethics reviewers</p>
        </div>
        <Button onClick={() => setAddReviewerOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Reviewer
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reviewers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Reviewers</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inactive Reviewers</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Reviewers List */}
      <Card>
        <CardHeader>
          <CardTitle>All Reviewers</CardTitle>
          <CardDescription>
            Complete list of research ethics reviewers
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewers.length > 0 ? (
            <div className="space-y-3">
              {reviewers.map(reviewer => (
                <div key={reviewer.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <p className="font-medium">{reviewer.name}</p>
                      <p className="text-sm text-muted-foreground">Code: {reviewer.code}</p>
                      <p className="text-xs text-muted-foreground">
                        Created: {reviewer.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={reviewer.isActive ? "default" : "secondary"}>
                      {reviewer.isActive ? "Active" : "Inactive"}
                    </Badge>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus(reviewer.id)}
                      disabled={saving}
                    >
                      {reviewer.isActive ? (
                        <ToggleRight className="h-4 w-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteReviewer(reviewer.id)}
                      disabled={saving}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No reviewers found. Click "Add Reviewer" to create the first reviewer.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddReviewerOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddReviewer} 
              disabled={saving || !newReviewer.name.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Reviewer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
