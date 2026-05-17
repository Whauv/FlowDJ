import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import { LandingPage } from "./app/LandingPage";
import "./styles/globals.css";
import "./styles/landing.css";

const path = window.location.pathname.toLowerCase();
const isConsole = path.startsWith("/console");

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {isConsole ? <App /> : <LandingPage />}
  </React.StrictMode>
);
