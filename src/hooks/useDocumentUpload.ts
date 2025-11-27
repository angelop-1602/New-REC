import { useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmissionContext } from '@/contexts/SubmissionContext';
import { useDocumentIdGenerator } from './useDocumentIdGenerator';
import { uploadFile as uploadToStorage, type UploadProgress } from '@/lib/firebase/storage';
import { generateDocumentStoragePath } from '@/lib/firebase/storage';
import { zipSingleFile } from '@/lib/utils/zip';
import { DocumentsType } from '@/types';

export interface DocumentUploadState {
  isUploading: boolean;
  progress: UploadProgress;
  error: string | null;
  uploadedFiles: DocumentsType[];
}

export interface UseDocumentUploadProps {
  submissionId?: string;
  onUploadComplete?: (documents: DocumentsType[]) => void;
  onUploadError?: (error: string) => void;
}

/**
 * Hook for uploading documents with proper naming and multiple file support
 */
export const useDocumentUpload = ({
  submissionId,
  onUploadComplete,
  onUploadError,
}: UseDocumentUploadProps = {}) => {
  const { user } = useAuth();
  const { addDocument } = useSubmissionContext();
  const { generateDocumentId } = useDocumentIdGenerator();

  const [uploadState, setUploadState] = useState<DocumentUploadState>({
    isUploading: false,
    progress: { bytesTransferred: 0, totalBytes: 0, percentage: 0 },
    error: null,
    uploadedFiles: [],
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

  // Upload single file
  const uploadSingleFile = useCallback(async (
    file: File,
    documentTitle: string,
    documentType: string,
    fileIndex?: number
  ): Promise<DocumentsType> => {
    const documentId = generateDocumentId();
    const fileName = generateFileName(documentTitle, fileIndex);

    // Zip the file
    const zippedFile = await zipSingleFile(file, { fileName });

    // Generate storage path (use temp path if no submissionId)
    const storagePath = submissionId 
      ? generateDocumentStoragePath(submissionId, fileName)
      : `temp/${user!.uid}/documents/${fileName}`;

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

    // Create document metadata
    const document: DocumentsType = {
      id: documentId,
      title: documentTitle,
      description: `Uploaded file: ${file.name}`,
      uploadedAt: new Date().toISOString(),
      fileType: file.type,
      storagePath,
      downloadUrl: uploadResult.downloadUrl,
      category: documentType as any,
      status: 'pending',
      version: 1,
      files: [{
        fileName: file.name,
        fileType: file.type,
        size: file.size,
        storagePath,
        downloadUrl: uploadResult.downloadUrl,
        uploadedAt: new Date().toISOString(),
      }],
    };

    return document;
  }, [generateDocumentId, generateFileName, submissionId]);

  // Upload multiple files for a single document type
  const uploadMultipleFiles = useCallback(async (
    files: File[],
    documentTitle: string,
    documentType: string
  ): Promise<DocumentsType[]> => {
    if (!user) {
      throw new Error('Missing user authentication');
    }

    setUploadState(prev => ({
      ...prev,
      isUploading: true,
      error: null,
      uploadedFiles: [],
    }));

    try {
      const uploadedDocuments: DocumentsType[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const document = await uploadSingleFile(
          file,
          documentTitle,
          documentType,
          files.length > 1 ? i : undefined // Only add index if multiple files
        );
        
        uploadedDocuments.push(document);
        
        // Add to submission context
        addDocument(document);
      }

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadedFiles: uploadedDocuments,
      }));

      onUploadComplete?.(uploadedDocuments);
      return uploadedDocuments;

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
  }, [user, submissionId, uploadSingleFile, addDocument, onUploadComplete, onUploadError]);

  // Upload single document (convenience method)
  const uploadDocument = useCallback(async (
    file: File,
    documentTitle: string,
    documentType: string
  ): Promise<DocumentsType> => {
    const results = await uploadMultipleFiles([file], documentTitle, documentType);
    return results[0];
  }, [uploadMultipleFiles]);

  // Validate file before upload
  const validateFile = useCallback((file: File, documentType: string): { isValid: boolean; error?: string } => {
    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return { isValid: false, error: 'File size must be less than 50MB' };
    }

    // Check file type
    const isPaymentDoc = documentType === 'payment_proof';
    const allowedTypes = isPaymentDoc 
      ? ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif']
      : ['application/pdf'];

    if (!allowedTypes.includes(file.type)) {
      const allowedTypesText = isPaymentDoc 
        ? 'PDF or image files (JPG, PNG, GIF)'
        : 'PDF files';
      return { isValid: false, error: `Only ${allowedTypesText} are allowed` };
    }

    return { isValid: true };
  }, []);

  // Reset upload state
  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: { bytesTransferred: 0, totalBytes: 0, percentage: 0 },
      error: null,
      uploadedFiles: [],
    });
  }, []);

  return {
    ...uploadState,
    uploadDocument,
    uploadMultipleFiles,
    validateFile,
    resetUploadState,
  };
}; 