import { createRoot } from "react-dom/client";
import TagManager from "react-gtm-module";
import App from "./App";
import "./index.css";

// Initialize Google Tag Manager
const gtmId = "GTM-NCK6KLG8";
TagManager.initialize({ gtmId });

createRoot(document.getElementById("root")!).render(<App />);
