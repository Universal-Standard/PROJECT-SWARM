import { createRoot } from "react-dom/client";
import { Router } from "wouter";
import App from "./App";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import "./index.css";

const routerBase = import.meta.env.BASE_URL.replace(/\/$/, "");

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <Router base={routerBase}>
      <App />
    </Router>
  </ErrorBoundary>
);
