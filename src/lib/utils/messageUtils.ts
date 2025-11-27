import { MessagesType } from '@/types';

/**
 * Utility function to safely compare sender IDs
 * Handles various edge cases like null, undefined, whitespace, type mismatches
 */
export function isMessageFromUser(
  message: MessagesType,
  userId: string | null | undefined
): boolean {
  // If no user ID provided, message is not from user
  if (!userId) {
    return false;
  }

  // If message has no senderId, it's not from user
  if (!message.senderId) {
    return false;
  }

  // Normalize both IDs: convert to string, trim whitespace, lowercase for comparison
  const normalizedMessageSenderId = String(message.senderId).trim().toLowerCase();
  const normalizedUserId = String(userId).trim().toLowerCase();

  // Compare normalized IDs
  const isMatch = normalizedMessageSenderId === normalizedUserId && normalizedMessageSenderId !== '';

  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 Message sender comparison:', {
      messageId: message.id,
      messageSenderId: message.senderId,
      normalizedMessageSenderId,
      userId,
      normalizedUserId,
      isMatch,
      messageContent: message.content.substring(0, 30)
    });
  }

  return isMatch;
}

/**
 * Get display name for a message sender
 */
export function getMessageSenderDisplayName(
  message: MessagesType,
  currentUserId: string | null | undefined
): string {
  if (isMessageFromUser(message, currentUserId)) {
    return 'You';
  }
  return message.senderName || 'Unknown';
}

