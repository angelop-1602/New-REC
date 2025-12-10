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
  addDoc,
  writeBatch,
  WriteBatch
} from "firebase/firestore";
import { getStorage, ref, uploadBytes } from "firebase/storage";
import { InformationType, DocumentsType, MessagesType, MessageType, PendingSubmissionDoc } from "@/types";
import { uploadFile as uploadToStorage } from "@/lib/firebase/storage";
import { zipSingleFile } from "@/lib/utils/zip";
import firebaseApp from "@/lib/firebaseConfig";

const db = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

// Single submissions collection with status field
const SUBMISSIONS_COLLECTION = "submissions";
const DOCUMENTS_COLLECTION = "documents";
const MESSAGES_COLLECTION = "messages";

// Legacy collection names removed - now using single submissions collection

// Submission status types (includes legacy statuses for backward compatibility)
export type SubmissionStatus = 'pending' | 'accepted' | 'approved' | 'archived' | 'draft' | 'submitted' | 'under_review' | 'rejected';

// Export for use in other files
export { SUBMISSIONS_COLLECTION };

// Submission data structure for Firestore
export interface SubmissionData {
  applicationID: string;
  protocolCode: string;
  title: string;
  submitBy: string;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  status: SubmissionStatus; // Updated to use new status type
  information: InformationType;
  documents?: DocumentsType[];
  // Additional fields for tracking
  spupCode?: string;
  tempProtocolCode?: string;
  researchType?: string;
  acceptedBy?: string;
  acceptedAt?: Timestamp;
  approvedAt?: Timestamp;
  archivedAt?: Timestamp;
  decision?: string;
  decisionDate?: Timestamp;
  decisionBy?: string;
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
    // Normalize empty optional fields to "N/A"
    const { normalizeFormData } = await import('@/lib/utils/normalizeFormData');
    const normalizedInformation = normalizeFormData(information);
    
    // Generate custom application ID in REC_YYYY_6random format
    const applicationID = generateApplicationID();
    const submissionRef = doc(db, SUBMISSIONS_COLLECTION, applicationID);
    const tempProtocolCode = generateTempProtocolCode();
    
    const submissionData: PendingSubmissionDoc = {
      applicationID,
      tempProtocolCode,
      title: normalizedInformation.general_information.protocol_title || "Untitled Protocol",
      submitBy: userId,
      createdBy: userId,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
      status: "pending",
      information: normalizedInformation,
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
    // Normalize empty optional fields to "N/A"
    const { normalizeFormData } = await import('@/lib/utils/normalizeFormData');
    const normalizedInformation = normalizeFormData(information);
    
    const submissionRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    
    // Check if submission exists
    const submissionDoc = await getDoc(submissionRef);
    if (!submissionDoc.exists()) {
      throw new Error("Submission not found");
    }

    const updateData: Partial<SubmissionData> = {
      information: normalizedInformation,
      title: normalizedInformation.general_information.protocol_title || "Untitled Protocol",
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
  const uploadedFiles: string[] = [];

  try {
    // Step 1: Create submission first
    submissionId = await createSubmission(userId, information);

    // Step 1.5: Verify submission exists in Firestore before uploading
    // This ensures Storage security rules can verify the submission exists
    // Retry up to 5 times with increasing delays (more retries for Firestore consistency)
    let submissionExists = false;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const submissionDoc = await getDoc(doc(db, SUBMISSIONS_COLLECTION, submissionId));
        const data = submissionDoc.data();
        
        if (submissionDoc.exists() && data && data.submitBy === userId) {
          submissionExists = true;
          console.log(`✅ Submission ${submissionId} verified successfully on attempt ${attempt + 1}`);
          break;
        } else {
          console.warn(`⚠️ Attempt ${attempt + 1}: Submission exists but submitBy mismatch or missing data`);
        }
      } catch (error) {
        lastError = error as Error;
        console.warn(`⚠️ Attempt ${attempt + 1} to verify submission failed:`, error);
      }
      
      // Wait before retry (exponential backoff: 500ms, 1000ms, 1500ms, 2000ms)
      if (attempt < 4) {
        const delay = 500 * (attempt + 1);
        console.log(`⏳ Waiting ${delay}ms before retry ${attempt + 2}...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (!submissionExists) {
      console.error(`❌ Failed to verify submission ${submissionId} after 5 attempts`);
      console.error('Last error:', lastError);
      throw new Error(`Failed to verify submission was created. Please try again. Last error: ${lastError?.message || 'Unknown'}`);
    }

    // Step 2: Upload documents if any exist
    // Filter out documents without valid file references (due to localStorage serialization)
    const documentsWithFiles = documents.filter(doc => doc._fileRef instanceof File);
    const skippedCount = documents.length - documentsWithFiles.length;
    
    if (skippedCount > 0) {
      console.warn(`${skippedCount} documents skipped due to missing file references (likely restored from localStorage)`);
    }
    
    if (documentsWithFiles.length > 0) {
      const uploadedDocuments: DocumentsType[] = [];

      for (const document of documentsWithFiles) {
        if (document._fileRef) {
          try {
            
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
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
          } catch (uploadError) {
            console.error(`Error uploading document ${document.id}:`, uploadError);
            throw new Error(`Failed to upload document "${document.title}": ${uploadError instanceof Error ? uploadError.message : 'Unknown error'}`);
          }
        }
      }

      // Step 3: Save document metadata to subcollection
      const documentsRef = collection(db, SUBMISSIONS_COLLECTION, submissionId, DOCUMENTS_COLLECTION);
      
      for (const document of uploadedDocuments) {
        await setDoc(doc(documentsRef, document.id), document);
      }

      // Step 4: Update submission timestamp
      await updateDoc(doc(db, SUBMISSIONS_COLLECTION, submissionId), {
        updatedAt: serverTimestamp(),
      });
    }

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
    
    // Delete uploaded files from Storage
    if (uploadedFiles.length > 0) {
      const { getStorage, ref, deleteObject } = await import("firebase/storage");
      const storage = getStorage();
      
      for (const filePath of uploadedFiles) {
        try {
          await deleteObject(ref(storage, filePath));
        } catch (deleteError) {
          console.warn(`Failed to delete file ${filePath}:`, deleteError);
        }
      }
    }

    // Delete submission document from Firestore
    if (submissionId) {
      try {
        await deleteDoc(doc(db, SUBMISSIONS_COLLECTION, submissionId));
      } catch (deleteError) {
        console.warn(`Failed to delete submission ${submissionId}:`, deleteError);
      }
    }
    
  } catch (cleanupError) {
    console.error("Error during cleanup:", cleanupError);
  }
};

// Get all user submissions from all collections for dashboard (no indexes required)
export const getAllUserSubmissions = async (userId: string): Promise<any[]> => {
  try {
    const submissions: any[] = [];
    
    // Query all submissions for user from single collection
    const submissionsQuery = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where("submitBy", "==", userId)
    );
    const snapshot = await getDocs(submissionsQuery);
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      submissions.push({
        id: doc.id,
        collection: data.status || "pending", // For backward compatibility
        ...data,
        createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt,
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
    // Query single collection
    const docRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        collection: data.status || "pending", // For backward compatibility
        ...data,
        createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt,
      };
    }

    return null; // Submission not found
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
        createdAt: doc.data().createdAt && typeof doc.data().createdAt === 'object' && 'toDate' in doc.data().createdAt && typeof doc.data().createdAt.toDate === 'function' ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt,
        updatedAt: doc.data().updatedAt && typeof doc.data().updatedAt === 'object' && 'toDate' in doc.data().updatedAt && typeof doc.data().updatedAt.toDate === 'function' ? doc.data().updatedAt.toDate().toISOString() : doc.data().updatedAt,
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

    // Get documents from single collection's subcollection
    const documents = await getSubmissionDocuments(submissionId, SUBMISSIONS_COLLECTION);

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
    
    // Ensure all required metadata is present
    if (!senderId || !senderName) {
      throw new Error("senderId and senderName are required");
    }
    
    const messageData: Omit<MessagesType, 'id'> = {
      senderId: senderId.trim(), // Ensure no whitespace
      senderName: senderName.trim(), // Ensure no whitespace
      content: content.trim(),
      createdAt: new Date().toISOString(),
      type: type || "reply",
      status: "sent"
    };

    const docRef = await addDoc(messagesRef, messageData);
    
    // Update protocol activity when message is sent
    try {
      const { updateProtocolActivity } = await import("@/lib/services/core/archivingService");
      await updateProtocolActivity(submissionId);
    } catch (activityError) {
      // Non-critical error, don't fail the message send
      console.warn("Failed to update protocol activity:", activityError);
    }
    
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

// Mark all messages as read for a submission (convenience function)
export const markAllMessagesAsRead = async (
  submissionId: string,
  userId: string
): Promise<void> => {
  try {
    const messagesRef = collection(db, SUBMISSIONS_COLLECTION, submissionId, MESSAGES_COLLECTION);
    const messagesQuery = query(messagesRef);
    const querySnapshot = await getDocs(messagesQuery);
    
    const updatePromises: Promise<void>[] = [];
    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      // Only mark messages as read if they're not sent by the current user and not already read
      if (data.senderId !== userId && data.status !== "read") {
        const messageRef = doc(db, SUBMISSIONS_COLLECTION, submissionId, MESSAGES_COLLECTION, docSnap.id);
        updatePromises.push(
          updateDoc(messageRef, {
            status: "read"
          }).then(() => {
          })
        );
      }
    });
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Error marking all messages as read:", error);
    throw new Error("Failed to mark messages as read");
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
    // Verify submission exists
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Use single collection
    return await getSubmissionMessages(submissionId, SUBMISSIONS_COLLECTION);
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
    // Verify submission exists
    const submission = await getSubmissionById(submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Use single collection
    return await sendMessage(submissionId, SUBMISSIONS_COLLECTION, senderId, senderName, content, type);
  } catch (error) {
    console.error("Error sending message to submission:", error);
    throw new Error("Failed to send message");
  }
};

// Get all submissions by status
export const getAllSubmissionsByStatus = async (status: SubmissionStatus): Promise<any[]> => {
  try {
    const submissions: any[] = [];
    
    // Query single collection filtered by status
    const statusQuery = query(
      collection(db, SUBMISSIONS_COLLECTION),
      where("status", "==", status)
    );
    const querySnapshot = await getDocs(statusQuery);
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      submissions.push({
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to serializable format
        createdAt: data.createdAt && typeof data.createdAt === 'object' && 'toDate' in data.createdAt && typeof data.createdAt.toDate === 'function' ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt && typeof data.updatedAt === 'object' && 'toDate' in data.updatedAt && typeof data.updatedAt.toDate === 'function' ? data.updatedAt.toDate().toISOString() : data.updatedAt,
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
  acceptedBy: string,
  researchType: string = 'SR'
): Promise<void> => {
  try {
    // Simply update submission status in single collection (no transfer needed)
    const submissionRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    await updateDoc(submissionRef, {
      status: "accepted" as SubmissionStatus,
      spupCode: spupCode,
      researchType: researchType,
      tempProtocolCode: null, // Clear temp code
      acceptedBy: acceptedBy,
      acceptedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Add acceptance notification message
    const researchTypeNames = {
      'SR': 'Social/Behavioral Research',
      'PR': 'Public Health Research', 
      'HO': 'Health Operations',
      'BS': 'Biomedical Research',
      'EX': 'Exempted from Review'
    };
    const typeName = researchTypeNames[researchType as keyof typeof researchTypeNames] || researchType;
    
    await sendMessage(
      submissionId,
      SUBMISSIONS_COLLECTION,
      acceptedBy,
      "REC Chairperson",
      `Your protocol has been accepted and assigned SPUP Code: ${spupCode} (${typeName}). You will be notified once a reviewer has been assigned.`,
      "system"
    );
    
    // Update protocol activity
    try {
      const { updateProtocolActivity } = await import("@/lib/services/core/archivingService");
      await updateProtocolActivity(submissionId);
    } catch (activityError) {
      console.warn("Failed to update protocol activity:", activityError);
    }
    
    // Invalidate analytics cache (protocol status changed)
    try {
      const { invalidateAnalyticsCache } = await import("@/lib/services/analytics/analyticsCache");
      await invalidateAnalyticsCache();
    } catch (cacheError) {
      console.warn("Failed to invalidate analytics cache:", cacheError);
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
    const submissionRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    
    // Update the submission status
    await updateDoc(submissionRef, {
      status: "rejected" as SubmissionStatus,
      rejectionReason: rejectionReason,
      rejectedBy: rejectedBy,
      rejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    // Add rejection notification message
    await sendMessage(
      submissionId,
      SUBMISSIONS_COLLECTION,
      rejectedBy,
      "REC Chairperson",
      `Your protocol has been rejected. Reason: ${rejectionReason}. Please address the issues and resubmit.`,
      "system"
    );
    
    // Update protocol activity
    try {
      const { updateProtocolActivity } = await import("@/lib/services/core/archivingService");
      await updateProtocolActivity(submissionId);
    } catch (activityError) {
      console.warn("Failed to update protocol activity:", activityError);
    }
    
    // Invalidate analytics cache (protocol status changed)
    try {
      const { invalidateAnalyticsCache } = await import("@/lib/services/analytics/analyticsCache");
      await invalidateAnalyticsCache();
    } catch (cacheError) {
      console.warn("Failed to invalidate analytics cache:", cacheError);
    }
    
  } catch (error) {
    console.error("Error rejecting submission:", error);
    throw new Error("Failed to reject submission");
  }
};

/**
 * Generate sequential meeting reference number for full board decisions
 * Format: sequential-mm-yyyy (e.g., 001-03-2025)
 */
const generateMeetingReference = async (month: number, year: number): Promise<string> => {
  try {
    // Query all submissions to find decisions with meeting references for this month-year
    const submissionsRef = collection(db, SUBMISSIONS_COLLECTION);
    const submissionsSnapshot = await getDocs(submissionsRef);
    
    let maxSequence = 0;
    const monthYearPattern = `-${month.toString().padStart(2, '0')}-${year}`;
    
    for (const submissionDoc of submissionsSnapshot.docs) {
      try {
        const decisionRef = doc(db, SUBMISSIONS_COLLECTION, submissionDoc.id, 'decision', 'details');
        const decisionSnap = await getDoc(decisionRef);
        
        if (decisionSnap.exists()) {
          const decisionData = decisionSnap.data();
          const meetingRef = decisionData.meetingReference;
          
          if (meetingRef && typeof meetingRef === 'string' && meetingRef.includes(monthYearPattern)) {
            // Extract sequence number (before the first dash)
            const sequenceMatch = meetingRef.match(/^(\d+)/);
            if (sequenceMatch) {
              const sequence = parseInt(sequenceMatch[1], 10);
              if (sequence > maxSequence) {
                maxSequence = sequence;
              }
            }
          }
        }
      } catch {
        // Skip if decision doesn't exist or error reading
        continue;
      }
    }
    
    // Return next sequential number
    const nextSequence = (maxSequence + 1).toString().padStart(3, '0');
    return `${nextSequence}-${month.toString().padStart(2, '0')}-${year}`;
  } catch (error) {
    console.error('Error generating meeting reference:', error);
    // Fallback: use current date as sequence
    const fallbackSequence = new Date().getDate().toString().padStart(3, '0');
    return `${fallbackSequence}-${month.toString().padStart(2, '0')}-${year}`;
  }
};

// Make protocol decision (for chairperson)
export const makeProtocolDecision = async (
  submissionId: string,
  decision: 'approved' | 'approved_minor_revisions' | 'major_revisions_deferred' | 'disapproved' | 'deferred',
  decisionDetails: string,
  decisionBy: string,
  timeline?: string,
  documents?: File[],
  meetingMonth?: number,
  meetingYear?: number
): Promise<void> => {
  try {
    // Upload documents to decision subfolder if provided
    const uploadedDocuments = [];
    if (documents && documents.length > 0) {
      for (const file of documents) {
        const fileName = `decision_documents/${file.name}`;
        const storageRef = ref(storage, `submissions/${submissionId}/${fileName}`);
        await uploadBytes(storageRef, file);
        
        // Add document info to array
        // Note: Cannot use serverTimestamp() inside arrays - use Timestamp.now() instead
        uploadedDocuments.push({
          fileName: file.name,
          storagePath: `submissions/${submissionId}/${fileName}`,
          uploadedAt: Timestamp.now(), // Fixed: Use Timestamp.now() instead of serverTimestamp()
          uploadedBy: decisionBy,
          fileSize: file.size,
          fileType: file.type
        });
      }
    }

    // Get submission to check if it's full board review
    const submissionRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    const submissionSnap = await getDoc(submissionRef);
    const submissionData = submissionSnap.exists() ? submissionSnap.data() : null;
    
    // Check if this is a full board review (typeOfReview === 'full')
    const typeOfReview = submissionData?.information?.general_information?.typeOfReview || 
                         submissionData?.typeOfReview || '';
    const isFullBoard = typeOfReview?.toString().toLowerCase() === 'full' || 
                        typeOfReview?.toString().toLowerCase() === 'full board';
    
    // Generate meeting reference for full board decisions if month/year provided
    let meetingReference: string | undefined;
    if (isFullBoard && meetingMonth && meetingYear) {
      meetingReference = await generateMeetingReference(meetingMonth, meetingYear);
    }
    
    // Create comprehensive decision subcollection structure
    const decisionDetailsRef = doc(db, SUBMISSIONS_COLLECTION, submissionId, 'decision', 'details');
    const decisionData: any = {
      decision: decision,
      decisionDetails: decisionDetails,
      decisionDate: serverTimestamp(),
      decisionBy: decisionBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    // Only add timeline if it's not undefined or empty
    if (timeline && timeline.trim()) {
      decisionData.timeline = timeline;
    }
    
    // Add meeting reference for full board decisions
    if (meetingReference) {
      decisionData.meetingReference = meetingReference;
    }
    
    // Add documents array to decision data if documents were uploaded
    if (uploadedDocuments.length > 0) {
      decisionData.documents = uploadedDocuments;
    }
    
    await setDoc(decisionDetailsRef, decisionData);
    
    // Update the submission with decision status and set appropriate status
    const updateData: any = {
      decision: decision,
      decisionDate: serverTimestamp(),
      decisionBy: decisionBy,
      updatedAt: serverTimestamp()
    };
    
    // Update status field based on decision
    if (decision === 'approved') {
      updateData.status = 'approved' as SubmissionStatus;
      updateData.approvedAt = serverTimestamp();
    }
    // For revisions, disapproved, or deferred, keep status as 'accepted' (awaiting resubmission)
    
    // Only add timeline if it's not undefined or empty
    if (timeline && timeline.trim()) {
      updateData.timeline = timeline;
    }
    
    // Add meeting reference to submission if present
    if (meetingReference) {
      updateData.meetingReference = meetingReference;
    }
    
    await updateDoc(submissionRef, updateData);
    
    // Send notification message based on decision
    const decisionText = {
      'approved': 'Approved',
      'approved_minor_revisions': 'Approved with Minor Revisions',
      'major_revisions_deferred': 'Major Revisions Required',
      'disapproved': 'Disapproved',
      'deferred': 'Deferred'
    }[decision];
    
    let message = `Decision: ${decisionText}.`;
    if (decision === 'approved') {
      message += ` ${decisionDetails}`;
    } else {
      message += ` ${decisionDetails}${timeline ? ` Timeline: ${timeline}` : ''}`;
    }
    
    await sendMessage(
      submissionId,
      SUBMISSIONS_COLLECTION,
      decisionBy,
      "REC Chairperson",
      message,
      "system"
    );
    
    // Invalidate analytics cache (protocol decision made)
    try {
      const { invalidateAnalyticsCache } = await import("@/lib/services/analytics/analyticsCache");
      await invalidateAnalyticsCache();
    } catch (cacheError) {
      console.warn("Failed to invalidate analytics cache:", cacheError);
    }
    
  } catch (error) {
    console.error("Error making decision:", error);
    throw new Error("Failed to make decision");
  }
};

/**
 * @deprecated No longer needed - we now use status field instead of collection transfer
 * Robust protocol transfer system from accepted to approved collection
 * Copies ALL subcollections to prevent data loss
 */
export const transferProtocolToApproved = async (
  submissionId: string,
  decisionBy: string,
  decisionDetails: string
): Promise<void> => {
  const batch = writeBatch(db);
  const transferLog: string[] = [];
  
  try {
    
    // Get the main submission document
    const acceptedRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    const acceptedSnap = await getDoc(acceptedRef);
    
    if (!acceptedSnap.exists()) {
      throw new Error(`Submission ${submissionId} not found in accepted collection`);
    }
    
    const submissionData = acceptedSnap.data();
    transferLog.push(`✅ Main submission document retrieved`);
    
    // Create approved document
    const approvedRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    batch.set(approvedRef, {
      ...submissionData,
      status: 'approved',
      approvedAt: serverTimestamp(),
      transferredAt: serverTimestamp(),
      transferredBy: decisionBy
    });
    transferLog.push(`✅ Main submission document prepared for approved collection`);
    
    // Define all subcollections to copy
    const subcollections = [
      { name: DOCUMENTS_COLLECTION, type: 'collection' },
      { name: MESSAGES_COLLECTION, type: 'collection' },
      { name: 'reviewers', type: 'collection' },
      { name: 'decision/details', type: 'document' } // Fixed: Must have even segments (4 not 3)
    ];
    
    // Copy each subcollection
    for (const subcollection of subcollections) {
      if (subcollection.type === 'collection') {
        await copySubcollection(
          submissionId, 
          subcollection.name, 
          batch, 
          transferLog
        );
      } else if (subcollection.type === 'document') {
        await copyDocument(
          submissionId, 
          subcollection.name, 
          batch, 
          transferLog
        );
      }
    }
    
    // Copy assessment forms (nested under reviewers)
    await copyAssessmentForms(submissionId, batch, transferLog);
    
    // Commit all changes
    await batch.commit();
    transferLog.push(`✅ All data successfully transferred to approved collection`);
    
    // Add decision notification message
    await sendMessage(
      submissionId,
      SUBMISSIONS_COLLECTION,
      decisionBy,
      "REC Chairperson",
      `Your protocol has been APPROVED! ${decisionDetails}`,
      "system"
    );
    transferLog.push(`✅ Decision notification sent`);
    
    // Clean up accepted collection
    await cleanupAcceptedCollection(submissionId, transferLog);
    
    
  } catch (error) {
    console.error(`❌ Transfer failed for ${submissionId}:`, error);
    console.error('Transfer log:', transferLog);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to transfer protocol: ${errorMessage}`);
  }
};

/**
 * Copy a subcollection from accepted to approved
 */
const copySubcollection = async (
  submissionId: string,
  subcollectionName: string,
  batch: WriteBatch,
  transferLog: string[]
): Promise<void> => {
  try {
    const sourceRef = collection(db, SUBMISSIONS_COLLECTION, submissionId, subcollectionName);
    const sourceSnap = await getDocs(sourceRef);
    
    if (sourceSnap.empty) {
      transferLog.push(`ℹ️ No documents found in ${subcollectionName}`);
      return;
    }
    
    for (const docSnap of sourceSnap.docs) {
      const targetRef = doc(db, SUBMISSIONS_COLLECTION, submissionId, subcollectionName, docSnap.id);
      batch.set(targetRef, docSnap.data());
    }
    
    transferLog.push(`✅ Copied ${sourceSnap.docs.length} documents from ${subcollectionName}`);
  } catch (error) {
    console.error(`Error copying ${subcollectionName}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    transferLog.push(`❌ Failed to copy ${subcollectionName}: ${errorMessage}`);
    throw error;
  }
};

/**
 * Copy a document from accepted to approved
 */
const copyDocument = async (
  submissionId: string,
  documentPath: string,
  batch: WriteBatch,
  transferLog: string[]
): Promise<void> => {
  try {
    // documentPath should be like "decision/details" - splits into subcollection and doc
    const pathParts = documentPath.split('/');
    const sourceRef = doc(db, SUBMISSIONS_COLLECTION, submissionId, ...pathParts);
    const sourceSnap = await getDoc(sourceRef);
    
    if (!sourceSnap.exists()) {
      transferLog.push(`ℹ️ Document ${documentPath} not found`);
      return;
    }
    
    const targetRef = doc(db, SUBMISSIONS_COLLECTION, submissionId, ...pathParts);
    batch.set(targetRef, sourceSnap.data());
    
    transferLog.push(`✅ Copied document ${documentPath}`);
  } catch (error) {
    console.error(`Error copying document ${documentPath}:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    transferLog.push(`❌ Failed to copy ${documentPath}: ${errorMessage}`);
    throw error;
  }
};

/**
 * Copy assessment forms (nested under reviewers)
 */
const copyAssessmentForms = async (
  submissionId: string,
  batch: WriteBatch,
  transferLog: string[]
): Promise<void> => {
  try {
    const reviewersRef = collection(db, SUBMISSIONS_COLLECTION, submissionId, 'reviewers');
    const reviewersSnap = await getDocs(reviewersRef);
    
    if (reviewersSnap.empty) {
      transferLog.push(`ℹ️ No reviewers found`);
      return;
    }
    
    let totalFormsCopied = 0;
    
    for (const reviewerSnap of reviewersSnap.docs) {
      const assessmentFormsRef = collection(db, SUBMISSIONS_COLLECTION, submissionId, 'reviewers', reviewerSnap.id, 'assessment_forms');
      const assessmentFormsSnap = await getDocs(assessmentFormsRef);
      
      if (!assessmentFormsSnap.empty) {
        for (const formSnap of assessmentFormsSnap.docs) {
          const targetRef = doc(db, SUBMISSIONS_COLLECTION, submissionId, 'reviewers', reviewerSnap.id, 'assessment_forms', formSnap.id);
          batch.set(targetRef, formSnap.data());
          totalFormsCopied++;
        }
      }
    }
    
    transferLog.push(`✅ Copied ${totalFormsCopied} assessment forms from ${reviewersSnap.docs.length} reviewers`);
  } catch (error) {
    console.error(`Error copying assessment forms:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    transferLog.push(`❌ Failed to copy assessment forms: ${errorMessage}`);
    throw error;
  }
};

/**
 * Clean up accepted collection after successful transfer
 */
const cleanupAcceptedCollection = async (
  submissionId: string,
  transferLog: string[]
): Promise<void> => {
  try {
    const batch = writeBatch(db);
    
    // Delete main document
    const acceptedRef = doc(db, SUBMISSIONS_COLLECTION, submissionId);
    batch.delete(acceptedRef);
    
    // Delete all subcollections
    const subcollections = [DOCUMENTS_COLLECTION, MESSAGES_COLLECTION, 'reviewers', 'decision'];
    
    for (const subcollectionName of subcollections) {
      const subcollectionRef = collection(db, SUBMISSIONS_COLLECTION, submissionId, subcollectionName);
      const subcollectionSnap = await getDocs(subcollectionRef);
      
      for (const docSnap of subcollectionSnap.docs) {
        batch.delete(docSnap.ref);
      }
    }
    
    // Delete assessment forms
    const reviewersRef = collection(db, SUBMISSIONS_COLLECTION, submissionId, 'reviewers');
    const reviewersSnap = await getDocs(reviewersRef);
    
    for (const reviewerSnap of reviewersSnap.docs) {
      const assessmentFormsRef = collection(db, SUBMISSIONS_COLLECTION, submissionId, 'reviewers', reviewerSnap.id, 'assessment_forms');
      const assessmentFormsSnap = await getDocs(assessmentFormsRef);
      
      for (const formSnap of assessmentFormsSnap.docs) {
        batch.delete(formSnap.ref);
      }
    }
    
    await batch.commit();
    transferLog.push(`✅ Cleaned up accepted collection`);
  } catch (error) {
    console.error(`Error cleaning up accepted collection:`, error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    transferLog.push(`❌ Failed to clean up accepted collection: ${errorMessage}`);
    // Don't throw error here as the transfer was successful
  }
}; 