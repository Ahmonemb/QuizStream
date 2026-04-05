import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { useAppState } from "@/context/AppStateContext";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Courses from "./pages/Courses";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/Welcome";

const ProtectedAppLayout = () => {
  const { user } = useAppState();

  if (!user) {
    return <Navigate to="/welcome" replace />;
  }

  return <Index />;
};

const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/welcome" element={<Welcome />} />
      <Route path="/" element={<ProtectedAppLayout />}>
        <Route index element={<Home />} />
        <Route path="courses" element={<Courses />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
