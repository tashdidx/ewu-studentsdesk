import CoursePlanner from '@/components/course-planner'
import React from 'react'
import Navigation from '@/components/Navigation'

function page() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <CoursePlanner/>
    </div>
  )
}

export default page
