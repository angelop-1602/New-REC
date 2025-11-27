import JSZip from 'jszip';

// Zip options interface
export interface ZipOptions {
  fileName?: string;
  compression?: 'STORE' | 'DEFLATE';
  compressionLevel?: number;
}

// Zip validation result
export interface ZipValidationResult {
  isValid: boolean;
  error?: string;
}

// Default zip options
const defaultZipOptions: ZipOptions = {
  compression: 'DEFLATE',
  compressionLevel: 6
};

// Zip a single file
export const zipSingleFile = async (
  file: File,
  options: ZipOptions = {}
): Promise<File> => {
  try {
    const zip = new JSZip();
    const opts = { ...defaultZipOptions, ...options };
    
    // Add file to zip
    zip.file(file.name, file, {
      compression: opts.compression,
      compressionOptions: {
        level: opts.compressionLevel || 6
      }
    });
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: opts.compression,
      compressionOptions: {
        level: opts.compressionLevel || 6
      }
    });
    
    // Create file from blob
    const zipFileName = opts.fileName || `${getFileNameWithoutExtension(file.name)}.zip`;
    const zipFile = new File([zipBlob], zipFileName, {
      type: 'application/zip',
      lastModified: Date.now()
    });
    
    return zipFile;
  } catch (error) {
    console.error('Error zipping file:', error);
    throw new Error(`Failed to zip file: ${error}`);
  }
};

// Zip multiple files
export const zipMultipleFiles = async (
  files: File[],
  options: ZipOptions = {}
): Promise<File> => {
  try {
    const zip = new JSZip();
    const opts = { ...defaultZipOptions, ...options };
    
    // Add all files to zip
    for (const file of files) {
      zip.file(file.name, file, {
        compression: opts.compression,
        compressionOptions: {
          level: opts.compressionLevel || 6
        }
      });
    }
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: opts.compression,
      compressionOptions: {
        level: opts.compressionLevel || 6
      }
    });
    
    // Create file from blob
    const zipFileName = opts.fileName || `documents_${Date.now()}.zip`;
    const zipFile = new File([zipBlob], zipFileName, {
      type: 'application/zip',
      lastModified: Date.now()
    });
    
    return zipFile;
  } catch (error) {
    console.error('Error zipping files:', error);
    throw new Error(`Failed to zip files: ${error}`);
  }
};

// Zip files by category
export const zipFilesByCategory = async (
  filesByCategory: { [category: string]: File[] },
  options: ZipOptions = {}
): Promise<File> => {
  try {
    const zip = new JSZip();
    const opts = { ...defaultZipOptions, ...options };
    
    // Create folders for each category
    for (const [category, files] of Object.entries(filesByCategory)) {
      const categoryFolder = zip.folder(category);
      
      if (categoryFolder) {
        for (const file of files) {
          categoryFolder.file(file.name, file, {
            compression: opts.compression,
            compressionOptions: {
              level: opts.compressionLevel ?? 6
            }
          });
        }
      }
    }
    
    // Generate zip file
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: opts.compression,
      compressionOptions: {
        level: opts.compressionLevel ?? 6
      }
    });
    
    // Create file from blob
    const zipFileName = opts.fileName || `submission_documents_${Date.now()}.zip`;
    const zipFile = new File([zipBlob], zipFileName, {
      type: 'application/zip',
      lastModified: Date.now()
    });
    
    return zipFile;
  } catch (error) {
    console.error('Error zipping files by category:', error);
    throw new Error(`Failed to zip files by category: ${error}`);
  }
};

// Extract files from zip
export const extractFilesFromZip = async (
  zipFile: File
): Promise<File[]> => {
  try {
    const zip = await JSZip.loadAsync(zipFile);
    const files: File[] = [];
    
    // Extract all files
    for (const [fileName, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        const content = await zipEntry.async('blob');
        const file = new File([content], fileName, {
          type: getFileType(fileName),
          lastModified: zipEntry.date?.getTime() || Date.now()
        });
        files.push(file);
      }
    }
    
    return files;
  } catch (error) {
    console.error('Error extracting files from zip:', error);
    throw new Error(`Failed to extract files from zip: ${error}`);
  }
};

// Validate file for zipping
export const validateFileForZip = (file: File): ZipValidationResult => {
  // Check file size (100MB limit before zipping)
  const maxSize = 100 * 1024 * 1024; // 100MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: "File too large to zip. Maximum size is 100MB."
    };
  }
  
  // Check file type (exclude already compressed files)
  const excludedTypes = [
    'application/zip',
    'application/x-zip-compressed',
    'application/gzip',
    'application/x-gzip',
    'application/x-rar-compressed',
    'application/vnd.rar',
    'application/x-7z-compressed'
  ];
  
  if (excludedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "File is already compressed and cannot be zipped again."
    };
  }
  
  return { isValid: true };
};

// Validate multiple files for zipping
export const validateFilesForZip = (files: File[]): ZipValidationResult => {
  if (files.length === 0) {
    return {
      isValid: false,
      error: "No files to zip."
    };
  }
  
  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const maxTotalSize = 500 * 1024 * 1024; // 500MB
  
  if (totalSize > maxTotalSize) {
    return {
      isValid: false,
      error: "Total file size too large. Maximum combined size is 500MB."
    };
  }
  
  // Validate each file
  for (const file of files) {
    const validation = validateFileForZip(file);
    if (!validation.isValid) {
      return {
        isValid: false,
        error: `File "${file.name}": ${validation.error}`
      };
    }
  }
  
  return { isValid: true };
};

// Generate zip file name for document
export const generateDocumentZipName = (
  documentType: string,
  userEmail: string,
  date: Date
): string => {
  const sanitizedEmail = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
  const sanitizedDocType = documentType.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = date.getTime();
  
  return `${sanitizedDocType}_${sanitizedEmail}_${timestamp}.zip`;
};

// Generate zip file name for submission
export const generateSubmissionZipName = (
  submissionId: string,
  date: Date
): string => {
  const timestamp = date.getTime();
  return `submission_${submissionId}_${timestamp}.zip`;
};

// Helper function to get file extension
export const getFileExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > 0 ? fileName.substring(lastDotIndex + 1).toLowerCase() : '';
};

// Helper function to get file name without extension
export const getFileNameWithoutExtension = (fileName: string): string => {
  const lastDotIndex = fileName.lastIndexOf('.');
  return lastDotIndex > 0 ? fileName.substring(0, lastDotIndex) : fileName;
};

// Helper function to get file type from extension
export const getFileType = (fileName: string): string => {
  const extension = getFileExtension(fileName);
  
  const mimeTypes: { [key: string]: string } = {
    // Documents
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xls': 'application/vnd.ms-excel',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'ppt': 'application/vnd.ms-powerpoint',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'csv': 'text/csv',
    
    // Images
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    
    // Archives
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    'tar': 'application/x-tar',
    'gz': 'application/gzip'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
};

// Get zip file info
export const getZipFileInfo = async (zipFile: File): Promise<{
  fileCount: number;
  totalUncompressedSize: number;
  files: Array<{
    name: string;
    size: number;
    compressedSize: number;
    type: string;
  }>;
}> => {
  try {
    const zip = await JSZip.loadAsync(zipFile);
    const files: Array<{
      name: string;
      size: number;
      compressedSize: number;
      type: string;
    }> = [];
    
    let totalUncompressedSize = 0;
    
    for (const [fileName, zipEntry] of Object.entries(zip.files)) {
      if (!zipEntry.dir) {
        const fileInfo = {
          name: fileName,
          size: (zipEntry as any).uncompressedSize ?? 0,
          compressedSize: (zipEntry as any).compressedSize ?? 0,
          type: getFileType(fileName)
        };
        
        files.push(fileInfo);
        totalUncompressedSize += (zipEntry as any).uncompressedSize ?? 0;
      }
    }
    
    return {
      fileCount: files.length,
      totalUncompressedSize,
      files
    };
  } catch (error) {
    console.error('Error getting zip file info:', error);
    throw new Error(`Failed to get zip file info: ${error}`);
  }
}; 