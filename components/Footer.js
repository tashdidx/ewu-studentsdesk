'use client';
import { FaHeart, FaGithub, FaLinkedin, FaEnvelope } from 'react-icons/fa';
import Link from 'next/link';
import { useState } from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!feedback.trim() || !email.trim()) return;
    
    setIsSubmitting(true);
    
    try {
      // Using Formspree to send emails
      const response = await fetch('https://formspree.io/f/xkgdznad', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          message: feedback,
          _subject: 'EWU Helpdesk - New Feedback'
        })
      });

      if (response.ok) {
        alert('Thank you for your feedback! Your message has been sent successfully.');
        setFeedback('');
        setEmail('');
      } else {
        throw new Error('Failed to send message');
      }
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Sorry, there was an error sending your feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <footer className="pt-16 bg-gradient-to-r from-gray-900 via-gray-800 to-black border-t border-gray-700 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:50px_50px]"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-sm">EWU</span>
              </div>
              <span className="text-xl font-bold text-white">Student&apos;s Desk</span>
            </div>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your comprehensive portal for course planning, routine generation, and CGPA calculation.
            </p>
          </div>

          {/* Feedback Form */}
          <div className="space-y-4 w-[80%]">
            <h3 className="text-white font-semibold text-lg">Quick Feedback</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="How can we improve this portal? Share your thoughts..."
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-300"
                  rows="3"
                  required
                />
              </div>
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email "
                  className="flex-1 px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-gray-100 placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
                  required
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !feedback.trim()}
                  className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isSubmitting ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>

          {/* Support & Contact */}
          <div className="space-y-4">
            <h3 className="text-white font-semibold text-lg">Contact</h3>
            <div className="space-y-2">
              <p className="text-gray-300 text-sm">
                 Get in touch with the developer!
              </p>
              <div className="flex space-x-4">
                <a
                  href="mailto:tashdid.professional@gmail.com"
                  className="text-gray-400 hover:text-blue-400 transition-colors transform hover:scale-110 duration-300"
                  title="Email Support"
                >
                  <FaEnvelope className="w-5 h-5" />
                </a>
                <a
                  href=""
                  className="text-gray-400 hover:text-purple-400 transition-colors transform hover:scale-110 duration-300"
                  title="GitHub Repository"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaGithub className="w-5 h-5" />
                </a>
                <a
                  href=""
                  className="text-gray-400 hover:text-emerald-400 transition-colors transform hover:scale-110 duration-300"
                  title="LinkedIn"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <FaLinkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0">
          <p className="text-gray-400 text-sm text-center">
            © {currentYear} East West University Student&apos;s Desk. Developed by <span className='font-semibold  text-blue-400 hover:text-blue-300 transition-colors'>Hasan Habibur Rahman</span>
            <span className="ml-2 font-bold text-gray-400">(1.3.0)</span>
          </p>
          {/* <div className="flex space-x-6 text-xs text-gray-400">
            <Link href="/privacy" className="hover:text-gray-200 transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-gray-200 transition-colors">
              Terms of Service
            </Link>
            <Link href="/about" className="hover:text-gray-200 transition-colors">
              About
            </Link>
          </div> */}
        </div>
      </div>
    </footer>
  );
}
