"use client"

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Search, FileText, MessageSquare, Calendar, UserCheck, Users, Settings } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAuth, signOut as firebaseSignOut } from "firebase/auth";
import firebaseApp from "@/lib/firebaseConfig";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChairpersonBreadcrumb } from "./chairperson-breadcrumb";
import { useState, useEffect, useMemo } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useRealtimeProtocols } from "@/hooks/useRealtimeProtocols";
import { SUBMISSIONS_COLLECTION } from "@/lib/firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { 
  ChairpersonProtocol, 
  toChairpersonProtocols,
  getProtocolTitle,
  getProtocolCode,
  getPIName
} from '@/types';

interface AppTopbarProps {
  className?: string;
}

export function AppTopbar({ className }: AppTopbarProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch all protocols for search
  const { protocols: allProtocols } = useRealtimeProtocols({
    collectionName: SUBMISSIONS_COLLECTION,
    enabled: open, // Only fetch when dialog is open
  });

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Filter protocols based on search query
  const filteredProtocols = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase().trim();
    const typedProtocols = toChairpersonProtocols(allProtocols);
    
    return typedProtocols.filter((protocol: ChairpersonProtocol) => {
      // Search by protocol code
      const code = (getProtocolCode(protocol) || "").toLowerCase();
      if (code.includes(query)) return true;

      // Search by application ID
      const appId = ((protocol.applicationID as string) || "").toLowerCase();
      if (appId.includes(query)) return true;

      // Search by title
      const title = (getProtocolTitle(protocol) || "").toLowerCase();
      if (title.includes(query)) return true;

      // Search by principal investigator name
      const piName = (getPIName(protocol) || "").toLowerCase();
      if (piName.includes(query)) return true;

      return false;
    }).slice(0, 10); // Limit to 10 results
  }, [allProtocols, searchQuery]);

  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      const auth = getAuth(firebaseApp);
      await firebaseSignOut(auth);
      toast.success("Signed out successfully");
      router.push('/auth/signin?role=chairperson');
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error("Failed to sign out");
    }
  };

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <div className={cn("flex items-center justify-between px-4 py-3 border-b border-[#036635]/10 dark:border-[#FECC07]/20 bg-gradient-to-r from-[#036635]/5 via-[#036635]/3 to-transparent dark:from-[#FECC07]/10 dark:via-[#FECC07]/5 dark:to-transparent w-full backdrop-blur-md bg-background/80 z-50 shadow-sm", className)}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <SidebarTrigger className="text-[#036635] dark:text-[#FECC07] hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 transition-all duration-300 hover:scale-105 rounded-md flex-shrink-0" />
        <div className="flex-1 min-w-0 overflow-x-auto overflow-y-hidden">
          <ChairpersonBreadcrumb />
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <Button
          variant="outline"
          className={cn(
            "hidden md:flex h-9 w-[300px] items-center justify-between rounded-md border border-[#036635]/20 dark:border-[#FECC07]/30 bg-background/50 backdrop-blur-sm px-3 text-sm text-muted-foreground shadow-sm transition-all duration-300 hover:border-[#036635] dark:hover:border-[#FECC07] hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10",
          )}
          onClick={() => setOpen(true)}
        >
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
            <span>Search protocols, messages...</span>
          </div>
          <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="md:hidden h-9 w-9 border-[#036635]/20 dark:border-[#FECC07]/30 hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20"
          onClick={() => setOpen(true)}
        >
          <Search className="h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
        </Button>
        <CommandDialog 
          open={open} 
          onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setSearchQuery("");
            }
          }}
          className="border-[#036635]/20 dark:border-[#FECC07]/30"
        >
          <CommandInput 
            placeholder="Search protocols, messages, reviewers..." 
            className="border-b border-[#036635]/10 dark:border-[#FECC07]/20"
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            
            {/* Protocol Search Results */}
            {searchQuery.trim() && filteredProtocols.length > 0 && (
              <>
                <CommandGroup heading="Protocols">
                  {filteredProtocols.map((protocol: ChairpersonProtocol) => {
                    const protocolCode = getProtocolCode(protocol) || (protocol.applicationID as string) || "N/A";
                    const protocolTitle = getProtocolTitle(protocol);
                    const piName = getPIName(protocol) || "Unknown";
                    const status = protocol.status || "pending";

                    return (
                      <CommandItem
                        key={String(protocol.id)}
                        value={`${protocolCode} ${protocolTitle} ${piName}`}
                        onSelect={() => runCommand(() => router.push(`/rec/chairperson/protocol/${protocol.id}`))}
                        className="cursor-pointer data-[selected=true]:bg-[#036635]/10 dark:data-[selected=true]:bg-[#FECC07]/20"
                      >
                        <FileText className="mr-2 h-4 w-4 text-[#036635] dark:text-[#FECC07] flex-shrink-0" />
                        <div className="flex flex-col flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium truncate">{protocolCode}</span>
                            <Badge 
                              variant="outline" 
                              className="text-xs border-[#036635]/20 dark:border-[#FECC07]/30 text-[#036635] dark:text-[#FECC07] flex-shrink-0"
                            >
                              {status}
                            </Badge>
                          </div>
                          <span className="text-xs text-muted-foreground truncate">{protocolTitle}</span>
                          <span className="text-xs text-muted-foreground truncate">PI: {piName}</span>
                        </div>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Navigation - only show if no search query or no protocol results */}
            {(!searchQuery.trim() || filteredProtocols.length === 0) && (
              <>
                <CommandGroup heading="Navigation">
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/rec/chairperson"))}
                    className="cursor-pointer data-[selected=true]:bg-[#036635]/10 dark:data-[selected=true]:bg-[#FECC07]/20"
                  >
                    <Search className="mr-2 h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
                    <span>Go to Dashboard</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/rec/chairperson/messages"))}
                    className="cursor-pointer data-[selected=true]:bg-[#036635]/10 dark:data-[selected=true]:bg-[#FECC07]/20"
                  >
                    <MessageSquare className="mr-2 h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
                    <span>Go to Messages</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/rec/chairperson/calendar"))}
                    className="cursor-pointer data-[selected=true]:bg-[#036635]/10 dark:data-[selected=true]:bg-[#FECC07]/20"
                  >
                    <Calendar className="mr-2 h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
                    <span>Go to Calendar</span>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Protocol Pages - only show if no search query or no protocol results */}
            {(!searchQuery.trim() || filteredProtocols.length === 0) && (
              <>
                <CommandGroup heading="Protocols">
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/rec/chairperson/pending-protocols"))}
                    className="cursor-pointer data-[selected=true]:bg-[#036635]/10 dark:data-[selected=true]:bg-[#FECC07]/20"
                  >
                    <FileText className="mr-2 h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
                    <span>Pending Protocols</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/rec/chairperson/accepted-protocols"))}
                    className="cursor-pointer data-[selected=true]:bg-[#036635]/10 dark:data-[selected=true]:bg-[#FECC07]/20"
                  >
                    <FileText className="mr-2 h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
                    <span>Accepted Protocols</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/rec/chairperson/under-review-protocols"))}
                    className="cursor-pointer data-[selected=true]:bg-[#036635]/10 dark:data-[selected=true]:bg-[#FECC07]/20"
                  >
                    <FileText className="mr-2 h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
                    <span>Under Review Protocols</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => runCommand(() => router.push("/rec/chairperson/approved-protocols"))}
                    className="cursor-pointer data-[selected=true]:bg-[#036635]/10 dark:data-[selected=true]:bg-[#FECC07]/20"
                  >
                    <FileText className="mr-2 h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
                    <span>Approved Protocols</span>
                  </CommandItem>
                </CommandGroup>
                <CommandSeparator />
              </>
            )}

            {/* Management - only show if no search query or no protocol results */}
            {(!searchQuery.trim() || filteredProtocols.length === 0) && (
              <CommandGroup heading="Management">
                <CommandItem
                  onSelect={() => runCommand(() => router.push("/rec/chairperson/reviewers"))}
                  className="cursor-pointer data-[selected=true]:bg-[#036635]/10 dark:data-[selected=true]:bg-[#FECC07]/20"
                >
                  <UserCheck className="mr-2 h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
                  <span>Reviewers</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(() => router.push("/rec/chairperson/rec-members"))}
                  className="cursor-pointer data-[selected=true]:bg-[#036635]/10 dark:data-[selected=true]:bg-[#FECC07]/20"
                >
                  <Users className="mr-2 h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
                  <span>REC Members</span>
                </CommandItem>
                <CommandItem
                  onSelect={() => runCommand(() => router.push("/rec/chairperson/settings"))}
                  className="cursor-pointer data-[selected=true]:bg-[#036635]/10 dark:data-[selected=true]:bg-[#FECC07]/20"
                >
                  <Settings className="mr-2 h-4 w-4 text-[#036635] dark:text-[#FECC07]" />
                  <span>Settings</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </CommandDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 rounded-full hover:bg-[#036635]/10 dark:hover:bg-[#FECC07]/20 transition-all duration-300 hover:scale-105 ring-2 ring-offset-2 ring-offset-background ring-[#036635]/20 dark:ring-[#FECC07]/30 hover:ring-[#036635]/40 dark:hover:ring-[#FECC07]/40"
            >
              <Avatar className="h-8 w-8 ring-1 ring-[#036635]/20 dark:ring-[#FECC07]/30">
                <AvatarImage src="/SPUP-Logo-with-yellow.png" alt="SPUP Logo" />
                <AvatarFallback className="bg-[#036635]/10 dark:bg-[#FECC07]/20">
                  <Image
                    src="/SPUP-Logo-with-yellow.png"
                    alt="SPUP"
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 border-[#036635]/20 dark:border-[#FECC07]/30 bg-background/95 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200 shadow-lg">
            <div className="flex items-center gap-3 p-3 border-b border-[#036635]/10 dark:border-[#FECC07]/20">
              <Avatar className="h-10 w-10 ring-2 ring-[#036635]/20 dark:ring-[#FECC07]/30">
                <AvatarImage src="/SPUP-Logo-with-yellow.png" alt="SPUP Logo" />
                <AvatarFallback className="bg-[#036635]/10 dark:bg-[#FECC07]/20">
                  <Image
                    src="/SPUP-Logo-with-yellow.png"
                    alt="SPUP"
                    width={40}
                    height={40}
                    className="rounded-full"
                  />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col space-y-0.5 leading-none flex-1 min-w-0">
                {user?.displayName && (
                  <p className="font-semibold text-[#036635] dark:text-[#FECC07] truncate">{user.displayName}</p>
                )}
                {user?.email && (
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email}
                  </p>
                )}
              </div>
            </div>
            <DropdownMenuItem 
              onClick={handleSignOut} 
              className="cursor-pointer text-[#036635] dark:text-[#FECC07] focus:bg-[#036635]/10 dark:focus:bg-[#FECC07]/20 transition-all duration-200 hover:bg-[#036635]/5 dark:hover:bg-[#FECC07]/10"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}