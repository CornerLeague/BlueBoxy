import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { ensureLocalUser } from "./lib/auth";

// Best-effort local user bootstrap; no-op if not signed in
ensureLocalUser().catch(() => {});

createRoot(document.getElementById("root")!).render(
  <App />
);
