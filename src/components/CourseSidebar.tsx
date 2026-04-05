import type { ElementType } from "react";
import {
  Home,
  BookOpen,
  BarChart3,
  Settings,
  GraduationCap,
  LogOut,
} from "lucide-react";
import { useLocation, Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/context/AppStateContext";
import { navItems } from "@/lib/navigation";

const iconMap: Record<string, ElementType> = {
  Home,
  BookOpen,
  BarChart3,
  Settings,
};

const CourseSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAppState();

  const handleLogout = () => {
    logout();
    navigate("/welcome", { replace: true });
  };

  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-card lg:flex">
      <div className="flex items-center gap-2 border-b border-border px-6 py-5">
        <GraduationCap className="h-7 w-7 text-primary" />
        <span className="text-lg font-bold text-foreground">QuizStream</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const Icon = iconMap[item.icon] || Home;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "border-l-4 border-primary bg-accent pl-2 text-accent-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-4">
        <div className="flex items-center gap-3 rounded-2xl bg-muted/40 px-3 py-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {user?.initials ?? "QS"}
          </div>
          <div className="min-w-0 flex-1 text-sm">
            <p className="truncate font-medium text-foreground">{user?.name ?? "QuizStream"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.plan ?? "Personal Workspace"}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="h-8 w-8 shrink-0 rounded-full text-muted-foreground hover:bg-background hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default CourseSidebar;
