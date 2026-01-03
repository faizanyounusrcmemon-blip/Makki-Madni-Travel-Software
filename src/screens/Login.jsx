import React, { useState } from "react";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
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
        alert("❌ Invalid login");
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
    <div className="login-bg">
      <div className="login-card">

        {/* LOGO */}
        <div className="logo-box">
          ✈️
        </div>

        <h2 className="title">Makki Madni Travel</h2>
        <p className="subtitle">Secure Admin Login</p>

        {/* USERNAME */}
        <div className="field">
          <input
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <label>Username</label>
        </div>

        {/* PASSWORD */}
        <div className="field">
          <input
            required
            type={show ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label>Password</label>
          <span className="eye" onClick={() => setShow(!show)}>
            {show ? "🙈" : "👁️"}
          </span>
        </div>

        {/* BUTTON */}
        <button className="login-btn" onClick={submit} disabled={loading}>
          {loading ? <span className="spinner"></span> : "LOGIN"}
        </button>

        <p className="footer">© Makki Madni Travel</p>
      </div>

      {/* STYLES */}
      <style>{`
        .login-bg {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(270deg, #0f2027, #203a43, #2c5364);
          background-size: 600% 600%;
          animation: bgMove 10s ease infinite;
        }

        @keyframes bgMove {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .login-card {
          width: 380px;
          padding: 35px 30px;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(18px);
          border-radius: 22px;
          box-shadow: 0 25px 60px rgba(0,0,0,0.8);
          text-align: center;
          color: white;
        }

        .logo-box {
          width: 70px;
          height: 70px;
          margin: auto;
          border-radius: 50%;
          background: linear-gradient(135deg, #ffd700, #ff9f1c);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 28px;
          box-shadow: 0 0 25px rgba(255,215,0,0.8);
          margin-bottom: 12px;
        }

        .title {
          color: #ffd700;
          font-weight: bold;
          margin-bottom: 4px;
        }

        .subtitle {
          font-size: 13px;
          opacity: 0.85;
          margin-bottom: 22px;
        }

        .field {
          position: relative;
          margin-bottom: 18px;
        }

        .field input {
          width: 100%;
          padding: 12px 14px;
          border-radius: 12px;
          border: none;
          outline: none;
          font-size: 14px;
          background: rgba(255,255,255,0.9);
        }

        .field label {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          color: #666;
          pointer-events: none;
          transition: 0.3s;
        }

        .field input:focus + label,
        .field input:not(:placeholder-shown) + label {
          top: -6px;
          font-size: 11px;
          color: #ffd700;
        }

        .eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
        }

        .login-btn {
          width: 100%;
          padding: 12px;
          border-radius: 30px;
          border: none;
          background: linear-gradient(135deg, #ffd700, #ff9f1c);
          color: #000;
          font-weight: bold;
          letter-spacing: 1px;
          cursor: pointer;
          transition: 0.3s;
        }

        .login-btn:hover {
          transform: scale(1.05);
        }

        .spinner {
          width: 18px;
          height: 18px;
          border: 3px solid rgba(0,0,0,0.2);
          border-top: 3px solid #000;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          display: inline-block;
        }

        @keyframes spin {
          100% { transform: rotate(360deg); }
        }

        .footer {
          margin-top: 18px;
          font-size: 11px;
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
