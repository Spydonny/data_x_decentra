import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "virtual:windi.css";
import "./index.css";
import App from "./App.tsx";
import { KyaRuntimeProvider } from "./kya/KyaRuntime.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <KyaRuntimeProvider>
      <App />
    </KyaRuntimeProvider>
  </StrictMode>,
);
