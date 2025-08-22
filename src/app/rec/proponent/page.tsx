import { Blog } from '@/components/rec/proponent/landing/blog';
import { CTA } from '@/components/rec/proponent/landing/cta';
import { About } from '@/components/rec/proponent/landing/about';
import { Pricing } from '@/components/rec/proponent/landing/fees';
import { Footer } from '@/components/rec/proponent/landing/footer';
import { FAQ } from '@/components/rec/proponent/landing/fqa';
import { Hero } from '@/components/rec/proponent/landing/hero';

const Page = () => {
  return (
    <>
      <Hero />
      <About />
      <CTA />
      <Pricing />
      <Blog />  
      <FAQ />
      <Footer />
    </>
  );
};

export default Page;
