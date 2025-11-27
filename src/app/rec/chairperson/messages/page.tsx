"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Search, Send, FileText } from 'lucide-react';
import { PageLoading, InlineLoading } from '@/components/ui/loading';
import { useAuth } from '@/hooks/useAuth';
import { MessagesType } from '@/types';
import { getMessagesForSubmission, sendMessageToSubmission, markAllMessagesAsRead } from '@/lib/firebase/firestore';
import { useRealtimeProtocols } from '@/hooks/useRealtimeProtocols';
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages';
import { format } from 'date-fns';
import { 
  toChairpersonProtocols,
  getProtocolTitle,
  getProtocolCode,
  getPIName
} from '@/types';
import { cn } from '@/lib/utils';
import { collection, doc, onSnapshot, query, orderBy } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import firebaseApp from '@/lib/firebaseConfig';
import { isMessageFromUser, getMessageSenderDisplayName } from '@/lib/utils/messageUtils';

const db = getFirestore(firebaseApp);

interface ProtocolConversation {
  protocolId: string;
  protocolTitle: string;
  protocolCode: string;
  principalInvestigatorName: string;
  lastMessage?: MessagesType;
  unreadCount: number;
  messages: MessagesType[];
}

export default function MessagesPage() {
  const { user } = useAuth();
  
  // Use Firebase Auth user (chairperson should be auto-logged in via layout)
  const currentUserId = user?.uid;
  const currentUserName = user?.displayName || user?.email || 'REC Chairperson';
  const [conversations, setConversations] = useState<ProtocolConversation[]>([]);
  const [selectedProtocolId, setSelectedProtocolId] = useState<string | null>(null);
  const [selectedMessages, setSelectedMessages] = useState<MessagesType[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Get all protocols
  const { protocols, loading: protocolsLoading } = useRealtimeProtocols({});

  // Real-time messages for selected conversation
  const { messages: realtimeMessages } = useRealtimeMessages({
    submissionId: selectedProtocolId,
    enabled: !!selectedProtocolId,
  });

  // Update selected messages when real-time messages change
  useEffect(() => {
    if (selectedProtocolId && realtimeMessages.length > 0) {
      setSelectedMessages(realtimeMessages);
    }
  }, [realtimeMessages, selectedProtocolId]);

  // Mark messages as read when viewing a conversation
  useEffect(() => {
    const markAsRead = async () => {
      if (!selectedProtocolId || !currentUserId) return;
      
      try {
        await markAllMessagesAsRead(selectedProtocolId, currentUserId);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    if (selectedProtocolId) {
      markAsRead();
    }
  }, [selectedProtocolId, currentUserId]);

  // Load all conversations
  const loadConversations = async () => {
    setLoading(true);
    try {
      const conversationsData: ProtocolConversation[] = [];

      const typedProtocols = toChairpersonProtocols(protocols);
      
      for (const protocol of typedProtocols) {
        try {
          const protocolMessages = await getMessagesForSubmission(String(protocol.id));
          
          if (protocolMessages.length > 0) {
            // Sort messages by date (newest last)
            const sortedMessages = [...protocolMessages].sort((a, b) => {
              return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
            });

            const lastMessage = sortedMessages[sortedMessages.length - 1];
            const unreadCount = sortedMessages.filter(
              msg => msg.status !== 'read' && msg.senderId !== currentUserId
            ).length;

            // Extract principal investigator name using typed getter
            const principalInvestigatorName = getPIName(protocol) || protocol.submittedByName || 'Unknown Investigator';

            conversationsData.push({
              protocolId: String(protocol.id),
              protocolTitle: getProtocolTitle(protocol),
              protocolCode: getProtocolCode(protocol) || String(protocol.id),
              principalInvestigatorName,
              lastMessage,
              unreadCount,
              messages: sortedMessages
            });
          }
        } catch (error) {
          console.error(`Error loading messages for protocol ${protocol.id}:`, error);
        }
      }

      // Sort conversations by last message date (newest first)
      conversationsData.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      });

      setConversations(conversationsData);
      
      // Auto-select first conversation if none selected
      if (!selectedProtocolId && conversationsData.length > 0) {
        setSelectedProtocolId(conversationsData[0].protocolId);
        // Don't set messages here - let real-time hook handle it
      }
      // Note: Selected messages are now handled by useRealtimeMessages hook
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!protocolsLoading) {
      loadConversations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [protocols, protocolsLoading]);

  // Set up real-time listeners for all conversations to update the list
  useEffect(() => {
    if (protocolsLoading || protocols.length === 0) return;

    console.log('🔄 Setting up real-time listeners for all conversations');
    const unsubscribeFunctions: (() => void)[] = [];

    protocols.forEach((protocol) => {
      try {
        const protocolRef = doc(db, 'submissions', protocol.id);
        const messagesRef = collection(protocolRef, 'messages');
        const messagesQuery = query(messagesRef, orderBy('createdAt', 'asc'));

        const unsubscribe = onSnapshot(
          messagesQuery,
          (snapshot) => {
            const protocolMessages: MessagesType[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data();
              protocolMessages.push({
                id: doc.id,
                ...data,
              } as MessagesType);
            });

            if (protocolMessages.length > 0) {
              // Update conversation in the list
              setConversations((prevConversations) => {
                const sortedMessages = [...protocolMessages].sort((a, b) => {
                  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                });

                const lastMessage = sortedMessages[sortedMessages.length - 1];
            const unreadCount = sortedMessages.filter(
              (msg) => msg.status !== 'read' && msg.senderId !== currentUserId
            ).length;

                const principalInvestigatorName =
                  (protocol.information?.general_information as {principal_investigator?: {name?: string}})?.principal_investigator?.name ||
                  protocol.principalInvestigator?.name ||
                  protocol.submittedByName ||
                  protocol.information?.principal_investigator?.name ||
                  'Unknown Investigator';

                const updatedConversation: ProtocolConversation = {
                  protocolId: protocol.id,
                  protocolTitle:
                    protocol.title ||
                    (protocol.information?.general_information as {protocol_title?: string})?.protocol_title ||
                    'Untitled Protocol',
                  protocolCode:
                    protocol.code || protocol.spupCode || protocol.tempProtocolCode || protocol.id,
                  principalInvestigatorName,
                  lastMessage,
                  unreadCount,
                  messages: sortedMessages,
                };

                // Update or add conversation
                const existingIndex = prevConversations.findIndex(
                  (c) => c.protocolId === protocol.id
                );
                let updatedConversations: ProtocolConversation[];

                if (existingIndex >= 0) {
                  // Update existing conversation
                  updatedConversations = [...prevConversations];
                  updatedConversations[existingIndex] = updatedConversation;
                } else {
                  // Add new conversation
                  updatedConversations = [...prevConversations, updatedConversation];
                }

                // Sort by last message date (newest first)
                updatedConversations.sort((a, b) => {
                  if (!a.lastMessage && !b.lastMessage) return 0;
                  if (!a.lastMessage) return 1;
                  if (!b.lastMessage) return -1;
                  return (
                    new Date(b.lastMessage.createdAt).getTime() -
                    new Date(a.lastMessage.createdAt).getTime()
                  );
                });

                return updatedConversations;
              });
            }
          },
          (err) => {
            console.error(`❌ Error in real-time messages listener for ${protocol.id}:`, err);
          }
        );

        unsubscribeFunctions.push(unsubscribe);
      } catch (error) {
        console.error(`Error setting up listener for protocol ${protocol.id}:`, error);
      }
    });

    // Cleanup all listeners on unmount or when protocols change
    return () => {
      console.log('🔌 Unsubscribing from all conversation listeners');
      unsubscribeFunctions.forEach((unsubscribe) => unsubscribe());
    };
  }, [protocols, protocolsLoading, currentUserId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMessages]);

  // Handle conversation selection
  const handleSelectConversation = (protocolId: string) => {
      setSelectedProtocolId(protocolId);
    // Messages will be loaded by useRealtimeMessages hook
  };

  // Send message
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedProtocolId || !currentUserId || sending) return;

    try {
      setSending(true);
      
      await sendMessageToSubmission(
        selectedProtocolId,
        currentUserId,
        currentUserName,
        messageInput.trim(),
        'reply'
      );

      // Don't need to reload - real-time hook will update automatically
      setMessageInput('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      conv.principalInvestigatorName.toLowerCase().includes(query) ||
      conv.protocolCode.toLowerCase().includes(query) ||
      conv.lastMessage?.content.toLowerCase().includes(query) ||
      conv.lastMessage?.senderName?.toLowerCase().includes(query)
    );
  });

  const selectedConversation = conversations.find(c => c.protocolId === selectedProtocolId);

  const formatMessageTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return format(date, 'HH:mm');
      } else if (diffInHours < 168) { // 7 days
        return format(date, 'EEE HH:mm');
      } else {
        return format(date, 'MMM d, HH:mm');
      }
    } catch {
      return '';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading || protocolsLoading) {
    return <PageLoading text="Loading messages..." />;
  }

  return (
    <div className="flex h-full w-full overflow-hidden animate-in fade-in duration-500">
      <div className="flex flex-1 min-h-0 overflow-hidden w-full">
        {/* Left Sidebar - Conversations List */}
        <div className="w-80 border-r border-[#036635]/10 dark:border-[#FECC07]/20 bg-muted/30 flex flex-col min-h-0 flex-shrink-0">
          {/* Search Header */}
          <div className="p-4 border-b border-[#036635]/10 dark:border-[#FECC07]/20 flex-shrink-0 bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
              <Input
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-[#036635]/20 dark:border-[#FECC07]/30 focus:border-[#036635] dark:focus:border-[#FECC07] focus:ring-[#036635]/20 dark:focus:ring-[#FECC07]/20 transition-all duration-300"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {filteredConversations.length > 0 ? (
              <div className="divide-y divide-[#036635]/10 dark:divide-[#FECC07]/20">
                {filteredConversations.map((conversation, index) => {
                  const isSelected = conversation.protocolId === selectedProtocolId;
                  return (
                    <div
                      key={conversation.protocolId}
                      onClick={() => handleSelectConversation(conversation.protocolId)}
                      className={cn(
                        "p-4 cursor-pointer transition-all duration-300 animate-in fade-in slide-in-from-left-2",
                        isSelected 
                          ? "bg-gradient-to-r from-[#036635]/10 to-[#036635]/5 dark:from-[#FECC07]/20 dark:to-[#FECC07]/10 border-l-2 border-[#036635] dark:border-[#FECC07]" 
                          : "hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10 hover:border-l-2 hover:border-[#036635]/30 dark:hover:border-[#FECC07]/40"
                      )}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 ring-2 ring-[#036635]/20 dark:ring-[#FECC07]/30 transition-all duration-300 group-hover:ring-[#036635]/40 dark:group-hover:ring-[#FECC07]/50">
                          <AvatarFallback className="bg-[#036635]/10 dark:bg-[#FECC07]/20 text-[#036635] dark:text-[#FECC07]">
                            <FileText className="h-5 w-5" />
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "font-semibold text-sm truncate transition-colors duration-300",
                                isSelected ? "text-[#036635] dark:text-[#FECC07]" : ""
                              )}>
                                {conversation.principalInvestigatorName}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {conversation.protocolCode}
                              </p>
                            </div>
                            {conversation.lastMessage && (
                              <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                {formatMessageTime(conversation.lastMessage.createdAt)}
                              </span>
                            )}
                          </div>
                          {conversation.lastMessage && (
                            <p className="text-sm text-muted-foreground truncate">
                              {conversation.lastMessage.content}
                            </p>
                          )}
                        </div>
                        {conversation.unreadCount > 0 && (
                          <Badge variant="default" className="ml-auto bg-[#036635] dark:bg-[#FECC07] text-white dark:text-black font-semibold animate-pulse">
                            {conversation.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-muted-foreground animate-in fade-in duration-500">
                <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50 text-[#036635] dark:text-[#FECC07]" />
                <p className="text-sm">
                  {searchQuery ? 'No conversations found' : 'No messages yet'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Chat Messages */}
        <div className="flex-1 flex flex-col min-h-0 animate-in fade-in slide-in-from-right-4 duration-500">
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-[#036635]/10 dark:border-[#FECC07]/20 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10">
                <div>
                  <h3 className="font-semibold bg-gradient-to-r from-[#036635] to-[#036635]/80 dark:from-[#FECC07] dark:to-[#FECC07]/80 bg-clip-text text-transparent">
                    {selectedConversation.principalInvestigatorName}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">{selectedConversation.protocolCode}</p>
                </div>
              </div>

              {/* Messages Area */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-muted/20 to-muted/10 min-h-0"
              >
                {selectedMessages.map((message, index) => {
                  // Use utility function for reliable sender comparison
                  const isOwnMessage = isMessageFromUser(message, currentUserId);
                  const isSystem = message.type === 'system';
                  
                  // For messages from proponent, use principal investigator name instead of email
                  let senderDisplayName = getMessageSenderDisplayName(message, currentUserId);
                  if (!isOwnMessage && !isSystem && selectedConversation) {
                    // If sender name looks like an email, use principal investigator name instead
                    if (message.senderName && message.senderName.includes('@')) {
                      senderDisplayName = selectedConversation.principalInvestigatorName;
                    } else {
                      // Use principal investigator name as fallback if sender name is not available
                      senderDisplayName = selectedConversation.principalInvestigatorName || senderDisplayName;
                    }
                  }

                  if (isSystem) {
                    return (
                      <div key={message.id} className="flex justify-center animate-in fade-in duration-300">
                        <div className="bg-muted px-3 py-1 rounded-full text-xs text-muted-foreground border border-[#036635]/10 dark:border-[#FECC07]/20">
                          {message.content}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={message.id}
                      className={cn(
                        "flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300",
                        isOwnMessage ? "justify-end" : "justify-start"
                      )}
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      {!isOwnMessage && (
                        <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-[#036635]/20 dark:ring-[#FECC07]/30 transition-all duration-300">
                          <AvatarFallback className="text-xs bg-[#036635]/10 dark:bg-[#FECC07]/20 text-[#036635] dark:text-[#FECC07]">
                            {getInitials(senderDisplayName)}
                        </AvatarFallback>
                      </Avatar>
                      )}
                      <div className={cn(
                        "flex flex-col max-w-[70%]",
                        isOwnMessage ? "items-end" : "items-start"
                      )}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn(
                            "text-xs font-medium transition-colors duration-300",
                            isOwnMessage ? "text-[#036635] dark:text-[#FECC07]" : ""
                          )}>
                            {senderDisplayName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatMessageTime(message.createdAt)}
                          </span>
                        </div>
                        <div
                          className={cn(
                            "rounded-lg px-4 py-2 transition-all duration-300 shadow-sm hover:shadow-md",
                            isOwnMessage
                              ? "bg-gradient-to-br from-[#036635] to-[#024A28] dark:from-[#FECC07] dark:to-[#E6B800] text-white dark:text-black"
                              : "bg-background border border-[#036635]/20 dark:border-[#FECC07]/30 hover:border-[#036635]/30 dark:hover:border-[#FECC07]/40"
                          )}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {message.content}
                          </p>
                        </div>
                      </div>
                      {isOwnMessage && (
                        <Avatar className="h-8 w-8 flex-shrink-0 ring-2 ring-[#036635]/30 dark:ring-[#FECC07]/40 transition-all duration-300">
                          <AvatarFallback className="text-xs bg-[#036635] dark:bg-[#FECC07] text-white dark:text-black">
                            {getInitials(currentUserName)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-[#036635]/10 dark:border-[#FECC07]/20 flex-shrink-0 bg-gradient-to-r from-[#036635]/5 to-transparent dark:from-[#FECC07]/10">
                <div className="flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    disabled={sending}
                    className="flex-1 border-[#036635]/20 dark:border-[#FECC07]/30 focus:border-[#036635] dark:focus:border-[#FECC07] focus:ring-[#036635]/20 dark:focus:ring-[#FECC07]/20 transition-all duration-300"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sending}
                    size="icon"
                    className="bg-[#036635] hover:bg-[#024A28] dark:bg-[#FECC07] dark:hover:bg-[#E6B800] text-white dark:text-black transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {sending ? (
                      <InlineLoading size="sm" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center animate-in fade-in duration-500">
              <div className="text-center text-muted-foreground">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50 text-[#036635] dark:text-[#FECC07]" />
                <p className="text-sm">Select a conversation to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
