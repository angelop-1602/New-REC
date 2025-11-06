# Cloud Functions for Storage → Firestore Sync

## Purpose
Mirror Firebase Storage events into Firestore to enable real-time UI updates.

## Architecture
```
Storage Event → Cloud Function → Firestore Update → UI Update (via onSnapshot)
```

## Functions to Implement

### 1. onDocumentUploaded
Trigger: When a file is uploaded to Storage

```typescript
import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const onDocumentUploaded = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name; // e.g., 'submissions/{id}/documents/{filename}'
  
  if (!filePath.includes('/documents/')) {
    return null; // Not a document upload
  }
  
  const pathParts = filePath.split('/');
  const submissionId = pathParts[1];
  const filename = pathParts[3];
  
  // Update Firestore with document metadata
  const db = admin.firestore();
  const documentRef = db
    .collection('submissions')
    .doc(submissionId)
    .collection('documents')
    .doc(filename.split('.')[0]); // Remove extension
  
  await documentRef.update({
    downloadUrl: `https://storage.googleapis.com/${object.bucket}/${filePath}`,
    size: object.size,
    contentType: object.contentType,
    uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    storagePath: filePath
  });
  
  console.log(`✅ Document metadata updated for ${filename}`);
  return null;
});
```

### 2. onDocumentDeleted
Trigger: When a file is deleted from Storage

```typescript
export const onDocumentDeleted = functions.storage.object().onDelete(async (object) => {
  const filePath = object.name;
  
  if (!filePath.includes('/documents/')) {
    return null;
  }
  
  const pathParts = filePath.split('/');
  const submissionId = pathParts[1];
  const filename = pathParts[3];
  
  // Delete or mark as deleted in Firestore
  const db = admin.firestore();
  const documentRef = db
    .collection('submissions')
    .doc(submissionId)
    .collection('documents')
    .doc(filename.split('.')[0]);
  
  await documentRef.delete();
  
  console.log(`✅ Document metadata deleted for ${filename}`);
  return null;
});
```

### 3. onDocumentMetadataUpdated
Trigger: When file metadata changes in Storage

```typescript
export const onDocumentMetadataUpdated = functions.storage.object().onMetadataUpdate(async (object) => {
  const filePath = object.name;
  
  if (!filePath.includes('/documents/')) {
    return null;
  }
  
  const pathParts = filePath.split('/');
  const submissionId = pathParts[1];
  const filename = pathParts[3];
  
  // Update Firestore with new metadata
  const db = admin.firestore();
  const documentRef = db
    .collection('submissions')
    .doc(submissionId)
    .collection('documents')
    .doc(filename.split('.')[0]);
  
  await documentRef.update({
    size: object.size,
    contentType: object.contentType,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    metadata: object.metadata || {}
  });
  
  console.log(`✅ Document metadata updated for ${filename}`);
  return null;
});
```

## Deployment

1. Install Firebase Functions:
```bash
npm install -g firebase-tools
firebase init functions
```

2. Install dependencies:
```bash
cd functions
npm install firebase-admin firebase-functions
```

3. Deploy functions:
```bash
firebase deploy --only functions
```

## Benefits

✅ **Automatic Sync** - No manual Firestore updates needed
✅ **Real-Time** - UI updates immediately via listeners
✅ **Reliable** - Cloud Functions guarantee execution
✅ **Scalable** - Handles any number of uploads
✅ **Consistent** - Single source of truth (Storage)

## Security Rules

Ensure Firestore security rules allow function writes:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /submissions/{submissionId}/documents/{documentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      (request.auth.uid == resource.data.createdBy || 
                       hasRole('chairperson'));
      // Allow Cloud Functions to write
      allow write: if request.auth.token.firebase.sign_in_provider == 'admin';
    }
  }
}
```

## Monitoring

Monitor functions in Firebase Console:
- Functions → Dashboard
- Check invocation count
- View logs
- Monitor errors

## Cost Optimization

- Use appropriate regions (closest to users)
- Set function timeouts appropriately
- Use batched writes when possible
- Monitor cold starts

