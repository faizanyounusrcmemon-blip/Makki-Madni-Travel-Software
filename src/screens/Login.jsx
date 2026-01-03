import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username || !password) {
      alert("Username & Password required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        }
      );

      const data = await res.json();
      setLoading(false);

      if (!data.success) {
        alert("Invalid login");
        return;
      }

      sessionStorage.setItem("user", JSON.stringify(data.user));
      onLogin();
    } catch {
      setLoading(false);
      alert("Server error");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-panel">

        {/* BRAND */}
        <div className="brand">
          <div className="brand-line"></div>
          <h1>MAKKI MADNI</h1>
          <p>TRAVEL & TOURS</p>
        </div>

        {/* FORM */}
        <div className="form">

          <div className="field">
            <label>Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="field">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button onClick={submit} disabled={loading}>
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </div>

        <div className="footer">
          Secure Internal Access
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        * {
          box-sizing: border-box;
        }

        .login-wrapper {
          height: 100vh;
          background: #f4f6f8;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: "Segoe UI", system-ui, sans-serif;
        }

        .login-panel {
          width: 420px;
          background: white;
          padding: 40px 42px;
          border-radius: 14px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }

        .brand {
          text-align: center;
          margin-bottom: 34px;
        }

        .brand-line {
          width: 50px;
          height: 3px;
          background: #c9a227;
          margin: 0 auto 12px;
        }

        .brand h1 {
          margin: 0;
          font-size: 26px;
          letter-spacing: 2px;
          color: #0f3d2e;
          font-weight: 700;
        }

        .brand p {
          margin: 6px 0 0;
          font-size: 12px;
          letter-spacing: 2px;
          color: #6b7280;
        }

        .form .field {
          margin-bottom: 18px;
        }

        .form label {
          display: block;
          font-size: 13px;
          color: #374151;
          margin-bottom: 6px;
        }

        .form input {
          width: 100%;
          padding: 11px 12px;
          border-radius: 8px;
          border: 1px solid #d1d5db;
          font-size: 14px;
          outline: none;
        }

        .form input:focus {
          border-color: #0f3d2e;
        }

        .form button {
          width: 100%;
          margin-top: 10px;
          padding: 12px;
          border-radius: 30px;
          border: none;
          background: #0f3d2e;
          color: white;
          font-size: 14px;
          font-weight: 600;
          letter-spacing: 1px;
          cursor: pointer;
        }

        .form button:disabled {
          opacity: 0.7;
        }

        .footer {
          text-align: center;
          margin-top: 22px;
          font-size: 11px;
          color: #9ca3af;
        }

        @media (max-width: 480px) {
          .login-panel {
            width: 90%;
            padding: 30px;
          }
        }
      `}</style>
    </div>
  );
}
