import React from 'react'
import RoutineGenerator from '@/components/Routine-generator'
import Navigation from '@/components/Navigation'

function page() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navigation />
      <RoutineGenerator />
    </div>
  )
}

export default page
