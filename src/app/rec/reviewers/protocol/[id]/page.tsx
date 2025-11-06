'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useReviewerAuthContext } from '@/contexts/ReviewerAuthContext';
import { useAssessmentForm } from '@/hooks/useAssessmentForm';
import { assessmentFormsService, FormType } from '@/lib/services/assessmentFormsService';
import { prePopulateFormFields, getFormDefaultValues, mapAssessmentTypeToFormType } from '@/lib/utils/formPrepopulation';
import { doc, getDoc, getDocs, collection } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import { getSubmissionWithDocuments } from '@/lib/firebase/firestore';

// Dynamic imports for forms
import dynamic from 'next/dynamic';
const ProtocolReviewForm = dynamic(() => import('@/components/rec/reviewer/forms/protocol-review-assesment-form'));
const ProtocolReviewIACUCForm = dynamic(() => import('@/components/rec/reviewer/forms/protcol-review-IACUC-form'));
const ExemptionChecklistForm = dynamic(() => import('@/components/rec/reviewer/forms/exemption-checklist-form'));
const InformedConsentAssessmentForm = dynamic(() => import('@/components/rec/reviewer/forms/informed-consent-assesment-form'));

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Send, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { LoadingSpinner } from '@/components/ui/loading';
import ProtocolOverview from '@/components/rec/shared/protocol-overview';

const db = getFirestore(firebaseApp);

export default function ProtocolReviewPage() {
  const params = useParams();
  const router = useRouter();
  const protocolId = params.id as string;
  
  const { reviewer, isAuthenticated, isLoading } = useReviewerAuthContext();
  const [protocolData, setProtocolData] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [reviewerAssignment, setReviewerAssignment] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<FormType | null>(null);
  const [defaultValues, setDefaultValues] = useState<Record<string, any>>({});
  const [skipFirebaseLoad, setSkipFirebaseLoad] = useState(false);
  const [assessmentStatus, setAssessmentStatus] = useState<string | null>(null);
  const [returnReason, setReturnReason] = useState<string | null>(null);

  // Load protocol and reviewer assignment data
  useEffect(() => {
    const loadData = async () => {
      // Wait for auth to finish initializing
      if (isLoading) return;

      if (!isAuthenticated || !reviewer || !protocolId) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

             try {
         setLoading(true);
         setError(null);

         // Get complete protocol data with documents
         const completeProtocol = await getSubmissionWithDocuments(protocolId);
         
         if (!completeProtocol) {
           setError('Protocol not found');
           setLoading(false);
           return;
         }

         setProtocolData(completeProtocol);
         setDocuments(completeProtocol.documents || []);

        // Check if this reviewer was reassigned from this protocol
        const reassignmentHistoryRef = collection(db, 'submissions', protocolId, 'reassignment_history');
        const reassignmentHistorySnap = await getDocs(reassignmentHistoryRef);
        
        const wasReassigned = reassignmentHistorySnap.docs.some(doc => 
          doc.data().oldReviewerId === reviewer.id
        );
        
        if (wasReassigned) {
          setError('You have been removed from reviewing this protocol. Please check the "Reassigned" tab for more details.');
          setLoading(false);
          return;
        }
        
        // Get reviewer assignment
        const reviewersRef = collection(db, 'submissions', protocolId, 'reviewers');
        const reviewersSnap = await getDocs(reviewersRef);
        
        const assignment = reviewersSnap.docs.find(doc => 
          doc.data().reviewerId === reviewer.id
        );

        if (!assignment) {
          setError('You are not assigned to review this protocol');
          setLoading(false);
          return;
        }

        const assignmentData = assignment.data();
        setReviewerAssignment(assignmentData);

        // Map assessment type to form type
        const mappedFormType = mapAssessmentTypeToFormType(assignmentData.assessmentType) as FormType;
        setFormType(mappedFormType);

        // Check if there's existing assessment data first
        const { default: AssessmentSubmissionService } = await import('@/lib/services/assessmentSubmissionService');
        const existingAssessment = await AssessmentSubmissionService.getAssessment(protocolId, mappedFormType, reviewer.id);
        
        if (existingAssessment && existingAssessment.formData) {
          // Use existing assessment data
          console.log('✅ Found existing assessment data, using it instead of pre-populated fields');
          setDefaultValues(existingAssessment.formData);
          setAssessmentStatus(existingAssessment.status);
          setReturnReason(existingAssessment.rejectionReason || null);
          // Set flag to skip Firebase loading in form component since we already have the data
          setSkipFirebaseLoad(true);
        } else {
          // Pre-populate form fields with protocol information for new assessments
          console.log('✅ No existing assessment found, using pre-populated protocol fields');
          const prepopulatedFields = prePopulateFormFields(completeProtocol);
          const formDefaults = getFormDefaultValues(mappedFormType, prepopulatedFields);
          setDefaultValues(formDefaults);
          setAssessmentStatus('draft');
          setSkipFirebaseLoad(false);
        }

      } catch (error) {
        console.error('Error loading protocol data:', error);
        setError('Failed to load protocol data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [protocolId, reviewer, isAuthenticated, isLoading]);

  // Handle form submission
  const handleFormSubmit = (formData: any) => {
    console.log('Form submitted:', formData);
    // Navigate back to reviewer dashboard
    router.push('/rec/reviewers');
  };

  // Render the appropriate form based on form type
  const renderForm = () => {
    if (!formType || !reviewer) return null;

    const formProps = {
      readOnly: assessmentStatus === 'approved',
      protocolData,
      reviewerAssignment,
      defaultValues,
      protocolId,
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      skipFirebaseLoad: skipFirebaseLoad
    };

    switch (formType) {
      case 'protocol-review':
        return <ProtocolReviewForm {...formProps} />;
      case 'informed-consent':
        return <InformedConsentAssessmentForm {...formProps} />;
      case 'exemption-checklist':
        return <ExemptionChecklistForm {...formProps} />;
      case 'iacuc-review':
        return <ProtocolReviewIACUCForm {...formProps} />;
      default:
        return <div>Unknown form type: {formType}</div>;
    }
  };

  // Loading state (auth or page)
  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading protocol data..." />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <Alert className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/rec/reviewers')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated || !reviewer) {
    router.push('/rec/reviewers');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/rec/reviewers')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-primary">Protocol Review</h1>
                <p className="text-sm text-muted-foreground">
                  {reviewer.name} • {reviewer.code}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {assessmentStatus && (
                <Badge 
                  variant={
                    assessmentStatus === 'submitted' || assessmentStatus === 'completed' || assessmentStatus === 'approved'
                      ? 'default' 
                      : assessmentStatus === 'draft'
                      ? 'secondary'
                      : 'outline'
                  }
                  className={
                    assessmentStatus === 'submitted' || assessmentStatus === 'completed' || assessmentStatus === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : assessmentStatus === 'draft'
                      ? 'bg-yellow-100 text-yellow-800'
                      : ''
                  }
                >
                  {assessmentStatus === 'submitted' || assessmentStatus === 'completed' || assessmentStatus === 'approved' ? (
                    <CheckCircle className="w-3 h-3 mr-1" />
                  ) : assessmentStatus === 'draft' ? (
                    <Clock className="w-3 h-3 mr-1" />
                  ) : (
                    <Clock className="w-3 h-3 mr-1" />
                  )}
                  {assessmentStatus === 'submitted' ? 'Submitted' :
                   assessmentStatus === 'completed' ? 'Completed' :
                   assessmentStatus === 'approved' ? 'Approved' :
                   assessmentStatus === 'draft' ? 'In Progress' :
                   'Not Started'}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Panel: Forms */}
          <div className="lg:col-span-3 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  {reviewerAssignment?.assessmentType || 'Assessment Form'}
                </CardTitle>
                <CardDescription>
                  Please complete your assessment of this protocol. Your work will be auto-saved.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderForm()}
              </CardContent>
            </Card>
          </div>

          {/* Right Panel: Return Reason + Protocol Overview */}
          <div className="lg:col-span-2 lg:border-l lg:border-gray-200 lg:pl-8">
            <div className="sticky top-8 max-h-[calc(100vh-8rem)] overflow-y-auto">
              {assessmentStatus === 'returned' && returnReason && (
                <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800">Returned by Chairperson</p>
                      <p className="text-sm text-red-800/90">{returnReason}</p>
                    </div>
                  </div>
                </div>
              )}
              <ProtocolOverview 
                information={protocolData?.information}
                documents={documents}
                userType="reviewer"
                showDocuments={true}
                protocolId={protocolId}
                submissionId={protocolId}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
