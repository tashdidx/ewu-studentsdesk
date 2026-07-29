"use client"
import { GlassBlogCard } from "../components/GlassBlogCard";
import { Hero } from "../components/ui/hero";
import { FaBookOpen, FaCalendarAlt, FaCalculator, FaBook } from "react-icons/fa";

export default function Home() {
  const cards = [
    { href: "/course-planner", icon: FaBookOpen, title: "Course Planner", description: "Plan your courses, avoid time conflicts, and review sections easily.", color: "text-blue-300" },
    { href: "/routine-generator", icon: FaCalendarAlt, title: "Routine Generator", description: "Generate, view, and print your weekly class routine in style.", color: "text-emerald-300" },
    { href: "/cgpa-calculator", icon: FaCalculator, title: "CGPA Calculator", description: "Calculate your term and total CGPA with ease and accuracy.", color: "text-purple-300" },
    { href: "/course-hub", icon: FaBook, title: "Course Hub", description: "Explore detailed course catalogs with prerequisites, objectives, and outcomes.", color: "text-violet-300" },
  ];

  return (
    <Hero>
      <div className="flex flex-col items-center justify-center p-4 lg:pt-24 pt-16 relative z-10 min-h-screen">
        {/* Content */}
        <div className="max-w-2xl w-full text-center lg:mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-2 drop-shadow-2xl bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">
            East West University Ultimate Student&apos;s guide
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-6 drop-shadow-lg">
            Your all-in-one portal for planning, organizing, and excelling at EWU
          </p>
          
          <div className="mx-auto w-24 h-0.5 bg-gradient-to-r from-gray-600 via-gray-400 to-gray-600 rounded-full"></div>
        </div>
        
        {/* All 4 Cards */}
        <div className="grid z-50 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 w-full max-w-6xl">
          {cards.map((card) => (
            <GlassBlogCard key={card.href} {...card} />
          ))}
        </div>
      </div>
    </Hero>
  );
}
