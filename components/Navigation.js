'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FaHome, FaBookOpen, FaCalendarAlt, FaCalculator, FaBars, FaTimes } from 'react-icons/fa';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const navItems = [
   
    { href: '/course-planner', label: 'Course Planner' },
    { href: '/routine-generator', label: 'Routine Generator' },
    { href: '/cgpa-calculator', label: 'CGPA Calculator' },
    { href: '/course-hub', label: 'Course Hub' },
  ];

  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex justify-center px-4">
      <nav className="flex items-center gap-6 bg-[#1a1a1a] rounded-full px-4 py-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/[0.06] backdrop-blur-sm w-full max-w-4xl">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-110 hover:shadow-lg hover:shadow-white/20 transition-all duration-300">
            <span className="text-[#1a1a1a] font-bold text-xs">EWU</span>
          </div>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-1 flex-1 justify-center">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-4 py-2 rounded-full text-xs font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Contact Button */}
        <div className="hidden md:flex flex-shrink-0">
          <Link href="/">
            <div className="bg-white text-[#1a1a1a] text-sm font-medium px-5 py-2 rounded-full whitespace-nowrap hover:shadow-lg hover:shadow-white/20 hover:scale-105 transition-all duration-300 cursor-pointer">
              EWU Student&apos;s desk
            </div>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden text-gray-300 hover:text-white p-2 transition-colors duration-200"
        >
          {isMenuOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
        </button>
      </nav>

      {/* Mobile Navigation Dropdown */}
      {isMenuOpen && (
        <div className="md:hidden fixed top-[68px] left-4 right-4 bg-[#1a1a1a] rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.5)] border border-white/[0.06] p-4 z-50">
          <div className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
            <Link href="/" onClick={() => setIsMenuOpen(false)}>
              <div className="bg-white text-[#1a1a1a] text-sm font-medium px-5 py-2.5 rounded-xl text-center mt-1.5 hover:shadow-lg hover:shadow-white/20 transition-all duration-300">
                EWU Student&apos;s desk
              </div>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
