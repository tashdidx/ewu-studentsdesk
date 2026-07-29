import CoursePlanner from '@/components/course-planner'
import React from 'react'
import Navigation from '@/components/Navigation'

function page() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navigation />
      <CoursePlanner/>
    </div>
  )
}

export default page
