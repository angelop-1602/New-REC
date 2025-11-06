"use client";
import CustomFileUpload from "@/components/ui/custom/file-input";
import {
  DocumentRequirement as DocumentRequirementType,
  DocumentsType,
} from "@/types/documents.types";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AddDocumentDialog } from "./components/add-document-dialog";
import { useSubmissionContext } from "@/contexts/SubmissionContext";
import { setFileReference, removeFileReference } from "@/utils/fileReferenceManager";

const basicRequirements: DocumentRequirementType[] = [
  {
    id: "informed_consent",
    title: "Informed Consent Form",
    templateUrl: "/templates/informed-consent.docx",
    required: true,
    description: "Upload the completed informed consent form",
    category: "basic",
  },
  {
    id: "endorsement_letter",
    title: "Endorsement Letter",
    templateUrl: "/templates/advisers-certification.docx",
    required: true,
    description:
      "Upload the signed endorsement letter or adviser's certification",
    category: "basic",
  },
  {
    id: "research_proposal",
    title: "Research Proposal/Study Protocol",
    required: true,
    description:
      "Upload your complete research proposal or study protocol document",
    category: "basic",
  },
  {
    id: "minutes_proposal_defense",
    title: "Minutes of Proposal Defense",
    required: true,
    description: "Upload the official minutes from your proposal defense",
    category: "basic",
  },
  {
    id: "curriculum_vitae",
    title: "Curriculum Vitae of Researchers",
    required: true,
    description: "Upload CVs of all research team members",
    multiple: true,
    category: "basic",
  },
];

const supplementaryDocuments: DocumentRequirementType[] = [
  {
    id: "questionnaire",
    title: "Questionnaire",
    required: false,
    description: "Upload research questionnaires if applicable",
    multiple: true,
    category: "supplementary",
  },
  {
    id: "data_collection_forms",
    title: "Data Collection Forms",
    required: false,
    description: "Upload all data collection forms and instruments",
    multiple: true,
    category: "supplementary",
  },
  {
    id: "technical_review",
    title: "Technical Review Approval (if applicable)",
    required: false,
    description: "Upload technical review approval if your study requires it",
    category: "supplementary",
  },
  {
    id: "abstract",
    title: "Abstract",
    required: true,
    description: "Upload a brief summary of your research (maximum 250 words)",
    category: "supplementary",
  },
  {
    id: "payment_proof",
    title: "Proof of Payment of Ethics Review Fee",
    required: false,
    description: "Upload proof of payment for the ethics review fee (PDF or image format accepted)",
    category: "supplementary",
  },
];



export default function SubmissionDocuments() {
  const [addDocumentOpen, setAddDocumentOpen] = useState(false);
  const [customRequirements, setCustomRequirements] = useState<DocumentRequirementType[]>([]);
  const { addDocument, removeDocument, documents } = useSubmissionContext();

  const handleAddCustomDocument = (requirement: DocumentRequirementType) => {
    setCustomRequirements(prev => [...prev, requirement]);
  };

  // Handle file upload for any document requirement
  const handleFileUpload = async (file: File | null, requirement: DocumentRequirementType) => {
    if (!file) return;

    try {
      // Check if there's already a document for this requirement
      const existingDoc = documents.find(doc => 
        doc.title === requirement.title
      );
      
      // If there's an existing document, remove it and its file reference first
      if (existingDoc) {
        console.log(`🔄 Replacing document "${requirement.title}"`);
        removeDocument(existingDoc.id);
        removeFileReference(existingDoc.id);
      }

      // Create unique document ID
      const documentId = `${requirement.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store file reference in memory (separate from context)
      setFileReference(documentId, file);
      console.log(`📁 File reference stored in memory for "${requirement.title}"`);

      // Create DocumentsType object for the uploaded file
      const document: DocumentsType = {
        id: documentId,
        title: requirement.title,
        description: requirement.description,
        uploadedAt: new Date().toISOString(),
        fileType: file.type,
        storagePath: `documents/${requirement.id}/${file.name}`, // Will be updated with submissionId on upload
        downloadUrl: "", // Will be updated after actual upload
        category: requirement.category,
        status: "pending",
        version: 1,
        custom: requirement.category === "custom",
        originalFileName: file.name,
        // Store the actual file for later upload
        files: [{
          fileName: file.name,
          fileType: file.type,
          size: file.size,
          storagePath: `documents/${requirement.id}/${file.name}`,
          downloadUrl: "",
          uploadedAt: new Date().toISOString(),
        }],
        // Store file reference for upload (will be restored from memory before submission)
        _fileRef: file as any,
      };

      // Add to submission context
      addDocument(document);
      console.log(`✅ Document "${requirement.title}" added to context with file reference in memory`);
    } catch (error) {
      console.error("Error handling file upload:", error);
    }
  };

  const getAcceptTypes = (documentType: string): string => {
    return documentType === "payment_proof" 
      ? ".pdf,.jpg,.jpeg,.png,.gif" 
      : ".pdf";
  };

  return (
    <>
      {/* Basic Requirements */}
      <h2 className="text-lg font-bold">Basic Requirements</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 w-full">
        {basicRequirements.map((requirement) => (
          <CustomFileUpload
            key={requirement.id}
            title={requirement.title}
            description={requirement.description}
            templateUrl={requirement.templateUrl}
            multiple={requirement.multiple}
            accept={getAcceptTypes(requirement.id)}
            onChange={(file: File | null) => handleFileUpload(file, requirement)}
          />
        ))}
      </div>

      {/* Supplementary Documents with Add Button */}
      <div className="flex justify-between items-center mt-10 mb-4">
        <h2 className="text-lg font-bold">Supplementary Documents</h2>
        <Button
          onClick={() => setAddDocumentOpen(true)}
          variant="outline"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {supplementaryDocuments.map((requirement) => (
          <CustomFileUpload
            key={requirement.id}
            title={requirement.title}
            description={requirement.description}
            templateUrl={requirement.templateUrl}
            multiple={requirement.multiple}
            accept={getAcceptTypes(requirement.id)}
            onChange={(file: File | null) => handleFileUpload(file, requirement)}
          />
        ))}

        {/* Custom Document Requirements */}
        {customRequirements.map((requirement) => (
          <CustomFileUpload
            key={requirement.id}
            title={requirement.title}
            description={requirement.description}
            templateUrl={requirement.templateUrl}
            multiple={requirement.multiple}
            accept=".pdf"
            onChange={(file: File | null) => handleFileUpload(file, requirement)}
          />
        ))}
      </div>

      {/* Add Document Dialog */}
      <AddDocumentDialog
        open={addDocumentOpen}
        onOpenChange={setAddDocumentOpen}
        onAdd={handleAddCustomDocument}
      />
    </>
  );
}
