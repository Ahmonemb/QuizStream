import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { AppStateProvider } from "@/context/AppStateContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <AppStateProvider>
    <App />
  </AppStateProvider>,
);
