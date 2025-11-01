import ActivityOverview from '@/components/dashboard/ActivityOverview'
import MainActions from '@/components/dashboard/MainActions'
import WelcomeSection from '@/components/dashboard/WelcomeSection'
import Nav from '@/components/Nav'
import React from 'react'

const page = () => {
  return (
    <>
    <Nav />
    <div className='max-w-7xl mx-auto px-6 py-8 pt-24 '>
      <WelcomeSection />
      <MainActions />
      <ActivityOverview />

    </div>
    
    </>
    
    
  )
}

export default page
