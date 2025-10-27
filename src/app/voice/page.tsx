import Nav from '@/components/Nav'
import FeatureCards from '@/components/voice/FeatureCards'
import ProPlanRequired from '@/components/voice/ProPlanRequired'
import VapiWidget from '@/components/voice/VapiWidget'
import WelcomeSection from '@/components/voice/WelcomeSection'
import { auth } from '@clerk/nextjs/server'
import React from 'react'

async function voicePage(){
    
const { has } = await auth();

const hasProPlan = has({plan:"basic_plan"}) || has({plan:"premium"});

if(!hasProPlan) return <ProPlanRequired />;


  return (
    <div className="min-h-screen bg-background">
      <Nav />

      <div className="max-w-7xl mx-auto px-6 py-8 pt-24">
        <WelcomeSection />
        <FeatureCards />
      </div>

      <VapiWidget />
    </div>
  )
}

export default voicePage
