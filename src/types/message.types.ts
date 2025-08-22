// ===========================
// MESSAGE/COMMENT TYPES
// ===========================

/**
 * Represents a single message, comment, or note in the system.
 * Can be used for general chat, reviewer notes, audit trails, etc.
 */
export interface MessagesType {
    id: string;           // Unique message ID (e.g., Firestore doc ID, uuid)
    senderId: string;     // User ID of sender (e.g., proponent, reviewer, admin)
    senderName?: string;  // Optional: Sender's name (for easy display, caching)
    content: string;      // Message content/text
    createdAt: string;    // ISO timestamp when sent/created
    type?: MessageType;   // Optional: Message type (e.g. "system", "private", etc.)
    status?: MessageStatus;// Optional: For workflow (e.g., "read", "delivered", "sent")
  }
  
  /**
   * Type of message, if you want to distinguish system notes, review comments, chat, etc.
   */
  export type MessageType =
    | "system"       // System-generated message (e.g., status change)
    | "private"      // Visible only to reviewers/admin
    | "reply";       // Reply to another message

  export type MessageStatus =
    | "sent"
    | "delivered"
    | "read"
