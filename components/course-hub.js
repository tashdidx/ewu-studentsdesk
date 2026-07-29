"use client";
import { useState, useRef, useEffect } from "react";
import { courseDetails } from "../public/course-details";
import { FaSearch, FaChevronDown, FaChevronUp, FaBook, FaFilter } from "react-icons/fa";

export default function CourseHub() {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");
  const [expandedCourse, setExpandedCourse] = useState(null);
  const topRef = useRef(null);

  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [search]);

  // Define departments
  const departments = ["All", "CSE", "BA"];

  // Get department display name
  const getDeptDisplayName = (dept) => {
    const deptNames = {
      "All": "All Departments",
      "CSE": "CSE - Computer Science & Engineering",
      "BA": "BA - Business Administration"
    };
    return deptNames[dept] || dept;
  };

  // Get department from course code
  const getCourseDept = (courseCode) => {
    const prefix = courseCode.match(/^([A-Z]+)/)?.[1];
    return prefix === "CSE" ? "CSE" : "BA";
  };

  // Filter courses by search and department
  const filteredCourses = courseDetails.filter((course) => {
    // Filter by department
    if (selectedDept !== "All") {
      const courseDept = getCourseDept(course.courseCode);
      if (courseDept !== selectedDept) return false;
    }

    // Filter by search
    if (!search) return true;
    const searchLower = search.toLowerCase().trim();
    if (!searchLower) return true;

    const searchNoSpace = searchLower.replace(/\s+/g, "");
    const courseCodeLower = (course.courseCode || "").toLowerCase();
    const courseCodeNoSpace = courseCodeLower.replace(/\s+/g, "");
    const courseNameLower = (course.courseName || "").toLowerCase();

    // 1. Check if the normalized search (no spaces) is part of the course code
    if (courseCodeNoSpace.includes(searchNoSpace)) return true;

    // 2. Check if the search is part of the course name
    if (courseNameLower.includes(searchLower)) return true;

    // 3. Multi-token matching (e.g., "106 CSE" or "Programming Structured")
    const searchTokens = searchLower.split(/\W+/).filter(Boolean);
    if (searchTokens.length > 1) {
      return searchTokens.every((token) =>
        courseCodeNoSpace.includes(token) || courseNameLower.includes(token)
      );
    }

    return false;
  });

  const toggleCourse = (courseKey) => {
    setExpandedCourse(expandedCourse === courseKey ? null : courseKey);
  };

  return (
    <div
      ref={topRef}
      className="min-h-screen bg-[#1a1a1a] py-8 px-4"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-4">
          <div className="flex justify-center mb-2">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-full shadow-lg">
              <FaBook className="w-5 h-5 text-white" />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold mb-1 text-white pt-10">
            Course Hub
          </h1>
          <p className="text-gray-400 text-xs md:text-sm px-4">
            Explore course catalogs from all departments with detailed information
          </p>
        </div>

        {/* Search and Filter Section */}
        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl p-2.5 md:p-3 mb-4">
          {/* Search and Filter Row */}
          <div className="flex flex-col md:flex-row gap-2 mb-1.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by course code or name..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-[#252525] border border-white/10 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50 focus:outline-none text-white placeholder-gray-500 transition-all duration-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Department Filter */}
            <div className="relative md:w-64">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-400 w-3.5 h-3.5 pointer-events-none z-10" />
              <select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-sm bg-[#252525] border border-white/10 rounded-lg focus:border-blue-400 focus:ring-2 focus:ring-blue-500/50 focus:outline-none text-white transition-all duration-200 cursor-pointer appearance-none"
              >
                {departments.map((dept) => (
                  <option key={dept} value={dept}>
                    {getDeptDisplayName(dept)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Counter */}
          <div className="text-xs text-blue-300">
            {filteredCourses.length} courses found
            {selectedDept !== "All" && ` in ${getDeptDisplayName(selectedDept)}`}
            {search && ` matching "${search}"`}
          </div>
        </div>

        {/* Course List */}
        <div className="space-y-2">
          {filteredCourses.length === 0 && (
            <div className="text-center text-gray-400 text-sm py-6">
              No courses found. Try a different search term.
            </div>
          )}
          
          {filteredCourses.map((course, index) => {
            const uniqueKey = `${course.courseCode}-${index}`;
            return (
              <div
                key={uniqueKey}
                className="bg-[#1a1a1a] border border-white/10 rounded-lg overflow-hidden transition-all duration-300 hover:border-blue-500/50"
              >
              {/* Course Header - Clickable */}
              <button
                onClick={() => toggleCourse(uniqueKey)}
                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-white/5 transition-colors duration-200"
              >
                <div className="flex items-center gap-2">
                  <span className="inline-block px-2 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow">
                    {course.courseCode}
                  </span>
                  <h3 className="text-xs md:text-sm font-semibold text-blue-200 text-left">
                    {course.courseName}
                  </h3>
                </div>
                <div className="text-blue-400 flex-shrink-0">
                  {expandedCourse === uniqueKey ? (
                    <FaChevronUp className="w-3 h-3" />
                  ) : (
                    <FaChevronDown className="w-3 h-3" />
                  )}
                </div>
              </button>

              {/* Course Details - Expandable */}
              {expandedCourse === uniqueKey && (
                <div className="px-3 pb-3 pt-1.5 border-t border-white/10 bg-[#252525]">
                  {/* Credit Hours */}
                  <div className="mb-2">
                    <h4 className="text-xs font-bold text-blue-300 mb-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Credit Hours
                    </h4>
                    <p className="text-gray-300 text-xs pl-3">
                      {course.creditHours}
                    </p>
                  </div>

                  {/* Prerequisites */}
                  <div className="mb-2">
                    <h4 className="text-xs font-bold text-blue-300 mb-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Prerequisites
                    </h4>
                    <p className="text-gray-300 text-xs pl-3">
                      {course.prerequisites}
                    </p>
                  </div>

                  {/* Objectives */}
                  <div className="mb-2">
                    <h4 className="text-xs font-bold text-blue-300 mb-0.5 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                      Course Objectives
                    </h4>
                    <p className="text-gray-300 text-xs pl-3 leading-relaxed">
                      {course.objectives}
                    </p>
                  </div>

                  {/* Course Outcomes */}
                  {course.outcomes && course.outcomes.length > 0 && course.outcomes[0] !== 'Not available' && (
                    <div className="mb-2">
                      <h4 className="text-xs font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        Course Outcomes
                      </h4>
                      <ul className="space-y-1 pl-3">
                        {course.outcomes.map((outcome, idx) => (
                          <li
                            key={idx}
                            className="text-gray-300 text-xs flex items-start gap-1.5"
                          >
                            <span className="text-blue-400">•</span>
                            <span>{outcome}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Course Contents */}
                  {course.courseContents && course.courseContents.length > 0 && course.courseContents[0] !== 'Not available' && (
                    <div>
                      <h4 className="text-xs font-bold text-blue-300 mb-1 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                        Course Contents
                      </h4>
                      <ul className="space-y-1 pl-3">
                        {course.courseContents.map((content, idx) => (
                          <li
                            key={idx}
                            className="text-gray-300 text-xs flex items-start gap-1.5"
                          >
                            <span className="text-blue-400">•</span>
                            <span>{content}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
        </div>
      </div>
    </div>
  );
}
