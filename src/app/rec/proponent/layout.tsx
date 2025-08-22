"use client";

import { Header } from "@/components/rec/proponent/nav";
import Footer from "@/components/rec/proponent/application/footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-background flex flex-col justify-between">
        {children}
        
      <Footer />
      </main>
    </>
  );
}