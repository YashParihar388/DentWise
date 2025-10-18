import CTA from "@/components/Landings/CTA";
import Footer from "@/components/Landings/Footer";
import Header from "@/components/Landings/Header";
import Hero from "@/components/Landings/Hero";
import HowItWorks from "@/components/Landings/HowItWorks";
import PricingSection from "@/components/Landings/PricingSection";
import WhatToAsk from "@/components/Landings/WhatToAsk";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";



export default async function Home() {

  const user =await currentUser();

  if(user) redirect('/dashboard');


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
