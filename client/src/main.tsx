import { createRoot } from "react-dom/client";
import TagManager from "react-gtm-module";
import { getGTMContainerId } from "@/lib/gtm";
import App from "./App";
import "./index.css";

// Initialize Google Tag Manager with environment-specific container
const gtmId = getGTMContainerId();
TagManager.initialize({ gtmId });



createRoot(document.getElementById("root")!).render(<App />);
