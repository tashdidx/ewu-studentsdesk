"use client";
import { useState, useEffect, useRef } from "react";
import { courses } from "../public/courses-data-updated";
import RoutinePage from "./routine-page";

function timeConflict(timeA, timeB) {
  // Parse time strings like "MW 10:10 AM - 11:40 AM" or "T 01:30 PM - 03:00 PM"
  const parseTime = (timeStr) => {
    const parts = timeStr.trim().split(' ');
    if (parts.length < 5) return null;
    
    const days = parts[0];
    const startTime = parts[1] + ' ' + parts[2];
    const endTime = parts[4] + ' ' + parts[5];
    
    return { days, startTime, endTime };
  };
  
  const convertTo24Hour = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let hour24 = hours;
    
    if (period === 'PM' && hours !== 12) {
      hour24 += 12;
    } else if (period === 'AM' && hours === 12) {
      hour24 = 0;
    }
    
    return hour24 * 60 + minutes; // Convert to minutes for easy comparison
  };
  
  const parsedA = parseTime(timeA);
  const parsedB = parseTime(timeB);
  
  if (!parsedA || !parsedB) return false;
  
  // Check if days overlap
  const daysOverlap = [...parsedA.days].some(day => parsedB.days.includes(day));
  if (!daysOverlap) return false;
  
  // Convert times to minutes for comparison
  const startA = convertTo24Hour(parsedA.startTime);
  const endA = convertTo24Hour(parsedA.endTime);
  const startB = convertTo24Hour(parsedB.startTime);
  const endB = convertTo24Hour(parsedB.endTime);
  
  // Check if time ranges overlap
  return (startA < endB && endA > startB);
}

export default function CoursePlanner() {
  const [selectedSections, setSelectedSections] = useState([]);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [facultySearch, setFacultySearch] = useState("");
  const [showRoutine, setShowRoutine] = useState(false);
  const [combinations, setCombinations] = useState([]);
  const [currentCombinationName, setCurrentCombinationName] = useState("");
  const topRef = useRef(null);

  useEffect(() => {
    if (topRef.current) {
      topRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [search, facultySearch]);
// ...existing code...

  const handleAddSection = (course, section) => {
    const sectionId = `${course.code}-${section.section}`;
    
    // Prevent adding the same section twice
    if (selectedSections.some(sel => sel.id === sectionId)) {
      setError(`Section ${sectionId} is already added.`);
      return;
    }
    // Prevent adding a different section of the same course
    if (selectedSections.some(sel => sel.courseCode === course.code)) {
      setError(`Course ${course.code} is already added. You cannot add another section of the same course.`);
      return;
    }
    
    // Check for time conflicts with all existing sections
    for (let sel of selectedSections) {
      for (let selTime of sel.times) {
        for (let newTime of section.times) {
          if (timeConflict(selTime.time, newTime.time)) {
            setError(`Time conflict between ${sel.id} and ${sectionId}`);
            return;
          }
        }
      }
    }
    
    setSelectedSections([...selectedSections, { 
      id: sectionId,
      courseCode: course.code,
      courseTitle: course.title,
      section: section.section,
      faculty: section.faculty,
      times: section.times
    }]);
    setError("");
  };

  const handleSaveCombination = () => {
    if (selectedSections.length === 0) {
      setError("Please select at least one course before saving the combination.");
      return;
    }
    
    const combinationName = currentCombinationName.trim() || `Combination ${combinations.length + 1}`;
    const newCombination = {
      id: Date.now(),
      name: combinationName,
      sections: [...selectedSections],
      createdAt: new Date().toLocaleString()
    };
    
    setCombinations([...combinations, newCombination]);
    setCurrentCombinationName("");
    setError("");
  };

  const handleRemoveCombination = (combinationId) => {
    setCombinations(combinations.filter(combo => combo.id !== combinationId));
  };

  const handleExportCombinations = async () => {
    if (combinations.length === 0) {
      setError("No combinations to export. Please create at least one combination first.");
      return;
    }

    try {
      setError(""); // Clear any previous errors
      
      // Show loading state
      const originalText = document.querySelector('[data-export-btn]')?.textContent;
      const exportBtn = document.querySelector('[data-export-btn]');
      if (exportBtn) exportBtn.textContent = 'Exporting...';

      // Try Canvas API first (more reliable)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Determine layout based on number of combinations
      const shouldUseTwoColumns = combinations.length > 4;
      const columnsCount = shouldUseTwoColumns ? 2 : 1;
      const columnWidth = shouldUseTwoColumns ? 430 : 820;
      const columnSpacing = 40;
      
      // Calculate dynamic canvas height based on content
      let totalHeight = 150; // Header space
      
      if (shouldUseTwoColumns) {
        // Calculate height for two-column layout
        const leftColumnCombinations = combinations.filter((_, index) => index % 2 === 0);
        const rightColumnCombinations = combinations.filter((_, index) => index % 2 === 1);
        
        const leftColumnHeight = leftColumnCombinations.reduce((sum, combination) => {
          const coursesCount = combination.sections.length;
          return sum + 80 + (coursesCount * 45) + 20;
        }, 0);
        
        const rightColumnHeight = rightColumnCombinations.reduce((sum, combination) => {
          const coursesCount = combination.sections.length;
          return sum + 80 + (coursesCount * 45) + 20;
        }, 0);
        
        totalHeight += Math.max(leftColumnHeight, rightColumnHeight);
      } else {
        // Single column layout
        combinations.forEach(combination => {
          const coursesCount = combination.sections.length;
          totalHeight += 80 + (coursesCount * 45) + 20;
        });
      }
      
      // Set canvas size
      canvas.width = shouldUseTwoColumns ? 900 : 900;
      canvas.height = Math.max(600, totalHeight);
      
      // Fill background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add title
      ctx.fillStyle = '#7c3aed';
      ctx.font = 'bold 28px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`Course Combinations (${combinations.length})`, canvas.width / 2, 40);
      
      // Add subtitle
      ctx.font = '16px Arial, sans-serif';
      ctx.fillStyle = '#374151';
      ctx.fillText('EWU Student\'s Desk - Course Planner Export', canvas.width / 2, 65);
      
      // Add date
      ctx.font = '14px Arial, sans-serif';
      ctx.fillStyle = '#6b7280';
      ctx.fillText(`Generated on: ${new Date().toLocaleString()}`, canvas.width / 2, 85);
      
      // Add separator line
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(50, 105);
      ctx.lineTo(canvas.width - 50, 105);
      ctx.stroke();
      
      let yPosition = 130;
      
      if (shouldUseTwoColumns) {
        // Two-column layout
        const leftColumnX = 20;
        const rightColumnX = leftColumnX + columnWidth + columnSpacing;
        let leftColumnY = yPosition;
        let rightColumnY = yPosition;
        
        combinations.forEach((combination, index) => {
          const isLeftColumn = index % 2 === 0;
          const currentX = isLeftColumn ? leftColumnX : rightColumnX;
          const currentY = isLeftColumn ? leftColumnY : rightColumnY;
          
          const combinationHeight = 60 + (combination.sections.length * 45) + 20;
          
          // Combination background
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(currentX, currentY, columnWidth, combinationHeight);
          
          // Combination border
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = 2;
          ctx.strokeRect(currentX, currentY, columnWidth, combinationHeight);
          
          // Combination header background
          ctx.fillStyle = '#e0e7ff';
          ctx.fillRect(currentX, currentY, columnWidth, 50);
          
          // Combination number and name
          ctx.fillStyle = '#3730a3';
          ctx.font = 'bold 16px Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${index + 1}. ${combination.name}`, currentX + 15, currentY + 25);
          
          // Creation date
          ctx.fillStyle = '#6366f1';
          ctx.font = '10px Arial, sans-serif';
          ctx.fillText(`Created: ${combination.createdAt}`, currentX + 15, currentY + 42);
          
          // Course count
          ctx.fillStyle = '#059669';
          ctx.font = 'bold 10px Arial, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${combination.sections.length} courses`, currentX + columnWidth - 15, currentY + 25);
          
          let courseY = currentY + 65;
          
          // Display courses
          combination.sections.forEach((section, sIdx) => {
            // Course header
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 12px Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${sIdx + 1}. ${section.courseCode} - Section ${section.section}`, currentX + 20, courseY);
            
            courseY += 18;
            
            // Faculty and times
            const facultyText = `Faculty: ${formatFacultyDisplay(section.faculty)}`;
            const timesText = combineTimeSlots(section.times).join(' | ');
            
            // Faculty name
            ctx.fillStyle = '#4338ca';
            ctx.font = '10px Arial, sans-serif';
            ctx.fillText(facultyText, currentX + 40, courseY);
            
            courseY += 12;
            
            // Times (on next line for better fit)
            ctx.fillStyle = '#059669';
            ctx.font = '9px Arial, sans-serif';
            ctx.fillText(`⏰ ${timesText}`, currentX + 40, courseY);
            
            courseY += 15;
          });
          
          // Update column Y positions
          if (isLeftColumn) {
            leftColumnY += combinationHeight + 20;
          } else {
            rightColumnY += combinationHeight + 20;
          }
        });
      } else {
        // Single column layout (original)
        combinations.forEach((combination, index) => {
          const combinationHeight = 60 + (combination.sections.length * 45) + 20;
          
          // Combination background with rounded corners effect
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(30, yPosition, canvas.width - 60, combinationHeight);
          
          // Combination border
          ctx.strokeStyle = '#d1d5db';
          ctx.lineWidth = 2;
          ctx.strokeRect(30, yPosition, canvas.width - 60, combinationHeight);
          
          // Combination header background
          ctx.fillStyle = '#e0e7ff';
          ctx.fillRect(30, yPosition, canvas.width - 60, 50);
          
          // Combination number and name
          ctx.fillStyle = '#3730a3';
          ctx.font = 'bold 18px Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText(`${index + 1}. ${combination.name}`, 45, yPosition + 25);
          
          // Creation date
          ctx.fillStyle = '#6366f1';
          ctx.font = '12px Arial, sans-serif';
          ctx.fillText(`Created: ${combination.createdAt}`, 45, yPosition + 42);
          
          // Course count
          ctx.fillStyle = '#059669';
          ctx.font = 'bold 12px Arial, sans-serif';
          ctx.textAlign = 'right';
          ctx.fillText(`${combination.sections.length} courses`, canvas.width - 45, yPosition + 25);
          
          let courseY = yPosition + 65;
          
          // Display all courses with full details
          combination.sections.forEach((section, sIdx) => {
            // Course header
            ctx.fillStyle = '#1f2937';
            ctx.font = 'bold 14px Arial, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${sIdx + 1}. ${section.courseCode} - Section ${section.section}`, 50, courseY);
            
            courseY += 20;
            
            // Faculty and times on the same line(s)
            const facultyText = `Faculty: ${formatFacultyDisplay(section.faculty)}`;
            const timesText = combineTimeSlots(section.times).join(' | ');
            
            // Faculty name (left side)
            ctx.fillStyle = '#4338ca';
            ctx.font = '12px Arial, sans-serif';
            ctx.fillText(facultyText, 70, courseY);
            
            // Measure faculty text width to position times
            const facultyWidth = ctx.measureText(facultyText).width;
            
            // Times (right side, starting after faculty text)
            ctx.fillStyle = '#059669';
            ctx.font = '11px Arial, sans-serif';
            ctx.fillText(`⏰ ${timesText}`, 70 + facultyWidth + 20, courseY);
            
            courseY += 25; // Space between courses
          });
          
          yPosition += combinationHeight + 20; // Space between combinations
        });
      }
      
      // Add footer
      ctx.fillStyle = '#9ca3af';
      ctx.font = '10px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Generated by EWU Student\'s Desk Course Planner', canvas.width / 2, canvas.height - 20);
      ctx.fillText('Visit: ewu-studentsdesk.vercel.app', canvas.width / 2, canvas.height - 8);
      
      // Create download link
      const link = document.createElement('a');
      link.download = `course-combinations-${new Date().toISOString().split('T')[0]}.png`;
      link.href = canvas.toDataURL('image/png');
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Show success message briefly
      if (exportBtn) {
        exportBtn.textContent = 'Exported!';
        setTimeout(() => {
          if (originalText) exportBtn.textContent = originalText;
        }, 2000);
      }

    } catch (error) {
      console.error('Canvas export failed, trying html2canvas:', error);
      
      // Fallback to html2canvas
      try {
        const html2canvas = (await import('html2canvas')).default;
        const element = document.getElementById('combinations-list');
        
        if (!element) {
          throw new Error('Export element not found');
        }

        // Temporarily remove max-height and overflow for capture
        const originalMaxHeight = element.style.maxHeight;
        const originalOverflow = element.style.overflow;
        element.style.maxHeight = 'none';
        element.style.overflow = 'visible';

        const canvas = await html2canvas(element, {
          backgroundColor: '#ffffff',
          scale: 1.5,
          useCORS: true,
          allowTaint: false,
          logging: false
        });

        // Restore original styles
        element.style.maxHeight = originalMaxHeight;
        element.style.overflow = originalOverflow;

        // Create and trigger download
        const link = document.createElement('a');
        link.download = `course-combinations-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        if (exportBtn) {
          exportBtn.textContent = 'Exported!';
          setTimeout(() => {
            if (originalText) exportBtn.textContent = originalText;
          }, 2000);
        }
        
      } catch (html2canvasError) {
        console.error('html2canvas also failed:', html2canvasError);
        
        // Final fallback: Export as text file
        try {
          const textContent = generateTextExport();
          const blob = new Blob([textContent], { type: 'text/plain' });
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `course-combinations-${new Date().toISOString().split('T')[0]}.txt`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          setError('Image export failed, but combinations exported as text file instead.');
        } catch (fallbackError) {
          setError(`All export methods failed. Please try again.`);
        }
      }
      
      // Reset button text
      const exportBtn = document.querySelector('[data-export-btn]');
      if (exportBtn && originalText) exportBtn.textContent = originalText;
    }
  };

  const handleViewAnalytics = () => {
    // Navigate to analytics page with combinations data
    const analyticsData = {
      combinations: combinations,
      totalCombinations: combinations.length,
      generatedAt: new Date().toISOString()
    };
    
    // Store in session storage for the analytics page
    sessionStorage.setItem('combinationsAnalytics', JSON.stringify(analyticsData));
    
    // Navigate to analytics page
    window.open('/course-planner/analytics', '_blank');
  };

  const generateTextExport = () => {
    let content = `Course Combinations Export\n`;
    content += `Generated on: ${new Date().toLocaleString()}\n`;
    content += `Total Combinations: ${combinations.length}\n\n`;
    content += '='.repeat(50) + '\n\n';
    
    combinations.forEach((combination, index) => {
      content += `${index + 1}. ${combination.name}\n`;
      content += `   Created: ${combination.createdAt}\n`;
      content += `   Courses:\n`;
      combination.sections.forEach(section => {
        content += `   • ${section.courseCode} - Section ${section.section} (${formatFacultyDisplay(section.faculty)})\n`;
        combineTimeSlots(section.times).forEach(combinedTime => {
          content += `     ${combinedTime}\n`;
        });
      });
      content += '\n' + '-'.repeat(30) + '\n\n';
    });
    
    return content;
  };

  // Helper function to get faculty names as an array
  const getFacultyNames = (facultyString) => {
    if (!facultyString) return [];
    // Split by common separators: comma, slash, ampersand, or "and"
    return facultyString.split(/[,/&]|\sand\s/i)
      .map(name => name.trim())
      .filter(name => name.length > 0);
  };

  // Helper function to format faculty display
  const formatFacultyDisplay = (facultyString) => {
    const names = getFacultyNames(facultyString);
    if (names.length <= 1) return facultyString;
    if (names.length === 2) return names.join(' & ');
    return names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
  };

  // Helper function to check if any faculty name matches the search
  const facultyMatchesSearch = (facultyString, searchTerm) => {
    if (!searchTerm) return true;
    const facultyNames = getFacultyNames(facultyString);
    return facultyNames.some(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  // Helper function to combine time slots with same time but different days
  const combineTimeSlots = (times) => {
    const timeGroups = {};
    
    times.forEach(timeObj => {
      const timeString = timeObj.time;
      const parts = timeString.split(' ');
      
      if (parts.length >= 5) {
        const days = parts[0];
        const timeSlot = parts.slice(1).join(' '); // "10:10 AM - 11:40 AM"
        
        if (!timeGroups[timeSlot]) {
          timeGroups[timeSlot] = new Set();
        }
        // Add each individual day to the set
        for (const day of days) {
          timeGroups[timeSlot].add(day);
        }
      }
    });
    
    // Combine days for same time slots with proper ordering
    return Object.entries(timeGroups).map(([timeSlot, daysSet]) => {
      // Define the proper day order: Saturday, Sunday, Monday, Tuesday, Wednesday, Thursday, Friday
      const dayOrder = ['S', 'U', 'M', 'T', 'W', 'R', 'F'];
      const sortedDays = dayOrder.filter(day => daysSet.has(day)).join('');
      return `${sortedDays} ${timeSlot}`;
    });
  };

  // Filter courses by search
  // Helper to normalize course codes for robust search
  const normalize = str => str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

  // Helper to check if search is a non-contiguous subsequence of code
  function isSubsequence(search, code) {
    let i = 0, j = 0;
    while (i < search.length && j < code.length) {
      if (search[i] === code[j]) i++;
      j++;
    }
    return i === search.length;
  }

  const filteredCourses = courses.filter(course => {
    if (!search && !facultySearch) return true;
    const normalizedSearch = normalize(search);
    const normalizedCode = normalize(course.code);
    const normalizedTitle = course.title ? normalize(course.title) : '';

    // Match if normalized search is in code, title, or is a non-contiguous subsequence of code
    const matchesCourseSearch = !search ||
      normalizedCode.includes(normalizedSearch) ||
      normalizedTitle.includes(normalizedSearch) ||
      isSubsequence(normalizedSearch, normalizedCode);

    // Faculty search filter - if faculty search is active, only show courses with matching faculty
    const matchesFacultySearch = !facultySearch ||
      course.sections.some(section =>
        facultyMatchesSearch(section.faculty, facultySearch)
      );

    return matchesCourseSearch && matchesFacultySearch;
  });

  // Helper to parse and organize routine
  function getRoutineTable(sections) {
    // This function is no longer needed as we use a separate page
    return null;
  }

  // Show routine page if requested
  if (showRoutine) {
    return <RoutinePage selectedSections={selectedSections} onBack={() => setShowRoutine(false)} />;
  }

  return (
    <div ref={topRef} className="max-w-5xl rounded-2xl mx-auto p-2 sm:p-4 relative min-h-screen text-gray-200">
      {/* <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold mb-6 sm:mb-8 text-center text-white drop-shadow-lg tracking-tight">Course Planner</h1> */}
      
      {/* Sticky Search Section */}
      <div className={`sticky top-20 z-20 backdrop-blur-md  shadow-lg mb-6 sm:mb-8 lg:p-4 py-2 transition-all duration-300 bg-[#1a1a1a]`}>
        {/* Course Search */}
        <div className="lg:mb-3 mb-1 flex gap-2">
          <input
            type="text"
            placeholder="🔍 Search course code or title..."
            className="w-full p-2 sm:p-3   shadow focus:outline-none focus:ring-2 text-xs sm:text-lg transition-all duration-200 border-gray-600 focus:border-blue-400 focus:ring-blue-500/20 bg-gray-700 text-white placeholder-gray-300"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        
        
       
          <input
            type="text"
            placeholder="👨‍🏫 Search by faculty name..."
            className="w-full p-2 sm:p-3  shadow focus:outline-none focus:ring-2 text-xs sm:text-lg transition-all duration-200 border-gray-600 focus:border-purple-400 focus:ring-purple-500/20 bg-gray-700 text-white placeholder-gray-300"
            value={facultySearch}
            onChange={e => setFacultySearch(e.target.value)}
          />
        </div>
        
        {/* Search Results Info */}
        <div className="flex items-center justify-between">
          <div className="lg:text-sm text-[.6rem] text-white">
            Found {filteredCourses.length} courses
            {search && ` matching course "${search}"`}
            {facultySearch && ` with faculty "${facultySearch}"`}
          </div>
          <div><h1 className="text-white lg:text-sm text-[.6rem]">Last updated : 15 May 2026</h1></div>
          <div><h1 className="text-white lg:text-sm text-[.6rem]">Current semester: Summer-26</h1></div>
          {/* Clear search buttons */}
          {(search || facultySearch) && (
            <div className="flex gap-2">
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="lg:text-xs text-[.6rem] px-2 py-1 rounded-full transition-colors duration-200 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300"
                >
                  Clear Course
                </button>
              )}
              {facultySearch && (
                <button
                  onClick={() => setFacultySearch("")}
                  className="text-xs px-2 py-1 rounded-full transition-colors duration-200 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300"
                >
                  Clear Faculty
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
         

          <div className="pb-6 pt-14 font-semibold text-center text-gray-400 text-[11px] text-[0.6rem] ">
            For reviews, make sure you are logged in to your Facebook account and have joined the EWU Faculty and Course Review group. Note that this list is not official so no one is responsible for its accuracy. Always recheck with the official advising list before finalizing your course selection.
          </div>
      
      <div className="flex  md:gap-10 lg:items-start">
        <div className="grid gap-4 sm:gap-6 md:gap-8 w-[60%] md:w-2/3">
          {filteredCourses.length === 0 && (
            <div className="text-center text-gray-500 text-base sm:text-lg">No courses found.</div>
          )}
          {filteredCourses.map((course) => {
            // Check if this course has matching faculty when searching by faculty
            const hasMatchingFaculty = facultySearch && 
              course.sections.some(section => facultyMatchesSearch(section.faculty, facultySearch));
            
            return (
              <div key={course.code} className={`border border-white/10 lg:w-full shadow-lg p-2 sm:p-6 transition-transform hover:shadow-2xl rounded-t-3xl bg-[#1a1a1a] ${hasMatchingFaculty ? 'border-l-purple-400' : 'border-l-blue-400'}`}>
                <h2 className="font-bold lg:text-lg text-sm mb-2 flex items-center gap-2 text-blue-400">
                  <span className="inline-block px-5 text-center py-2 rounded-3xl lg:text-lg text-sm font-semibold bg-white text-[#1a1a1a]">{course.code}</span>
                  {hasMatchingFaculty && (
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-purple-500/20 text-purple-300">
                      Faculty Match
                    </span>
                  )}
                </h2>
              <ul className="space-y-2 sm:space-y-3 mt-2">
                {course.sections
                  .filter(section => {
                    // If faculty search is active, only show sections with matching faculty
                    if (facultySearch) {
                      return facultyMatchesSearch(section.faculty, facultySearch);
                    }
                    return true;
                  })
                  .map((section) => {
                  // Highlight faculty name if searching by faculty
                  const highlightFaculty = facultySearch && 
                    facultyMatchesSearch(section.faculty, facultySearch);
                  
                  return (
                    <li key={section.section} className="flex flex-col text-xs lg:text-base sm:flex-row items-start sm:items-center gap-2 sm:gap-3 rounded-lg p-2 sm:p-3 border border-white/10 transition bg-[#252525] hover:bg-[#2a2a2a]">
                      <div className="flex-1 w-full">
                        <div className="font-semibold text-blue-300">
                          Section {section.section} 
                          <span className={`text-xs lg:text-sm ml-2 ${highlightFaculty ? 'bg-yellow-200/20 text-yellow-300 px-2 py-1 rounded-full font-bold' : 'text-blue-400'}`}>
                            {formatFacultyDisplay(section.faculty)}
                          </span>
                        </div>
                        {combineTimeSlots(section.times).map((combinedTime, idx) => (
                          <div key={idx} className="lg:text-xs text-[0.7rem] font-mono text-gray-400">
                            {combinedTime}
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2 w-full sm:w-auto">
                        <a
                        href={`https://www.facebook.com/groups/161934770547464/search/?q=${course.code.toLowerCase()}%20${getFacultyNames(section.faculty)[0]?.toLowerCase() || section.faculty.toLowerCase()}
`}
                         
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium shadow transition w-full sm:w-auto text-center bg-[#6D9886] hover:bg-[#5a7d6e]"
                        >
                          Review
                        </a>
                        <button
                          className="text-white px-3 sm:px-4 py-1 sm:py-2 rounded-lg font-medium shadow transition w-full sm:w-auto bg-[#8B7E74] hover:bg-[#7a6e65]"
                          onClick={() => handleAddSection(course, section)}
                        >
                          Add
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
          })}
        </div>
        <div className="md:w-1/2 w-[40%] sticky lg:top-45 top-33 self-start p-1 sm:p-6 border border-white/10 shadow-2xl backdrop-blur-lg max-h-[70vh] overflow-y-auto bg-[#1a1a1a] rounded-3xl">
          <h2 className="font-bold mb-3 sm:mb-4 text-sm sm:text-xl flex items-center gap-2 text-white">
            
            Current Selection
          </h2>
          {error && <div className="bg-red-500/20 text-red-300 p-2 sm:p-3 mb-3 sm:mb-4 rounded-lg border border-red-500/30 shadow text-[.6rem] sm:text-base">{error}</div>}
          
          {/* Current Combination Name Input */}
          <input
            type="text"
            placeholder="Combination name (optional)"
            className="w-full lg:mb-3 mb-1 p-2 border-2 rounded-lg shadow focus:outline-none lg:text-sm text-xs border-blue-200 focus:border-blue-400 bg-[#1a1a1a] text-white placeholder-gray-400"
             value={currentCombinationName}
            onChange={e => setCurrentCombinationName(e.target.value)}
          />
          
          <ul className="space-y-2 sm:space-y-3 mb-4">
            {selectedSections.length === 0 && (
              <li className="text-gray-400 text-center lg:text-base text-xs">No courses selected.</li>
            )}
            {selectedSections.map((section) => (
              <li key={section.id} className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 rounded-lg p-1 sm:p-3 border border-white/10 transition bg-[#252525] hover:bg-[#2a2a2a]">
                <div className="flex-1 w-full">
                  <div className="font-semibold lg:text-base text-[.6rem] text-blue-300">{section.courseCode} - Sec {section.section} <span className="lg:text-xs text-[.6rem] ml-2 text-blue-400">{formatFacultyDisplay(section.faculty)}</span></div>
                  {combineTimeSlots(section.times).map((combinedTime, idx) => (
                    <div key={idx} className="lg:text-xs text-[.6rem] font-mono text-gray-400">
                      {combinedTime}
                    </div>
                  ))}
                </div>
                <button
                  className="text-white px-3 py-1 rounded-lg font-medium shadow transition ml-0 sm:ml-2 w-full sm:w-auto lg:text-base text-[.6rem] bg-red-500/80 hover:bg-red-600"
                  onClick={() => {
                    setSelectedSections(selectedSections.filter(sel => sel.id !== section.id));
                    setError("");
                  }}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          
          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              className="w-full text-white py-1 sm:py-2.5 rounded-xl font-medium shadow transition text-[.6rem] sm:text-base disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500/80 hover:bg-blue-600"
              onClick={handleSaveCombination}
              disabled={selectedSections.length === 0}
            >
              Save as Combination
            </button>
          </div>

          {/* Saved Combinations */}
          {combinations.length > 0 && (
            <div className="mt-6 pt-4 border-t border-white/10">
              <div className=" sm:flex-row gap-2 items-stretch mb-3">
                <h3 className="font-bold text-xs sm:text-lg flex-1 text-blue-300">Saved Combinations ({combinations.length})</h3>
                <div className="flex gap-2 lg:flex-row flex-col my-2">
                  <button
                    className="text-white lg:px-3 px-1 py-2 rounded-lg font-medium shadow transition text-[.6rem] sm:text-sm flex-1 sm:flex-none bg-[#6D9886] hover:bg-[#5a7d6e]"
                    onClick={handleExportCombinations}
                    data-export-btn
                  >
                    Export as Image
                  </button>
                  <button
                    className="text-white px-3 py-2 rounded-lg font-medium shadow transition text-[.6rem] sm:text-sm flex-1 sm:flex-none bg-blue-600/80 hover:bg-blue-700"
                    onClick={handleViewAnalytics}
                  >
                    Analytics
                  </button>
                </div>
              </div>
              
              <div id="combinations-list" className="space-y-3 overflow-y-auto lg:p-3 rounded-lg border border-white/10 bg-[#252525]">
                {combinations.map((combination, idx) => (
                  <div key={combination.id} className="rounded-lg p-3 border border-white/10 bg-[#1a1a1a]">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-xs lg:text-sm text-gray-200">{combination.name}</h4>
                      <button
                        className="text-xs font-bold text-red-400 hover:text-red-300"
                        onClick={() => handleRemoveCombination(combination.id)}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-xs lg:block hidden mb-2 text-gray-500">Created: {combination.createdAt}</div>
                    <div className="space-y-1">
                      {combination.sections.map((section) => (
                        <div key={section.id} className="lg:text-xs text-[.6rem] text-gray-400">
                          <span className="font-medium text-gray-200">{section.courseCode}</span> - Section {section.section} ({formatFacultyDisplay(section.faculty)})
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
