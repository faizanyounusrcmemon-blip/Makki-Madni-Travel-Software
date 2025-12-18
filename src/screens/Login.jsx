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

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      onLogin();

    } catch (err) {
      setLoading(false);
      alert("Server error");
    }
  };

  const cancel = () => {
    setUsername("");
    setPassword("");
  };

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2 className="title">✈️ Makki Madni Travel</h2>
        <p className="subtitle">Secure Login Panel</p>

        {/* USERNAME */}
        <input
          className="login-input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        {/* PASSWORD */}
        <div className="password-box">
          <input
            className="login-input"
            type={show ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <span className="eye" onClick={() => setShow(!show)}>
            {show ? "🙈" : "👁️"}
          </span>
        </div>

        {/* BUTTONS */}
        <div className="btn-row">
          <button
            className="btn login-btn"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          <button className="btn cancel-btn" onClick={cancel}>
            Cancel
          </button>
        </div>
      </div>

      {/* STYLES */}
      <style>{`
        .login-wrapper {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top, #1e3c72, #000428);
        }

        .login-card {
          width: 360px;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(15px);
          border-radius: 18px;
          padding: 28px;
          box-shadow: 0 30px 60px rgba(0,0,0,0.7);
          text-align: center;
          color: white;
        }

        .title {
          font-size: 24px;
          font-weight: bold;
          color: #ffd700;
          margin-bottom: 4px;
        }

        .subtitle {
          font-size: 13px;
          opacity: 0.8;
          margin-bottom: 18px;
        }

        .login-input {
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          border: none;
          margin-bottom: 12px;
          outline: none;
          font-size: 14px;
        }

        .password-box {
          position: relative;
        }

        .eye {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          font-size: 16px;
        }

        .btn-row {
          display: flex;
          gap: 10px;
          margin-top: 14px;
        }

        .btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 20px;
          font-size: 14px;
          cursor: pointer;
          transition: 0.3s;
        }

        .login-btn {
          background: linear-gradient(135deg, #ffd700, #ffb347);
          color: #000;
          font-weight: bold;
        }

        .login-btn:hover {
          transform: scale(1.05);
        }

        .cancel-btn {
          background: rgba(255,255,255,0.2);
          color: white;
        }

        .cancel-btn:hover {
          background: rgba(255,255,255,0.35);
        }
      `}</style>
    </div>
  );
}
