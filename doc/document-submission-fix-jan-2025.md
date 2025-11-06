# Document Submission Fix - File References Lost Issue

**Date:** January 20, 2025  
**Issue:** Documents were not being saved during application submission  
**Status:** ✅ Fixed

## Problem Description

When users uploaded documents during the application submission process, the documents were not being saved to the Firestore `documents` subcollection. The issue occurred because:

1. Users uploaded files which were stored in state with `_fileRef` containing the actual File object
2. The submission form auto-saved to localStorage every 2 seconds for draft persistence
3. File objects cannot be serialized to JSON, so they were stripped out during localStorage save
4. When the form state was reloaded, documents no longer had their `_fileRef` properties
5. During submission, documents without `_fileRef` were filtered out and skipped
6. Result: No documents were uploaded to Firebase Storage or saved to Firestore

## Root Cause

The issue was in the localStorage serialization process:
- File objects cannot be converted to JSON
- The `localStorageManager` was stripping out `_fileRef` properties during save
- Documents loaded from localStorage had no way to access their original File objects
- The submission process required File objects to upload documents to Firebase Storage

## Solution

Created a **File Reference Manager** to keep File objects in memory separate from localStorage:

### 1. New File Reference Manager (`src/utils/fileReferenceManager.ts`)

- Singleton class that manages File objects in memory using `Map<documentId, File>`
- File objects are stored separately and never go through JSON serialization
- Provides methods to:
  - Store file references when files are uploaded
  - Retrieve file references when needed for submission
  - Remove file references when documents are deleted
  - Clear all file references after successful submission

### 2. Updated Submission Context (`src/contexts/SubmissionContext.tsx`)

**File Reference Restoration:**
- When loading documents from localStorage, restore file references from memory
- Before submission, ensure all documents have valid file references
- Throw error if any documents are missing file references (with clear message for user)

**Cleanup:**
- Remove file references when documents are deleted
- Clear all file references after successful submission
- Clear all file references when form is reset

**Enhanced Logging:**
- Added comprehensive console logging to track file reference state
- Log file reference manager state before submission
- Log successful file reference restoration for each document
- Log warnings when file references are missing

### 3. Updated Documents Component (`src/components/rec/proponent/application/protocol-submission/documents.tsx`)

**File Registration:**
- When user uploads a file, store it in FileReferenceManager immediately
- Files are registered before being added to submission context
- Old file references are removed when documents are replaced

**Enhanced Logging:**
- Log when files are stored in memory
- Log when documents are added to context
- Log when existing documents are replaced

## Data Structure

Documents are now properly saved in the new subcollection structure:
```
submissions/{applicationId}/documents/{documentId}
```

Each document in the subcollection contains:
- Document metadata (title, description, category, etc.)
- Storage information (storagePath, downloadUrl)
- File information (originalFileName, fileType, size)
- Upload timestamps
- Status tracking

## Benefits

1. **Reliable Document Submission**: All uploaded documents are now properly saved
2. **No Data Loss**: File references are preserved in memory throughout the session
3. **Better Error Handling**: Clear error messages if file references are lost
4. **Clean Architecture**: Separation of concerns between persistence and file handling
5. **Debugging Support**: Comprehensive logging for troubleshooting

## Testing Checklist

- [x] File upload works correctly
- [x] File references are stored in memory
- [x] File references are restored from memory
- [x] Documents are uploaded to Firebase Storage
- [x] Document metadata is saved to Firestore subcollection
- [x] Multiple documents can be uploaded
- [x] Documents can be replaced
- [x] Document removal cleans up file references
- [x] Form reset clears all file references
- [x] Error handling for missing file references
- [x] Submission succeeds with all documents

## Code Changes Summary

### New Files:
- `src/utils/fileReferenceManager.ts` - File reference manager singleton

### Modified Files:
- `src/contexts/SubmissionContext.tsx` - Integrated file reference manager
- `src/components/rec/proponent/application/protocol-submission/documents.tsx` - File registration

### Documentation:
- `TASKING.md` - Added entry documenting the fix
- `doc/document-submission-fix-jan-2025.md` - This file

## Future Improvements

Potential enhancements for consideration:
1. Add file reference persistence using IndexedDB for cross-session support
2. Add file size validation before storing in memory
3. Add total memory usage monitoring
4. Implement file compression before storage
5. Add file thumbnail generation for images

## Migration Notes

No migration needed - this is a development environment fix. The new architecture:
- Uses the single `submissions` collection
- Stores documents in `submissions/{applicationId}/documents/` subcollection
- All new submissions will use this structure

