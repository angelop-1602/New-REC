import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Link from "next/link";

interface CustomAvatarProps {
  name: string;
  email: string;
  photoURL?: string | null;
}

export default function CustomAvatar({
  name,
  email,
  photoURL,
}: CustomAvatarProps) {
  // Generate initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Popover>
      <div className="flex gap-3 items-center">
        <PopoverTrigger asChild>
          <Avatar className="ring-1 ring-green-500 ring-offset-[3px] ring-offset-background w-[25px] h-[25px]">
            <AvatarImage src={photoURL || undefined} alt={name} />
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          </Avatar>
        </PopoverTrigger>
        <div className="flex flex-col text-[.8rem] ">
          <span className="font-semibold tracking-tight">{name}</span>
          <span className="leading-none text-[.6rem] text-muted-foreground">
            {email}
          </span>
        </div>
      </div>
      <PopoverContent className="max-w-[150px] p-1 mt-1 relative">
          <div className="flex flex-col ">
            <Link
              href="/rec/proponent/dashboard"
              className="text-xs hover:text-primary hover:bg-primary/10 p-2 rounded-md transition-colors"
            >
              Dashboard
            </Link>
            <Link
              href="/rec/proponent/profile"
              className="text-xs hover:text-primary hover:bg-primary/10 p-2 rounded-md transition-colors"
            >
              Profile
            </Link>
            <Link
              href="/rec/proponent/settings"
              className="text-xs hover:text-primary hover:bg-primary/10 p-2 rounded-md transition-colors"
            >
              Settings
            </Link>
            <Link
              href="/rec/proponent/logout"
              className="text-xs hover:text-primary hover:bg-primary/10 p-2 rounded-md transition-colors"
            >
              Logout
            </Link>
          </div>
      </PopoverContent>
    </Popover>
  );
}
