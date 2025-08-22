# View Document Feature Implementation

## 📖 Overview

The **View Document** feature allows proponents to view the contents of uploaded ZIP files directly in their browser without downloading the entire ZIP file. This provides a seamless user experience for reviewing submitted documents.

## 🎯 Objectives Achieved

✅ **Client-Side ZIP Extraction**: All ZIP processing happens in the browser using JSZip  
✅ **Secure File Access**: Uses Firebase Storage `getDownloadURL()` to avoid CORS issues  
✅ **Smart File Prioritization**: Automatically opens the most relevant file type  
✅ **Memory Management**: Implements intelligent caching with size limits  
✅ **Responsive Design**: Works on both desktop and mobile devices  
✅ **Error Handling**: Graceful fallbacks and user-friendly error messages  

## 🔧 Technical Implementation

### Core Components

#### 1. **ViewDocumentButton Component**
```typescript
// Location: src/components/ui/custom/view-document-button.tsx
<ViewDocumentButton
  storagePath="submissions/REC_2025_ABC123/documents/research_proposal.zip"
  documentTitle="Research Proposal"
  variant="ghost"
  size="sm"
/>
```

**Features:**
- Loading states with spinner
- Error states with tooltips
- Automatic file type detection
- Secure blob URL creation
- Memory cleanup after viewing

#### 2. **useDocumentViewer Hook**
```typescript
// Location: src/hooks/useDocumentViewer.ts
const { viewDocument, loading, error, clearCache } = useDocumentViewer();
```

**Features:**
- Progress tracking (0-100%)
- Enhanced cache management (50MB limit)
- File type prioritization
- Cache statistics and cleanup

### File Type Support & Prioritization

| Extension | Priority | MIME Type | Opens In Browser |
|-----------|----------|-----------|------------------|
| `.pdf` | 1 (Highest) | `application/pdf` | ✅ PDF viewer |
| `.png`, `.jpg`, `.jpeg` | 2 | `image/*` | ✅ Image viewer |
| `.html`, `.htm` | 3 | `text/html` | ✅ Web page |
| `.txt`, `.md` | 4 (Lowest) | `text/plain` | ✅ Text viewer |

### Cache Management

**Memory Cache Features:**
- **Size Limit**: 50MB total cache size
- **TTL**: 1 hour automatic expiration
- **LRU Eviction**: Removes oldest entries when cache is full
- **Manual Cleanup**: `clearCache()` function available

**Cache Storage:**
```typescript
interface CachedFile {
  blob: Blob;           // File content
  type: string;         // MIME type
  name: string;         // Original filename
  timestamp: number;    // Cache timestamp
  size: number;         // File size in bytes
  extension: string;    // File extension
}
```

## 🚀 Integration

### Protocol Document View
The feature is integrated into the Protocol Document component:

```typescript
// In DropdownMenu actions
<ViewDocumentButton
  storagePath={document.storagePath}
  documentTitle={formatDocumentName(document)}
  variant="ghost"
  size="sm"
/>
```

### User Experience Flow

1. **User Clicks "View"** → ViewDocumentButton triggered
2. **Check Cache** → Instant loading if file cached
3. **Download ZIP** → Firebase getBlob() - no CORS issues
4. **Extract Contents** → JSZip extraction in memory
5. **Find Best File** → Prioritize by file type (.pdf > .png > .html > .txt)
6. **Open File** → New tab with blob URL
7. **Cache File** → Store extracted file for future access
8. **Cleanup** → Revoke blob URL after 3 seconds

## 📊 Performance Features

### 1. **Smart Caching**
- **First View**: Downloads and extracts ZIP (1-3 seconds)
- **Subsequent Views**: Instant loading from cache (<1 second)
- **Memory Efficient**: Automatic cleanup prevents memory leaks

### 2. **Progressive Loading**
```typescript
Progress States:
10% - Cache check complete
50% - ZIP file downloaded via getBlob()
70% - ZIP content loaded
85% - Best file identified
95% - File extracted
100% - File opened in browser
```

### 3. **Fallback Mechanisms**
- **No Viewable Files**: Downloads ZIP file instead
- **Popup Blocked**: Triggers file download
- **Large Files**: Shows progress indicator
- **Firebase Errors**: Clear error messages

## 🛡️ Security Features

### CORS Handling
- ✅ Uses Firebase getBlob() - completely bypasses CORS
- ✅ No CORS configuration needed - Firebase SDK handles everything
- ✅ All processing happens client-side
- ✅ Secure blob URL generation

### Memory Safety
- ✅ Automatic blob URL revocation
- ✅ Cache size limits (50MB max)
- ✅ TTL-based cleanup (1 hour)
- ✅ No persistent storage of sensitive data

## 🔧 Usage Examples

### Basic Usage
```tsx
import ViewDocumentButton from '@/components/ui/custom/view-document-button';

<ViewDocumentButton
  storagePath="submissions/REC_2025_ABC123/documents/informed_consent.zip"
  documentTitle="Informed Consent Form"
/>
```

### Advanced Usage with Hook
```tsx
import { useDocumentViewer } from '@/hooks/useDocumentViewer';

const DocumentViewer = () => {
  const { viewDocument, loading, error, progress } = useDocumentViewer();

  const handleView = async () => {
    try {
      await viewDocument('path/to/document.zip', 'My Document');
    } catch (err) {
      console.error('Failed to view document:', err);
    }
  };

  return (
    <Button onClick={handleView} disabled={loading}>
      {loading ? `Loading... ${progress}%` : 'View Document'}
    </Button>
  );
};
```

### Cache Management
```tsx
import { useDocumentViewer } from '@/hooks/useDocumentViewer';

const CacheManager = () => {
  const { getCacheStats, clearCache } = useDocumentViewer();
  
  const stats = getCacheStats();
  
  return (
    <div>
      <p>Cached Files: {stats.totalFiles}</p>
      <p>Cache Size: {(stats.totalSize / 1024 / 1024).toFixed(2)} MB</p>
      <p>Utilization: {stats.utilizationPercent}%</p>
      <Button onClick={clearCache}>Clear Cache</Button>
    </div>
  );
};
```

## 🧪 Testing Scenarios

### Supported File Types
- ✅ PDF documents (research proposals, forms)
- ✅ Images (PNG, JPEG screenshots, diagrams)
- ✅ HTML files (exported forms, reports)  
- ✅ Text files (README, notes, logs)

### Edge Cases Handled
- ✅ Empty ZIP files
- ✅ ZIP files with no viewable content
- ✅ Corrupted ZIP files
- ✅ Network connectivity issues
- ✅ Very large files (>10MB)
- ✅ Popup blockers
- ✅ Mobile devices

### Error Messages
- `"ZIP file is empty"`
- `"No viewable files found in ZIP. ZIP file downloaded instead."`
- `"Failed to download file: 404 Not Found"`
- `"Popup blocked. File has been downloaded instead."`

## 🔮 Future Enhancements

### Optional Improvements
1. **IndexedDB Storage**: For persistent caching across sessions
2. **File Preview**: Thumbnail generation for images/PDFs
3. **Multi-File View**: Support viewing multiple files from one ZIP
4. **File Search**: Search within ZIP contents
5. **Annotation Support**: Basic markup on PDFs/images

### Performance Optimizations
1. **Streaming Extraction**: Progressive ZIP reading for large files
2. **WebWorker Processing**: Background ZIP extraction
3. **Prefetching**: Preload commonly accessed documents
4. **Compression**: Further compress cached files

## 📋 Deployment Checklist

- ✅ Component created and tested
- ✅ Integration with Protocol Document view
- ✅ Error handling and user feedback
- ✅ Mobile responsiveness verified
- ✅ Cache management implemented
- ✅ TypeScript definitions complete
- ✅ Documentation written
- ✅ Security considerations addressed

## 🐛 Troubleshooting

### Common Issues

**"Storage path is required"**
- Ensure `storagePath` prop is provided and not empty

**"Failed to download file: 403 Forbidden"**
- Check Firebase Storage security rules
- Verify user authentication status

**"No viewable files found"**
- ZIP contains only unsupported file types
- Add more file types to `SUPPORTED_FILE_TYPES` if needed

**"Popup blocked"**
- Browser blocks new tab opening
- File automatically downloads as fallback

### Debug Information
```typescript
// Enable debug logging
console.log('Cache stats:', getCacheStats());
console.log('Supported types:', getSupportedTypes());
```

---

The View Document feature provides a seamless, secure, and performant way for proponents to review their submitted documents without the hassle of downloading and manually extracting ZIP files. The implementation prioritizes user experience while maintaining security and performance standards.