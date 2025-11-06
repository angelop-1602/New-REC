import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { uploadFile as uploadToStorage, type UploadProgress } from '@/lib/firebase/storage';
import { zipSingleFile } from '@/lib/utils/zip';
import { enhancedDocumentManagementService } from '@/lib/services/enhancedDocumentManagementService';
import { DocumentCategory } from '@/types/documents.types';

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

  // Upload document to fulfill a request
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

      // Generate storage path - use submissions collection (not submissions_accepted)
      const storagePath = `submissions/${protocolId}/documents/${fileName}`;

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

      // Create document using enhanced service
      const documentId = await enhancedDocumentManagementService.createDocument(
        protocolId,
        {
          title: documentTitle,
          description: documentDescription,
          category,
          uploadedBy: user.uid,
          fileType: file.type,
          storagePath,
          downloadUrl: uploadResult.downloadUrl,
          originalFileName: file.name,
          fileSize: file.size,
          requestId, // This will fulfill the existing request
          isRequired: true, // Assume requested documents are required
        }
      );

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
