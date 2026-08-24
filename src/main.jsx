import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import AppWrapper from "./common/AppWrapper";

// ================= GLOBAL FETCH PATCH ================= //
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  let [resource, config] = args;
  config = config || {};
  config.headers = config.headers || {};

  // LocalStorage aur SessionStorage dono me se check karna
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  const directUsername = localStorage.getItem("username") || sessionStorage.getItem("username");
  
  let username = directUsername || "";

  if (!username && userStr) {
    try {
      // Agar user object saved hai (e.g. { username: "ali", role: "admin" })
      const u = JSON.parse(userStr);
      username = typeof u === "string" ? u : (u.username || u.user_name || u.name || u.email || "");
    } catch (e) {
      // Agar direct string bina JSON stringify ke saved hai
      username = userStr;
    }
  }

  // Header attach karna (Agar username mil jaye to header bhejein)
  if (username) {
    if (config.headers instanceof Headers) {
      config.headers.append("x-user-name", username);
    } else {
      config.headers["x-user-name"] = username;
    }
  }

  return originalFetch(resource, config);
};
// ===================================================== //

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper>
      <App />
    </AppWrapper>
  </React.StrictMode>
);