const fs = require('fs');
const path = require('path');

// Input and output file paths
const inputPath = path.join(__dirname, 'public/list', 'updated_2-8-26.csv');
const outputPath = path.join(__dirname, 'public/list', 'cleaned_2-8-26.csv');

function formatNewCSV() {
  try {
    const data = fs.readFileSync(inputPath, 'utf8');
    const lines = data.split('\n');
    
    console.log('Processing new faculty CSV...');
    
    let processedLines = [];
    let currentDept = '';
    let isInDataSection = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Skip header lines and university info
      if (line.startsWith('"East West University"') || 
          line.startsWith('"Offered Courses') || 
          line === '' ||
          line === '""') {
        continue;
      }
      
      // Check if this is a header row
      if (line.startsWith('"Course","Sec","Faculty"')) {
        isInDataSection = true;
        continue;
      }
      
      if (!isInDataSection) continue;
      
      // Parse the CSV line
      const columns = parseCSVLine(line);
      if (columns.length < 3) continue;
      
      let dept = columns[0]?.replace(/"/g, '').trim() || '';
      let col2 = columns[1]?.replace(/"/g, '').trim() || '';
      let col3 = columns[2]?.replace(/"/g, '').trim() || '';
      let col4 = columns[3]?.replace(/"/g, '').trim() || '';
      
      // Update current department if present
      if (dept) {
        currentDept = dept;
      } else {
        dept = currentDept;
      }
      
      if (!dept) continue;
      
      let courseCode = '';
      let section = '';
      let faculty = '';
      let timing = '';
      let capacity = '0/30';
      
      // Determine the format:
      // Format 1 (Lab with dash): dept="PHRM", col2="203-L", col3="1TBA", col4="0/2S 10:10 AM..."
      // Format 2 (Standard): dept="CSE", col2="1011MAR", col3="0/30M 10:10 AM...", col4="room"
      
      if (col2.match(/^\d+-[A-Z]/)) {
        // Format 1: Lab course with dash (e.g., "203-L")
        courseCode = col2;  // "203-L"
        
        // col3 contains section+faculty (e.g., "1TBA")
        const match3 = col3.match(/^(\d+)([A-Z]+.*)$/);
        if (match3) {
          section = match3[1];  // "1"
          faculty = match3[2];  // "TBA"
        }
        
        // col4 contains capacity+timing
        const match4 = col4.match(/^(\d+\/\d+)(.+)$/);
        if (match4) {
          capacity = match4[1];  // "0/2"
          timing = match4[2].trim();  // "S 10:10 AM - 11:25 AM"
        }
        
      } else {
        // Format 2: Standard format
        // col2 contains courseCode+section+faculty (e.g., "1011MAR" or "10110TZE" or "72261TMD")
        const match2 = col2.match(/^(\d+)([A-Z]+.*)$/);
        
        if (match2) {
          const digits = match2[1];
          faculty = match2[2];
          
          // Extract course code and section
          // Evening courses start with "7" and have 4-digit codes (e.g., "7226")
          if (digits.startsWith('7') && digits.length === 5) {
            // Evening course: "72261" -> course="7226", section="1"
            courseCode = digits.substring(0, 4);  // First 4 digits
            section = digits.substring(4);         // Last 1 digit
          } else if (digits.startsWith('7') && digits.length === 6) {
            // Evening course with 2-digit section: "722610" -> course="7226", section="10"
            courseCode = digits.substring(0, 4);  // First 4 digits
            section = digits.substring(4);         // Last 2 digits
          } else if (digits.length === 4) {
            // Regular course: "1011" -> course="101", section="1"
            courseCode = digits.substring(0, 3);  // First 3 digits
            section = digits.substring(3);         // Last 1 digit
          } else if (digits.length === 5) {
            // Regular course with 2-digit section: "10110" -> course="101", section="10"
            courseCode = digits.substring(0, 3);  // First 3 digits
            section = digits.substring(3);         // Last 2 digits
          } else if (digits.length === 3) {
            courseCode = digits;
            section = '1';  // Default to section 1 if not specified
          } else {
            // Can't determine, skip
            continue;
          }
          
          // col3 contains capacity+timing
          const match3 = col3.match(/^(\d+\/\d+)(.+)$/);
          if (match3) {
            capacity = match3[1];
            timing = match3[2].trim();
          } else {
            timing = col3;
          }
        } else {
          // Can't parse, skip
          continue;
        }
      }
      
      // Clean timing
      timing = cleanTiming(timing);
      
      if (!courseCode || !section || !faculty || !timing) {
        continue;
      }
      
      const fullCourse = dept + courseCode;
      const formattedLine = `${fullCourse},${section},${faculty},${capacity},${timing}`;
      processedLines.push(formattedLine);
    }
    
    // Write output
    const header = 'Course,Section,Faculty,Capacity,Timing';
    const output = [header, ...processedLines].join('\n');
    
    fs.writeFileSync(outputPath, output, 'utf8');
    console.log(`✅ Formatted CSV saved as: ${outputPath}`);
    console.log(`📊 Processed ${processedLines.length} course entries`);
    
    return true;
  } catch (error) {
    console.error('❌ Error formatting CSV:', error);
    console.error(error.stack);
    return false;
  }
}

function cleanTiming(timing) {
  // Remove room codes from end of timing
  // Patterns: "AMAB", "PMFUB-301", "PMField Work", "PM352 (Drawing Lab)", etc.
  timing = timing.replace(/(AM|PM)([A-Z0-9][A-Za-z0-9\s\-()]*?)$/, '$1');
  
  // Remove any remaining parentheses content (like "(Allocated for ...)", "(Chemistry Lab)")
  timing = timing.replace(/\s*\([^)]*\)\s*/g, '');
  
  // Clean up extra whitespace
  timing = timing.trim();
  
  return timing;
}

function parseCSVLine(line) {
  const columns = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      columns.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Push the last column
  columns.push(current);
  
  return columns;
}

// Run the function
formatNewCSV();
