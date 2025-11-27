# Pre-Deployment Checklist

## 🔒 Firestore Security Rules Review

### ✅ Rules Status: READY FOR DEPLOYMENT

The `firestore.rules` file has been updated to match the current codebase structure:

### Key Changes Made:
1. **Unified Submissions Collection**: Rules now use single `submissions` collection (replaced old separate collections)
2. **Subcollections Covered**: All subcollections under submissions are properly secured:
   - `documents` - Document files
   - `reviewers` - Reviewer assignments
   - `messages` - Messages
   - `reassignment_history` - Reassignment tracking
   - `decision` - Decision data
   - `reviewers/{id}/assessment_forms` - Nested assessment forms

3. **Role-Based Access**:
   - **Proponent**: Can read/write own submissions and documents
   - **Reviewer**: Can read assigned submissions, write own assessments
   - **Chairperson**: Full access to all collections

4. **Security Features**:
   - Default deny rule (secure by default)
   - Authentication required for all operations
   - Owner checks prevent unauthorized access
   - Proper subcollection access control

### Collections Covered:
- ✅ `submissions` (main collection)
- ✅ `submissions/{id}/documents` (subcollection)
- ✅ `submissions/{id}/reviewers` (subcollection)
- ✅ `submissions/{id}/reviewers/{id}/assessment_forms` (nested)
- ✅ `submissions/{id}/messages` (subcollection)
- ✅ `submissions/{id}/reassignment_history` (subcollection)
- ✅ `submissions/{id}/decision` (subcollection)
- ✅ `reviewers` (top-level)
- ✅ `users` (top-level)
- ✅ `messages` (top-level, if used)
- ✅ `presence` (top-level)
- ✅ `rec_settings` / `settings` (top-level)
- ✅ `assessment_forms` (top-level, if used)
- ✅ `decision` (top-level, if used)

## 📋 Pre-Deployment Steps:

### 1. Test Rules in Firebase Console
- Go to Firebase Console → Firestore Database → Rules
- Use the Rules Playground to test different scenarios:
  - Proponent reading/writing own submission
  - Reviewer reading assigned submission
  - Chairperson accessing all data
  - Unauthorized access attempts

### 2. Verify Environment Variables
- ✅ `FIREBASE_PROJECT_ID` set in `.env.local`
- ✅ `FIREBASE_CLIENT_EMAIL` set in `.env.local`
- ✅ `FIREBASE_PRIVATE_KEY` set in `.env.local` (with proper formatting)

### 3. Backup Current Rules
- If you have existing rules in Firebase, note them down or export them

### 4. Deploy Rules
```bash
firebase deploy --only firestore:rules
```

### 5. Post-Deployment Testing
- Test with different user roles
- Monitor Firestore usage logs
- Check for permission denied errors
- Verify all features work correctly

## ⚠️ Important Notes:

1. **Legacy Collections**: The old collection structure (`submissions_pending`, `submissions_accepted`, etc.) is no longer in the rules. If you still have data in those collections, you may need to:
   - Migrate data to unified `submissions` collection, OR
   - Add rules for legacy collections temporarily

2. **Reviewer Assignment Check**: Reviewers can only access submissions they're assigned to. The rules check the `reviewers` subcollection to verify assignment.

3. **Chairperson Detection**: Chairperson is detected by checking if user exists in `rec_settings` or `settings` collection. Make sure chairperson users are properly set up.

## 🚨 Rollback Plan:

If issues occur after deployment:
1. Go to Firebase Console → Firestore Database → Rules
2. Click "Edit Rules"
3. Revert to previous rules or use the backup
4. Click "Publish"

## 📝 Files Updated:

- ✅ `firestore.rules` - Main security rules file (updated)
- ✅ `FIRESTORE_RULES_REVIEW.md` - Detailed review document (created)
- ✅ `.gitignore` - Firebase Admin SDK JSON files excluded (updated)

## ✅ Ready to Deploy!

The rules are comprehensive, secure, and match your current codebase structure.

