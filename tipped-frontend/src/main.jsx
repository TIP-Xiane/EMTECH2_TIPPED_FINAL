import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { ReportProvider } from "./context/ReportContext";
import { NotificationProvider } from "./context/NotificationContext";
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ReportProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </ReportProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
