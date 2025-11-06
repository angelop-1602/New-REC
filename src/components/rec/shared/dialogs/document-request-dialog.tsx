"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";
import { enhancedDocumentManagementService } from "@/lib/services/enhancedDocumentManagementService";
import { DocumentsType, DocumentCategory } from "@/types/documents.types";
import { toast } from "sonner";

interface DocumentRequestDialogProps {
  protocolId: string;
  trigger?: React.ReactNode;
  onRequestCreated?: () => void;
  existingDocuments?: DocumentsType[];
}

// Required documents from protocol review application
const REQUIRED_DOCUMENTS = [
  // Basic Required Documents
  {
    id: "informed_consent",
    title: "Informed Consent Form",
    description: "Upload the completed informed consent form",
    category: "basic",
    templateUrl: "/templates/informed-consent.docx"
  },
  {
    id: "endorsement_letter",
    title: "Endorsement Letter",
    description: "Upload the signed endorsement letter or adviser's certification",
    category: "basic",
    templateUrl: "/templates/advisers-certification.docx"
  },
  {
    id: "research_proposal",
    title: "Research Proposal/Study Protocol",
    description: "Upload your complete research proposal or study protocol document",
    category: "basic"
  },
  {
    id: "minutes_proposal_defense",
    title: "Minutes of Proposal Defense",
    description: "Upload the official minutes from your proposal defense",
    category: "basic"
  },
  {
    id: "curriculum_vitae",
    title: "Curriculum Vitae of Researchers",
    description: "Upload CVs of all research team members",
    category: "basic",
    multiple: true
  },
  // Supplementary Documents
  {
    id: "abstract",
    title: "Abstract",
    description: "Upload a brief summary of your research (maximum 250 words)",
    category: "supplementary"
  },
  {
    id: "questionnaire",
    title: "Questionnaire",
    description: "Upload research questionnaires if applicable",
    category: "supplementary",
    multiple: true
  },
  {
    id: "data_collection_forms",
    title: "Data Collection Forms",
    description: "Upload all data collection forms and instruments",
    category: "supplementary",
    multiple: true
  },
  {
    id: "technical_review",
    title: "Technical Review Approval (if applicable)",
    description: "Upload technical review approval if your study requires it",
    category: "supplementary"
  },
  {
    id: "payment_proof",
    title: "Proof of Payment of Ethics Review Fee",
    description: "Upload proof of payment for the ethics review fee (PDF or image format accepted)",
    category: "supplementary"
  }
];

// Document templates for new document requests
const NEW_DOCUMENT_TEMPLATES = [
  {
    id: "updated_irb_approval",
    title: "Updated IRB Approval",
    description: "Updated Institutional Review Board approval letter",
    category: "regulatory"
  },
  {
    id: "site_authorization",
    title: "Site Authorization Letter",
    description: "Official authorization letter from study site",
    category: "regulatory"
  },
  {
    id: "data_sharing_agreement",
    title: "Data Sharing Agreement",
    description: "Agreement for data sharing and collaboration",
    category: "legal"
  },
  {
    id: "conflict_of_interest",
    title: "Conflict of Interest Declaration",
    description: "Declaration of any potential conflicts of interest",
    category: "ethical"
  },
  {
    id: "funding_documentation",
    title: "Funding Documentation",
    description: "Documentation of research funding sources",
    category: "financial"
  },
  {
    id: "collaboration_agreement",
    title: "Collaboration Agreement",
    description: "Agreement with collaborating institutions",
    category: "legal"
  },
  {
    id: "safety_monitoring",
    title: "Safety Monitoring Plan",
    description: "Plan for monitoring participant safety",
    category: "safety"
  },
  {
    id: "data_management",
    title: "Data Management Plan",
    description: "Comprehensive data management and storage plan",
    category: "technical"
  }
];

export default function DocumentRequestDialog({
  protocolId,
  trigger,
  onRequestCreated,
  existingDocuments = []
}: DocumentRequestDialogProps) {
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("initial");
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedRequiredDocs, setSelectedRequiredDocs] = useState<string[]>([]);

  // Helper function to get missing required documents
  const getMissingRequiredDocuments = () => {
    // Compare by document title (case-insensitive and trimmed)
    const submittedDocTitles = existingDocuments.map(doc => 
      doc.title.toLowerCase().trim()
    );
    
    return REQUIRED_DOCUMENTS.filter(reqDoc => 
      !submittedDocTitles.includes(reqDoc.title.toLowerCase().trim())
    );
  };

  // Handle required document selection
  const handleRequiredDocToggle = (docId: string) => {
    setSelectedRequiredDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  // Handle template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = NEW_DOCUMENT_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplate(templateId);
      setTitle(template.title);
      setDescription(template.description);
    }
  };

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setTitle('');
      setDescription('');
      setSelectedTemplate(null);
      setSelectedRequiredDocs([]);
      setActiveTab("initial");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (activeTab === "initial") {
      if (selectedRequiredDocs.length === 0) {
        toast.error('Please select at least one document to request');
        return;
      }
    } else {
      if (!title.trim() || !description.trim()) {
        toast.error('Please fill in all required fields');
        return;
      }
    }

    setIsSubmitting(true);
    
    try {
      if (activeTab === "initial") {
        // Create requests for each selected required document using enhanced service
        const requests = selectedRequiredDocs.map(docId => {
          const doc = REQUIRED_DOCUMENTS.find(d => d.id === docId);
          return enhancedDocumentManagementService.createDocumentRequest(
            protocolId,
            doc?.title || 'Required Document',
            doc?.description || 'Please provide this required document',
            'current-chairperson-id', // TODO: Get actual chairperson ID from auth context
            doc?.category as DocumentCategory || 'basic',
            true, // isRequired
            false, // urgent - removed
            undefined, // dueDate - removed
            doc?.multiple || false, // Ensure boolean value
            doc?.templateUrl || undefined
          );
        });
        
        await Promise.all(requests);
        toast.success(`${selectedRequiredDocs.length} document request(s) created successfully`);
      } else {
        // Single new document request using enhanced service
        await enhancedDocumentManagementService.createDocumentRequest(
          protocolId,
          title.trim(),
          description.trim(),
          'current-chairperson-id', // TODO: Get actual chairperson ID from auth context
          'custom', // category for new documents
          false, // isRequired
          false, // urgent - removed
          undefined, // dueDate - removed
          false, // multiple - default to false for custom requests
          undefined // templateUrl - no template for custom requests
        );
        toast.success('Document request created successfully');
      }
      
      onRequestCreated?.();
      setOpen(false);
    } catch (error) {
      console.error('Error creating document request:', error);
      toast.error('Failed to create document request');
    } finally {
      setIsSubmitting(false);
    }
  };

  const missingRequiredDocs = getMissingRequiredDocuments();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Request Document
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Request Additional Document
          </DialogTitle>
          <DialogDescription>
            Request specific documents from the proponent. Choose from missing required documents or request new ones.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="initial" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Missing Required Documents
            </TabsTrigger>
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Documents
            </TabsTrigger>
          </TabsList>

          {/* Initial Documents Tab */}
          <TabsContent value="initial" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Select missing required documents from the protocol review application:
              </h4>
              
              {missingRequiredDocs.length > 0 ? (
                <div className="space-y-2 max-h-100 overflow-y-auto border rounded-md p-3">
                  {missingRequiredDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className={`flex items-center justify-between p-3 border rounded cursor-pointer transition-colors ${
                        selectedRequiredDocs.includes(doc.id) 
                          ? 'bg-primary/10 border-primary' 
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleRequiredDocToggle(doc.id)}
                    >
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedRequiredDocs.includes(doc.id)}
                          onChange={() => handleRequiredDocToggle(doc.id)}
                          className="pointer-events-none"
                        />
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium">{doc.title}</p>
                            <p className="text-xs text-muted-foreground">{doc.description}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {doc.multiple && (
                                <span className="text-xs text-orange-600">Multiple files allowed</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="text-sm">All required documents have been submitted</p>
                  <p className="text-xs mt-1">No missing documents to request</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* New Documents Tab */}
          <TabsContent value="new" className="space-y-4 mt-4">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-muted-foreground">
                Choose from common document templates or create a custom request:
              </h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-md p-3">
                {NEW_DOCUMENT_TEMPLATES.map((template) => (
                  <div
                    key={template.id}
                    className={`p-2 border rounded hover:bg-muted/50 cursor-pointer transition-colors ${
                      selectedTemplate === template.id ? 'bg-primary/10 border-primary' : ''
                    }`}
                    onClick={() => handleTemplateSelect(template.id)}
                  >
                    <div className="flex items-start gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{template.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {template.description}
                        </p>
                        <span className="text-xs text-blue-600 capitalize">
                          {template.category}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Request Form - Only show for New Documents tab */}
        {activeTab === "new" && (
          <div className="space-y-4 pt-4 border-t">
            {/* Document Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium">
                Document Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Updated IRB Approval, Site Authorization Letter"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/100 characters
              </p>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                placeholder="Please describe what document is needed and why it's required for the review process..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/500 characters
              </p>
            </div>
          </div>
        )}


        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting || 
              (activeTab === "initial" && selectedRequiredDocs.length === 0) ||
              (activeTab === "new" && (!title.trim() || !description.trim()))
            }
          >
            {isSubmitting 
              ? 'Creating...' 
              : activeTab === "initial" 
                ? `Request ${selectedRequiredDocs.length} Document${selectedRequiredDocs.length !== 1 ? 's' : ''}`
                : 'Create Request'
            }
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
