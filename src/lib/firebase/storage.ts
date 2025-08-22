import { 
  getStorage, 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll,
  getMetadata,
  UploadTaskSnapshot
} from "firebase/storage";
import firebaseApp from "@/lib/firebaseConfig";

const storage = getStorage(firebaseApp);

// Upload progress interface
export interface UploadProgress {
  bytesTransferred: number;
  totalBytes: number;
  percentage: number;
}

// File upload result interface
export interface FileUploadResult {
  downloadUrl: string;
  storagePath: string;
  fileName: string;
  fileType: string;
  size: number;
  uploadedAt: string;
}

// Upload callbacks interface
export interface UploadCallbacks {
  onProgress?: (progress: UploadProgress) => void;
  onError?: (error: Error) => void;
  onComplete?: (result: FileUploadResult) => void;
}

// Upload file to Firebase Storage
export const uploadFile = async (
  file: File,
  storagePath: string,
  callbacks?: UploadCallbacks
): Promise<FileUploadResult> => {
  return new Promise((resolve, reject) => {
    try {
      // Create storage reference
      const storageRef = ref(storage, storagePath);
      
      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Listen for state changes, errors, and completion
      uploadTask.on(
        'state_changed',
        (snapshot: UploadTaskSnapshot) => {
          // Calculate progress
          const progress: UploadProgress = {
            bytesTransferred: snapshot.bytesTransferred,
            totalBytes: snapshot.totalBytes,
            percentage: Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100)
          };
          
          // Call progress callback
          callbacks?.onProgress?.(progress);
        },
        (error) => {
          // Handle error
          console.error("Upload error:", error);
          const uploadError = new Error(`Upload failed: ${error.message}`);
          callbacks?.onError?.(uploadError);
          reject(uploadError);
        },
        async () => {
          try {
            // Upload completed successfully
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            
            const result: FileUploadResult = {
              downloadUrl,
              storagePath,
              fileName: file.name,
              fileType: file.type,
              size: file.size,
              uploadedAt: new Date().toISOString()
            };
            
            callbacks?.onComplete?.(result);
            resolve(result);
          } catch (error) {
            const downloadError = new Error(`Failed to get download URL: ${error}`);
            callbacks?.onError?.(downloadError);
            reject(downloadError);
          }
        }
      );
    } catch (error) {
      const initError = new Error(`Failed to initialize upload: ${error}`);
      callbacks?.onError?.(initError);
      reject(initError);
    }
  });
};

// Upload multiple files
export const uploadMultipleFiles = async (
  files: File[],
  getStoragePath: (file: File, index: number) => string,
  callbacks?: {
    onFileProgress?: (fileIndex: number, progress: UploadProgress) => void;
    onFileComplete?: (fileIndex: number, result: FileUploadResult) => void;
    onFileError?: (fileIndex: number, error: Error) => void;
    onAllComplete?: (results: FileUploadResult[]) => void;
    onAllError?: (errors: Error[]) => void;
  }
): Promise<FileUploadResult[]> => {
  const uploadPromises = files.map((file, index) => {
    const storagePath = getStoragePath(file, index);
    
    return uploadFile(file, storagePath, {
      onProgress: (progress) => callbacks?.onFileProgress?.(index, progress),
      onComplete: (result) => callbacks?.onFileComplete?.(index, result),
      onError: (error) => callbacks?.onFileError?.(index, error)
    });
  });

  try {
    const results = await Promise.all(uploadPromises);
    callbacks?.onAllComplete?.(results);
    return results;
  } catch (error) {
    const errors = Array.isArray(error) ? error : [error as Error];
    callbacks?.onAllError?.(errors);
    throw error;
  }
};

// Delete file from Firebase Storage
export const deleteFile = async (storagePath: string): Promise<void> => {
  try {
    const storageRef = ref(storage, storagePath);
    await deleteObject(storageRef);
  } catch (error) {
    console.error("Delete error:", error);
    throw new Error(`Failed to delete file: ${error}`);
  }
};

// Delete multiple files
export const deleteMultipleFiles = async (storagePaths: string[]): Promise<void> => {
  try {
    const deletePromises = storagePaths.map(path => deleteFile(path));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error("Multiple delete error:", error);
    throw new Error(`Failed to delete files: ${error}`);
  }
};

// Get file metadata
export const getFileMetadata = async (storagePath: string) => {
  try {
    const storageRef = ref(storage, storagePath);
    const metadata = await getMetadata(storageRef);
    return metadata;
  } catch (error) {
    console.error("Get metadata error:", error);
    throw new Error(`Failed to get file metadata: ${error}`);
  }
};

// List files in a directory
export const listFiles = async (directoryPath: string): Promise<{
  files: string[];
  directories: string[];
}> => {
  try {
    const storageRef = ref(storage, directoryPath);
    const result = await listAll(storageRef);
    
    const files = result.items.map(item => item.fullPath);
    const directories = result.prefixes.map(prefix => prefix.fullPath);
    
    return { files, directories };
  } catch (error) {
    console.error("List files error:", error);
    throw new Error(`Failed to list files: ${error}`);
  }
};

// Generate storage path for submission documents
// New structure: submissions/{submissionId}/documents/{fileName}
export const generateDocumentStoragePath = (
  submissionId: string,
  fileName: string
): string => {
  return `submissions/${submissionId}/documents/${fileName}`;
};

// Generate storage path for user files
export const generateUserStoragePath = (
  userId: string,
  fileType: string,
  fileName: string
): string => {
  return `users/${userId}/${fileType}/${fileName}`;
};

// Get download URL for a file
export const getFileDownloadURL = async (storagePath: string): Promise<string> => {
  try {
    const storageRef = ref(storage, storagePath);
    const downloadUrl = await getDownloadURL(storageRef);
    return downloadUrl;
  } catch (error) {
    console.error("Get download URL error:", error);
    throw new Error(`Failed to get download URL: ${error}`);
  }
};

// Check if file exists
export const fileExists = async (storagePath: string): Promise<boolean> => {
  try {
    const storageRef = ref(storage, storagePath);
    await getMetadata(storageRef);
    return true;
  } catch (error) {
    return false;
  }
};

// Upload file with retry logic
export const uploadFileWithRetry = async (
  file: File,
  storagePath: string,
  callbacks?: UploadCallbacks,
  maxRetries: number = 3
): Promise<FileUploadResult> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFile(file, storagePath, callbacks);
    } catch (error) {
      lastError = error as Error;
      console.warn(`Upload attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retry (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }
  
  throw lastError;
};

// Validate file before upload
export const validateFileForUpload = (file: File): {
  isValid: boolean;
  error?: string;
} => {
  // Check file size (50MB limit)
  const maxSize = 50 * 1024 * 1024; // 50MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File size must be less than 50MB"
    };
  }
  
  // Check file type (common document types)
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/csv',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-zip-compressed'
  ];
  
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "File type not supported. Please upload PDF, Word, Excel, PowerPoint, text, image, or ZIP files."
    };
  }
  
  return { isValid: true };
}; 