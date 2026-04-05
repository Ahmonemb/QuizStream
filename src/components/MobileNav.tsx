import { Home, BookOpen, BarChart3, Settings } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { navItems } from "@/lib/navigation";

const mobileIconMap = {
  Home,
  BookOpen,
  BarChart3,
  Settings,
};

const MobileNav = () => {
  const location = useLocation();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex items-center justify-around py-2 px-1">
      {navItems.map((item) => {
        const Icon = mobileIconMap[item.icon as keyof typeof mobileIconMap] ?? Home;

        return (
          <Link
            key={item.id}
            to={item.path}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-[11px] font-medium transition-colors ${
              location.pathname === item.path ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <Icon className="h-5 w-5" />
            {item.title}
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileNav;
