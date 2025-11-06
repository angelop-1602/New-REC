"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function GlobalBackButton() {
  const router = useRouter();
  const hasHistoryRef = useRef(false);

  useEffect(() => {
    hasHistoryRef.current = window.history.length > 1;
  }, []);

  const handleBackClick = () => {
    if (hasHistoryRef.current) {
      router.back();
    } else {
      router.push("/rec/proponent/dashboard");
    }
  };

  return (
    <button
      onClick={handleBackClick}
      className="
        group flex items-center gap-2 text-primary font-medium
        transition-all duration-300 ease-out
        hover:text-primary/90
        active:scale-95
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40
      "
    >
      <ArrowLeft
        className="
          w-4 h-4 transition-transform duration-300
          group-hover:-translate-x-1 group-hover:scale-110
        "
      />
      <span
        className="
          relative
          after:absolute after:left-0 after:w-0 after:bg-current
          after:transition-all after:duration-300
          group-hover:after:w-full
        "
      >
        Back
      </span>
    </button>
  );
}
