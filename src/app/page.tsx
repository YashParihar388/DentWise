import CTA from "@/components/Landings/CTA";
import Footer from "@/components/Landings/Footer";
import Header from "@/components/Landings/Header";
import Hero from "@/components/Landings/Hero";
import HowItWorks from "@/components/Landings/HowItWorks";
import PricingSection from "@/components/Landings/PricingSection";
import WhatToAsk from "@/components/Landings/WhatToAsk";



export default function Home() {
  return (
    <div>
      <Header />
      <Hero />
      <HowItWorks />
      <WhatToAsk />
      <PricingSection />
      <CTA />
      <Footer />
    </div>
    
  );
}
