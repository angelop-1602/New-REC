"use client";
import CustomFileUpload from "@/components/ui/custom/file-input";
import {
  DocumentRequirement as DocumentRequirementType,
  DocumentsType,
} from "@/types";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AddDocumentDialog } from "./components/add-document-dialog";
import { useSubmissionContext } from "@/contexts/SubmissionContext";
import { setFileReference, removeFileReference } from "@/lib/utils/fileReferenceManager";

const basicRequirements: DocumentRequirementType[] = [
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
    id: "informed_consent",
    title: "Informed Consent Form",
    templateUrl: "/templates/informed-consent.docx",
    required: true,
    description: "Upload the completed informed consent form",
    category: "supplementary",
  },
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

  // Helper function to check if a document exists for a requirement
  const getDocumentForRequirement = (requirementId: string) => {
    return documents.find(doc => {
      // Match by requirement ID or title
      return doc.id.includes(requirementId) || doc.title === requirementId;
    });
  };

  // Helper function to get all documents for a requirement (for multiple files)
  const getDocumentsForRequirement = (requirementId: string) => {
    return documents.filter(doc => {
      return doc.id.includes(requirementId) || doc.title === requirementId;
    });
  };

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
        await removeDocument(existingDoc.id);
        await removeFileReference(existingDoc.id);
      }

      // Create unique document ID
      const documentId = `${requirement.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Store file reference in both memory and IndexedDB (persistent storage)
      await setFileReference(documentId, file);

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
        // Store file reference for upload (will be restored from IndexedDB before submission)
        _fileRef: file as any,
      };

      // Add to submission context (async)
      await addDocument(document);
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
        {basicRequirements.map((requirement) => {
          const existingDoc = getDocumentForRequirement(requirement.id);
          // Disable input if document exists and it's NOT a multiple file requirement
          const isDisabled = existingDoc && !requirement.multiple;
          return (
            <div key={requirement.id} className="relative">
              <CustomFileUpload
                title={requirement.title}
                description={requirement.description}
                templateUrl={requirement.templateUrl}
                multiple={requirement.multiple}
                accept={getAcceptTypes(requirement.id)}
                disabled={isDisabled}
                onChange={(file: File | null) => handleFileUpload(file, requirement)}
              />
              {existingDoc && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700 dark:text-blue-300">
                      ✓ {existingDoc.originalFileName || existingDoc.title}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-blue-700 dark:text-blue-300 hover:text-red-600"
                      onClick={async () => {
                        await removeDocument(existingDoc.id);
                        await removeFileReference(existingDoc.id);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Supplementary Documents with Add Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mt-10 mb-4">
        <h2 className="text-lg font-bold">Supplementary Documents</h2>
        <Button
          onClick={() => setAddDocumentOpen(true)}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Document
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        {supplementaryDocuments.map((requirement) => {
          const existingDocs = getDocumentsForRequirement(requirement.id);
          // Disable input if document exists and it's NOT a multiple file requirement
          const isDisabled = existingDocs.length > 0 && !requirement.multiple;
          return (
            <div key={requirement.id} className="relative">
              <CustomFileUpload
                title={requirement.title}
                description={requirement.description}
                templateUrl={requirement.templateUrl}
                multiple={requirement.multiple}
                accept={getAcceptTypes(requirement.id)}
                disabled={isDisabled}
                onChange={(file: File | null) => handleFileUpload(file, requirement)}
              />
              {existingDocs.length > 0 && (
                <div className="mt-2 space-y-1">
                  {existingDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                        <span className="text-blue-700 dark:text-blue-300 break-words flex-1">
                          ✓ {doc.originalFileName || doc.title}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-blue-700 dark:text-blue-300 hover:text-red-600 self-end sm:self-auto"
                          onClick={async () => {
                            await removeDocument(doc.id);
                            await removeFileReference(doc.id);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

        {/* Custom Document Requirements */}
        {customRequirements.map((requirement) => {
          const existingDoc = getDocumentForRequirement(requirement.id);
          // Disable input if document exists and it's NOT a multiple file requirement
          const isDisabled = existingDoc && !requirement.multiple;
          return (
            <div key={requirement.id} className="relative">
              <CustomFileUpload
                title={requirement.title}
                description={requirement.description}
                templateUrl={requirement.templateUrl}
                multiple={requirement.multiple}
                accept=".pdf"
                disabled={isDisabled}
                onChange={(file: File | null) => handleFileUpload(file, requirement)}
              />
              {existingDoc && (
                <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-blue-700 dark:text-blue-300">
                      ✓ {existingDoc.originalFileName || existingDoc.title}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2 text-blue-700 dark:text-blue-300 hover:text-red-600"
                      onClick={async () => {
                        await removeDocument(existingDoc.id);
                        await removeFileReference(existingDoc.id);
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
