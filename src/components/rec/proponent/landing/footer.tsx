"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin } from "lucide-react";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

export const Footer = () => {
  const { ref: footerRef, isVisible: footerVisible } = useScrollAnimation({ threshold: 0.1, triggerOnce: true });
  const navigationItems = [
    {
      title: "Resources",
      items: [
        {
          title: "Review Process",
          href: "/rec/proponent/process",
        },
        {
          title: "About Us",
          href: "/rec/proponent/about",
        },
        {
          title: "Forms",
          href: "/rec/proponent/process#forms",
        },
      ],
    },
    {
      title: "Quick Links",
      items: [
        {
          title: "Submit Protocol",
          href: "/rec/proponent/application",
        },
        {
          title: "Dashboard",
          href: "/rec/proponent/dashboard",
        },
        {
          title: "FAQ",
          href: "#faq",
        },
      ],
    },
  ];

  return (
    <div 
      ref={footerRef}
      className={`w-full py-8 lg:py-12 bg-primary text-background px-4 sm:px-6 lg:px-8 transition-all duration-1000 ${
        footerVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-6 items-start">
          <div className="flex gap-4 flex-col items-start">
            <div className={`flex gap-4 flex-col transition-all duration-700 delay-100 ${
              footerVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-8'
            }`}>
              <div className="flex gap-4 sm:gap-6 items-center">
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 flex-shrink-0">
                  <Image
                    src="/SPUP-Logo-with-yellow.png"
                    alt="St. Paul University Philippines Logo"
                    fill
                    className="object-contain"
                    priority
                  />
                </div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tighter font-regular text-left text-primary-foreground">
                  SPUP Research Ethics Committee
                </h2>
                
              </div>
              <p className="text-base sm:text-lg max-w-lg leading-relaxed tracking-tight text-primary-foreground/90 text-left">
                  Committed to upholding the highest standards of research ethics and protecting the rights, dignity, and welfare of human participants in research.
                </p>
            </div>
            <div className={`flex flex-col gap-4 text-sm leading-relaxed tracking-tight text-primary-foreground/90 transition-all duration-700 delay-200 ${
              footerVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}>
              <div className="flex items-start gap-3 transition-all duration-300 hover:translate-x-1">
                <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary-foreground" />
                <div>
                  <p className="font-medium text-primary-foreground">CPRINT Office</p>
                  <p className="text-primary-foreground/90">St. Paul University Philippines</p>
                  <p className="text-primary-foreground/90">Tuguegarao City, Cagayan</p>
                </div>
              </div>
              <div className="flex items-start gap-3 transition-all duration-300 hover:translate-x-1">
                <Mail className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary-foreground" />
                <div>
                  <Link href="mailto:rec@spup.edu.ph" className="hover:text-primary-foreground transition-all duration-300 font-medium text-primary-foreground hover:underline">
                    rec@spup.edu.ph
                  </Link>
                </div>
              </div>
              <div className="flex items-start gap-3 transition-all duration-300 hover:translate-x-1">
                <Phone className="w-5 h-5 flex-shrink-0 mt-0.5 text-primary-foreground" />
                <div>
                  <p className="text-primary-foreground/90">Local 211</p>
                </div>
              </div>
            </div>
          </div>
          <div className={`grid grid-cols-1 sm:grid-cols-2 gap-6 lg:gap-8 items-start transition-all duration-700 delay-300 ${
            footerVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8'
          }`}>
            {navigationItems.map((item) => (
              <div
                key={item.title}
                className="flex text-base gap-1 flex-col items-start"
              >
                <div className="flex flex-col gap-2">
                  <p className="text-lg sm:text-xl font-medium text-primary-foreground">{item.title}</p>
                  {item.items &&
                    item.items.map((subItem) => (
                      <Link
                        key={subItem.title}
                        href={subItem.href}
                        className="flex justify-between items-center hover:text-primary-foreground transition-all duration-300 hover:translate-x-1"
                      >
                        <span className="text-primary-foreground/90 text-sm sm:text-base">
                          {subItem.title}
                        </span>
                      </Link>
                    ))}
                </div>
              </div>
            ))}
            <div className="flex text-base gap-1 flex-col items-start">
              <div className="flex flex-col gap-2">
                <p className="text-lg sm:text-xl font-medium text-primary-foreground">Legal</p>
                <Link
                  href="#"
                  className="flex justify-between items-center hover:text-primary-foreground transition-all duration-300 hover:translate-x-1"
                >
                  <span className="text-primary-foreground/90 text-sm sm:text-base">
                    Privacy Policy
                  </span>
                </Link>
                <Link
                  href="#"
                  className="flex justify-between items-center hover:text-primary-foreground transition-all duration-300 hover:translate-x-1"
                >
                  <span className="text-primary-foreground/90 text-sm sm:text-base">
                    Terms of Service
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-primary-foreground/20">
          <p className="text-sm text-primary-foreground/85 text-center">
            © {new Date().getFullYear()} St. Paul University Philippines Research Ethics Committee. All rights reserved.
          </p>
          <p className="text-sm text-primary-foreground/85 text-center mt-2 opacity-0 hover:opacity-100 transition-all duration-300">
            developed by <Link href="mailto:a.peralta0216@gmail.com" className="hover:underline hover:text-primary-foreground transition-all duration-300">
              Angelo Peralta
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
