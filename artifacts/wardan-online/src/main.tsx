import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import { getAdminToken } from "./lib/adminAuth";

setAuthTokenGetter(getAdminToken);

document.documentElement.setAttribute("dir", "rtl");
document.documentElement.setAttribute("lang", "ar");

createRoot(document.getElementById("root")!).render(<App />);
