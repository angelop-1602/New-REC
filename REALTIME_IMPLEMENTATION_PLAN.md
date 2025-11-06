# Real-Time UI Update Implementation Plan

## 🎯 Goal
Auto-update UI across the system (Proponent, Chairperson, Reviewer) without page refresh.

## 📋 Architecture

### 1. Firestore Real-Time Listeners
- Replace all `getDocs()` with `onSnapshot()`
- Subscribe to document changes
- Unsubscribe on component unmount

### 2. Cloud Functions (Storage → Firestore Mirror)
```
Storage Event → Cloud Function → Firestore Update → UI Update
```

### 3. Components to Update

#### Proponent
- ✅ Protocol list (submissions)
- ✅ Document list for their protocols
- ✅ Document status changes
- ✅ Messages/notifications
- ✅ Protocol status changes

#### Chairperson
- ✅ Pending protocols list
- ✅ Accepted protocols list
- ✅ Document review status
- ✅ Reviewer assignments
- ✅ Protocol decisions

#### Reviewer
- ✅ Assigned protocols list
- ✅ Document access
- ✅ Assessment status
- ✅ Messages

## 🔧 Implementation Steps

### Phase 1: Real-Time Hooks (Current)
1. Create `useRealtimeDocuments` hook
2. Create `useRealtimeProtocol` hook
3. Create `useRealtimeProtocols` hook
4. Update all components to use these hooks

### Phase 2: Cloud Functions Setup
1. Create `onDocumentUploaded` function
2. Create `onDocumentDeleted` function
3. Create `onDocumentUpdated` function

### Phase 3: Component Updates
1. Update `protocol-overview.tsx`
2. Update `chairperson-actions.tsx`
3. Update protocol lists
4. Update document tables

### Phase 4: Optimistic Updates
1. Update UI immediately on action
2. Rollback if server update fails

## 📦 Files to Create/Update

### New Files
- `src/hooks/useRealtimeDocuments.ts`
- `src/hooks/useRealtimeProtocol.ts`
- `src/hooks/useRealtimeProtocols.ts`
- `functions/src/storage-sync.ts` (Cloud Functions)

### Update Files
- `src/components/rec/shared/protocol-overview.tsx`
- `src/components/rec/chairperson/components/protocol/chairperson-actions.tsx`
- `src/components/rec/proponent/dashboard/protocols-list.tsx`
- `src/components/rec/chairperson/dashboard/protocols-list.tsx`
- `src/components/rec/reviewer/dashboard/protocols-list.tsx`

## ⚡ Key Principles

1. **No Polling** - Use Firestore listeners only
2. **No Bucket Listing** - Storage is source, Firestore is index
3. **Instant Updates** - UI updates as soon as Firestore changes
4. **Clean Unsubscribe** - Always cleanup listeners
5. **Error Handling** - Graceful handling of connection issues

## 🚀 Benefits

- ✅ No manual refresh needed
- ✅ Real-time collaboration
- ✅ Instant feedback
- ✅ Better UX
- ✅ Reduced server load (no repeated polling)

