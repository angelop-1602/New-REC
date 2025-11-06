"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText as FileTextIcon, 
  Loader2, 
  Eye, 
  ArrowLeft,
  Download,

  Calendar,
  User,
  Building,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Edit,
  Save,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { generateDecisionDocuments } from "@/lib/services/documentGenerator";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';

const db = getFirestore(firebaseApp);

type DecisionType = 'approved' | 'approved_minor_revisions' | 'major_revisions_deferred' | 'disapproved';

// Helper function to get template labels based on research type
const getTemplateLabels = (researchType?: string): string[] => {
  const isSR = researchType === 'SR';
  const isEX = researchType === 'EX' || researchType === 'Ex';
  
  return [
    isSR ? "Certificate of Approval" : isEX ? "Certificate of Exemption" : "Certificate of Approval",
    "Notification of SPUP REC Decision",
    "Protocol Resubmission Form",
    "Archiving Notification"
  ];
};

export default function GenerateDocumentsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const protocolId = params.id as string;

  const [submission, setSubmission] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [loading, setLoading] = useState(true);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editedData, setEditedData] = useState<any>({}); // eslint-disable-line @typescript-eslint/no-explicit-any
  const [chairpersonName, setChairpersonName] = useState<string>("REC Chairperson");
  const [templateLabels, setTemplateLabels] = useState<string[]>([]);

  // Load submission data and chairperson
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load submission data
        const submissionRef = doc(db, 'submissions', protocolId);
        const submissionSnap = await getDoc(submissionRef);
        
        if (submissionSnap.exists()) {
          setSubmission({
            id: submissionSnap.id,
            ...submissionSnap.data()
          });
        } else {
          toast.error("Protocol not found");
          router.back();
          return;
        }

        // Load chairperson from reviewers collection
        const reviewersRef = collection(db, 'reviewers');
        const q = query(reviewersRef, where('role', '==', 'Chairperson'));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const chairpersonDoc = querySnapshot.docs[0];
          const chairpersonData = chairpersonDoc.data();
          setChairpersonName(chairpersonData.name || 'REC Chairperson');
        }
        
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error("Failed to load protocol data");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    if (protocolId) {
      loadData();
    }
  }, [protocolId, router]);

  // Initialize templates based on research type
  useEffect(() => {
    if (submission) {
      const researchType = submission.researchType || submission.reviewType;
      const labels = getTemplateLabels(researchType);
      setTemplateLabels(labels);
      setSelectedTemplates(labels);
    }
  }, [submission]);

  const replacementPreview = useMemo(() => {
    if (!submission) return [];
    
    const pi = submission.information?.general_information?.principal_investigator;
    const protocolTitle = submission.information?.general_information?.protocol_title || submission.title;
    const spupCode = submission.spupCode || submission.tempProtocolCode || 'TBD';
    const today = new Date();
    const initialDate = new Date(today);
    initialDate.setDate(initialDate.getDate() - 5);
    const durationDate = new Date(today);
    durationDate.setFullYear(durationDate.getFullYear() + 1);

    return [
      // Auto-Generated Values
      { key: "DATE", label: "Current Date", value: editedData.DATE || today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), icon: Calendar, editable: true },
      { key: "INITIAL_DATE", label: "Initial Date", value: editedData.INITIAL_DATE || initialDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), icon: Calendar, editable: true },
      { key: "DURATION_DATE", label: "Duration Period", value: editedData.DURATION_DATE || `${today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} - ${durationDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, icon: Calendar, editable: true },
      
      // Protocol Information
      { key: "SPUP_REC_CODE", label: "SPUP REC Code", value: editedData.SPUP_REC_CODE || spupCode, icon: FileTextIcon, editable: true },
      { key: "PROTOCOL_TITLE", label: "Protocol Title", value: editedData.PROTOCOL_TITLE || protocolTitle, icon: BookOpen, editable: true },
      { key: "PRINCIPAL_INVESTIGATOR", label: "Principal Investigator", value: editedData.PRINCIPAL_INVESTIGATOR || pi?.name || "N/A", icon: User, editable: true },
      { key: "INSTITUTION", label: "Institution", value: editedData.INSTITUTION || pi?.position_institution || "St. Paul University Philippines", icon: Building, editable: true },
      { key: "ADDRESS", label: "Address", value: editedData.ADDRESS || pi?.address || "N/A", icon: MapPin, editable: true },
      { key: "CONTACT_NUMBER", label: "Contact Number", value: editedData.CONTACT_NUMBER || pi?.contact_number || "N/A", icon: Phone, editable: true },
      { key: "E_MAIL", label: "Email Address", value: editedData.E_MAIL || pi?.email || "N/A", icon: Mail, editable: true },
      { key: "ADVISER", label: "Research Adviser", value: editedData.ADVISER || submission.information?.general_information?.adviser?.name || "N/A", icon: User, editable: true },
      { key: "APPROVED_DATE", label: "Approved Date", value: editedData.APPROVED_DATE || today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), icon: Calendar, editable: true },
      { key: "TYPE_SUBMISSION", label: "Submission Type", value: editedData.TYPE_SUBMISSION || "Initial Review", icon: FileTextIcon, editable: true },
      
      // Input/Reviewer Values
      { key: "VERSION", label: "Protocol Version", value: editedData.VERSION || "02", icon: FileTextIcon, editable: true },
      { key: "Chairperson", label: "REC Chairperson", value: editedData.Chairperson || chairpersonName, icon: User, editable: true },
    ];
  }, [submission, editedData, chairpersonName]);

  const toggleTemplate = (label: string) => {
    setSelectedTemplates(curr => curr.includes(label) ? curr.filter(t => t !== label) : [...curr, label]);
  };

  const handleEditField = (fieldKey: string, currentValue: string) => {
    setEditingField(fieldKey);
    setEditedData(prev => ({ ...prev, [fieldKey]: currentValue }));
  };

  const handleSaveField = (fieldKey: string) => {
    setEditingField(null);
    toast.success(`${fieldKey} updated successfully`);
  };

  const handleCancelEdit = (fieldKey: string) => {
    setEditingField(null);
    setEditedData(prev => {
      const newData = { ...prev };
      delete newData[fieldKey];
      return newData;
    });
  };

  const handleFieldChange = (fieldKey: string, value: string) => {
    setEditedData(prev => ({ ...prev, [fieldKey]: value }));
  };

  const handleGenerate = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }
    
    if (selectedTemplates.length === 0) {
      toast.error("Please select at least one document to generate");
      return;
    }

    setIsGenerating(true);
    try {
      const finalChairpersonName = editedData.Chairperson || chairpersonName;
      
      // Determine research type from submission (SR or EX)
      const researchType = submission.researchType || submission.reviewType || 'SR';
      
      // Add research type to submission data for certificate selection
      const submissionWithType = {
        ...submission,
        researchType
      };
      
      const docs = await generateDecisionDocuments('approved', submissionWithType, finalChairpersonName);

      // Filter documents based on selected templates
      const filtered = docs.filter(doc => {
        const name = doc.fileName.toLowerCase();
        return selectedTemplates.some(label => {
          const labelLower = label.toLowerCase();
          
          // Direct mapping for known templates
          const labelMappings: Record<string, string[]> = {
            "certificate of approval": ["certificate_of_approval", "certificate", "approval"],
            "certificate of exemption": ["certificate_of_exemption", "exemption"],
            "notification of spup rec decision": ["notice_of_decision", "notice", "decision"],
            "protocol resubmission form": ["protocol_resubmission", "resubmission"],
            "archiving notification": ["archiving_notification", "archiving"]
          };
          
          // Check if there's a mapping for this label
          const keywords = labelMappings[labelLower];
          if (keywords) {
            return keywords.some(keyword => name.includes(keyword));
          }
          
          // Fallback to original logic
          return name.includes(labelLower.split(' ').join('_')) || 
                 name.includes(labelLower);
        });
      });

      if (filtered.length === 0) {
        toast.warning("No documents selected to generate");
        return;
      }

      // Download all selected documents
      filtered.forEach(doc => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(doc.blob);
        link.download = doc.fileName;
        link.click();
        URL.revokeObjectURL(link.href);
      });

      toast.success(`Successfully generated ${filtered.length} document(s)`);
      router.back();

    } catch (error) {
      console.error('Error generating documents:', error);
      toast.error("Failed to generate documents. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading protocol data...</span>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Protocol Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested protocol could not be found.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.back()}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Protocol
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Generate Documents</h1>
            <p className="text-muted-foreground">
              Create official documents for protocol: {submission.spupCode || submission.tempProtocolCode}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2">
          {submission.spupCode || submission.tempProtocolCode}
        </Badge>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Templates */}
        <div className="lg:col-span-1 space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>Document Templates</CardTitle>
              <CardDescription>
                Select which documents to generate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {templateLabels.map(label => (
                  <div key={label} className="flex items-center space-x-3">
                    <Checkbox 
                      id={label}
                      checked={selectedTemplates.includes(label)} 
                      onCheckedChange={() => toggleTemplate(label)}
                    />
                    <Label htmlFor={label} className="text-sm font-normal cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="pt-4 border-t flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || selectedTemplates.length === 0}
                  className="flex-1"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Generate {selectedTemplates.length}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Replacement Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Replacement Preview
              </CardTitle>
              <CardDescription>
                Preview the data that will be used to populate the generated documents
              </CardDescription>
            </CardHeader>
                         <CardContent>
               <div className="grid md:grid-cols-2 gap-4">
                 {replacementPreview.map((item, index) => {
                   const IconComponent = item.icon;
                   const isEditing = editingField === item.key;
                   
                   return (
                     <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                       <IconComponent className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                       <div className="min-w-0 flex-1">
                         <div className="text-sm font-medium text-muted-foreground mb-1">
                           {item.label}
                         </div>
                         {isEditing ? (
                           <div className="flex items-center gap-2">
                             <Input
                               value={editedData[item.key] || item.value}
                               onChange={(e) => handleFieldChange(item.key, e.target.value)}
                               className="text-sm h-8 flex-1"
                               placeholder={`Enter ${item.label}`}
                             />
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleSaveField(item.key)}
                               className="h-8 w-8 p-0"
                             >
                               <Save className="h-3 w-3" />
                             </Button>
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleCancelEdit(item.key)}
                               className="h-8 w-8 p-0"
                             >
                               <X className="h-3 w-3" />
                             </Button>
                           </div>
                         ) : (
                           <div className="flex items-center gap-2">
                             <div className="text-sm break-words flex-1">
                               {item.value}
                             </div>
                             {item.editable && (
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={() => handleEditField(item.key, item.value)}
                                 className="h-8 w-8 p-0"
                               >
                                 <Edit className="h-3 w-3" />
                               </Button>
                             )}
                           </div>
                         )}
                       </div>
                     </div>
                   );
                 })}
               </div>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
