"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Loader2, Database, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import {
  injectAllMockSubmissions,
  injectMockSubmissionsByStatus,
  injectMockSubmissionById,
} from '@/lib/mock/mockDataInjector';
import { allMockSubmissions, mockByStatus } from '@/lib/mock/mockSubmissions';
import { toast } from 'sonner';

export function MockDataInjector() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [injectionType, setInjectionType] = useState<'all' | 'status' | 'single'>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedSubmission, setSelectedSubmission] = useState<string>('');
  const [results, setResults] = useState<{
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const handleInject = async () => {
    if (!user?.uid) {
      toast.error('You must be logged in to inject mock data');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      let result;
      
      if (injectionType === 'all') {
        result = await injectAllMockSubmissions(user.uid);
      } else if (injectionType === 'status') {
        result = await injectMockSubmissionsByStatus(
          user.uid,
          selectedStatus as 'pending' | 'accepted' | 'approved' | 'archived' | 'draft'
        );
      } else if (injectionType === 'single') {
        if (!selectedSubmission) {
          toast.error('Please select a submission to inject');
          setLoading(false);
          return;
        }
        await injectMockSubmissionById(user.uid, selectedSubmission);
        result = { success: 1, failed: 0, errors: [] };
      } else {
        throw new Error('Invalid injection type');
      }

      setResults(result);

      if (result.failed === 0) {
        toast.success(`Successfully injected ${result.success} mock submission(s)`);
        setOpen(false);
      } else {
        toast.warning(
          `Injected ${result.success} submission(s), ${result.failed} failed`
        );
      }
    } catch (error) {
      console.error('Error injecting mock data:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to inject mock data'
      );
      setResults({ success: 0, failed: 1, errors: [error instanceof Error ? error.message : 'Unknown error'] });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Database className="h-4 w-4" />
          Add Mock Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Inject Mock Data</DialogTitle>
          <DialogDescription>
            Add mock protocol submissions to your account for testing. This will create
            sample data in Firestore.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Injection Type</Label>
            <Select
              value={injectionType}
              onValueChange={(value) => {
                setInjectionType(value as 'all' | 'status' | 'single');
                setResults(null);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Mock Submissions ({allMockSubmissions.length})</SelectItem>
                <SelectItem value="status">By Status</SelectItem>
                <SelectItem value="single">Single Submission</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {injectionType === 'status' && (
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={selectedStatus}
                onValueChange={(value) => {
                  setSelectedStatus(value);
                  setResults(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">
                    Pending ({mockByStatus.pending.length})
                  </SelectItem>
                  <SelectItem value="accepted">
                    Accepted ({mockByStatus.accepted.length})
                  </SelectItem>
                  <SelectItem value="approved">
                    Approved ({mockByStatus.approved.length})
                  </SelectItem>
                  <SelectItem value="archived">
                    Archived ({mockByStatus.archived.length})
                  </SelectItem>
                  <SelectItem value="draft">
                    Draft ({mockByStatus.draft.length})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {injectionType === 'single' && (
            <div className="space-y-2">
              <Label>Select Submission</Label>
              <Select
                value={selectedSubmission}
                onValueChange={(value) => {
                  setSelectedSubmission(value);
                  setResults(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a submission..." />
                </SelectTrigger>
                <SelectContent>
                  {allMockSubmissions.map((sub) => (
                    <SelectItem key={sub.id} value={sub.id}>
                      {sub.title} ({sub.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {results && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                {results.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">
                  {results.success} successful, {results.failed} failed
                </span>
              </div>
              {results.errors.length > 0 && (
                <div className="text-sm text-muted-foreground max-h-32 overflow-y-auto">
                  <p className="font-medium mb-1">Errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {results.errors.map((error, idx) => (
                      <li key={idx} className="text-xs">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleInject} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Injecting...
              </>
            ) : (
              'Inject Data'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

