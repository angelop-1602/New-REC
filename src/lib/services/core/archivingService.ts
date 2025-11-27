import { 
  doc, 
  updateDoc, 
  getDoc, 
  serverTimestamp,
  Timestamp,
  query,
  where,
  getDocs,
  collection
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";
import firebaseApp from "@/lib/firebaseConfig";
import { SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore";
import { sendMessage } from "@/lib/firebase/firestore";
import { toDate } from '@/types';

const db = getFirestore(firebaseApp);

export type ArchiveReason = 
  | "final_report_approved" 
  | "no_submission_3_months" 
  | "early_termination" 
  | "no_activity_3_years";

export interface ArchivingCheckResult {
  shouldArchive: boolean;
  reason?: ArchiveReason;
  details?: string;
}

/**
 * Check if a protocol should be archived based on the 4 archiving conditions
 */
export async function checkArchivingConditions(protocolId: string): Promise<ArchivingCheckResult> {
  try {
    const protocolRef = doc(db, SUBMISSIONS_COLLECTION, protocolId);
    const protocolSnap = await getDoc(protocolRef);
    
    if (!protocolSnap.exists()) {
      return { shouldArchive: false };
    }
    
    const protocol = protocolSnap.data();
    const now = new Date();
    
    // Condition 1: Final Report Approved
    if (protocol.finalReport?.status === "approved") {
      return {
        shouldArchive: true,
        reason: "final_report_approved",
        details: "Final report has been approved by REC"
      };
    }
    
    // Condition 2: No Submission Within 3 Months
    // Check if there are overdue deadlines that are more than 3 months old
    // Also check for revision requests, document requests that are overdue
    if (protocol.deadlines && Array.isArray(protocol.deadlines)) {
      const threeMonthsAgo = new Date(now);
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      
      const overdueDeadlines = protocol.deadlines.filter((deadline: any) => {
        if (deadline.status === "completed") {
          return false;
        }
        
        const dueDate = toDate(deadline.dueDate);
        
        if (!dueDate) return false;
        
        // Check if deadline is more than 3 months old
        return dueDate < threeMonthsAgo;
      });
      
      if (overdueDeadlines.length > 0) {
        return {
          shouldArchive: true,
          reason: "no_submission_3_months",
          details: `Required submission(s) overdue for more than 3 months: ${overdueDeadlines.map((d: any) => d.type || "submission").join(", ")}`
        };
      }
    }
    
    // Also check for revision requests or document requests that are overdue
    // Check decision date and if revision was requested but not submitted
    if (protocol.decision && protocol.decisionDate) {
      const decisionDate = toDate(protocol.decisionDate);
      
      if (decisionDate) {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
        
        // Check if decision requires revision and no resubmission happened
        const requiresRevision = protocol.decision === 'approved_minor_revisions' || 
                                 protocol.decision === 'major_revisions_deferred' ||
                                 protocol.decision === 'returned';
        
        if (requiresRevision && decisionDate < threeMonthsAgo) {
          // Check if there was a resubmission after the decision
          const updatedDate = toDate(protocol.updatedAt);
          
          // If updated date is not significantly after decision date, no resubmission
          if (!updatedDate || updatedDate.getTime() <= decisionDate.getTime() + (24 * 60 * 60 * 1000)) {
            return {
              shouldArchive: true,
              reason: "no_submission_3_months",
              details: `Revision requested but not submitted within 3 months (decision date: ${decisionDate.toLocaleDateString()})`
            };
          }
        }
      }
    }
    
    // Condition 3: Early Termination
    // Check if there's an early termination report that's approved
    if (protocol.earlyTerminationReport?.status === "approved") {
      return {
        shouldArchive: true,
        reason: "early_termination",
        details: "Early termination report has been approved"
      };
    }
    
    // Condition 4: No Activity for 3 Years
    // Check last activity date (updatedAt or last activity timestamp)
    const lastActivityDate = toDate(protocol.lastActivityDate) || toDate(protocol.updatedAt) || toDate(protocol.createdAt);
    
    if (lastActivityDate) {
      const threeYearsAgo = new Date(now);
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      
      if (lastActivityDate < threeYearsAgo) {
        return {
          shouldArchive: true,
          reason: "no_activity_3_years",
          details: `No activity for more than 3 years (last activity: ${lastActivityDate.toLocaleDateString()})`
        };
      }
    }
    
    return { shouldArchive: false };
  } catch (error) {
    console.error("Error checking archiving conditions:", error);
    return { shouldArchive: false };
  }
}

/**
 * Archive a protocol based on the archiving reason
 */
export async function archiveProtocol(
  protocolId: string,
  reason: ArchiveReason,
  details?: string,
  archivedBy?: string
): Promise<void> {
  try {
    const protocolRef = doc(db, SUBMISSIONS_COLLECTION, protocolId);
    const protocolSnap = await getDoc(protocolRef);
    
    if (!protocolSnap.exists()) {
      throw new Error("Protocol not found");
    }
    
    const protocol = protocolSnap.data();
    
    // Determine archive status based on reason
    let archiveStatus: "completed" | "terminated" | "expired" = "completed";
    let archiveReason: "completed" | "terminated_by_researcher" | "terminated_by_rec" | "expired" = "completed";
    
    if (reason === "final_report_approved") {
      archiveStatus = "completed";
      archiveReason = "completed";
    } else if (reason === "early_termination") {
      archiveStatus = "terminated";
      archiveReason = "terminated_by_researcher";
    } else if (reason === "no_submission_3_months" || reason === "no_activity_3_years") {
      archiveStatus = "expired";
      archiveReason = reason === "no_submission_3_months" ? "terminated_by_rec" : "expired";
    }
    
    // Update protocol status to archived
    await updateDoc(protocolRef, {
      status: "archived",
      archivedAt: serverTimestamp(),
      archiveReason: archiveReason,
      archiveStatus: archiveStatus,
      archiveDetails: details || "",
      archivedBy: archivedBy || "system",
      updatedAt: serverTimestamp()
    });
    
    // Send notification message to proponent
    const protocolCode = protocol.spupCode || protocol.tempProtocolCode || protocol.applicationID;
    const reasonMessages: Record<ArchiveReason, string> = {
      final_report_approved: "Your protocol has been archived because the final report was approved. The study is now complete.",
      no_submission_3_months: "Your protocol has been archived due to non-compliance. Required submissions were not provided within 3 months.",
      early_termination: "Your protocol has been archived due to early termination of the study.",
      no_activity_3_years: "Your protocol has been archived due to inactivity. No activity has been recorded for 3 years."
    };
    
    await sendMessage(
      protocolId,
      SUBMISSIONS_COLLECTION,
      archivedBy || "system",
      "REC Chairperson",
      `Protocol ${protocolCode} has been archived. ${reasonMessages[reason]} ${details ? `Details: ${details}` : ""}`,
      "system"
    );
    
    console.log(`✅ Protocol ${protocolId} archived with reason: ${reason}`);
  } catch (error) {
    console.error("Error archiving protocol:", error);
    throw new Error("Failed to archive protocol");
  }
}

/**
 * Check and archive protocols that meet archiving conditions
 * This can be called periodically or when protocols are accessed
 */
export async function checkAndArchiveProtocols(protocolIds?: string[]): Promise<{
  checked: number;
  archived: number;
  results: Array<{ protocolId: string; archived: boolean; reason?: ArchiveReason }>;
}> {
  try {
    let protocolsToCheck: string[] = [];
    
    if (protocolIds && protocolIds.length > 0) {
      // Check specific protocols
      protocolsToCheck = protocolIds;
    } else {
      // Check all non-archived protocols
      const protocolsRef = collection(db, SUBMISSIONS_COLLECTION);
      const nonArchivedQuery = query(
        protocolsRef,
        where("status", "in", ["pending", "accepted", "approved", "under_review"])
      );
      const snapshot = await getDocs(nonArchivedQuery);
      protocolsToCheck = snapshot.docs.map(doc => doc.id);
    }
    
    const results: Array<{ protocolId: string; archived: boolean; reason?: ArchiveReason }> = [];
    let archivedCount = 0;
    
    for (const protocolId of protocolsToCheck) {
      const checkResult = await checkArchivingConditions(protocolId);
      
      if (checkResult.shouldArchive && checkResult.reason) {
        try {
          await archiveProtocol(protocolId, checkResult.reason, checkResult.details);
          results.push({ protocolId, archived: true, reason: checkResult.reason });
          archivedCount++;
        } catch (error) {
          console.error(`Failed to archive protocol ${protocolId}:`, error);
          results.push({ protocolId, archived: false });
        }
      } else {
        results.push({ protocolId, archived: false });
      }
    }
    
    return {
      checked: protocolsToCheck.length,
      archived: archivedCount,
      results
    };
  } catch (error) {
    console.error("Error checking and archiving protocols:", error);
    throw new Error("Failed to check and archive protocols");
  }
}

/**
 * Update last activity date for a protocol
 * Call this whenever there's activity (submission, message, document upload, etc.)
 */
export async function updateProtocolActivity(protocolId: string): Promise<void> {
  try {
    const protocolRef = doc(db, SUBMISSIONS_COLLECTION, protocolId);
    await updateDoc(protocolRef, {
      lastActivityDate: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error updating protocol activity:", error);
  }
}

