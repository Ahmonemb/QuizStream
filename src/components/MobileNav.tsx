import { Home, BookOpen, BarChart3, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const items = [
  { icon: Home, label: "Home", path: "/" },
  { icon: BookOpen, label: "Courses", path: "/courses" },
  { icon: BarChart3, label: "Progress", path: "/progress" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

const MobileNav = () => {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around py-2 px-1">
      {items.map((item) => (
        <Link
          key={item.label}
          to={item.path}
          className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium transition-colors ${
            location.pathname === item.path ? "text-primary" : "text-muted-foreground"
          }`}
        >
          <item.icon className="h-5 w-5" />
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default MobileNav;
