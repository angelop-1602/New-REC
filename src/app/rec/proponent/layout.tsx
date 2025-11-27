"use client";

import { Header } from "@/components/rec/proponent/nav";
import Footer from "@/components/rec/proponent/application/footer";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="bg-background">
        {children}
      </main>
      <Footer />
    </>
  );
}