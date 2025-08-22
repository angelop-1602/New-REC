"use client";

import { useState, useCallback } from "react";
import { zipSingleFile, generateDocumentZipName, validateFileForZip } from "@/lib/utils/zip";
import { uploadFile as uploadToStorage, type UploadProgress, type FileUploadResult } from "@/lib/firebase/storage";
import { useAuth } from "@/contexts/AuthContext";

export interface FileUploadState {
  file: File | null;
  isUploading: boolean;
  isZipping: boolean;
  progress: UploadProgress | null;
  uploadResult: FileUploadResult | null;
  error: string | null;
}

export interface UseFileUploadProps {
  documentType: string;
  submissionId?: string;
  onUploadComplete?: (result: FileUploadResult) => void;
  onUploadError?: (error: string) => void;
}

export const useFileUpload = ({
  documentType,
  submissionId,
  onUploadComplete,
  onUploadError
}: UseFileUploadProps) => {
  const { user } = useAuth();
  
  const [uploadState, setUploadState] = useState<FileUploadState>({
    file: null,
    isUploading: false,
    isZipping: false,
    progress: null,
    uploadResult: null,
    error: null,
  });

  // Reset upload state
  const resetUpload = useCallback(() => {
    setUploadState({
      file: null,
      isUploading: false,
      isZipping: false,
      progress: null,
      uploadResult: null,
      error: null,
    });
  }, []);

  // Set file for upload
  const setFile = useCallback((file: File | null) => {
    setUploadState(prev => ({
      ...prev,
      file,
      error: null,
      uploadResult: null,
      progress: null,
    }));
  }, []);

  // Upload file with zipping
  const uploadFile = useCallback(async (): Promise<FileUploadResult | null> => {
    if (!uploadState.file || !user || !submissionId) {
      const error = "Missing file, user authentication, or submission ID";
      setUploadState(prev => ({ ...prev, error }));
      onUploadError?.(error);
      return null;
    }

    // Validate file
    const validation = validateFileForZip(uploadState.file);
    if (!validation.isValid) {
      setUploadState(prev => ({ ...prev, error: validation.error! }));
      onUploadError?.(validation.error!);
      return null;
    }

    try {
      // Start zipping
      setUploadState(prev => ({
        ...prev,
        isZipping: true,
        error: null,
      }));

      // Create zip file
      const zipFileName = generateDocumentZipName(
        documentType,
        user.email || "user",
        new Date()
      );

      const zippedFile = await zipSingleFile(uploadState.file, {
        fileName: zipFileName,
      });

      // Start upload
      setUploadState(prev => ({
        ...prev,
        isZipping: false,
        isUploading: true,
      }));

      // Generate storage path
      const storagePath = `submissions/${submissionId}/${documentType}/${zipFileName}`;

      // Upload to Firebase Storage
      const result = await uploadToStorage(zippedFile, storagePath, {
        onProgress: (progress: UploadProgress) => {
          setUploadState(prev => ({
            ...prev,
            progress,
          }));
        },
        onError: (error: Error) => {
          const errorMessage = error.message;
          setUploadState(prev => ({
            ...prev,
            isUploading: false,
            error: errorMessage,
          }));
          onUploadError?.(errorMessage);
        },
      });

      // Upload completed successfully
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        uploadResult: result,
        progress: { bytesTransferred: result.size, totalBytes: result.size, percentage: 100 },
      }));

      onUploadComplete?.(result);
      return result;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadState(prev => ({
        ...prev,
        isZipping: false,
        isUploading: false,
        error: errorMessage,
      }));
      onUploadError?.(errorMessage);
      return null;
    }
  }, [uploadState.file, user, submissionId, documentType, onUploadComplete, onUploadError]);

  // Check if ready to upload
  const canUpload = uploadState.file && !uploadState.isUploading && !uploadState.isZipping && user && submissionId;

  // Check if upload is in progress
  const isProcessing = uploadState.isUploading || uploadState.isZipping;

  return {
    // State
    ...uploadState,
    canUpload,
    isProcessing,
    
    // Actions
    setFile,
    uploadFile,
    resetUpload,
  };
}; 