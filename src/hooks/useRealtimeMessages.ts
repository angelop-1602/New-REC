import { useEffect, useState } from 'react';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import type { MessagesType } from '@/types';

const db = getFirestore(firebaseApp);

interface UseRealtimeMessagesOptions {
  submissionId: string | null;
  collectionName?: string;
  enabled?: boolean; // Enable/disable listener
}

interface UseRealtimeMessagesResult {
  messages: MessagesType[];
  loading: boolean;
  error: Error | null;
}

/**
 * Hook for real-time message updates
 * Automatically subscribes to Firestore changes and updates UI
 */
export function useRealtimeMessages({
  submissionId,
  collectionName = 'submissions',
  enabled = true,
}: UseRealtimeMessagesOptions): UseRealtimeMessagesResult {
  const [messages, setMessages] = useState<MessagesType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled || !submissionId) {
      setLoading(false);
      setMessages([]);
      return;
    }

    console.log(`🔄 Setting up real-time listener for messages in ${submissionId}`);
    
    try {
      const submissionRef = doc(db, collectionName, submissionId);
      const messagesRef = collection(submissionRef, 'messages');
      const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

      // Subscribe to real-time updates
      const unsubscribe = onSnapshot(
        messagesQuery,
        (snapshot) => {
          console.log(`💬 Messages updated: ${snapshot.docs.length} messages for ${submissionId}`);
          
          const updatedMessages: MessagesType[] = [];
          snapshot.forEach((doc) => {
            const data = doc.data();
            // Ensure all message fields are properly extracted
            const message: MessagesType = {
              id: doc.id,
              senderId: String(data.senderId || '').trim(),
              senderName: String(data.senderName || '').trim(),
              content: String(data.content || '').trim(),
              createdAt: data.createdAt || new Date().toISOString(),
              type: data.type || 'reply',
              status: data.status || 'sent',
            };
            
            // Debug: Log message data
            if (process.env.NODE_ENV === 'development') {
              console.log('📨 Message extracted from Firestore:', {
                id: message.id,
                senderId: message.senderId,
                senderName: message.senderName,
                content: message.content.substring(0, 50),
                rawData: data
              });
            }
            
            updatedMessages.push(message);
          });

          // Messages are already sorted by createdAt asc from the query
          setMessages(updatedMessages);
          setLoading(false);
          setError(null);
        },
        (err) => {
          console.error('❌ Error in real-time messages listener:', err);
          setError(err as Error);
          setLoading(false);
        }
      );

      // Cleanup subscription on unmount
      return () => {
        console.log(`🔌 Unsubscribing from messages listener for ${submissionId}`);
        unsubscribe();
      };
    } catch (err) {
      console.error('❌ Error setting up messages listener:', err);
      setError(err as Error);
      setLoading(false);
    }
  }, [submissionId, collectionName, enabled]);

  return { messages, loading, error };
}

