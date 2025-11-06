# View Document Feature Added to Revision Upload Dialog!

## 🎯 **Feature Request Completed**

**Request**: Add a "View Document" option to the document revision upload dialog so proponents can see the current document before uploading a revision.

**Solution**: Enhanced the `DocumentRevisionUploadDialog` component to include a "View Document" button that opens the current document in a new tab using the existing preview API.

## ✅ **Implementation Details**

### 1. **Enhanced DocumentRevisionUploadDialog** (`src/components/rec/shared/dialogs/document-revision-upload-dialog.tsx`)

**New Features Added**:
- ✅ **View Document Button**: Button to preview current document
- ✅ **Current Document Section**: UI section showing current document info
- ✅ **Preview Integration**: Uses existing preview API for document viewing
- ✅ **Error Handling**: Graceful handling when preview is not available

**New Props Added**:
```typescript
interface DocumentRevisionUploadDialogProps {
  // ... existing props
  submissionId?: string; // For document viewing
  storagePath?: string;  // For document viewing
}
```

**New UI Section**:
```typescript
{/* View Current Document Section */}
{storagePath && submissionId && (
  <div className="space-y-2">
    <Label>Current Document</Label>
    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{documentTitle}</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleViewDocument}
        className="flex items-center gap-2"
      >
        <Eye className="w-4 h-4" />
        View Document
      </Button>
    </div>
  </div>
)}
```

### 2. **Updated ProtocolOverview Component** (`src/components/rec/shared/protocol-overview.tsx`)

**Changes Made**:
- ✅ **Added Props**: Pass `submissionId` and `storagePath` to DocumentRevisionUploadDialog
- ✅ **Updated Both Instances**: Updated both proponent action sections
- ✅ **Maintained Consistency**: Same props passed to both dialog instances

**Updated Dialog Calls**:
```typescript
<DocumentRevisionUploadDialog
  documentId={document.id}
  documentTitle={document.title}
  documentDescription={document.description}
  category={document.category}
  protocolId={protocolId}
  submissionId={submissionId}        // ✅ New prop
  storagePath={document.storagePath} // ✅ New prop
  chairpersonComment={document.chairpersonComment}
  onUploadComplete={() => onDocumentStatusUpdate?.()}
  trigger={...}
/>
```

## 🔧 **Technical Implementation**

### **View Document Function**:
```typescript
const handleViewDocument = () => {
  if (!storagePath || !submissionId) {
    toast.error("Document preview not available");
    return;
  }

  // Use the same preview API as other components
  const filename = storagePath.split('/').pop();
  const previewUrl = `/api/preview/document/${filename}?submissionId=${submissionId}&auto=1&storagePath=${encodeURIComponent(storagePath)}`;
  window.open(previewUrl, '_blank');
};
```

### **Preview API Integration**:
- ✅ **Same API**: Uses the same preview API as other document viewing components
- ✅ **New Tab**: Opens document in new tab for better user experience
- ✅ **Error Handling**: Shows error toast if preview is not available
- ✅ **URL Encoding**: Properly encodes storage path for URL safety

## 🚀 **User Experience Flow**

### **Enhanced Dialog Experience**:

1. **Open Revision Dialog** → Dialog shows:
   - 💬 **Chairperson's Feedback**: What needs to be revised
   - 📄 **Current Document Section**: Shows current document with "View Document" button
   - 📁 **File Upload Section**: Select revised document
   - 📝 **Description Field**: Optional revision notes

2. **Click View Document** → Opens current document in new tab
3. **Review Current Document** → User can see what needs to be revised
4. **Upload Revision** → User uploads improved document
5. **Success** → Document status updates to "pending"

### **Dialog Layout**:
```
┌─────────────────────────────────────────┐
│ Upload Document Revision                │
├─────────────────────────────────────────┤
│ Upload a revised version of "Document"  │
│ based on the chairperson's feedback.    │
│                                         │
│ 💬 Chairperson's Feedback:              │
│ ┌─────────────────────────────────────┐ │
│ │ Please revise section 3.2 and add   │ │
│ │ more details about the methodology  │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📄 Current Document:                    │
│ ┌─────────────────────────────────────┐ │
│ │ 📄 Document Title        [👁️ View] │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ 📁 Select File: [Choose File]           │
│ 📝 Description: [Optional notes...]    │
│                                         │
│ [Cancel] [Upload Revision]              │
└─────────────────────────────────────────┘
```

## 🧪 **Testing the Feature**

### **Test Scenario**:
1. **Chairperson Reviews Document** → Sets status to "revise" with comments
2. **Proponent Views Protocol** → Sees document with "Needs Revision" status
3. **Proponent Clicks Upload Revision** → Dialog opens with:
   - Chairperson's feedback
   - Current document section with "View Document" button
4. **Proponent Clicks View Document** → Current document opens in new tab
5. **Proponent Reviews Document** → Can see what needs to be revised
6. **Proponent Uploads Revision** → Improved document uploaded

### **Expected Behavior**:
- ✅ **View Button Available**: Shows when document has storage path
- ✅ **Preview Opens**: Document opens in new tab
- ✅ **Error Handling**: Shows error if preview not available
- ✅ **Consistent UI**: Matches existing document viewing patterns
- ✅ **Better UX**: Proponents can see current document before revising

## 📋 **Files Modified**

### **Updated Files**:
- `src/components/rec/shared/dialogs/document-revision-upload-dialog.tsx` - Added view document functionality
- `src/components/rec/shared/protocol-overview.tsx` - Added new props to dialog calls

### **Key Features Added**:
- ✅ **View Document Button**: Preview current document before revision
- ✅ **Current Document Section**: UI section showing document info
- ✅ **Preview Integration**: Uses existing preview API
- ✅ **Error Handling**: Graceful handling of preview errors
- ✅ **Enhanced UX**: Better workflow for document revision

## 🎉 **Result**

The "View Document" feature is now **fully implemented** in the revision upload dialog! Proponents can:

- ✅ **See Current Document**: View the document that needs revision
- ✅ **Understand Requirements**: See chairperson's feedback alongside current document
- ✅ **Better Revision Process**: Review current document before uploading revision
- ✅ **Consistent Experience**: Same preview functionality as other document views
- ✅ **Improved Workflow**: More informed revision process

**Status**: ✅ **COMPLETE** - View document functionality added to revision upload dialog!
