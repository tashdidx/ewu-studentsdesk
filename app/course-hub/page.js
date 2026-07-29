import CourseHub from "../../components/course-hub";
import Navigation from '@/components/Navigation'

export default function CourseHubPage() {
  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      <Navigation />
      <CourseHub />
    </div>
  );
}
