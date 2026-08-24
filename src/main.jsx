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

  // LocalStorage / SessionStorage dono se check karna
  const userStr = localStorage.getItem("user") || sessionStorage.getItem("user");
  let username = "faizan";

  if (userStr) {
    try {
      const u = JSON.parse(userStr);
      username = u.username || u.name || "faizan";
    } catch (e) {}
  }

  // Header attach karna
  if (config.headers instanceof Headers) {
    config.headers.append("x-user-name", username);
  } else {
    config.headers["x-user-name"] = username;
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