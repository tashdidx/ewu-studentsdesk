"use client";
import { useState } from "react";

const gradePoints = {
  "A+": 4.0, "A": 3.75, "A-": 3.5,
  "B+": 3.25, "B": 3.0, "B-": 2.75,
  "C+": 2.5, "C": 2.25, 
  "D": 2.0, "F": 0.0
};

export default function CgpaCalculator() {
  const [courses, setCourses] = useState([
    { name: "", credit: "", grade: "" },
    { name: "", credit: "", grade: "" },
    { name: "", credit: "", grade: "" }
  ]);
  const [prevCredit, setPrevCredit] = useState("");
  const [prevCgpa, setPrevCgpa] = useState("");
  const [termCgpa, setTermCgpa] = useState(null);
  const [totalCgpa, setTotalCgpa] = useState(null);
  
  // Goal planning states
  const [goalCourses, setGoalCourses] = useState([
    { name: "", credit: "" },
    { name: "", credit: "" }
  ]);
  const [targetCgpa, setTargetCgpa] = useState("");
  const [goalPrevCredit, setGoalPrevCredit] = useState("");
  const [goalPrevCgpa, setGoalPrevCgpa] = useState("");
  const [gradeCombinations, setGradeCombinations] = useState(null);
  const [activeTab, setActiveTab] = useState("calculator");

  const handleCourseChange = (idx, field, value) => {
    const updated = courses.map((c, i) => i === idx ? { ...c, [field]: value } : c);
    setCourses(updated);
  };

  const addCourse = () => setCourses([...courses, { name: "", credit: "", grade: "" }]);
  const removeCourse = (idx) => setCourses(courses.filter((_, i) => i !== idx));

  // Goal planning functions
  const handleGoalCourseChange = (idx, field, value) => {
    const updated = goalCourses.map((c, i) => i === idx ? { ...c, [field]: value } : c);
    setGoalCourses(updated);
  };

  const addGoalCourse = () => setGoalCourses([...goalCourses, { name: "", credit: "" }]);
  const removeGoalCourse = (idx) => setGoalCourses(goalCourses.filter((_, i) => i !== idx));

  const generateGradeCombinations = (courses, targetPoints) => {
    const grades = Object.keys(gradePoints).reverse(); // Start with highest grades
    const combinations = [];
    
    const generate = (courseIndex, currentCombination) => {
      if (courseIndex === courses.length) {
        // Calculate total points for this combination
        let totalPoints = 0;
        for (let i = 0; i < courses.length; i++) {
          totalPoints += parseFloat(courses[i].credit) * gradePoints[currentCombination[i]];
        }
        
        // Accept combinations that meet or exceed the target
        if (totalPoints >= targetPoints) {
          combinations.push({
            grades: [...currentCombination],
            points: totalPoints,
            excess: totalPoints - targetPoints
          });
        }
        return;
      }
      
      // Try each grade for current course
      for (const grade of grades) {
        currentCombination[courseIndex] = grade;
        generate(courseIndex + 1, currentCombination);
        
        // Limit combinations to prevent excessive computation
        if (combinations.length >= 100) return;
      }
    };
    
    generate(0, new Array(courses.length));
    
    // Sort by excess points (closest to target first) and limit results
    combinations.sort((a, b) => a.excess - b.excess);
    return combinations.slice(0, 15); // Return top 15 closest combinations
  };

  const findGradeCombinations = () => {
    // Validate inputs
    const validCourses = goalCourses.filter(c => c.credit && !isNaN(parseFloat(c.credit)));
    if (validCourses.length === 0 || !targetCgpa) {
      alert("Please enter target CGPA and at least one course with credits.");
      return;
    }

    const target = parseFloat(targetCgpa);
    const prevCr = parseFloat(goalPrevCredit) || 0;
    const prevCg = parseFloat(goalPrevCgpa) || 0;
    
    // Calculate required points for new courses
    let totalNewCredits = 0;
    for (const course of validCourses) {
      totalNewCredits += parseFloat(course.credit);
    }
    
    const totalCreditsAfter = prevCr + totalNewCredits;
    const totalPointsNeeded = target * totalCreditsAfter;
    const newPointsNeeded = totalPointsNeeded - (prevCg * prevCr);
    
    // Check if target is achievable
    const maxPossiblePoints = totalNewCredits * 4.0; // Assuming A+ = 4.0 is max
    const minPossiblePoints = totalNewCredits * 0.0; // F = 0.0 is min
    
    if (newPointsNeeded > maxPossiblePoints) {
      setGradeCombinations({ error: "Target CGPA is too high to achieve with these courses." });
      return;
    }
    
    if (newPointsNeeded < minPossiblePoints) {
      setGradeCombinations({ error: "Target CGPA is too low - you'll achieve it with any grades." });
      return;
    }
    
    const combinations = generateGradeCombinations(validCourses, newPointsNeeded);
    
    if (combinations.length === 0) {
      setGradeCombinations({ error: "No grade combinations found that can achieve your target CGPA." });
    } else {
      // Calculate actual CGPA for each combination
      const enrichedCombinations = combinations.map(combo => {
        const actualTotalPoints = (prevCg * prevCr) + combo.points;
        const actualCgpa = actualTotalPoints / totalCreditsAfter;
        return {
          ...combo,
          actualCgpa: actualCgpa.toFixed(2)
        };
      });
      
      setGradeCombinations({
        courses: validCourses,
        combinations: enrichedCombinations,
        targetCgpa: target,
        totalCredits: totalCreditsAfter
      });
    }
  };

  const calculate = () => {
    let totalPoints = 0, totalCredits = 0;
    for (const c of courses) {
      const credit = parseFloat(c.credit);
      const gp = gradePoints[c.grade.toUpperCase()] ?? null;
      if (!isNaN(credit) && gp !== null) {
        totalPoints += credit * gp;
        totalCredits += credit;
      }
    }
    const term = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : null;
    setTermCgpa(term);

    // Total CGPA calculation
    const prevCr = parseFloat(prevCredit);
    const prevCg = parseFloat(prevCgpa);
    let totalCg = null;
    if (!isNaN(prevCr) && !isNaN(prevCg) && totalCredits > 0) {
      const newTotalCredits = prevCr + totalCredits;
      const newTotalPoints = prevCg * prevCr + totalPoints;
      totalCg = (newTotalPoints / newTotalCredits).toFixed(2);
    } else if (totalCredits > 0) {
      totalCg = term;
    }
    setTotalCgpa(totalCg);
  };

  return (
    <div className="pt-24">
    <div className="max-w-4xl mx-auto bg-[#1a1a1a] rounded-2xl shadow-xl p-4 sm:p-6  border border-white/10 relative overflow-hidden">
      <div className="absolute -top-8 -left-8 w-28 h-28 bg-blue-500/10 rounded-full blur-2xl opacity-30 z-0" />
      <div className="absolute -bottom-8 -right-8 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl opacity-30 z-0" />
      
      {/* Tab Navigation */}
      <div className="flex justify-center mb-4 sm:mb-6 z-10 relative">
        <div className="bg-[#252525] p-1 rounded-xl border border-white/10">
          <button
            onClick={() => setActiveTab("calculator")}
            className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              activeTab === "calculator"
                ? "bg-blue-500 text-white shadow-md"
                : "text-blue-300 hover:bg-white/10"
            }`}
          >
            CGPA Calculator
          </button>
          <button
            onClick={() => setActiveTab("planner")}
            className={`px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all text-sm sm:text-base ${
              activeTab === "planner"
                ? "bg-blue-500 text-white shadow-md"
                : "text-blue-300 hover:bg-white/10"
            }`}
          >
            Grade Planner
          </button>
        </div>
      </div>

      {activeTab === "calculator" ? (
        /* Calculator Tab */
        <div className="max-w-lg mx-auto px-2 sm:px-0">
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mb-4 text-center drop-shadow-lg z-10 relative tracking-tight">CGPA Calculator</h2>
          <div className="space-y-3 z-10 relative">
            {courses.map((c, idx) => (
              <div key={idx} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-[#252525] rounded-lg shadow p-3 sm:p-2 border border-white/10 transition">
                <input
                  type="text"
                  className="flex-1 p-2 sm:p-1.5 border border-white/10 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none font-semibold text-white bg-[#252525] placeholder:text-gray-500 text-sm"
                  placeholder="Course Name (optional)"
                  value={c.name}
                  onChange={e => handleCourseChange(idx, "name", e.target.value)}
                />
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="flex-1 sm:w-20 p-2 sm:p-1.5 border border-white/10 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none font-semibold text-white bg-[#252525] placeholder:text-gray-500 text-sm"
                    placeholder="Credit"
                    value={c.credit}
                    onChange={e => handleCourseChange(idx, "credit", e.target.value)}
                  />
                  <select
                    className="flex-1 sm:w-20 p-2 sm:p-1.5 border border-white/10 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none font-semibold text-white bg-[#252525] text-sm"
                    value={c.grade}
                    onChange={e => handleCourseChange(idx, "grade", e.target.value)}
                  >
                    <option value="">Grade</option>
                    {Object.keys(gradePoints).map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                  <button
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 sm:p-1.5 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:hover:bg-transparent group"
                    onClick={() => removeCourse(idx)}
                    disabled={courses.length === 1}
                    title="Remove course"
                  >
                    <svg 
                      className="w-4 h-4 group-hover:scale-110 transition-transform" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path 
                        fillRule="evenodd" 
                        d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" 
                        clipRule="evenodd" 
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
            <button
              className="bg-blue-500 text-white px-4 py-2 sm:py-1.5 rounded-lg shadow font-bold hover:from-blue-500 hover:to-indigo-600 transition text-sm flex items-center gap-2 mx-auto"
              onClick={addCourse}
            >
              <span className="text-lg">＋</span> Add Course
            </button>
          </div>
          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 z-10 relative">
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full p-3 sm:p-2 border border-white/10 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none font-semibold text-white bg-[#252525] placeholder:text-gray-500 text-sm"
              placeholder="Previous Total Credits (optional)"
              value={prevCredit}
              onChange={e => setPrevCredit(e.target.value)}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              className="w-full p-3 sm:p-2 border border-white/10 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none font-semibold text-white bg-[#252525] placeholder:text-gray-500 text-sm"
              placeholder="Previous CGPA (optional)"
              value={prevCgpa}
              onChange={e => setPrevCgpa(e.target.value)}
            />
          </div>
          <button
            className="mt-6 w-full bg-blue-500 text-white py-3 sm:py-2 rounded-xl font-extrabold shadow hover:from-green-500 hover:to-blue-600 transition text-base tracking-wide z-10 relative"
            onClick={calculate}
          >
            Calculate
          </button>
          <div className="mt-6 text-center space-y-1 z-10 relative">
            {termCgpa && <div className="text-base font-semibold text-gray-300">Term CGPA: <span className="font-bold text-blue-300">{termCgpa}</span></div>}
            {totalCgpa && <div className="text-base font-semibold text-gray-300">Total CGPA: <span className="font-bold text-green-400">{totalCgpa}</span></div>}
          </div>
        </div>
      ) : (
        /* Grade Planner Tab */
        <div className="max-w-3xl mx-auto px-2 sm:px-0">
          <h2 className="text-xl sm:text-2xl font-extrabold text-blue-300 mb-4 text-center drop-shadow-lg z-10 relative tracking-tight">Grade Planner</h2>
          <p className="text-blue-300 text-center mb-6 text-sm">Find what grades you need to achieve your target CGPA</p>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Input Section */}
            <div className="space-y-4 z-10 relative">
              <div className="bg-[#252525] rounded-lg p-4 border border-white/10 shadow">
                <h3 className="font-bold text-blue-300 mb-3">Target & Previous Records</h3>
                <div className="space-y-3">
                  <input
                    type="number"
                    min="0"
                    max="4"
                    step="0.01"
                    className="w-full p-3 sm:p-2 border border-white/10 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none font-semibold text-white bg-[#252525] placeholder:text-gray-500 text-sm"
                    placeholder="Target CGPA (e.g., 3.50)"
                    value={targetCgpa}
                    onChange={e => setTargetCgpa(e.target.value)}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className="w-full p-3 sm:p-2 border border-white/10 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none font-semibold text-white bg-[#252525] placeholder:text-gray-500 text-sm"
                      placeholder="Previous Credits"
                      value={goalPrevCredit}
                      onChange={e => setGoalPrevCredit(e.target.value)}
                    />
                    <input
                      type="number"
                      min="0"
                      max="4"
                      step="0.01"
                      className="w-full p-3 sm:p-2 border border-white/10 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none font-semibold text-white bg-[#252525] placeholder:text-gray-500 text-sm"
                      placeholder="Previous CGPA"
                      value={goalPrevCgpa}
                      onChange={e => setGoalPrevCgpa(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#252525] rounded-lg p-4 border border-white/10 shadow">
                <h3 className="font-bold text-blue-300 mb-3">Upcoming Courses</h3>
                <div className="space-y-2">
                  {goalCourses.map((c, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                      <input
                        type="text"
                        className="flex-1 p-3 sm:p-2 border border-white/10 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none font-semibold text-white bg-[#252525] placeholder:text-gray-500 text-sm"
                        placeholder="Course Name (optional)"
                        value={c.name}
                        onChange={e => handleGoalCourseChange(idx, "name", e.target.value)}
                      />
                      <div className="flex gap-2 items-center">
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="flex-1 sm:w-24 p-3 sm:p-2 border border-white/10 rounded focus:ring-2 focus:ring-blue-400 focus:outline-none font-semibold text-white bg-[#252525] placeholder:text-gray-500 text-sm"
                          placeholder="Credits"
                          value={c.credit}
                          onChange={e => handleGoalCourseChange(idx, "credit", e.target.value)}
                        />
                        <button
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 sm:p-1.5 rounded-lg transition-all duration-200 disabled:opacity-40 disabled:hover:bg-transparent group"
                          onClick={() => removeGoalCourse(idx)}
                          disabled={goalCourses.length === 1}
                          title="Remove course"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    className="bg-gradient-to-r from-blue-400 to-indigo-500 text-white px-3 py-2 sm:py-1.5 rounded-full shadow font-bold hover:from-blue-500 hover:to-indigo-600 transition text-sm flex items-center gap-2 mx-auto"
                    onClick={addGoalCourse}
                  >
                    <span className="text-lg">＋</span> Add Course
                  </button>
                </div>
              </div>

              <button
                className="w-full bg-gradient-to-r from-purple-400 to-pink-500 text-white py-3 sm:py-2 rounded-xl font-extrabold shadow hover:from-purple-500 hover:to-pink-600 transition text-base tracking-wide z-10 relative"
                onClick={findGradeCombinations}
              >
                Find Grade Combinations
              </button>
            </div>

            {/* Results Section */}
            <div className="z-10 relative">
              {gradeCombinations && (
                <div className="bg-[#252525] rounded-lg p-4 border border-white/10 shadow">
                  <h3 className="font-bold text-blue-300 mb-3">Grade Combinations</h3>
                  {gradeCombinations.error ? (
                    <div className="text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg text-sm">
                      {gradeCombinations.error}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="text-sm text-blue-300 bg-[#1a1a1a] p-2 rounded border border-white/10">
                        Target: <span className="font-bold">{gradeCombinations.targetCgpa}</span> CGPA (minimum)
                        with <span className="font-bold">{gradeCombinations.totalCredits}</span> total credits
                      </div>
                      <div className="max-h-80 overflow-y-auto space-y-2">
                        {gradeCombinations.combinations.map((combination, idx) => (
                          <div key={idx} className="border border-white/10 rounded p-3 bg-[#1a1a1a]">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                              <div className="text-xs font-semibold text-gray-400">Option {idx + 1}:</div>
                              <div className="text-sm font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded text-center sm:text-left">
                                CGPA: {combination.actualCgpa}
                              </div>
                            </div>
                            <div className="grid grid-cols-1 gap-1">
                              {gradeCombinations.courses.map((course, courseIdx) => (
                                <div key={courseIdx} className="flex flex-col sm:flex-row sm:justify-between text-sm gap-1">
                                  <span className="text-blue-300">
                                    {course.name || `Course ${courseIdx + 1}`} ({course.credit} cr):
                                  </span>
                                  <span className="font-bold text-green-400">
                                    {combination.grades[courseIdx]}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
}
