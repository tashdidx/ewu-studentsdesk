import CgpaCalculator from '@/components/Cgpa-calculator'
import React from 'react'
import Navigation from '@/components/Navigation'

function page() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navigation />
      <CgpaCalculator/>
    </div>
  )
}

export default page
