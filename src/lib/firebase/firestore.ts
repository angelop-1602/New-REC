import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { InformationType } from "@/types/information.types";
import { DocumentsType } from "@/types/documents.types";
import { SubmissionsType } from "@/types/submissions.type";
import { MessagesType, MessageType } from "@/types/message.types";
import { PendingSubmissionDoc } from "@/types/firestore.types";
import { uploadFile as uploadToStorage } from "@/lib/firebase/storage";
import { zipSingleFile } from "@/lib/utils/zip";
import firebaseApp from "@/lib/firebaseConfig";

const db = getFirestore(firebaseApp);

// Collections
const SUBMISSIONS_PENDING_COLLECTION = "submissions_pending";
const SUBMISSIONS_ACCEPTED_COLLECTION = "submissions_accepted";
const SUBMISSIONS_APPROVED_COLLECTION = "submissions_approved";
const SUBMISSIONS_ARCHIVED_COLLECTION = "submissions_archived";
const DOCUMENTS_COLLECTION = "documents";
const MESSAGES_COLLECTION = "messages";

// Legacy collection name (for backward compatibility)
const SUBMISSIONS_COLLECTION = "submissions_pending"; // Default to pending for legacy functions

// Submission data structure for Firestore
export interface SubmissionData {
  applicationID: string;
  protocolCode: string;
  title: string;
  submitBy: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: "draft" | "submitted" | "under_review" | "approved" | "rejected";
  information: InformationType;
  documents?: DocumentsType[];
}

// Generate unique temporary protocol code for pending submissions
const generateTempProtocolCode = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const timestamp = now.getTime().toString().slice(-6);
  
  return `PENDING-${year}${month}${day}-${timestamp}`;
};

// Generate REC application ID in format: REC_YYYY_6random
const generateApplicationID = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const randomString = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  return `REC_${year}_${randomString}`;
};

// Create new submission (always starts as pending)
export const createSubmission = async (
  userId: string,
  information: InformationType
): Promise<string> => {
  try {
    // Generate custom application ID in REC_YYYY_6random format
    const applicationID = generateApplicationID();
    const submissionRef = doc(db, SUBMISSIONS_PENDING_COLLECTION, applicationID);
    const tempProtocolCode = generateTempProtocolCode();
    
    const submissionData: PendingSubmissionDoc = {
      applicationID,
      tempProtocolCode,
      title: information.general_information.protocol_title || "Untitled Protocol",
      submitBy: userId,
      createdBy: userId,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      status: "pending",
      information,
      // documents removed - stored only in subcollection
    };

    await setDoc(submissionRef, submissionData);
    
    return applicationID;
  } catch (error) {
    console.error("Error creating submission:", error);
    throw new Error("Failed to create submission");
  }
};

// Update existing submission
export const updateSubmission = async (
  submissionId: string,
  information: InformationType,
  status?: "draft" | "submitted" | "under_review" | "approved" | "rejected"
): Promise<void> => {
  try {
    const submissionRef = doc(db, SUBMISSIONS_PENDING_COLLECTION, submissionId);
    
    // Check if submission exists
    const submissionDoc = await getDoc(submissionRef);
    if (!submissionDoc.exists()) {
      throw new Error("Submission not found");
    }

    const updateData: Partial<SubmissionData> = {
      information,
      title: information.general_information.protocol_title || "Untitled Protocol",
      updatedAt: serverTimestamp() as Timestamp,
    };

    if (status) {
      updateData.status = status;
    }

    await updateDoc(submissionRef, updateData);
  } catch (error) {
    console.error("Error updating submission:", error);
    throw new Error("Failed to update submission");
  }
};

// Submit draft (change status from draft to submitted)
export const submitDraft = async (submissionId: string): Promise<void> => {
  try {
    const submissionRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    
    // Check if submission exists and is a draft
    const submissionDoc = await getDoc(submissionRef);
    if (!submissionDoc.exists()) {
      throw new Error("Submission not found");
    }

    const submissionData = submissionDoc.data() as SubmissionData;
    if (submissionData.status !== "draft") {
      throw new Error("Only draft submissions can be submitted");
    }

    await updateDoc(submissionRef, {
      status: "submitted",
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error submitting draft:", error);
    throw new Error("Failed to submit draft");
  }
};

// Get submission by ID
export const getSubmission = async (submissionId: string): Promise<SubmissionData | null> => {
  try {
    const submissionRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    const submissionDoc = await getDoc(submissionRef);
    
    if (!submissionDoc.exists()) {
      return null;
    }

    return submissionDoc.data() as SubmissionData;
  } catch (error) {
    console.error("Error getting submission:", error);
    throw new Error("Failed to get submission");
  }
};

// Get user's submissions
export const getUserSubmissions = async (
  userId: string,
  statusFilter?: "draft" | "submitted" | "under_review" | "approved" | "rejected",
  limitCount: number = 10
): Promise<SubmissionData[]> => {
  try {
    let submissionsQuery = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where("submitBy", "==", userId),
      orderBy("updatedAt", "desc"),
      limit(limitCount)
    );

    if (statusFilter) {
      submissionsQuery = query(
        collection(db, SUBMISSIONS_COLLECTION),
        where("submitBy", "==", userId),
        where("status", "==", statusFilter),
        orderBy("updatedAt", "desc"),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(submissionsQuery);
    const submissions: SubmissionData[] = [];
    
    querySnapshot.forEach((doc) => {
      submissions.push(doc.data() as SubmissionData);
    });

    return submissions;
  } catch (error) {
    console.error("Error getting user submissions:", error);
    throw new Error("Failed to get user submissions");
  }
};

// Transaction-based submission with proper error handling and cleanup
export const createCompleteSubmission = async (
  userId: string,
  information: InformationType,
  documents: DocumentsType[]
): Promise<string> => {
  let submissionId: string | null = null;
  let uploadedFiles: string[] = [];

  try {
    // Step 1: Create submission first
    console.log("Creating submission...");
    submissionId = await createSubmission(userId, information);
    console.log(`Submission created with ID: ${submissionId}`);

    // Step 2: Upload documents if any exist
    if (documents.length > 0) {
      console.log(`Uploading ${documents.length} documents...`);
      const uploadedDocuments: DocumentsType[] = [];

      for (const document of documents) {
        if (document._fileRef) {
          try {
            console.log(`Uploading document: ${document.title}`);
            
            // Zip the file before uploading
            const zippedFile = await zipSingleFile(document._fileRef, {
              fileName: `${document.title.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-').toLowerCase()}.zip`
            });
            
            // Upload directly to documents folder (no subfolders)
            const storagePath = `submissions/${submissionId}/documents/${zippedFile.name}`;
            const uploadResult = await uploadToStorage(zippedFile, storagePath);
            
            // Track uploaded file for potential cleanup
            uploadedFiles.push(uploadResult.storagePath);
            
            // Create final document metadata with actual URLs (remove _fileRef completely)
            const { _fileRef, ...documentWithoutFileRef } = document;
            const finalDocument: DocumentsType = {
              ...documentWithoutFileRef,
              storagePath: uploadResult.storagePath,
              downloadUrl: uploadResult.downloadUrl,
              uploadedAt: uploadResult.uploadedAt,
              originalFileName: document._fileRef.name, // Store original filename
              status: "pending",
              // Update files array if exists (remove undefined to avoid Firebase errors)
              ...(document.files ? {
                files: [{
                  ...document.files[0],
                  fileName: zippedFile.name,
                  storagePath: uploadResult.storagePath,
                  downloadUrl: uploadResult.downloadUrl,
                  uploadedAt: uploadResult.uploadedAt,
                }]
              } : {}),
            };
            
            uploadedDocuments.push(finalDocument);
            console.log(`Document uploaded successfully: ${document.title}`);
          } catch (uploadError) {
            console.error(`Error uploading document ${document.id}:`, uploadError);
            throw new Error(`Failed to upload document "${document.title}": ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          }
        }
      }

      // Step 3: Save document metadata to subcollection
      console.log("Saving document metadata...");
      const documentsRef = collection(db, SUBMISSIONS_PENDING_COLLECTION, submissionId, DOCUMENTS_COLLECTION);
      
      for (const document of uploadedDocuments) {
        await setDoc(doc(documentsRef, document.id), document);
      }

      // Step 4: Update submission timestamp
      await updateDoc(doc(db, SUBMISSIONS_PENDING_COLLECTION, submissionId), {
        updatedAt: serverTimestamp(),
      });
    }

    console.log("Submission completed successfully");
    return submissionId;

  } catch (error) {
    console.error("Error in createCompleteSubmission:", error);
    
    // Cleanup on error
    await cleanupFailedSubmission(submissionId, uploadedFiles);
    
    // Throw descriptive error
    if (error instanceof Error) {
      throw new Error(`Submission failed: ${error.message}`);
    } else {
      throw new Error("Submission failed: Unknown error occurred");
    }
  }
};

// Cleanup function for failed submissions
export const cleanupFailedSubmission = async (
  submissionId: string | null,
  uploadedFiles: string[]
): Promise<void> => {
  try {
    console.log("Cleaning up failed submission...");
    
    // Delete uploaded files from Storage
    if (uploadedFiles.length > 0) {
      const { getStorage, ref, deleteObject } = await import("firebase/storage");
      const storage = getStorage();
      
      for (const filePath of uploadedFiles) {
        try {
          await deleteObject(ref(storage, filePath));
          console.log(`Deleted file: ${filePath}`);
        } catch (deleteError) {
          console.warn(`Failed to delete file ${filePath}:`, deleteError);
        }
      }
    }

    // Delete submission document from Firestore
    if (submissionId) {
      try {
        await deleteDoc(doc(db, SUBMISSIONS_PENDING_COLLECTION, submissionId));
        console.log(`Deleted submission: ${submissionId}`);
      } catch (deleteError) {
        console.warn(`Failed to delete submission ${submissionId}:`, deleteError);
      }
    }
    
    console.log("Cleanup completed");
  } catch (cleanupError) {
    console.error("Error during cleanup:", cleanupError);
  }
};

// Get all user submissions from all collections for dashboard (no indexes required)
export const getAllUserSubmissions = async (userId: string): Promise<any[]> => {
  try {
    const submissions: any[] = [];
    
    // Query pending submissions (no orderBy to avoid index requirement)
    const pendingQuery = query(
      collection(db, SUBMISSIONS_PENDING_COLLECTION),
      where("submitBy", "==", userId)
    );
    const pendingSnapshot = await getDocs(pendingQuery);
    
    pendingSnapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        collection: "pending",
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      });
    });

    // Query accepted submissions (no orderBy to avoid index requirement)
    const acceptedQuery = query(
      collection(db, SUBMISSIONS_ACCEPTED_COLLECTION),
      where("submitBy", "==", userId)
    );
    const acceptedSnapshot = await getDocs(acceptedQuery);
    
    acceptedSnapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        collection: "accepted",
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      });
    });

    // Query approved submissions (no orderBy to avoid index requirement)
    const approvedQuery = query(
      collection(db, SUBMISSIONS_APPROVED_COLLECTION),
      where("submitBy", "==", userId)
    );
    const approvedSnapshot = await getDocs(approvedQuery);
    
    approvedSnapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        collection: "approved",
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      });
    });

    // Query archived submissions (no orderBy to avoid index requirement)
    const archivedQuery = query(
      collection(db, SUBMISSIONS_ARCHIVED_COLLECTION),
      where("submitBy", "==", userId)
    );
    const archivedSnapshot = await getDocs(archivedQuery);
    
    archivedSnapshot.forEach((doc) => {
      submissions.push({
        id: doc.id,
        collection: "archived",
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      });
    });

    // Sort all submissions by creation date in JavaScript (newest first)
    return submissions.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });

  } catch (error) {
    console.error("Error fetching user submissions:", error);
    throw new Error("Failed to fetch submissions");
  }
};



// Delete submission (soft delete by updating status)
export const deleteSubmission = async (submissionId: string): Promise<void> => {
  try {
    const submissionRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    
    // Check if submission exists
    const submissionDoc = await getDoc(submissionRef);
    if (!submissionDoc.exists()) {
      throw new Error("Submission not found");
    }

    const submissionData = submissionDoc.data() as SubmissionData;
    if (submissionData.status !== "draft") {
      throw new Error("Only draft submissions can be deleted");
    }

    await updateDoc(submissionRef, {
      status: "deleted" as any,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error("Error deleting submission:", error);
    throw new Error("Failed to delete submission");
  }
};

// Check if user can edit submission
export const canUserEditSubmission = async (
  submissionId: string,
  userId: string
): Promise<boolean> => {
  try {
    const submission = await getSubmission(submissionId);
    if (!submission) {
      return false;
    }

    // User can edit if they are the creator and submission is still a draft
    return submission.createdBy === userId && submission.status === "draft";
  } catch (error) {
    console.error("Error checking edit permission:", error);
    return false;
  }
};

// Get submission statistics for user
export const getUserSubmissionStats = async (userId: string): Promise<{
  total: number;
  draft: number;
  submitted: number;
  under_review: number;
  approved: number;
  rejected: number;
}> => {
  try {
    const submissionsQuery = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where("submitBy", "==", userId)
    );

    const querySnapshot = await getDocs(submissionsQuery);
    const stats = {
      total: 0,
      draft: 0,
      submitted: 0,
      under_review: 0,
      approved: 0,
      rejected: 0,
    };

    querySnapshot.forEach((doc) => {
      const submission = doc.data() as SubmissionData;
      stats.total++;
      
      switch (submission.status) {
        case "draft":
          stats.draft++;
          break;
        case "submitted":
          stats.submitted++;
          break;
        case "under_review":
          stats.under_review++;
          break;
        case "approved":
          stats.approved++;
          break;
        case "rejected":
          stats.rejected++;
          break;
      }
    });

    return stats;
  } catch (error) {
    console.error("Error getting submission stats:", error);
    throw new Error("Failed to get submission statistics");
  }
};

// Get submission by ID from any collection
export const getSubmissionById = async (submissionId: string): Promise<any | null> => {
  try {
    const collections = [
      { name: SUBMISSIONS_PENDING_COLLECTION, status: "pending" },
      { name: SUBMISSIONS_ACCEPTED_COLLECTION, status: "accepted" },
      { name: SUBMISSIONS_APPROVED_COLLECTION, status: "approved" },
      { name: SUBMISSIONS_ARCHIVED_COLLECTION, status: "archived" }
    ];

    for (const collectionInfo of collections) {
      const docRef = doc(db, collectionInfo.name, submissionId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          collection: collectionInfo.status,
          status: collectionInfo.status,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate?.()?.toISOString() || docSnap.data().createdAt,
          updatedAt: docSnap.data().updatedAt?.toDate?.()?.toISOString() || docSnap.data().updatedAt,
        };
      }
    }

    return null; // Submission not found in any collection
  } catch (error) {
    console.error("Error fetching submission by ID:", error);
    throw new Error("Failed to fetch submission details");
  }
};

// Get submission documents from subcollection
export const getSubmissionDocuments = async (submissionId: string, collectionName: string): Promise<any[]> => {
  try {
    const documentsRef = collection(db, collectionName, submissionId, "documents");
    const documentsSnapshot = await getDocs(documentsRef);
    
    const documents: any[] = [];
    documentsSnapshot.forEach((doc) => {
      documents.push({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt,
        updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || doc.data().updatedAt,
      });
    });

    return documents;
  } catch (error) {
    console.error("Error fetching submission documents:", error);
    throw new Error("Failed to fetch submission documents");
  }
};

// Get complete submission with documents
export const getSubmissionWithDocuments = async (submissionId: string): Promise<any | null> => {
  try {
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      return null;
    }

    // Get collection name based on status
    const collectionMap = {
      pending: SUBMISSIONS_PENDING_COLLECTION,
      accepted: SUBMISSIONS_ACCEPTED_COLLECTION,
      approved: SUBMISSIONS_APPROVED_COLLECTION,
      archived: SUBMISSIONS_ARCHIVED_COLLECTION,
    };

    const collectionName = collectionMap[submission.status as keyof typeof collectionMap];
    const documents = await getSubmissionDocuments(submissionId, collectionName);

    return {
      ...submission,
      documents
    };
  } catch (error) {
    console.error("Error fetching complete submission:", error);
    throw new Error("Failed to fetch complete submission details");
  }
};

// ===========================
// MESSAGE FUNCTIONS
// ===========================

// Send a message to a submission
export const sendMessage = async (
  submissionId: string,
  collectionName: string,
  senderId: string,
  senderName: string,
  content: string,
  type?: MessageType
): Promise<string> => {
  try {
    const messagesRef = collection(db, collectionName, submissionId, MESSAGES_COLLECTION);
    
    const messageData: Omit<MessagesType, 'id'> = {
      senderId,
      senderName,
      content,
      createdAt: new Date().toISOString(),
      type: type || "reply",
      status: "sent"
    };

    const docRef = await addDoc(messagesRef, messageData);
    return docRef.id;
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message");
  }
};

// Get all messages for a submission
export const getSubmissionMessages = async (
  submissionId: string,
  collectionName: string
): Promise<MessagesType[]> => {
  try {
    const messagesRef = collection(db, collectionName, submissionId, MESSAGES_COLLECTION);
    const messagesQuery = query(messagesRef, orderBy("createdAt", "asc"));
    const querySnapshot = await getDocs(messagesQuery);
    
    const messages: MessagesType[] = [];
    querySnapshot.forEach((doc) => {
      messages.push({
        id: doc.id,
        ...doc.data()
      } as MessagesType);
    });

    return messages;
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw new Error("Failed to fetch messages");
  }
};

// Mark message as read
export const markMessageAsRead = async (
  submissionId: string,
  collectionName: string,
  messageId: string
): Promise<void> => {
  try {
    const messageRef = doc(db, collectionName, submissionId, MESSAGES_COLLECTION, messageId);
    await updateDoc(messageRef, {
      status: "read"
    });
  } catch (error) {
    console.error("Error marking message as read:", error);
    throw new Error("Failed to mark message as read");
  }
};

// Get unread message count for a submission
export const getUnreadMessageCount = async (
  submissionId: string,
  collectionName: string,
  userId: string
): Promise<number> => {
  try {
    const messagesRef = collection(db, collectionName, submissionId, MESSAGES_COLLECTION);
    
    // Since we can't use multiple != filters, get all messages and filter client-side
    const allMessagesQuery = query(messagesRef);
    const querySnapshot = await getDocs(allMessagesQuery);
    
    // Filter client-side for messages that are:
    // 1. Not sent by current user (senderId !== userId)
    // 2. Not read (status !== "read")
    let unreadCount = 0;
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.senderId !== userId && data.status !== "read") {
        unreadCount++;
      }
    });
    
    return unreadCount;
  } catch (error) {
    console.error("Error getting unread message count:", error);
    return 0;
  }
};

// Get messages for a submission with collection detection
export const getMessagesForSubmission = async (
  submissionId: string
): Promise<MessagesType[]> => {
  try {
    // First find which collection the submission is in
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const collectionMap = {
      pending: SUBMISSIONS_PENDING_COLLECTION,
      accepted: SUBMISSIONS_ACCEPTED_COLLECTION,
      approved: SUBMISSIONS_APPROVED_COLLECTION,
      archived: SUBMISSIONS_ARCHIVED_COLLECTION,
    };

    const collectionName = collectionMap[submission.status as keyof typeof collectionMap];
    return await getSubmissionMessages(submissionId, collectionName);
  } catch (error) {
    console.error("Error fetching messages for submission:", error);
    throw new Error("Failed to fetch messages");
  }
};

// Send message to submission with collection detection
export const sendMessageToSubmission = async (
  submissionId: string,
  senderId: string,
  senderName: string,
  content: string,
  type?: MessageType
): Promise<string> => {
  try {
    // First find which collection the submission is in
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const collectionMap = {
      pending: SUBMISSIONS_PENDING_COLLECTION,
      accepted: SUBMISSIONS_ACCEPTED_COLLECTION,
      approved: SUBMISSIONS_APPROVED_COLLECTION,
      archived: SUBMISSIONS_ARCHIVED_COLLECTION,
    };

    const collectionName = collectionMap[submission.status as keyof typeof collectionMap];
    return await sendMessage(submissionId, collectionName, senderId, senderName, content, type);
  } catch (error) {
    console.error("Error sending message to submission:", error);
    throw new Error("Failed to send message");
  }
};

// Get all submissions by status
export const getAllSubmissionsByStatus = async (status: string): Promise<any[]> => {
  try {
    const submissions: any[] = [];
    
    // Map status to collection
    const collectionMap: Record<string, string> = {
      'pending': SUBMISSIONS_PENDING_COLLECTION,
      'accepted': SUBMISSIONS_ACCEPTED_COLLECTION,
      'approved': SUBMISSIONS_APPROVED_COLLECTION,
      'archived': SUBMISSIONS_ARCHIVED_COLLECTION,
    };
    
    const collectionName = collectionMap[status];
    if (!collectionName) {
      throw new Error(`Invalid status: ${status}`);
    }
    
    const querySnapshot = await getDocs(collection(db, collectionName));
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      submissions.push({
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to serializable format
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      });
    });
    
    return submissions;
  } catch (error) {
    console.error('Error fetching submissions by status:', error);
    throw new Error('Failed to fetch submissions');
  }
};

// Accept submission and assign SPUP code (for chairperson)
export const acceptSubmission = async (
  submissionId: string,
  spupCode: string,
  acceptedBy: string
): Promise<void> => {
  try {
    // First, get the submission from pending
    const pendingRef = doc(db, SUBMISSIONS_PENDING_COLLECTION, submissionId);
    const pendingSnap = await getDoc(pendingRef);
    
    if (!pendingSnap.exists()) {
      throw new Error("Submission not found in pending collection");
    }
    
    const submissionData = pendingSnap.data();
    
    // Create the accepted submission with SPUP code
    const acceptedRef = doc(db, SUBMISSIONS_ACCEPTED_COLLECTION, submissionId);
    await setDoc(acceptedRef, {
      ...submissionData,
      status: "accepted",
      spupCode: spupCode,
      tempProtocolCode: null, // Clear temp code
      acceptedBy: acceptedBy,
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Copy documents subcollection
    const documentsRef = collection(db, SUBMISSIONS_PENDING_COLLECTION, submissionId, DOCUMENTS_COLLECTION);
    const documentsSnap = await getDocs(documentsRef);
    
    for (const docSnap of documentsSnap.docs) {
      const newDocRef = doc(db, SUBMISSIONS_ACCEPTED_COLLECTION, submissionId, DOCUMENTS_COLLECTION, docSnap.id);
      await setDoc(newDocRef, docSnap.data());
    }
    
    // Copy messages subcollection
    const messagesRef = collection(db, SUBMISSIONS_PENDING_COLLECTION, submissionId, MESSAGES_COLLECTION);
    const messagesSnap = await getDocs(messagesRef);
    
    for (const msgSnap of messagesSnap.docs) {
      const newMsgRef = doc(db, SUBMISSIONS_ACCEPTED_COLLECTION, submissionId, MESSAGES_COLLECTION, msgSnap.id);
      await setDoc(newMsgRef, msgSnap.data());
    }
    
    // Add acceptance notification message
    await sendMessage(
      submissionId,
      SUBMISSIONS_ACCEPTED_COLLECTION,
      acceptedBy,
      "REC Chairperson",
      `Your protocol has been accepted and assigned SPUP Code: ${spupCode}. You will be notified once a reviewer has been assigned.`,
      "system"
    );
    
    // Delete from pending collection
    await deleteDoc(pendingRef);
    
    // Delete pending subcollections
    for (const docSnap of documentsSnap.docs) {
      await deleteDoc(doc(db, SUBMISSIONS_PENDING_COLLECTION, submissionId, DOCUMENTS_COLLECTION, docSnap.id));
    }
    for (const msgSnap of messagesSnap.docs) {
      await deleteDoc(doc(db, SUBMISSIONS_PENDING_COLLECTION, submissionId, MESSAGES_COLLECTION, msgSnap.id));
    }
    
  } catch (error) {
    console.error("Error accepting submission:", error);
    throw new Error("Failed to accept submission");
  }
};

// Reject submission (for chairperson)
export const rejectSubmission = async (
  submissionId: string,
  rejectionReason: string,
  rejectedBy: string
): Promise<void> => {
  try {
    const pendingRef = doc(db, SUBMISSIONS_PENDING_COLLECTION, submissionId);
    
    // Update the submission status
    await updateDoc(pendingRef, {
      status: "rejected",
      rejectionReason: rejectionReason,
      rejectedBy: rejectedBy,
      rejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Add rejection notification message
    await sendMessage(
      submissionId,
      SUBMISSIONS_PENDING_COLLECTION,
      rejectedBy,
      "REC Chairperson",
      `Your protocol has been rejected. Reason: ${rejectionReason}. Please address the issues and resubmit.`,
      "system"
    );
    
  } catch (error) {
    console.error("Error rejecting submission:", error);
    throw new Error("Failed to reject submission");
  }
};

// Make protocol decision (for chairperson)
export const makeProtocolDecision = async (
  submissionId: string,
  decision: 'approved' | 'approved_minor_revisions' | 'major_revisions_deferred' | 'disapproved',
  decisionDetails: string,
  decisionBy: string,
  timeline?: string,
  documents?: File[]
): Promise<void> => {
  try {
    const acceptedRef = doc(db, SUBMISSIONS_ACCEPTED_COLLECTION, submissionId);
    
    // Update the submission with decision
    await updateDoc(acceptedRef, {
      decision: decision,
      decisionDetails: decisionDetails,
      decisionDate: serverTimestamp(),
      decisionBy: decisionBy,
      timeline: timeline,
      updatedAt: serverTimestamp()
    });
    
    // If approved, move to approved collection
    if (decision === 'approved') {
      const acceptedSnap = await getDoc(acceptedRef);
      
      if (acceptedSnap.exists()) {
        const submissionData = acceptedSnap.data();
        
        // Move to approved collection
        const approvedRef = doc(db, SUBMISSIONS_APPROVED_COLLECTION, submissionId);
        await setDoc(approvedRef, {
          ...submissionData,
          status: 'approved',
          approvedAt: serverTimestamp()
        });
        
        // Copy subcollections
        const documentsRef = collection(db, SUBMISSIONS_ACCEPTED_COLLECTION, submissionId, DOCUMENTS_COLLECTION);
        const messagesRef = collection(db, SUBMISSIONS_ACCEPTED_COLLECTION, submissionId, MESSAGES_COLLECTION);
        
        const [documentsSnap, messagesSnap] = await Promise.all([
          getDocs(documentsRef),
          getDocs(messagesRef)
        ]);
        
        // Copy documents
        for (const docSnap of documentsSnap.docs) {
          const newDocRef = doc(db, SUBMISSIONS_APPROVED_COLLECTION, submissionId, DOCUMENTS_COLLECTION, docSnap.id);
          await setDoc(newDocRef, docSnap.data());
        }
        
        // Copy messages
        for (const msgSnap of messagesSnap.docs) {
          const newMsgRef = doc(db, SUBMISSIONS_APPROVED_COLLECTION, submissionId, MESSAGES_COLLECTION, msgSnap.id);
          await setDoc(newMsgRef, msgSnap.data());
        }
        
        // Add decision notification message
        await sendMessage(
          submissionId,
          SUBMISSIONS_APPROVED_COLLECTION,
          decisionBy,
          "REC Chairperson",
          `Your protocol has been APPROVED! ${decisionDetails}`,
          "system"
        );
        
        // Delete from accepted collection
        await deleteDoc(acceptedRef);
        
        // Delete accepted subcollections
        for (const docSnap of documentsSnap.docs) {
          await deleteDoc(doc(db, SUBMISSIONS_ACCEPTED_COLLECTION, submissionId, DOCUMENTS_COLLECTION, docSnap.id));
        }
        for (const msgSnap of messagesSnap.docs) {
          await deleteDoc(doc(db, SUBMISSIONS_ACCEPTED_COLLECTION, submissionId, MESSAGES_COLLECTION, msgSnap.id));
        }
      }
    } else {
      // For other decisions, just add notification message
      const decisionText = {
        'approved_minor_revisions': 'Approved with Minor Revisions',
        'major_revisions_deferred': 'Major Revisions Required',
        'disapproved': 'Disapproved'
      }[decision];
      
      await sendMessage(
        submissionId,
        SUBMISSIONS_ACCEPTED_COLLECTION,
        decisionBy,
        "REC Chairperson",
        `Decision: ${decisionText}. ${decisionDetails}${timeline ? ` Timeline: ${timeline}` : ''}`,
        "system"
      );
    }
    
  } catch (error) {
    console.error("Error making decision:", error);
    throw new Error("Failed to make decision");
  }
}; 