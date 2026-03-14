import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { registerServiceWorker, setupInstallPrompt } from "./lib/pwa";

createRoot(document.getElementById("root")!).render(<App />);

if (typeof window !== 'undefined') {
  setupInstallPrompt();
  
  if (import.meta.env.PROD) {
    registerServiceWorker().then((registration) => {
      if (registration) {
        console.log('[App] Service Worker registered successfully');
      }
    });
  }
}
