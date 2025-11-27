"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, SendHorizonal } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { sendMessageToSubmission, markAllMessagesAsRead, getUnreadMessageCount } from "@/lib/firebase/firestore";
import { useRealtimeMessages } from "@/hooks/useRealtimeMessages";
import { MessagesType } from "@/types";
import { LoadingSimple } from "@/components/ui/loading";
import { isMessageFromUser, getMessageSenderDisplayName } from "@/lib/utils/messageUtils";
import { reviewersManagementService } from "@/lib/services/reviewers/reviewersManagementService";
import { useChairpersonPresence } from "@/hooks/usePresence";

// SPUP Logo for chairperson
const CHAIRPERSON_LOGO = '/SPUP-Logo-with-yellow.png';

interface ProtocolMessageProps {
  submissionId?: string;
  unreadCount?: number;
}

export default function ProtocolMessage({ submissionId, unreadCount: initialUnreadCount = 0 }: ProtocolMessageProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MessagesType[]>([]);
  const [direction, setDirection] = useState<"right" | "bottom">("right");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chairpersonName, setChairpersonName] = useState<string>("SPUP REC Chair");
  const [chairpersonImage, setChairpersonImage] = useState<string>(CHAIRPERSON_LOGO);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  
  // Use real-time presence hook for chairperson
  const { presence: chairpersonPresence } = useChairpersonPresence();
  const chairpersonStatus: "online" | "offline" = chairpersonPresence?.status === "online" ? "online" : "offline";

  useEffect(() => {
    const updateDirection = () => {
      setDirection(window.innerWidth < 768 ? "bottom" : "right");
    };

    updateDirection();
    window.addEventListener('resize', updateDirection);
    return () => window.removeEventListener('resize', updateDirection);
  }, []);

  // Fetch chairperson information
  useEffect(() => {
    const fetchChairpersonInfo = async () => {
      try {
        const reviewers = await reviewersManagementService.getAllReviewers();
        const chairperson = reviewers.find(r => r.role === 'chairperson' && r.isActive);
        
        if (chairperson) {
          setChairpersonName(chairperson.name);
          // Always use SPUP logo for chairperson
          setChairpersonImage(CHAIRPERSON_LOGO);
        }
      } catch (error) {
        console.error('Error fetching chairperson info:', error);
      }
    };

    fetchChairpersonInfo();
  }, []);

  // Chairperson presence is now handled by useChairpersonPresence hook
  // It automatically updates in real-time when chairperson comes online/offline

  // Real-time messages for proponent
  const { messages: realtimeMessages, loading: messagesLoading } = useRealtimeMessages({
    submissionId: open && submissionId ? submissionId : null,
    enabled: open && !!submissionId,
  });

  // Update messages when real-time messages change and recalculate unread count
  useEffect(() => {
    if (realtimeMessages.length > 0) {
      setMessages(realtimeMessages);
      setLoading(false);
      
      // Update unread count based on real-time messages
      if (user) {
        const unread = realtimeMessages.filter(
          (msg) => msg.senderId !== user.uid && msg.status !== "read"
        ).length;
        setUnreadCount(unread);
      }
    }
  }, [realtimeMessages, user]);

  // Fetch unread count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!submissionId || !user) {
        setUnreadCount(0);
        return;
      }

      try {
        const count = await getUnreadMessageCount(submissionId, 'submissions', user.uid);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error fetching unread count:", error);
        setUnreadCount(0);
      }
    };

    fetchUnreadCount();
    // Refresh count periodically and when drawer closes
    const interval = setInterval(fetchUnreadCount, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [submissionId, user]);

  // Update unread count when initial prop changes
  useEffect(() => {
    setUnreadCount(initialUnreadCount);
  }, [initialUnreadCount]);

  // Mark messages as read when drawer opens and update count
  useEffect(() => {
    const markAsRead = async () => {
      if (!open || !submissionId || !user) return;
      
      try {
        await markAllMessagesAsRead(submissionId, user.uid);
        // Immediately update the count to 0 after marking as read
        setUnreadCount(0);
        // Also fetch to ensure it's accurate
        const count = await getUnreadMessageCount(submissionId, 'submissions', user.uid);
        setUnreadCount(count);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    };

    if (open) {
      markAsRead();
      }
  }, [open, submissionId, user]);

  const addMessage = async (messageText: string) => {
    if (!messageText.trim() || !submissionId || !user) return;
    
    try {
      setSending(true);
      
      // Ensure we have proper sender metadata
      const senderId = user.uid;
      const senderName = user.displayName || user.email || "User";
      
      if (!senderId) {
        throw new Error("User ID is required to send messages");
      }
      
      // Send message to Firestore
      await sendMessageToSubmission(
        submissionId,
        senderId,
        senderName,
        messageText,
        "reply"
      );
      
      // Don't need to refresh - real-time hook will update automatically
      setInput("");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!sending) {
        addMessage(input);
      }
    }
  };

  // Helper function to format message time
  const formatMessageTime = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return "";
    }
  };

  // Helper function to get user initials
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  // Get chairperson initials for avatar fallback
  const getChairpersonInitials = () => {
    return getUserInitials(chairpersonName);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen} direction={direction}>
      <DrawerTrigger asChild>
        <div className="relative">
          <Button 
            size="sm"
            className="bg-primary text-white hover:bg-primary/90 hover:text-white h-9 w-9 sm:h-full sm:w-full p-2"
            disabled={!submissionId}
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">Open chat</span>
          </Button>
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
        </div>
      </DrawerTrigger>
      
      <DrawerContent className={`
        bg-white flex flex-col
        ${direction === "bottom" 
          ? "w-full h-[80vh] max-h-[600px]" 
          : "w-full max-w-md h-full"
        }
      `}>
        <DrawerHeader className="p-4 pb-2">
          <DrawerTitle>
            <div className="flex flex-row gap-3 items-center">
              <div className="relative">
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10 ring-2 ring-[#036635]/20 dark:ring-[#FECC07]/30">
                  <AvatarImage 
                    src={chairpersonImage} 
                    alt={chairpersonName}
                    className="object-contain bg-white p-1"
                  />
                  <AvatarFallback className="bg-[#036635] text-white dark:bg-[#FECC07] dark:text-[#036635]">
                    {getChairpersonInitials()}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className={`h-2.5 w-2.5 ring-2 ring-white rounded-full absolute -bottom-0.5 -right-0.5 ${
                    chairpersonStatus === 'online' 
                      ? 'bg-green-500' 
                      : 'bg-gray-400'
                  }`}
                  title={chairpersonStatus === 'online' ? 'Online' : 'Offline'}
                ></div>
              </div>
              <div>
                <p className="text-sm sm:text-base font-semibold text-primary">{chairpersonName}</p>
                <p className={`text-xs ${
                  chairpersonStatus === 'online' 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-muted-foreground'
                }`}>
                  {chairpersonStatus === 'online' ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </DrawerTitle>
          <Separator className="mt-4" />
        </DrawerHeader>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 min-h-0">
          {loading || messagesLoading ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSimple size="md" text="Loading messages..." />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-sm text-muted-foreground">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map(msg => {
              // Use utility function for reliable sender comparison
              const isCurrentUser = isMessageFromUser(msg, user?.uid);
              const isSystemMessage = msg.type === "system";
              const senderDisplayName = getMessageSenderDisplayName(msg, user?.uid);
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-2 items-end max-w-[80%] sm:max-w-xs`}>
                    {!isCurrentUser && (
                      <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {getUserInitials(senderDisplayName)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
                      {!isCurrentUser && (
                        <span className="text-xs text-muted-foreground mb-1">
                          {senderDisplayName}
                        </span>
                      )}
                      <div className={`
                        rounded-lg px-3 py-2 text-sm break-words
                        ${isSystemMessage
                          ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                          : isCurrentUser 
                            ? "bg-primary text-white" 
                            : "bg-muted text-foreground"
                        }
                      `}>
                        {msg.content}
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        
        <DrawerFooter className="flex flex-row gap-2 items-center border-t px-4 py-3 bg-background">
          <Input
            type="text"
            placeholder="Type your message..."
            value={input}
            onChange={e => setInput(e.target.value)}
            className="flex-1 text-sm"
            aria-label="Message input"
            onKeyDown={handleKeyDown}
          />
          <Button
            size="sm"
            className="bg-primary text-white rounded-full h-8 w-8 p-0 flex-shrink-0"
            disabled={!input.trim() || sending || !submissionId}
            onClick={() => addMessage(input)}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
            ) : (
              <SendHorizonal className="w-3 h-3" />
            )}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
