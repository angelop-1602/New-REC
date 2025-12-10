"use client";

import { Header } from "@/components/rec/proponent/nav";
import Footer from "@/components/rec/proponent/application/footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="bg-background pt-14 sm:pt-16 md:pt-20">
        {children}
      </main>
      <Footer />
    </>
  );
}