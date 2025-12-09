"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  FileText as FileTextIcon, 
  Eye, 
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
import { generateDecisionDocuments } from "@/lib/services/documents/documentGenerator";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import { InlineLoading, LoadingSkeleton } from "@/components/ui/loading";
import { 
  ChairpersonProtocol, 
  toChairpersonProtocol,
  getProtocolTitle,
  getProtocolCode,
  getPIName
} from '@/types';

const db = getFirestore(firebaseApp);


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

  const [submission, setSubmission] = useState<ChairpersonProtocol | null>(null);
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
          const rawData = {
            id: submissionSnap.id,
            ...submissionSnap.data()
          };
          const typedProtocol = toChairpersonProtocol(rawData);
          setSubmission(typedProtocol);
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
    const protocolTitle = getProtocolTitle(submission);
    const spupCode = getProtocolCode(submission) || 'TBD';
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
      { key: "PRINCIPAL_INVESTIGATOR", label: "Principal Investigator", value: editedData.PRINCIPAL_INVESTIGATOR || getPIName(submission) || "N/A", icon: User, editable: true },
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
    setEditedData((prev: any) => ({ ...prev, [fieldKey]: currentValue })); // eslint-disable-line @typescript-eslint/no-explicit-any
  };

  const handleSaveField = (fieldKey: string) => {
    setEditingField(null);
    toast.success(`${fieldKey} updated successfully`);
  };

  const handleCancelEdit = (fieldKey: string) => {
    setEditingField(null);
    setEditedData((prev: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const newData = { ...prev };
      delete newData[fieldKey];
      return newData;
    });
  };

  const handleFieldChange = (fieldKey: string, value: string) => {
    setEditedData((prev: any) => ({ ...prev, [fieldKey]: value })); // eslint-disable-line @typescript-eslint/no-explicit-any
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
      
      if (!submission) {
        toast.error("Protocol data not available");
        return;
      }

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
      <div className="container mx-auto p-4 md:p-6 max-w-7xl animate-in fade-in duration-500">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20 pt-6">
                <LoadingSkeleton className="h-5 w-40 rounded-md mb-2" />
                <LoadingSkeleton className="h-4 w-56 rounded-md" />
              </CardHeader>
              <CardContent className="space-y-3 p-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <LoadingSkeleton className="h-4 w-4 rounded-sm" />
                    <LoadingSkeleton className="h-4 w-40 rounded-md" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <LoadingSkeleton className="h-6 w-48 rounded-md" />
            <LoadingSkeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex items-center justify-center min-h-screen animate-in fade-in duration-500">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2 bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Protocol Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested protocol could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-7xl animate-in fade-in duration-500">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Templates */}
        <div className="lg:col-span-1">
          {/* Template Selection */}
          <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-left-4 duration-500 delay-150 overflow-hidden p-0">
            <CardHeader className="bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20 rounded-t-lg pt-6">
              <CardTitle className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Document Templates</CardTitle>
              <CardDescription>
                Select which documents to generate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4">
              <div className="space-y-3">
                {templateLabels.map((label, index) => (
                  <div 
                    key={label} 
                    className="flex items-center space-x-3 p-2 rounded-lg hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-all duration-200 animate-in fade-in slide-in-from-left-2"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <Checkbox 
                      id={label}
                      checked={selectedTemplates.includes(label)} 
                      onCheckedChange={() => toggleTemplate(label)}
                      className="border-[#036635]/20 dark:border-[#FECC07]/30 data-[state=checked]:bg-[#036635] data-[state=checked]:border-[#036635] dark:data-[state=checked]:bg-[#FECC07] dark:data-[state=checked]:border-[#FECC07]"
                    />
                    <Label htmlFor={label} className="text-sm font-normal cursor-pointer">
                      {label}
                    </Label>
                  </div>
                ))}
              </div>
              
              {/* Action Buttons */}
              <div className="pt-4 border-t border-[#036635]/10 dark:border-[#FECC07]/20 flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => router.back()}
                  disabled={isGenerating}
                  className="flex-1 border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 hover:border-[#036635] dark:hover:border-[#FECC07] transition-all duration-300"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating || selectedTemplates.length === 0}
                  className="flex-1 bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black transition-all duration-300 hover:scale-105"
                >
                  {isGenerating ? (
                    <>
                      <InlineLoading size="sm" text="Generating..." />
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
          <Card className="border-[#036635]/10 dark:border-[#FECC07]/20 transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-right-4 duration-500 delay-300 overflow-hidden p-0">
            <CardHeader className="bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10 border-b border-[#036635]/10 dark:border-[#FECC07]/20 rounded-t-lg pt-6 pb-6">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-[#036635] dark:text-[#FECC07]" />
                <span className="bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">Replacement Preview</span>
              </CardTitle>
              <CardDescription>
                Preview the data that will be used to populate the generated documents
              </CardDescription>
            </CardHeader>
                         <CardContent className="p-6">
               <div className="grid md:grid-cols-2 gap-4">
                 {replacementPreview.map((item, index) => {
                   const IconComponent = item.icon;
                   const isEditing = editingField === item.key;
                   
                   return (
                     <div 
                       key={index} 
                       className="flex items-start gap-3 p-3 border border-[#036635]/10 dark:border-[#FECC07]/20 rounded-lg hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
                       style={{ animationDelay: `${index * 30}ms` }}
                     >
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
                               className="text-sm h-8 flex-1 border-[#036635]/20 dark:border-[#FECC07]/30 focus:border-[#036635] dark:focus:border-[#FECC07] focus:ring-[#036635]/20 dark:focus:ring-[#FECC07]/20 transition-all duration-300"
                               placeholder={`Enter ${item.label}`}
                             />
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleSaveField(item.key)}
                               className="h-8 w-8 p-0 border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 hover:border-[#036635] dark:hover:border-[#FECC07] transition-all duration-300"
                             >
                               <Save className="h-3 w-3 text-[#036635] dark:text-[#FECC07]" />
                             </Button>
                             <Button
                               size="sm"
                               variant="outline"
                               onClick={() => handleCancelEdit(item.key)}
                               className="h-8 w-8 p-0 border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 hover:border-[#036635] dark:hover:border-[#FECC07] transition-all duration-300"
                             >
                               <X className="h-3 w-3 text-[#036635] dark:text-[#FECC07]" />
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
                                 className="h-8 w-8 p-0 border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 hover:border-[#036635] dark:hover:border-[#FECC07] transition-all duration-300"
                               >
                                 <Edit className="h-3 w-3 text-[#036635] dark:text-[#FECC07]" />
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
