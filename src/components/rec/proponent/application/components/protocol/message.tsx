"use client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
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
import { getMessagesForSubmission, sendMessageToSubmission } from "@/lib/firebase/firestore";
import { MessagesType } from "@/types/message.types";
import { LoadingSimple, InlineLoading } from "@/components/ui/loading";

interface ProtocolMessageProps {
  submissionId?: string;
  unreadCount?: number;
}

export default function ProtocolMessage({ submissionId, unreadCount = 0 }: ProtocolMessageProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<MessagesType[]>([]);
  const [direction, setDirection] = useState<"right" | "bottom">("right");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const updateDirection = () => {
      setDirection(window.innerWidth < 768 ? "bottom" : "right");
    };

    updateDirection();
    window.addEventListener('resize', updateDirection);
    return () => window.removeEventListener('resize', updateDirection);
  }, []);

  // Fetch messages when drawer opens
  useEffect(() => {
    const fetchMessages = async () => {
      if (!open || !submissionId) return;
      
      try {
        setLoading(true);
        const fetchedMessages = await getMessagesForSubmission(submissionId);
        setMessages(fetchedMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [open, submissionId]);

  const addMessage = async (messageText: string) => {
    if (!messageText.trim() || !submissionId || !user) return;
    
    try {
      setSending(true);
      
      // Send message to Firestore
      await sendMessageToSubmission(
        submissionId,
        user.uid,
        user.displayName || user.email || "User",
        messageText,
        "reply"
      );
      
      // Refresh messages to include the new one
      const updatedMessages = await getMessagesForSubmission(submissionId);
      setMessages(updatedMessages);
      
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

  return (
    <Drawer open={open} onOpenChange={setOpen} direction={direction}>
      <DrawerTrigger asChild>
        <div className="relative">
          <Button 
            size="sm"
            className="bg-primary text-white hover:bg-primary/90 hover:text-white rounded-full h-9 w-9 sm:h-10 sm:w-10 p-0"
            disabled={!submissionId}
          >
            <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
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
                <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                  <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                  <AvatarFallback>CN</AvatarFallback>
                </Avatar>
                <div className="h-2.5 w-2.5 ring-2 ring-white rounded-full bg-green-500 absolute -bottom-0.5 -right-0.5"></div>
              </div>
              <div>
                <p className="text-sm sm:text-base font-semibold text-primary">SPUP REC Chair</p>
                <p className="text-xs text-muted-foreground">Online</p>
              </div>
            </div>
          </DrawerTitle>
          <Separator className="mt-4" />
        </DrawerHeader>
        
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-4 min-h-0">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <LoadingSimple size="md" text="Loading messages..." />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-32">
              <p className="text-sm text-muted-foreground">No messages yet. Start a conversation!</p>
            </div>
          ) : (
            messages.map(msg => {
              const isCurrentUser = msg.senderId === user?.uid;
              const isSystemMessage = msg.type === "system";
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isCurrentUser ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-2 items-end max-w-[80%] sm:max-w-xs`}>
                    {!isCurrentUser && (
                      <Avatar className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0">
                        <AvatarFallback className="text-xs">
                          {getUserInitials(msg.senderName || "Unknown")}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div className={`flex flex-col ${isCurrentUser ? "items-end" : "items-start"}`}>
                      {!isCurrentUser && (
                        <span className="text-xs text-muted-foreground mb-1">
                          {msg.senderName}
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
