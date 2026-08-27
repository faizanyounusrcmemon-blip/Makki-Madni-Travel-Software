import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "bootstrap/dist/css/bootstrap.min.css";
import AppWrapper from "./common/AppWrapper";
import axios from "axios";

// ================= DYNAMIC USER EXTRACTION ================= //
const getLoggedInUserData = () => {
  try {
    const keysToCheck = ["user", "loggedInUser", "authUser", "userData", "currentUser"];
    
    for (const key of keysToCheck) {
      const stored = sessionStorage.getItem(key) || localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const username =
            parsed?.username ||
            parsed?.name ||
            parsed?.user?.username ||
            parsed?.user?.name;

          if (username) {
            return {
              username: String(username).trim(),
              id: parsed.id || parsed.user?.id || null,
            };
          }
        } catch (e) {
          if (typeof stored === "string" && stored.trim()) {
            return { username: stored.trim(), id: null };
          }
        }
      }
    }
  } catch (err) {}

  return { username: "", id: null };
};

// ================= 1. AXIOS INTERCEPTOR ================= //
axios.interceptors.request.use((config) => {
  const userData = getLoggedInUserData();
  config.headers = config.headers || {};
  
  if (userData.username) {
    config.headers["x-user-name"] = userData.username;
    config.headers["x-username"] = userData.username;
  }
  if (userData.id) {
    config.headers["x-user-id"] = userData.id;
  }

  // Handle Regular JSON Payload
  if (config.data && typeof config.data === "object" && !(config.data instanceof FormData)) {
    if (userData.username) {
      config.data.username = userData.username;
      config.data.user = userData.username;
    }
  }

  // Handle FormData Payloads (Images/Files Upload)
  if (config.data instanceof FormData && userData.username) {
    if (!config.data.has("username")) {
      config.data.append("username", userData.username);
    }
    if (!config.data.has("user")) {
      config.data.append("user", userData.username);
    }
  }

  return config;
});

// ================= 2. GLOBAL FETCH INTERCEPTOR ================= //
const originalFetch = window.fetch;
window.fetch = async function (...args) {
  let [resource, config] = args;
  config = config || {};
  config.headers = config.headers || {};

  const userData = getLoggedInUserData();

  if (userData.username) {
    if (config.headers instanceof Headers) {
      config.headers.set("x-user-name", userData.username);
      config.headers.set("x-username", userData.username);
      if (userData.id) config.headers.set("x-user-id", String(userData.id));
    } else {
      config.headers["x-user-name"] = userData.username;
      config.headers["x-username"] = userData.username;
      if (userData.id) config.headers["x-user-id"] = String(userData.id);
    }
  }

  const method = (config.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    // 1. JSON String Body
    if (typeof config.body === "string" && userData.username) {
      try {
        const parsedBody = JSON.parse(config.body);
        if (typeof parsedBody === "object" && parsedBody !== null) {
          parsedBody.username = userData.username;
          parsedBody.user = userData.username;
          config.body = JSON.stringify(parsedBody);
        }
      } catch (e) {}
    } 
    // 2. FormData Body
    else if (config.body instanceof FormData && userData.username) {
      if (!config.body.has("username")) {
        config.body.append("username", userData.username);
      }
      if (!config.body.has("user")) {
        config.body.append("user", userData.username);
      }
    }
  }

  return originalFetch(resource, config);
};
// ================================================================= //

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppWrapper>
      <App />
    </AppWrapper>
  </React.StrictMode>
);