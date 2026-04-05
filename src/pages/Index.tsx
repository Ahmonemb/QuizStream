import { Outlet, useLocation } from "react-router-dom";
import CourseSidebar from "@/components/CourseSidebar";
import MobileNav from "@/components/MobileNav";

const Index = () => {
  const location = useLocation();
  const isImmersiveCoursePage = location.pathname === "/courses";

  return (
    <div className="flex min-h-screen bg-background">
      <CourseSidebar />
      {isImmersiveCoursePage ? (
        <Outlet />
      ) : (
        <main className="flex-1 min-w-0 pb-20 lg:pb-0">
          <Outlet />
        </main>
      )}
      <MobileNav />
    </div>
  );
};

export default Index;
