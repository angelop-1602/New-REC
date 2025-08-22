"use client";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Menu, MoveRight, X, LogOut } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CustomAvatar from "@/components/ui/custom/avatar";
import { useAuth } from "../../../hooks/useAuth";

export const Header = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setOpen] = useState(false);

  const publicNavigationItems = [
    {
      title: "Home",
      href: "/rec/proponent",
      description: "",
    },
    {
      title: "About us",
      description: "Learn about our research ethics committee",
      items: [
        { title: "Members", href: "#members" },
        { title: "Processes", href: "#processes" },
        { title: "Fees", href: "#fees" },
      ],
    },
    {
      title: "Resources",
      description: "Helpful information and updates",
      items: [
        { title: "Guidelines", href: "/guidelines" },
        { title: "Forms", href: "/forms" },
        { title: "FAQ", href: "/faq" },
        { title: "Contact", href: "/contact" },
      ],
    },
  ];

  const authenticatedNavigationItems = [
    {
      title: "Home",
      href: "/rec/proponent",
      description: "",
    },
    {
      title: "Dashboard",
      href: "/rec/proponent/dashboard",
      description: "",
    },
    {
      title: "About us",
      description: "Learn about our research ethics committee",
      items: [
        { title: "Members", href: "#members" },
        { title: "Processes", href: "#processes" },
        { title: "Fees", href: "#fees" },
      ],
    },
    {
      title: "Resources",
      description: "Helpful information and updates",
      items: [
        { title: "Guidelines", href: "/guidelines" },
        { title: "Forms", href: "/forms" },
        { title: "FAQ", href: "/faq" },
        { title: "Contact", href: "/contact" },
      ],
    },
  ];
  
  const mobileNavigationItems = user ? [
    {
      title: "Home",
      href: "/rec/proponent",
      description: "",
    },
    {
      title: "Dashboard",
      href: "/rec/proponent/dashboard",
      description: "",
    },
    {
      title: "Application",
      href: "/rec/proponent/application",
      description: "",
    },
    {
      title: "Profile",
      href: "/rec/proponent/profile",
      description: "",
    },
  ] : [
    {
      title: "Home",
      href: "/rec/proponent",
      description: "",
    },
    {
      title: "Sign In",
      href: "/auth/signin",
      description: "",
    },
  ];

  const navigationItems = user ? authenticatedNavigationItems : publicNavigationItems;

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="w-full z-40 fixed top-0 left-0 bg-background shadow-md p-2">
      <div className="container mx-auto px-4 py-2 lg:py-0 flex items-center justify-between lg:grid lg:grid-cols-3">
        {/* Logo (left) */}
        <div className="hidden lg:flex items-center">
          <Link href="/rec/proponent">
            <Image
              src="/SPUP-REC-logo-light.png"
              alt="SPUP REC Logo"
              width={160}
              height={50}
              priority
              className="h-12 w-auto"
            />
          </Link>
        </div>

        {/* Menu (center - desktop only) */}
        <div className="hidden lg:flex justify-center items-center">
          <NavigationMenu>
            <NavigationMenuList className="flex gap-4">
              {navigationItems.map((item) => (
                <NavigationMenuItem key={item.title}>
                  {item.href ? (
                    <NavigationMenuLink asChild>
                      <Link href={item.href}>
                        <Button variant="ghost">{item.title}</Button>
                      </Link>
                    </NavigationMenuLink>
                  ) : (
                    <>
                      <NavigationMenuTrigger className="font-medium text-sm">
                        {item.title}
                      </NavigationMenuTrigger>
                      <NavigationMenuContent className="!w-[450px] p-4">
                        <div className="flex flex-col lg:grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-base font-semibold">
                              {item.title}
                            </p>
                            <p className="text-muted-foreground text-sm">
                              {item.description}
                            </p>
                            {user && user.emailVerified ? (
                              <Button size="sm" className="mt-6" asChild>
                                <Link href="/rec/proponent/application">
                                  Submit a proposal
                                </Link>
                              </Button>
                            ) : (
                              <Button size="sm" className="mt-6" asChild>
                                <Link href="/auth/signin?redirect=/rec/proponent/application">
                                  Submit a proposal
                                </Link>
                              </Button>
                            )}
                          </div>
                          <div className="flex flex-col gap-2">
                            {item.items?.map((subItem) => (
                              <NavigationMenuLink
                                asChild
                                key={subItem.title}
                                className="flex flex-row justify-start hover:bg-muted py-2 px-4 rounded"
                              >
                                <Link href={subItem.href}>
                                  <span>{subItem.title}</span>
                                  <MoveRight className="w-4 h-4 text-muted-foreground ml-2" />
                                </Link>
                              </NavigationMenuLink>
                            ))}
                          </div>
                        </div>
                      </NavigationMenuContent>
                    </>
                  )}
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* CTA (right - desktop only) */}
        <div className="hidden lg:flex justify-end">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer">
                  <CustomAvatar 
                    name={user.displayName || user.email || "User"} 
                    email={user.email || ""}
                    photoURL={user.photoURL}
                  />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    {user.displayName && (
                      <p className="font-medium">{user.displayName}</p>
                    )}
                    {user.email && (
                      <p className="w-[200px] truncate text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    )}
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/rec/proponent/profile">
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <Link href="/auth/signin">Sign In</Link>
            </Button>
          )}
        </div>

        {/* Mobile: Logo + Toggle */}
        <div className="flex lg:hidden w-full justify-between items-center">
          <Link href="/rec/proponent">
            <Image
              src="/SPUP-REC-logo-light.png"
              alt="SPUP REC Logo"
              width={130}
              height={40}
              className="h-10 w-auto"
            />
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setOpen(!isOpen)}>
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-background shadow-md border-t py-4 z-50">
          <div className="container mx-auto px-4 flex flex-col gap-4">
            {/* Mobile nav items */}
            {mobileNavigationItems.map((item) => (
              <Link
                key={item.title}
                href={item.href}
                className="flex justify-between items-center py-2 text-lg font-medium hover:text-primary transition-colors"
                onClick={() => setOpen(false)}
              >
                <span>{item.title}</span>
                <MoveRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
            
            {user && (
              <>
                <hr className="border-t border-muted" />
                <div className="flex items-center gap-3 py-2">
                  <CustomAvatar 
                    name={user.displayName || user.email || "User"} 
                    email={user.email || ""}
                    photoURL={user.photoURL}
                  />
                  <div className="flex flex-col">
                    {user.displayName && (
                      <p className="font-medium">{user.displayName}</p>
                    )}
                    {user.email && (
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    )}
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  className="justify-start"
                  onClick={() => {
                    handleSignOut();
                    setOpen(false);
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
