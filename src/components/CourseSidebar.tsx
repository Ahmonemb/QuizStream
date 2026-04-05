import {
  Home,
  BookOpen,
  BarChart3,
  Settings,
  GraduationCap,
} from "lucide-react";
import { learnerProfile, navItems } from "@/data/courseData";
import { useLocation, Link } from "react-router-dom";

const iconMap: Record<string, React.ElementType> = {
  Home,
  BookOpen,
  BarChart3,
  Settings,
};

const CourseSidebar = () => {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-60 bg-card border-r border-border h-screen sticky top-0 shrink-0">
      <div className="flex items-center gap-2 px-6 py-5 border-b border-border">
        <GraduationCap className="h-7 w-7 text-primary" />
        <span className="text-lg font-bold text-foreground">QuizStream</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || Home;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.id}
              to={item.path}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-accent text-accent-foreground border-l-4 border-primary pl-2"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-semibold">
            {learnerProfile.initials}
          </div>
          <div className="text-sm">
            <p className="font-medium text-foreground">{learnerProfile.name}</p>
            <p className="text-muted-foreground text-xs">{learnerProfile.plan}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default CourseSidebar;
