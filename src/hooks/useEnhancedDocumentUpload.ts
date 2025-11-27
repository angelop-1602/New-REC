import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile as uploadToStorage, type UploadProgress } from '@/lib/firebase/storage';
import { zipSingleFile } from '@/lib/utils/zip';
import { enhancedDocumentManagementService } from '@/lib/services/documents/enhancedDocumentManagementService';
import { DocumentCategory } from '@/types';

export interface EnhancedDocumentUploadState {
  isUploading: boolean;
  progress: UploadProgress;
  error: string | null;
  uploadedDocumentId: string | null;
}

export interface UseEnhancedDocumentUploadProps {
  protocolId: string;
  onUploadComplete?: (documentId: string) => void;
  onUploadError?: (error: string) => void;
}

/**
 * Hook for uploading documents to fulfill document requests using the enhanced service
 */
export const useEnhancedDocumentUpload = ({
  protocolId,
  onUploadComplete,
  onUploadError,
}: UseEnhancedDocumentUploadProps) => {
  const { user } = useAuth();

  const [uploadState, setUploadState] = useState<EnhancedDocumentUploadState>({
    isUploading: false,
    progress: { bytesTransferred: 0, totalBytes: 0, percentage: 0 },
    error: null,
    uploadedDocumentId: null,
  });

  // Generate filename from document title
  const generateFileName = useCallback((title: string, fileIndex?: number): string => {
    // Sanitize title for filename
    const sanitizedTitle = title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .trim();

    // Add numbering for multiple files
    const suffix = fileIndex !== undefined ? `_${fileIndex + 1}` : '';
    return `${sanitizedTitle}${suffix}.zip`;
  }, []);

  // Upload document to fulfill a request or add a new version
  const uploadDocumentToRequest = useCallback(async (
    file: File,
    documentTitle: string,
    documentDescription: string,
    category: DocumentCategory,
    requestId?: string
  ): Promise<string> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      error: null,
      uploadedDocumentId: null,
    }));

    try {
      const fileName = generateFileName(documentTitle);
      
      // Zip the file
      const zippedFile = await zipSingleFile(file, { fileName });

      // Check if this is a revision (requestId is an existing document ID)
      let storagePath: string;
      let documentId: string;
      let isRevision = false;
      let newVersionNumber = 1;

      if (requestId) {
        // This might be a revision - check if document exists
        try {
          const existingDoc = await enhancedDocumentManagementService.getDocument(protocolId, requestId);
          if (existingDoc && existingDoc.currentVersion > 0) {
            // This is a revision - use versioned path
            isRevision = true;
            documentId = requestId;
            newVersionNumber = existingDoc.currentVersion + 1;
            // Use versioned storage path: documents/{documentId}/v{version}/{fileName}
            storagePath = `submissions/${protocolId}/documents/${documentId}/v${newVersionNumber}/${fileName}`;
          } else {
            // New document fulfilling a request (status is "requested" but no version yet)
            documentId = requestId;
            // Use versioned path for initial upload: documents/{documentId}/v1/{fileName}
            storagePath = `submissions/${protocolId}/documents/${documentId}/v1/${fileName}`;
            newVersionNumber = 1;
          }
        } catch {
          // Document doesn't exist, treat as new document
          documentId = requestId;
          storagePath = `submissions/${protocolId}/documents/${documentId}/v1/${fileName}`;
          newVersionNumber = 1;
        }
      } else {
        // New document - generate ID first for versioned path
        const sanitizedTitle = documentTitle
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '_')
          .trim();
        documentId = `${sanitizedTitle}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        // Use versioned path from the start: documents/{documentId}/v1/{fileName}
        storagePath = `submissions/${protocolId}/documents/${documentId}/v1/${fileName}`;
        newVersionNumber = 1;
      }

      // Upload to Firebase Storage
      const uploadResult = await uploadToStorage(zippedFile, storagePath, {
        onProgress: (progress: UploadProgress) => {
          setUploadState(prev => ({
            ...prev,
            progress,
          }));
        },
        onError: (error: Error) => {
          throw error;
        },
      });

      if (isRevision) {
        // Add new version to existing document
        await enhancedDocumentManagementService.addDocumentVersion(
          protocolId,
          documentId,
          {
            uploadedBy: user.uid,
            fileType: file.type,
            storagePath: uploadResult.storagePath,
            downloadUrl: uploadResult.downloadUrl,
            originalFileName: file.name,
            fileSize: file.size,
          }
        );
      } else {
        // Create new document or fulfill request
        // documentId and storagePath are already set above with versioned path
        const createdDocumentId = await enhancedDocumentManagementService.createDocument(
          protocolId,
          {
            title: documentTitle,
            description: documentDescription,
            category,
            uploadedBy: user.uid,
            fileType: file.type,
            storagePath: uploadResult.storagePath, // Already uses versioned path: documents/{documentId}/v1/{fileName}
            downloadUrl: uploadResult.downloadUrl,
            originalFileName: file.name,
            fileSize: file.size,
            requestId: requestId || documentId, // Pass documentId if it's a new document (will be used as requestId for fulfillment)
            isRequired: true, // Assume requested documents are required
          }
        );
        documentId = createdDocumentId;
      }

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadedDocumentId: documentId,
      }));

      onUploadComplete?.(documentId);
      return documentId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: errorMessage,
      }));
      
      onUploadError?.(errorMessage);
      throw error;
    }
  }, [user, protocolId, generateFileName, onUploadComplete, onUploadError]);

  // Validate file before upload
  const validateFile = useCallback((file: File): { isValid: boolean; error?: string } => {
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 50MB' };
    }

    // Check file type - allow PDF and common image formats
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { 
        isValid: false, 
        error: 'Only PDF, Word documents, or image files (JPG, PNG, GIF) are allowed' 
      };
    }

    return { isValid: true };
  }, []);

  // Reset upload state
  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: { bytesTransferred: 0, totalBytes: 0, percentage: 0 },
      error: null,
      uploadedDocumentId: null,
    });
  }, []);

  return {
    ...uploadState,
    uploadDocumentToRequest,
    validateFile,
    resetUploadState,
  };
};
