# Firestore Security Rules Review

## Overview
This document reviews the Firestore security rules before deployment to ensure they match the current codebase structure.

## Current Codebase Structure

### Main Collections:
1. **`submissions`** - Unified collection for all protocol submissions (replaces old `submissions_pending`, `submissions_accepted`, `submissions_approved`, `submissions_archived`)
2. **`reviewers`** - Reviewer data and information
3. **`users`** - User account data
4. **`messages`** - Messages (can be top-level or subcollection)
5. **`presence`** - User presence/online status tracking
6. **`rec_settings`** or **`settings`** - REC settings and configuration
7. **`assessment_forms`** - Assessment forms (can be top-level or nested)
8. **`decision`** - Decision data (can be top-level or nested)

### Subcollections under `submissions/{submissionId}`:
1. **`documents`** - Documents for each submission
2. **`reviewers`** - Reviewer assignments for each submission
3. **`messages`** - Messages related to each submission
4. **`reassignment_history`** - History of reviewer reassignments
5. **`decision`** - Decision data for each submission

### Nested under `submissions/{submissionId}/reviewers/{reviewerAssignmentId}`:
1. **`assessment_forms/{formType}`** - Assessment forms for each reviewer assignment

## Security Rules Summary

### ✅ Rules Implemented:

1. **Authentication Helpers**:
   - `isAuthenticated()` - Checks if user is logged in
   - `isOwner(userId)` - Checks if user owns the resource
   - `isReviewer()` - Checks if user is an active reviewer
   - `isChairperson()` - Checks if user is chairperson
   - `isProponent(submissionData)` - Checks if user is the submission owner
   - `canReadSubmission()` - Checks read permissions
   - `canWriteSubmission()` - Checks write permissions

2. **Users Collection**:
   - Read: Owner or Chairperson
   - Write: Owner only

3. **Submissions Collection**:
   - Read: Proponent (own), Chairperson, Reviewers
   - Create: Authenticated users (own submissions)
   - Update: Proponent (own), Chairperson
   - Delete: Chairperson only

4. **Documents Subcollection**:
   - Read: Proponent, Owner, Chairperson, Reviewers
   - Create: Owner, Proponent, Chairperson
   - Update: Owner, Chairperson
   - Delete: Chairperson only

5. **Reviewers Subcollection**:
   - Read: Reviewer (own), Chairperson, Proponent
   - Write: Chairperson only

6. **Assessment Forms (Nested)**:
   - Read: Reviewer (own), Chairperson, Proponent
   - Create: Reviewer (own), Chairperson
   - Update: Reviewer (own), Chairperson
   - Delete: Chairperson only

7. **Messages Subcollection**:
   - Read: Sender, Receiver, Chairperson
   - Create: Sender only
   - Update/Delete: Sender, Chairperson

8. **Reviewers Collection**:
   - Read: Owner, Chairperson
   - Write: Chairperson only

9. **Presence Collection**:
   - Read: Authenticated users
   - Write: Owner only

10. **Settings Collections**:
    - Read/Write: Chairperson only

## ⚠️ Important Notes:

1. **Default Deny**: All unmatched paths are denied by default (secure by default)

2. **Legacy Collections**: The rules no longer include:
   - `submissions_pending`
   - `submissions_accepted`
   - `submissions_approved`
   - `submissions_archived`
   
   These have been replaced by the unified `submissions` collection with a `status` field.

3. **Testing Recommendations**:
   - Test with different user roles (proponent, reviewer, chairperson)
   - Test read/write permissions for each collection
   - Test subcollection access
   - Verify default deny rule works

## 🔒 Security Checklist:

- [x] All collections have appropriate access controls
- [x] Subcollections inherit parent permissions correctly
- [x] Default deny rule in place
- [x] Authentication required for all operations
- [x] Role-based access control implemented
- [x] Owner checks prevent unauthorized access
- [x] Chairperson has appropriate admin access
- [x] Reviewers can only access assigned submissions

## 📝 Deployment Notes:

1. **Before Deploying**:
   - Review all rules carefully
   - Test in Firebase Console Rules Playground
   - Verify with test users of each role

2. **After Deploying**:
   - Monitor Firestore usage logs
   - Check for any permission denied errors
   - Verify all features work as expected

3. **Rollback Plan**:
   - Keep backup of previous rules
   - Can revert via Firebase Console if issues arise

## 🚀 Next Steps:

1. Test rules in Firebase Console Rules Playground
2. Deploy rules using Firebase CLI: `firebase deploy --only firestore:rules`
3. Monitor for any permission errors
4. Update documentation if needed

