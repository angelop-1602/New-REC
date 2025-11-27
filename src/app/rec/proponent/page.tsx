"use client";

import { useAuth } from "@/hooks/useAuth";
import { PageLoading } from "@/components/ui/loading";
import { About } from '@/components/rec/proponent/landing/about';
import { Footer } from '@/components/rec/proponent/landing/footer';
import { FAQ } from '@/components/rec/proponent/landing/fqa';
import { Hero } from '@/components/rec/proponent/landing/hero';

const Page = () => {
  const { loading } = useAuth();

  // Show loading while checking auth
  if (loading) {
    return <PageLoading />;
  }

  // Show landing page for all users (authenticated or not)
  return (
    <>
      <Hero />
      <About />
      {/* <CTA />
      <Pricing /> */}
      {/* <Blog />   */}
      <FAQ />
      <Footer />
    </>
  );
};

export default Page;
