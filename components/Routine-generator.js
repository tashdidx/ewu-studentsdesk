"use client";
import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';

function RoutineGenerator() {
  const fileInput = useRef();
  const [routine, setRoutine] = useState(null);
  const [error, setError] = useState("");
  const [weeklySchedule, setWeeklySchedule] = useState(null);

  const parseTimeSlot = (timeStr) => {
    if (!timeStr) return null;
    
    // Handle various time formats from the advising slip
    // Examples: "W 1:30PM-3:09PM", "T 3:10PM-4:40PM", "S 10:10AM-12:00PM", "MW 4:50PM-6:20PM"
    
    // Clean the input string
    const cleanTimeStr = timeStr.toString().trim().replace(/\s+/g, ' ');
    
    // First try the standard format
    let match = cleanTimeStr.match(/([MTWRFSU]+)\s*(\d{1,2}:\d{2}[AP]M)-(\d{1,2}:\d{2}[AP]M)/);
    if (match) {
      const [, days, startTime, endTime] = match;
      return { days, startTime, endTime, original: timeStr };
    }
    
    // Try format without space between days and time
    match = cleanTimeStr.match(/([MTWRFSU]+)(\d{1,2}:\d{2}[AP]M)-(\d{1,2}:\d{2}[AP]M)/);
    if (match) {
      const [, days, startTime, endTime] = match;
      return { days, startTime, endTime, original: timeStr };
    }
    
    // Try format with different separators
    match = cleanTimeStr.match(/([MTWRFSU]+)[\s:]*(\d{1,2}:\d{2}[AP]M)[\s-]*(\d{1,2}:\d{2}[AP]M)/);
    if (match) {
      const [, days, startTime, endTime] = match;
      return { days, startTime, endTime, original: timeStr };
    }
    
    // Try to handle format like "MW4:50PM-6:20PM" (no space)
    match = cleanTimeStr.match(/([MTWRFSU]+)(\d{1,2}:\d{2}[AP]M-\d{1,2}:\d{2}[AP]M)/);
    if (match) {
      const [, days, timeRange] = match;
      const timeMatch = timeRange.match(/(\d{1,2}:\d{2}[AP]M)-(\d{1,2}:\d{2}[AP]M)/);
      if (timeMatch) {
        const [, startTime, endTime] = timeMatch;
        return { days, startTime, endTime, original: timeStr };
      }
    }
    
    console.log('Could not parse time:', timeStr, 'cleaned:', cleanTimeStr);
    return { original: timeStr };
  };

  const formatRoutine = (data) => {
    if (!data || data.length === 0) {
      setError("No data found in the Excel file.");
      return null;
    }

    console.log('Raw data:', data); // Debug

    // Dynamically find the header row
    let headerRowIndex = -1;
    let headers = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row && Array.isArray(row) && row.includes('Course(s)') && row.includes('Time-WeekDay')) {
        headerRowIndex = i;
        headers = row.map(h => h ? h.toString().trim() : '');
        break;
      }
    }

    if (headerRowIndex === -1) {
      console.error('Could not find the course table header row. Please ensure the Excel file contains a table with "Course(s)" and "Time-WeekDay" headers.');
      setError("Could not find a valid course table in the Excel file.");
      return { headers: ['Error'], rows: [['Could not find course table header.']], schedule: {} };
    }
    
    console.log('Found header row at index:', headerRowIndex, 'Headers:', headers);

    // Dynamically find column indices from the header
    const courseIdx = headers.indexOf('Course(s)');
    const secIdx = headers.indexOf('Sec');
    const creditIdx = headers.indexOf('Cr');
    const timeIdx = headers.indexOf('Time-WeekDay');
    const roomIdx = headers.indexOf('Room');
    const remarksIdx = headers.indexOf('Remarks');

    if (courseIdx === -1 || timeIdx === -1) {
      console.error("Could not find required columns in the header.");
      setError("The course table is missing required columns: 'Course(s)' and/or 'Time-WeekDay'.");
      return { headers: ['Error'], rows: [['Missing required columns in header.']], schedule: {} };
    }

    console.log('Dynamic column indices:', { courseIdx, secIdx, creditIdx, timeIdx, roomIdx, remarksIdx });

    // Extract course rows starting from the row after the header
    const courseRows = [];
    let emptyRowCount = 0;
    for (let i = headerRowIndex + 1; i < data.length; i++) {
      const row = data[i];
      
      // Stop if we hit a summary row (starts with "Total")
      if (row && Array.isArray(row) && row[courseIdx] && row[courseIdx].toString().trim().startsWith('Total')) {
        console.log(`Stopping at Total row ${i}`);
        break;
      }
      
      // If row is completely empty or null, count it
      if (!row || !Array.isArray(row) || row.every(cell => !cell || cell.toString().trim() === '')) {
        emptyRowCount++;
        // Stop only if we have 5+ consecutive completely empty rows
        if (emptyRowCount >= 5) {
          console.log(`Stopping after ${emptyRowCount} empty rows at row ${i}`);
          break;
        }
        continue;
      }
      
      // Reset empty row count when we find any non-empty row
      emptyRowCount = 0;
      
      // Extract data from the row
      const courseCode = row[courseIdx] ? row[courseIdx].toString().trim() : '';
      const timeData = row[timeIdx] ? row[timeIdx].toString().trim() : '';
      const sectionData = secIdx > -1 && row[secIdx] ? row[secIdx].toString().trim() : '';
      const roomData = roomIdx > -1 && row[roomIdx] ? row[roomIdx].toString().trim() : '';
      
      // More inclusive criteria - include row if ANY of these conditions are met:
      const hasValidCourse = /^[A-Z]{2,4}\d{3,4}/.test(courseCode) || courseCode.toLowerCase().includes('lab');
      const hasTimeData = timeData && /[MTWRFSU]/.test(timeData);
      const hasSection = sectionData && sectionData.length > 0;
      const hasRoom = roomData && roomData.length > 0;
      const hasAnyRelevantData = hasValidCourse || hasTimeData || (hasSection && hasTimeData) || (hasRoom && hasTimeData);
      
      if (hasAnyRelevantData) {
        courseRows.push(row);
        console.log(`Added course row ${i}:`, { 
          courseCode, 
          timeData, 
          sectionData, 
          roomData, 
          reason: hasValidCourse ? 'Valid course code' : hasTimeData ? 'Has time data' : 'Has relevant data',
          fullRow: row 
        });
      } else {
        console.log(`Skipped row ${i}:`, { 
          courseCode, 
          timeData, 
          sectionData, 
          roomData, 
          reason: 'No relevant course data',
          rowContent: row 
        });
      }
    }
    
    console.log('Dynamically extracted course rows:', courseRows);

    const schedule = {};
    
    courseRows.forEach((row, rowIdx) => {
      if (!row || !Array.isArray(row)) return;
      
      const course = (row[courseIdx] && row[courseIdx].toString().trim()) || '';
      const section = (secIdx > -1 && row[secIdx] && row[secIdx].toString().trim()) || '';
      const credits = (creditIdx > -1 && row[creditIdx] && row[creditIdx].toString().trim()) || '';
      const timeSlot = (row[timeIdx] && row[timeIdx].toString().trim()) || '';
      const room = (roomIdx > -1 && row[roomIdx] && row[roomIdx].toString().trim()) || '';
      const remarks = (remarksIdx > -1 && row[remarksIdx] && row[remarksIdx].toString().trim()) || '';
      
      console.log(`Processing Row ${rowIdx}:`, { 
        course, 
        section, 
        timeSlot, 
        room, 
        credits,
        remarks,
        fullRow: row 
      });
      
      // Skip courses with remarks (dropped/withdrawn courses)
      if (remarks) {
        console.log(`Skipping course ${course} due to remarks: ${remarks}`);
        return;
      }
      
      // Process if we have a time slot (this is the most important criteria)
      if (timeSlot) {
        const parsed = parseTimeSlot(timeSlot);
        console.log('Parsed time for', course || 'Unknown Course', ':', parsed);
        if (parsed && parsed.days) {
          const days = parsed.days.split('');
          days.forEach(day => {
            if (!schedule[day]) schedule[day] = [];
            
            // Determine course name and section with improved logic
            let courseName = course;
            let courseSection = section;
            
            // If no course name in current row, try to inherit from context
            if (!courseName) {
              // Look for the most recent course name in previous rows
              for (let prevIdx = rowIdx - 1; prevIdx >= 0; prevIdx--) {
                const prevRow = courseRows[prevIdx];
                const prevCourse = prevRow && prevRow[courseIdx] ? prevRow[courseIdx].toString().trim() : '';
                const prevSection = prevRow && secIdx > -1 && prevRow[secIdx] ? prevRow[secIdx].toString().trim() : '';
                
                if (prevCourse && /^[A-Z]{2,4}\d{3,4}/.test(prevCourse)) {
                  // Helper function to calculate time duration in minutes
                  const getTimeDuration = (timeStr) => {
                    if (!timeStr) return 0;
                    const parts = timeStr.split('-');
                    if (parts.length !== 2) return 0;
                    
                    const parseTime = (t) => {
                      const [time, period] = t.trim().split(/([AP]M)/);
                      let [hours, minutes] = time.split(':').map(Number);
                      if (period === 'PM' && hours !== 12) hours += 12;
                      if (period === 'AM' && hours === 12) hours = 0;
                      return hours * 60 + minutes;
                    };
                    
                    try {
                      const startMinutes = parseTime(parts[0]);
                      const endMinutes = parseTime(parts[1]);
                      return endMinutes - startMinutes;
                    } catch (e) {
                      console.warn('Error calculating duration:', timeStr, e);
                      return 0;
                    }
                  };
                  
                  try {
                    // Find all durations for this course code across all rows
                    const courseDurations = [];
                    for (let checkIdx = 0; checkIdx < courseRows.length; checkIdx++) {
                      const checkRow = courseRows[checkIdx];
                      const checkCourse = checkRow && checkRow[courseIdx] ? checkRow[courseIdx].toString().trim() : '';
                      const checkTimeSlot = checkRow && checkRow[timeIdx] ? checkRow[timeIdx].toString().trim() : '';
                      
                      // If this row has the same course code or empty course (inheriting from previous)
                      if (checkCourse === prevCourse || (!checkCourse && checkIdx > prevIdx)) {
                        const duration = getTimeDuration(checkTimeSlot);
                        if (duration > 0) {
                          courseDurations.push(duration);
                        }
                      }
                    }
                    
                    // Find the most common duration (that's the regular class)
                    let mostCommonDuration = 0;
                    if (courseDurations.length > 0) {
                      const durationCounts = {};
                      courseDurations.forEach(d => {
                        durationCounts[d] = (durationCounts[d] || 0) + 1;
                      });
                      
                      mostCommonDuration = Object.keys(durationCounts).reduce((a, b) => 
                        durationCounts[a] > durationCounts[b] ? a : b
                      );
                      mostCommonDuration = parseInt(mostCommonDuration);
                    }
                    
                    // Get current row's duration
                    const currentDuration = getTimeDuration(timeSlot);
                    
                    // Check if duration is significantly different from the most common one
                    const durationDiff = mostCommonDuration > 0 ? Math.abs(currentDuration - mostCommonDuration) : 0;
                    const hasDifferentDuration = durationDiff > 30; // More than 30 min difference suggests lab
                    
                    // If duration is different, it's definitely a lab
                    if (hasDifferentDuration && mostCommonDuration > 0) {
                      courseName = prevCourse + ' Lab';
                    } else {
                      // If duration is the same as most common, it's NOT a lab
                      courseName = prevCourse;
                    }
                  } catch (durErr) {
                    console.warn('Error in duration logic:', durErr);
                    courseName = prevCourse;
                  }
                  
                  // Always inherit section from the previous course if current row doesn't have one
                  if (!courseSection && prevSection) {
                    courseSection = prevSection;
                    console.log(`Inherited section "${prevSection}" for course "${courseName}"`);
                  }
                  
                  break;
                }
              }
              
              // Fallback if no previous course found
              if (!courseName) {
                courseName = 'Unknown Course';
              }
            }
            
            // Also check if we have a course name but no section, inherit from previous course
            if (courseName && !courseSection) {
              for (let prevIdx = rowIdx - 1; prevIdx >= 0; prevIdx--) {
                const prevRow = courseRows[prevIdx];
                const prevCourse = prevRow && prevRow[courseIdx] ? prevRow[courseIdx].toString().trim() : '';
                const prevSection = prevRow && secIdx > -1 && prevRow[secIdx] ? prevRow[secIdx].toString().trim() : '';
                
                if (prevCourse && /^[A-Z]{2,4}\d{3,4}/.test(prevCourse) && prevSection) {
                  courseSection = prevSection;
                  console.log(`Inherited section "${prevSection}" for existing course "${courseName}"`);
                  break;
                }
              }
            }
            
            console.log(`Final course data: ${courseName}, section: ${courseSection || 'No section'}`);
            
            schedule[day].push({
              course: courseName,
              section: courseSection || '',
              credits,
              time: `${parsed.startTime}-${parsed.endTime}`,
              room,
              startTime: parsed.startTime
            });
          });
        } else {
          console.warn(`Could not parse time slot for ${course || 'Unknown'}:`, timeSlot);
        }
      } else if (course) {
        // If we have a course but no time slot, warn about it
        console.warn(`Course ${course} has no time slot data`);
      } else {
        console.warn(`Row ${rowIdx} has no course or time data:`, row);
      }
    });
    
    console.log('Final schedule:', schedule);
    
    // Sort by time for each day
    Object.keys(schedule).forEach(day => {
      schedule[day].sort((a, b) => {
        // Handle potential invalid time strings
        try {
          // Convert time strings to 24-hour format for proper sorting
          const parseTime = (timeStr) => {
            const [time, period] = timeStr.split(/([AP]M)/);
            let [hours, minutes] = time.split(':').map(Number);
            
            if (period === 'PM' && hours !== 12) {
              hours += 12;
            } else if (period === 'AM' && hours === 12) {
              hours = 0;
            }
            
            return hours * 60 + minutes; // Convert to minutes for easy comparison
          };
          
          const timeA = parseTime(a.startTime);
          const timeB = parseTime(b.startTime);
          
          return timeA - timeB;
        } catch (e) {
          console.warn('Error sorting times:', a.startTime, b.startTime, e);
          // Fallback to string comparison
          return a.startTime.localeCompare(b.startTime);
        }
      });
      
      console.log(`Sorted schedule for ${day}:`, schedule[day].map(cls => `${cls.course} at ${cls.startTime}`));
    });
    
    return { headers, rows: courseRows, schedule };
  };

  const handleFile = (e) => {
    setError("");
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        
        if (!json || json.length === 0) {
          setError("The Excel file is empty or could not be read. Please check your file.");
          return;
        }
        
        const formatted = formatRoutine(json);
        if (formatted) {
          setRoutine(formatted);
          setWeeklySchedule(formatted.schedule);
        }
      } catch (err) {
        console.error("File parsing error:", err);
        console.error("Error stack:", err.stack);
        
        let errorMsg = "Failed to parse Excel file. ";
        if (err.message.includes('Invalid file')) {
          errorMsg += "The file format is not supported.";
        } else if (err.message.includes('header')) {
          errorMsg += "Could not find required columns (Course(s) and Time-WeekDay).";
        } else {
          errorMsg += "Please ensure it's a valid .xlsx or .xls file and not corrupted.";
        }
        
        setError(errorMsg);
      }
    };
    reader.onerror = () => {
      setError("Failed to read the file. Please try again.");
    };
    reader.readAsArrayBuffer(file);
  };

  const exportAsPDF = () => {
    // Create a new window for PDF export
    const printWindow = window.open('', '_blank');
    const scheduleHTML = generatePrintableHTML();
    
    printWindow.document.write(scheduleHTML);
    printWindow.document.close();
    
    // Wait for content to load then print
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const exportAsImage = async (event) => {
    let buttonElement = null;
    try {
      // Show loading state
      buttonElement = event?.target;
      const originalText = buttonElement?.textContent;
      if (buttonElement) {
        buttonElement.textContent = 'Generating...';
        buttonElement.disabled = true;
      }

      // Check if we have schedule data
      const days = Object.keys(dayNames).filter(day => weeklySchedule[day] && weeklySchedule[day].length > 0);
      if (days.length === 0) {
        throw new Error('No schedule data available to export');
      }

      console.log('Starting Canvas API image export...');

      // Create canvas directly using Canvas API (bypass html2canvas completely)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      // Calculate optimal canvas dimensions
      const maxClassesPerDay = Math.max(...days.map(day => weeklySchedule[day].length));
      const columns = Math.min(days.length, 3);
      const rows = Math.ceil(days.length / columns);
      
      canvas.width = 1400;
      canvas.height = Math.max(900, 250 + rows * (120 + maxClassesPerDay * 90));
      
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#f8fafc');
      gradient.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Add subtle pattern overlay
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      for (let i = 0; i < canvas.width; i += 60) {
        for (let j = 0; j < canvas.height; j += 60) {
          ctx.fillRect(i, j, 30, 30);
        }
      }
      
      // Header with enhanced styling
      const headerY = 60;
      
      // Header background with rounded rectangle effect
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 20;
      ctx.shadowOffsetY = 5;
      ctx.fillRect(50, 20, canvas.width - 100, 100);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // Header border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 2;
      ctx.strokeRect(50, 20, canvas.width - 100, 100);
      
      // Title with gradient effect
      const titleGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      titleGradient.addColorStop(0, '#1e40af');
      titleGradient.addColorStop(1, '#3b82f6');
      ctx.fillStyle = titleGradient;
      ctx.font = 'bold 42px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('📅 Weekly Class Schedule', canvas.width / 2, headerY);
      
      // Subtitle
      ctx.fillStyle = '#64748b';
      ctx.font = '24px Arial, sans-serif';
      ctx.fillText('East West University', canvas.width / 2, headerY + 35);
      
      let yPosition = 160;
      const columnWidth = Math.min(420, (canvas.width - 120) / columns);
      const columnGap = 30;
      const startX = (canvas.width - (columns * columnWidth + (columns - 1) * columnGap)) / 2;
      
      // Draw schedule for each day with enhanced styling
      days.forEach((day, dayIndex) => {
        const columnIndex = dayIndex % columns;
        const rowIndex = Math.floor(dayIndex / columns);
        const x = startX + columnIndex * (columnWidth + columnGap);
        const y = yPosition + rowIndex * (120 + maxClassesPerDay * 90);
        
        const dayContentHeight = weeklySchedule[day].length * 90 + 60;
        const totalDayHeight = 60 + dayContentHeight;
        
        // Day column shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
        ctx.shadowBlur = 25;
        ctx.shadowOffsetY = 8;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, columnWidth, totalDayHeight);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        
        // Day column border with rounded corners effect
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, columnWidth, totalDayHeight);
        
        // Day header with gradient
        const dayGradient = ctx.createLinearGradient(x, y, x + columnWidth, y + 60);
        dayGradient.addColorStop(0, '#3b82f6');
        dayGradient.addColorStop(1, '#1d4ed8');
        ctx.fillStyle = dayGradient;
        ctx.fillRect(x, y, columnWidth, 60);
        
        // Day header top border highlight
        ctx.fillStyle = '#60a5fa';
        ctx.fillRect(x, y, columnWidth, 3);
        
        // Day name with better typography
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 24px Arial, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(dayNames[day], x + columnWidth / 2, y + 38);
        
        // Day content area
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(x, y + 60, columnWidth, dayContentHeight);
        
        // Classes for this day with enhanced cards
        weeklySchedule[day].forEach((cls, classIndex) => {
          const classY = y + 85 + classIndex * 90;
          const cardHeight = 80;
          
          // Class card shadow
          ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
          ctx.shadowBlur = 15;
          ctx.shadowOffsetY = 4;
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(x + 15, classY, columnWidth - 30, cardHeight);
          ctx.shadowColor = 'transparent';
          ctx.shadowBlur = 0;
          ctx.shadowOffsetY = 0;
          
          // Class card border
          ctx.strokeStyle = '#e2e8f0';
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 15, classY, columnWidth - 30, cardHeight);
          
          // Left accent bar with gradient
          const accentGradient = ctx.createLinearGradient(x + 15, classY, x + 15, classY + cardHeight);
          accentGradient.addColorStop(0, '#3b82f6');
          accentGradient.addColorStop(1, '#1e40af');
          ctx.fillStyle = accentGradient;
          ctx.fillRect(x + 15, classY, 6, cardHeight);
          
          // Course name with better styling
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 18px Arial, sans-serif';
          ctx.textAlign = 'left';
          const courseText = cls.course.length > 32 ? cls.course.substring(0, 32) + '...' : cls.course;
          ctx.fillText(courseText, x + 35, classY + 22);
          
          // Section info
          ctx.fillStyle = '#64748b';
          ctx.font = '14px Arial, sans-serif';
          ctx.fillText(`📚 Section: ${cls.section || 'TBA'}`, x + 35, classY + 42);
          
          // Time with clock icon
          ctx.fillStyle = '#2563eb';
          ctx.font = 'bold 14px Arial, sans-serif';
          ctx.fillText(`⏰ ${cls.time}`, x + 35, classY + 58);
          
          // Room info
          ctx.fillStyle = '#64748b';
          ctx.font = '14px Arial, sans-serif';
          ctx.fillText(`📍 Room: ${cls.room || 'TBA'}`, x + 35, classY + 74);
        });
      });
      
      // Enhanced footer
      const footerY = canvas.height - 60;
      
      // Footer background
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = -3;
      ctx.fillRect(50, footerY - 20, canvas.width - 100, 60);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // Footer border
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.strokeRect(50, footerY - 20, canvas.width - 100, 60);
      
      // Generated date
      ctx.fillStyle = '#64748b';
      ctx.font = '16px Arial, sans-serif';
      ctx.textAlign = 'center';
      const currentDate = new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      ctx.fillText(`📅 Generated on ${currentDate}`, canvas.width / 2, footerY + 5);
      
      // Website branding
      ctx.fillStyle = '#3b82f6';
      ctx.font = 'bold 18px Arial, sans-serif';
      ctx.fillText('🎓 EWU Student\'s Desk', canvas.width / 2, footerY + 25);
      
      console.log('Canvas created successfully:', canvas.width, 'x', canvas.height);

      // Convert to blob and download
      return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob && blob.size > 0) {
            console.log('Blob created successfully, size:', blob.size, 'bytes');
            
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `EWU-class-schedule-${new Date().toISOString().split('T')[0]}.png`;
            
            // Force download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            
            alert('📱 Schedule exported successfully as image!');
            resolve();
          } else {
            console.error('Failed to create blob or blob is empty');
            reject(new Error('Failed to create image blob'));
          }
        }, 'image/png', 0.9);
      });

    } catch (error) {
      console.error('Error exporting as image:', error);
      
      // Provide specific error messages
      let errorMessage = 'Failed to export as image:\n\n';
      if (error.message.includes('No schedule data')) {
        errorMessage += '📊 No schedule data available. Please upload an advising slip first.';
      } else if (error.message.includes('blob')) {
        errorMessage += '🖼️ Image generation failed due to browser restrictions.';
      } else {
        errorMessage += `❌ ${error.message || 'Unknown error occurred.'}`;
      }
      
      errorMessage += '\n\n💡 Tips:\n• Try using the PDF export option instead\n• Try a different browser (Chrome/Firefox work best)\n• Make sure you have uploaded a schedule first';
      alert(errorMessage);
    } finally {
      // Restore button state
      if (buttonElement) {
        buttonElement.textContent = 'Export as Image';
        buttonElement.disabled = false;
      }
    }
  };

  const generatePrintableHTML = () => {
    const days = Object.keys(dayNames).filter(day => weeklySchedule[day] && weeklySchedule[day].length > 0);
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Class Schedule</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              background: white;
              padding: 15px;
              font-size: 12px;
            }
            .container { 
              max-width: 100%; 
              margin: 0 auto;
            }
            .header { 
              text-align: center; 
              margin-bottom: 20px;
              border-bottom: 2px solid #2563eb;
              padding-bottom: 10px;
            }
            .header h1 { 
              color: #2563eb; 
              font-size: 24px; 
              margin-bottom: 5px;
            }
            .header p { 
              color: #6b7280; 
              font-size: 14px;
            }
            .schedule-grid { 
              display: grid; 
              grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
              gap: 15px;
              page-break-inside: avoid;
            }
            .day-column { 
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              overflow: hidden;
              background: #f9fafb;
            }
            .day-header { 
              background: #2563eb; 
              color: white; 
              padding: 8px; 
              text-align: center; 
              font-weight: bold;
              font-size: 14px;
            }
            .day-content { 
              padding: 8px;
            }
            .class-item { 
              background: white; 
              margin-bottom: 8px; 
              padding: 8px; 
              border-radius: 4px;
              border-left: 3px solid #2563eb;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .class-item:last-child { margin-bottom: 0; }
            .course-name { 
              font-weight: bold; 
              color: #1e40af; 
              font-size: 13px;
              margin-bottom: 3px;
            }
            .class-details { 
              font-size: 11px; 
              color: #6b7280;
              line-height: 1.3;
            }
            .time { 
              color: #2563eb; 
              font-weight: 600;
            }
            @media print {
              body { padding: 10px; }
              .container { max-width: 100%; }
              .schedule-grid { 
                grid-template-columns: repeat(${Math.min(days.length, 3)}, 1fr);
                gap: 10px;
              }
              .header h1 { font-size: 20px; }
              .day-header { font-size: 12px; padding: 6px; }
              .class-item { padding: 6px; margin-bottom: 6px; }
              .course-name { font-size: 12px; }
              .class-details { font-size: 10px; }
            }
            @page {
              size: A4;
              margin: 0.5in;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Weekly Class Schedule</h1>
              <p>East West University</p>
            </div>
            <div class="schedule-grid">
              ${days.map(day => `
                <div class="day-column">
                  <div class="day-header">${dayNames[day]}</div>
                  <div class="day-content">
                    ${weeklySchedule[day].map(cls => `
                      <div class="class-item">
                        <div class="course-name">${cls.course}</div>
                        <div class="class-details">
                          <div>Section: ${cls.section || 'TBA'}</div>
                          <div class="time">${cls.time}</div>
                          <div>Room: ${cls.room}</div>
                        </div>
                      </div>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </body>
      </html>
    `;
  };

  const dayNames = {
      'S': 'Sunday',
    'M': 'Monday',
    'T': 'Tuesday', 
    'W': 'Wednesday',
    'R': 'Thursday',
    'F': 'Friday',
    'A': 'Saturday',
  };

  return (
    <div className="pt-34">
      <div className="max-w-6xl mx-auto">
        <div className="bg-[#1a1a1a] rounded-3xl shadow-2xl p-8 mb-8 border border-white/10 relative overflow-hidden no-print">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl opacity-30 z-0" />
          <h2 className="text-3xl font-extrabold text-white mb-6 text-center drop-shadow-lg z-10 relative">Class Routine Generator</h2>
          
          <div className="z-10 relative">
            <label className="block text-lg font-semibold text-white mb-3">Upload Advising Slip (Excel)</label>
            <input
              type="file"
              accept=".xlsx,.xls"
              ref={fileInput}
              onChange={handleFile}
              className="w-full p-4 border border-white/10 rounded-xl bg-[#252525] text-white file:mr-4 file:py-2 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition"
            />
            {error && <div className="text-red-400 mt-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">{error}</div>}
          </div>
        </div>

        {weeklySchedule && Object.keys(weeklySchedule).length > 0 && (
          <div className="bg-[#1a1a1a] rounded-3xl shadow-2xl p-8 border border-white/10 relative overflow-hidden routine-table">
            <div className="absolute -bottom-10 -left-10 w-44 h-40 bg-indigo-500/10 rounded-full blur-2xl opacity-30 z-0 no-print" />
            <h3 className="text-2xl font-bold text-indigo-300 mb-6 text-center z-10 relative">Weekly Class Schedule</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 z-10 relative">
              {Object.keys(dayNames).map(day => (
                weeklySchedule[day] && weeklySchedule[day].length > 0 && (
                  <div key={day} className="bg-[#252525] rounded-2xl p-4 border border-white/10">
                    <h4 className="text-lg font-bold text-blue-300 mb-3 text-center">{dayNames[day]}</h4>
                    <div className="space-y-2">
                      {weeklySchedule[day].map((cls, idx) => (
                        <div key={idx} className="bg-[#1a1a1a] rounded-lg p-3 shadow border-l-4 border-blue-500">
                          <div className="font-bold text-blue-300">{cls.course}</div>
                          <div className="text-sm text-gray-400">Section: {cls.section || 'TBA'}</div>
                          <div className="text-sm text-blue-400 font-semibold">{cls.time}</div>
                          <div className="text-sm text-gray-400">Room: {cls.room || 'TBA'}</div>
                          {/* <div className="text-xs text-gray-500">Credits: {cls.credits}</div> */}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              ))}
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center gap-4 z-10 relative no-print">
             
              <button 
                onClick={exportAsPDF}
                className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 flex items-center gap-2 text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export as PDF
              </button>
              <button 
                onClick={exportAsImage}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 flex items-center gap-2 text-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Export as Image
              </button>
            </div>
          </div>
        )}

        {routine && (!weeklySchedule || Object.keys(weeklySchedule).length === 0) && (
          <div className="bg-[#1a1a1a] rounded-3xl shadow-2xl p-8 border border-white/10 relative overflow-hidden">
            <h3 className="text-2xl font-bold text-red-300 mb-6 text-center">Raw Data (Debug View)</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-[#252525]">
                    {routine.headers.map((header, j) => (
                      <th key={j} className="border border-white/10 px-4 py-2 text-left font-bold text-gray-200">
                        {header || `Column ${j + 1}`}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {routine.rows.slice(0, 10).map((row, i) => (
                    <tr key={i} className={i % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#222]'}>
                      {row.map((cell, j) => (
                        <td key={j} className="border border-white/10 px-4 py-2 text-gray-300">
                          {cell || '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .routine-table {
            width: 100% !important;
            margin: 0 !important;
            box-shadow: none !important;
            page-break-inside: avoid;
          }
          .routine-table .grid {
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)) !important;
            gap: 8px !important;
          }
          .routine-table h3 {
            font-size: 18px !important;
            margin-bottom: 15px !important;
          }
          .routine-table h4 {
            font-size: 14px !important;
            margin-bottom: 8px !important;
          }
          .routine-table .border-l-4 {
            padding: 6px !important;
            margin-bottom: 6px !important;
          }
          .routine-table .font-bold {
            font-size: 12px !important;
          }
          .routine-table .text-sm {
            font-size: 10px !important;
          }
          .routine-table .text-xs {
            font-size: 9px !important;
          }
        }
        @page {
          size: A4;
          margin: 0.5in;
        }
      `}</style>
    </div>
  );
}

export default RoutineGenerator;
