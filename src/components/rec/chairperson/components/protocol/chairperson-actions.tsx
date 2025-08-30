"use client"

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  CheckCircle, 
  XCircle, 
  UserPlus, 
  Send, 
  FileText,
  Clock,
  AlertCircle,
  Info,
  Loader2
} from "lucide-react";
import { useSpupCodeGenerator } from "@/hooks/useSpupCodeGenerator";
import { acceptSubmission, rejectSubmission, makeProtocolDecision } from "@/lib/firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ChairpersonActionsProps {
  submission: any;
  onStatusUpdate: (status: string) => void;
  onAssignReviewer: (reviewerId: string) => void;
}

export function ChairpersonActions({ 
  submission, 
  onStatusUpdate, 
  onAssignReviewer 
}: ChairpersonActionsProps) {
  const { user } = useAuth();
  const { generateSpupCode, generateInitials, loading: codeLoading } = useSpupCodeGenerator();
  
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [decisionDialogOpen, setDecisionDialogOpen] = useState(false);
  const [documentUploadOpen, setDocumentUploadOpen] = useState(false);
  const [spupCode, setSpupCode] = useState("");
  const [reviewType, setReviewType] = useState<'SR' | 'EX'>('SR');
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedReviewer, setSelectedReviewer] = useState("");
  const [decision, setDecision] = useState<'approved' | 'approved_minor_revisions' | 'major_revisions_deferred' | 'disapproved'>('approved');
  const [decisionDetails, setDecisionDetails] = useState("");
  const [timeline, setTimeline] = useState("");
  const [uploadedDocuments, setUploadedDocuments] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [generatedCode, setGeneratedCode] = useState("");
  const [piInitials, setPiInitials] = useState("");

  // Mock reviewers - replace with actual data from Firebase
  const reviewers = [
    { id: "reviewer1", name: "Dr. John Doe", expertise: "Medical Ethics" },
    { id: "reviewer2", name: "Dr. Jane Smith", expertise: "Clinical Research" },
    { id: "reviewer3", name: "Dr. Robert Johnson", expertise: "Social Sciences" },
  ];

  // Generate SPUP code when dialog opens
  useEffect(() => {
    const generateCode = async () => {
      if (approveDialogOpen && submission) {
        const pi = submission.information?.general_information?.principal_investigator;
        const code = await generateSpupCode(pi, reviewType);
        setGeneratedCode(code);
        setSpupCode(code);
        
        // Extract initials from PI name
        if (pi?.name) {
          const nameParts = pi.name.trim().split(' ');
          if (nameParts.length >= 2) {
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            setPiInitials(generateInitials(firstName, lastName));
          }
        }
      }
    };
    
    generateCode();
  }, [approveDialogOpen, submission, reviewType, generateSpupCode, generateInitials]);

  const handleApprove = async () => {
    if (!spupCode) {
      toast.error("Please enter or confirm the SPUP Code");
      return;
    }
    
    if (!user) {
      toast.error("You must be logged in to approve submissions");
      return;
    }
    
    setIsProcessing(true);
    try {
      await acceptSubmission(submission.id, spupCode, user.uid);
      toast.success(`Protocol accepted with SPUP Code: ${spupCode}`);
      onStatusUpdate("accepted");
      setApproveDialogOpen(false);
    } catch (error) {
      console.error("Error accepting submission:", error);
      toast.error("Failed to accept submission. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    
    if (!user) {
      toast.error("You must be logged in to reject submissions");
      return;
    }
    
    setIsProcessing(true);
    try {
      await rejectSubmission(submission.id, rejectionReason, user.uid);
      toast.success("Protocol rejected");
      onStatusUpdate("rejected");
      setRejectDialogOpen(false);
    } catch (error) {
      console.error("Error rejecting submission:", error);
      toast.error("Failed to reject submission. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAssignReviewer = () => {
    if (!selectedReviewer) {
      alert("Please select a reviewer");
      return;
    }
    onAssignReviewer(selectedReviewer);
    setAssignDialogOpen(false);
  };

  const handleMakeDecision = async () => {
    if (!decisionDetails.trim()) {
      toast.error("Please provide decision details");
      return;
    }

    if ((decision === 'approved_minor_revisions' || decision === 'major_revisions_deferred') && !timeline.trim()) {
      toast.error("Please specify timeline for revisions");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to make decisions");
      return;
    }

    setIsProcessing(true);
    try {
      await makeProtocolDecision(
        submission.id,
        decision,
        decisionDetails,
        user.uid,
        timeline || undefined,
        uploadedDocuments
      );
      
      const decisionText = {
        'approved': 'Approved',
        'approved_minor_revisions': 'Approved with Minor Revisions',
        'major_revisions_deferred': 'Major Revisions Required',
        'disapproved': 'Disapproved'
      }[decision];
      
      toast.success(`Protocol ${decisionText}`);
      onStatusUpdate(decision === 'approved' ? 'approved' : 'accepted');
      setDecisionDialogOpen(false);
    } catch (error) {
      console.error("Error making decision:", error);
      toast.error("Failed to make decision. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const getDecisionDescription = (decisionType: string) => {
    switch (decisionType) {
      case 'approved':
        return 'The research may proceed as submitted.';
      case 'approved_minor_revisions':
        return 'Approval granted with minor revisions required before proceeding.';
      case 'major_revisions_deferred':
        return 'Significant ethical issues require major revision and resubmission.';
      case 'disapproved':
        return 'Protocol cannot be approved due to unresolvable ethical concerns.';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "approved":
      case "accepted":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Administrative Actions</span>
            <div className="flex items-center gap-2">
              {getStatusIcon(submission.status)}
              <Badge 
                variant={
                  submission.status === "approved" || submission.status === "accepted" 
                    ? "default" 
                    : submission.status === "rejected" 
                    ? "destructive" 
                    : "secondary"
                }
              >
                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
              </Badge>
            </div>
          </CardTitle>
          <CardDescription>
            Manage protocol review and approval process
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Application ID</p>
              <p className="font-medium">{submission.applicationID || submission.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">SPUP Code</p>
              <p className="font-medium">{submission.spupCode || submission.tempProtocolCode || "Not Assigned"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Reviewer</p>
              <p className="font-medium">{submission.reviewerId ? "Assigned" : "Not Assigned"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Review Status</p>
              <p className="font-medium">{submission.reviewStatus || "Pending"}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            {submission.status === "pending" && (
              <>
                <Button 
                  onClick={() => setApproveDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Protocol
                </Button>
                <Button 
                  variant="destructive"
                  onClick={() => setRejectDialogOpen(true)}
                >
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Protocol
                </Button>
              </>
            )}
            
            {(submission.status === "accepted" || submission.status === "pending") && (
              <Button 
                variant="outline"
                onClick={() => setAssignDialogOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                {submission.reviewerId ? "Reassign Reviewer" : "Assign Reviewer"}
              </Button>
            )}

            {submission.status === "accepted" && !submission.decision && (
              <Button 
                onClick={() => setDecisionDialogOpen(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Make Decision
              </Button>
            )}

            {submission.status === "accepted" && (
              <Button 
                variant="outline"
                onClick={() => setDocumentUploadOpen(true)}
              >
                <FileText className="mr-2 h-4 w-4" />
                Upload Documents
              </Button>
            )}

            <Button 
              variant="outline"
              onClick={() => {/* TODO: Send notification */}}
            >
              <Send className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Approve Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Accept Protocol</DialogTitle>
            <DialogDescription>
              Review and confirm the SPUP Code for this protocol
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Protocol Info */}
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="space-y-1 text-sm">
                  <p><strong>Application ID:</strong> {submission.applicationID || submission.id}</p>
                  <p><strong>Protocol Title:</strong> {submission.information?.general_information?.protocol_title || submission.title}</p>
                  <p><strong>Principal Investigator:</strong> {submission.information?.general_information?.principal_investigator?.name || "N/A"}</p>
                  <p><strong>Temporary Code:</strong> {submission.tempProtocolCode}</p>
                </div>
              </div>
            </div>

            {/* Review Type Selection */}
            <div>
              <Label>Review Type</Label>
              <RadioGroup value={reviewType} onValueChange={(value) => setReviewType(value as 'SR' | 'EX')}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="SR" id="sr" />
                  <Label htmlFor="sr" className="font-normal cursor-pointer">
                    Standard Review (SR)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="EX" id="ex" />
                  <Label htmlFor="ex" className="font-normal cursor-pointer">
                    Expedited Review (EX)
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Generated SPUP Code */}
            <div>
              <Label htmlFor="spup-code">Generated SPUP Code</Label>
              <div className="flex gap-2">
                <Input
                  id="spup-code"
                  value={spupCode}
                  onChange={(e) => setSpupCode(e.target.value)}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const pi = submission.information?.general_information?.principal_investigator;
                    const code = await generateSpupCode(pi, reviewType);
                    setSpupCode(code);
                  }}
                  disabled={codeLoading}
                >
                  {codeLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Regenerate"}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground mt-2 space-y-1">
                <p><strong>Format:</strong> SPUP_YYYY_00000_SR/EX_XX</p>
                <p><strong>Example:</strong> SPUP_2025_00437_SR_KS</p>
                <p className="text-xs">You can manually edit the code if needed</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setApproveDialogOpen(false);
                setSpupCode("");
                setReviewType('SR');
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleApprove} 
              className="bg-green-600 hover:bg-green-700"
              disabled={isProcessing || !spupCode}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Accept Protocol
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Protocol</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting this protocol
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Enter the reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={isProcessing || !rejectionReason}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject Protocol
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Reviewer Dialog */}
      <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Reviewer</DialogTitle>
            <DialogDescription>
              Select a reviewer for this protocol
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="reviewer">Select Reviewer</Label>
              <Select value={selectedReviewer} onValueChange={setSelectedReviewer}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a reviewer" />
                </SelectTrigger>
                <SelectContent>
                  {reviewers.map((reviewer) => (
                    <SelectItem key={reviewer.id} value={reviewer.id}>
                      <div>
                        <p className="font-medium">{reviewer.name}</p>
                        <p className="text-sm text-muted-foreground">{reviewer.expertise}</p>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAssignReviewer}>
              Assign Reviewer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Decision Dialog */}
      <Dialog open={decisionDialogOpen} onOpenChange={setDecisionDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Make Protocol Decision</DialogTitle>
            <DialogDescription>
              Make a final decision on this protocol after review
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Decision Type Selection */}
            <div>
              <Label>Decision Type</Label>
              <RadioGroup value={decision} onValueChange={(value) => setDecision(value as any)}>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value="approved" id="approved" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="approved" className="font-medium cursor-pointer text-green-700">
                        Approved
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getDecisionDescription('approved')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value="approved_minor_revisions" id="minor" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="minor" className="font-medium cursor-pointer text-blue-700">
                        Approved with Minor Revisions
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getDecisionDescription('approved_minor_revisions')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value="major_revisions_deferred" id="major" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="major" className="font-medium cursor-pointer text-yellow-700">
                        Major Revisions / Deferred
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getDecisionDescription('major_revisions_deferred')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 border rounded-lg">
                    <RadioGroupItem value="disapproved" id="disapproved" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="disapproved" className="font-medium cursor-pointer text-red-700">
                        Disapproved
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        {getDecisionDescription('disapproved')}
                      </p>
                    </div>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Decision Details */}
            <div>
              <Label htmlFor="decision-details">Decision Details</Label>
              <Textarea
                id="decision-details"
                placeholder="Provide detailed explanation of the decision..."
                value={decisionDetails}
                onChange={(e) => setDecisionDetails(e.target.value)}
                rows={4}
              />
            </div>

            {/* Timeline (for revisions) */}
            {(decision === 'approved_minor_revisions' || decision === 'major_revisions_deferred') && (
              <div>
                <Label htmlFor="timeline">Timeline for Compliance</Label>
                <Input
                  id="timeline"
                  placeholder="e.g., 30 days, 2 weeks, etc."
                  value={timeline}
                  onChange={(e) => setTimeline(e.target.value)}
                />
              </div>
            )}

            {/* Document Upload */}
            <div>
              <Label>Upload Decision Documents (Optional)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    setUploadedDocuments(files);
                  }}
                  className="hidden"
                  id="document-upload"
                />
                <Label htmlFor="document-upload" className="cursor-pointer">
                  <FileText className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm">Click to upload decision documents</p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, DOCX files accepted</p>
                </Label>
              </div>
              {uploadedDocuments.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Selected files:</p>
                  <ul className="text-sm text-muted-foreground">
                    {uploadedDocuments.map((file, index) => (
                      <li key={index}>• {file.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setDecisionDialogOpen(false);
                setDecisionDetails("");
                setTimeline("");
                setUploadedDocuments([]);
              }}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleMakeDecision}
              disabled={isProcessing || !decisionDetails.trim()}
              className={
                decision === 'approved' ? 'bg-green-600 hover:bg-green-700' :
                decision === 'approved_minor_revisions' ? 'bg-blue-600 hover:bg-blue-700' :
                decision === 'major_revisions_deferred' ? 'bg-yellow-600 hover:bg-yellow-700' :
                'bg-red-600 hover:bg-red-700'
              }
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm Decision
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
