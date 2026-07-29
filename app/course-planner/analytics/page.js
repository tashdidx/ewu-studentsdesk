import Analytics from '../../../components/analytics';
import Navigation from '@/components/Navigation'

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navigation />
      <Analytics />
    </div>
  );
}

export const metadata = {
  title: 'Course Combinations Analytics - EWU Helpdesk',
  description: 'Comprehensive analytics and insights for your saved course combinations',
};
