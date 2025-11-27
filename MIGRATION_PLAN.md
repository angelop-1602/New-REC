# Type System Migration Plan - Remaining Files

## Overview
After completing the **Chairperson Module** migration (38/38 files ✅), we need to migrate:
- **Proponent Module** files
- **Reviewer Module** files  
- **Shared Components** files
- **Services & Hooks** files

## Migration Status Summary
- ✅ **Chairperson Module**: 38/38 files (100% complete)
- ⏳ **Proponent Module**: 0/X files
- ⏳ **Reviewer Module**: 0/X files
- ⏳ **Shared Components**: 0/X files
- ⏳ **Services & Hooks**: 0/X files

---

## PART 1: PROPONENT MODULE MIGRATION

### 1.1 Proponent Pages (3 files) ✅ **COMPLETE!**
**Priority: HIGH** - User-facing pages

1. **`src/app/rec/proponent/dashboard/page.tsx`** ✅
   - ✅ Migrated to use `toProponentSubmissions()`, `sortByDate()`, `getProtocolTitle()`, `getProtocolCode()`, `toLocaleDateString()`
   - ✅ Removed manual date casting and manual information access

2. **`src/app/rec/proponent/dashboard/protocol/[id]/page.tsx`** ✅
   - ✅ Migrated to use `toProponentSubmission()` at the top
   - ✅ Uses typed getters: `getProtocolTitle()`, `getProtocolCode()`, `toLocaleDateString()`
   - ✅ Removed manual type casting

3. **`src/app/rec/proponent/application/page.tsx`** ✅
   - ✅ No type issues found - no migration needed

### 1.2 Proponent Components (8 files)
**Priority: MEDIUM** - Reusable components

1. **`src/components/rec/proponent/application/components/protocol/information.tsx`**
   - Issues: Likely has manual casting for protocol information
   - **Migration**: Use typed getters

2. **`src/components/rec/proponent/application/protocol-submission/information.tsx`**
   - Issues: Manual type casting
   - **Migration**: Use typed accessors

3. **`src/components/rec/proponent/application/protocol-submission/confirmation.tsx`**
   - Issues: Manual type casting
   - **Migration**: Use typed accessors

4. **`src/components/rec/proponent/application/components/dashboard-card.tsx`**
   - Check for date handling issues

5. **`src/components/rec/proponent/application/components/protocol/banner.tsx`**
   - Check for type casting issues

6. **`src/components/rec/proponent/application/components/protocol/decision.tsx`**
   - Check for type casting issues

7. **`src/components/rec/proponent/application/components/protocol/report.tsx`**
   - Check for type casting issues

8. **`src/components/rec/proponent/components/dashboard-stats.tsx`**
   - Check for date handling issues

---

## PART 2: REVIEWER MODULE MIGRATION

### 2.1 Reviewer Pages (2 files) ✅ **COMPLETE!**
**Priority: HIGH** - User-facing pages

1. **`src/app/rec/reviewers/protocol/[id]/page.tsx`** ✅
   - ✅ Removed manual casting: `documents as unknown as DocumentsType[]` → typed array
   - ✅ Documents now properly typed as `DocumentsType[]`
   - ✅ Information casting kept (already correct type)

2. **`src/app/rec/reviewers/page.tsx`** ✅
   - ✅ No type issues found - no migration needed

### 2.2 Reviewer Components (4 files)
**Priority: MEDIUM** - Reusable components

1. **`src/components/rec/reviewer/information.tsx`**
   - Issues: Manual type casting
   - **Migration**: Use typed getters

2. **`src/components/rec/reviewer/table.tsx`**
   - Issues: Manual date guards (`date.toDate ? date.toDate() : new Date(date)`)
   - **Migration**: Use `toDate()` from `@/types`

3. **`src/components/rec/reviewer/tabs.tsx`**
   - Check for type issues

4. **`src/components/rec/reviewer/components/decision-card.tsx`**
   - Check for type issues

---

## PART 3: SHARED COMPONENTS MIGRATION

### 3.1 Shared Protocol Components (1 file) ✅ **COMPLETE!**
**Priority: HIGH** - Used across modules

1. **`src/components/rec/shared/protocol-overview.tsx`** ✅
   - ✅ Removed manual casting: `(document as unknown as Record<string, unknown>).currentStatus` → `document.currentStatus`
   - ✅ Removed manual casting: `(selectedDocumentForAction as Record<string, unknown>).category` → `selectedDocumentForAction?.category`
   - ✅ Documents already properly typed as `DocumentsType[]`

### 3.2 Other Shared Components (1 file) ✅ **COMPLETE!**
**Priority: LOW** - Navigation only

1. **`src/components/rec/chairperson/components/navbar/chairperson-breadcrumb.tsx`** ✅
   - ✅ No type issues found - no migration needed

---

## PART 4: SERVICES & HOOKS MIGRATION

### 4.1 Services (9 files)
**Priority: MEDIUM** - Backend logic

1. **`src/lib/services/decisionService.ts`**
   - Issues: Manual date guards (`a.uploadedAt?.toDate?.() || new Date(a.uploadedAt)`)
   - **Migration**: Use `toDate()` from `@/types`

2. **`src/lib/services/reviewersManagementService.ts`**
   - Issues: Manual date guards
   - **Migration**: Use `toLocaleDateString()` from `@/types`

3. **`src/lib/services/reviewerService.ts`**
   - Issues: Multiple manual date guards
   - **Migration**: Use `toDate()` from `@/types`

4. **`src/lib/services/reviewerAuthService.ts`**
   - Issues: Manual date guards (`a.assignedAt?.toDate?.() || new Date(a.assignedAt)`)
   - **Migration**: Use `toDate()` from `@/types`

5. **`src/lib/services/presenceService.ts`**
   - Issues: Manual date guards
   - **Migration**: Use `toDate()` from `@/types`

6. **`src/lib/services/archivingService.ts`**
   - Check for date handling issues

7. **`src/lib/services/assessmentFormExportService.ts`**
   - Check for type casting issues

8. **`src/lib/services/templateDataMapper.ts`**
   - Check for type casting issues

9. **`src/lib/services/assessmentAggregationService.ts`**
   - Check for type casting issues

### 4.2 Hooks (4 files)
**Priority: MEDIUM** - React hooks

1. **`src/hooks/useRealtimeProtocols.ts`**
   - Issues: Manual date guards (`a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0)`)
   - **Migration**: Use `toDate()` from `@/types`

2. **`src/hooks/useSubmissionFormReducer.ts`**
   - Check for type casting issues

3. **`src/hooks/useAssessmentForm.ts`**
   - Check for type casting issues (already has `any` types)

4. **`src/hooks/useLocalDraft.ts`**
   - Check for type casting issues

---

## MIGRATION PATTERNS BY MODULE

### Proponent Module Pattern:
```typescript
// ❌ OLD WAY
const submissions = data.map((s: Record<string, unknown>) => ({
  ...s,
  title: (s.information as Record<string, unknown>)?.general_information?.protocol_title
}));

// ✅ NEW WAY
import { toProponentSubmissions, getProtocolTitle, sortByDate } from '@/types';
const submissions = toProponentSubmissions(data);
const sorted = sortByDate(submissions);
const title = getProtocolTitle(submission);
```

### Reviewer Module Pattern:
```typescript
// ❌ OLD WAY
const protocol = data as ReviewerProtocol;
const date = assignment.deadline?.toDate?.() || new Date(assignment.deadline);

// ✅ NEW WAY
import { toReviewerProtocol, toDate } from '@/types';
const protocol = toReviewerProtocol(data);
const date = toDate(assignment.deadline) || new Date();
```

### Services Pattern:
```typescript
// ❌ OLD WAY
const date = data.createdAt?.toDate?.()?.toISOString() || data.createdAt?.toISOString?.() || null;

// ✅ NEW WAY
import { toDate, toISOString } from '@/types';
const date = toISOString(data.createdAt);
```

---

## EXECUTION ORDER

1. **Phase 1: Proponent Pages** (3 files) - High priority, user-facing
2. **Phase 2: Reviewer Pages** (2 files) - High priority, user-facing
3. **Phase 3: Shared Components** (2 files) - High priority, used everywhere
4. **Phase 4: Proponent Components** (8 files) - Medium priority
5. **Phase 5: Reviewer Components** (4 files) - Medium priority
6. **Phase 6: Services** (9 files) - Medium priority, backend logic
7. **Phase 7: Hooks** (4 files) - Medium priority, React hooks

---

## ESTIMATED FILE COUNT

- **Proponent Module**: ~11 files
- **Reviewer Module**: ~6 files
- **Shared Components**: ~2 files
- **Services**: ~9 files
- **Hooks**: ~4 files

**Total Remaining**: ~32 files

---

## NOTES

- All files should use the new type system from `@/types`
- Remove all manual `as Record<string, unknown>` casts
- Replace manual date guards with `toDate()` or `toLocaleDateString()`
- Use typed getters: `getProtocolTitle()`, `getProtocolCode()`, `getPIName()`
- Use typed conversion: `toProponentSubmissions()`, `toReviewerProtocols()`
- After migration, run `npm run build` to check for remaining issues

