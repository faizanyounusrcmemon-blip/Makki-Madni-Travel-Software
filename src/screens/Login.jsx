import React, { useState } from "react";
import Swal from "sweetalert2";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  // ✅ NEW STATES
  const [shake, setShake] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const cancel = () => {
    setUsername("");
    setPassword("");
  };

  // ================= ENTER KEY LOGIN =================
  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      submit();
    }
  };

  const submit = async () => {
    if (!username || !password) {
      Swal.fire({
        width: "280px",
        icon: "warning",
        text: "Username & Password required"
      });
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

      // ❌ LOGIN FAIL
      if (!data.success) {

        // 🔥 SHAKE TRIGGER
        setShake(true);
        setTimeout(() => setShake(false), 500);

        const msg = (data.error || "").toLowerCase();

        let errorText = "Invalid login";

        if (msg.includes("missing")) {
          errorText = "⚠️ Please enter username and password";
        }

        else if (msg.includes("inactive")) {
          errorText = "⛔ Your account is deactivated. Contact admin";
        }

        else if (msg.includes("invalid login")) {
          errorText = "❌ Username or password is incorrect";
        }

        else if (msg.includes("username")) {
          errorText = "❌ Username is incorrect";
        }
 
        else if (msg.includes("password")) {
          errorText = "❌ Password is incorrect";
        }

        Swal.fire({
          width: "300px",
          icon: "error",
          title: "Login Failed",
          text: errorText
        });

        return;
      }

      // ✅ SUCCESS
      sessionStorage.setItem("user", JSON.stringify(data.user));

Swal.fire({
  width: "280px",
  icon: "success",
  title: "Login Successful",
  html: `
    <div style="font-size:16px;">
      Welcome <span id="typedUser" style="color:#1e90ff; font-weight:bold;"></span>
    </div>
  `,
  showConfirmButton: false,
  timer: 2000,
  didOpen: () => {
    const text = data.user.username || "User";
    const el = document.getElementById("typedUser");

    let i = 0;
    el.textContent = "";

    const typing = setInterval(() => {
      el.textContent += text[i];
      i++;

      if (i >= text.length) {
        clearInterval(typing);
      }
    }, 100);
  }
});

      setTimeout(() => {
        onLogin();
      }, 1500);

    } catch (err) {
      setLoading(false);

      Swal.fire({
        width: "280px",
        icon: "error",
        text: "Server Error"
      });
    }
  };

  return (
    <div className="login-wrapper">
      <div className={`login-card ${shake ? "shake" : ""}`}>
        <h2 className="title">✈️ Makki Madni Travel & Tours</h2>
        <p className="subtitle">Secure Login Panel</p>

        <input
          className="login-input"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        <div className="password-box">
          <input
            className="login-input"
            type={show ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            onKeyUp={(e) => setCapsLock(e.getModifierState("CapsLock"))}
          />

          <span className="eye" onClick={() => setShow(!show)}>
            {show ? "🙈" : "👁️"}
          </span>
        </div>

        {/* CAPS LOCK WARNING */}
        {capsLock && (
          <div style={{ color: "yellow", fontSize: "12px", marginBottom: "8px" }}>
            ⚠️ Caps Lock is ON
          </div>
        )}

        <div className="btn-row">
          <button
            className="btn login-btn"
            onClick={submit}
            disabled={loading}
          >
            {loading ? "🔑 Logging in..." : "🔑 Login"}
          </button>

          <button className="btn cancel-btn" onClick={cancel}>
            ❌ Cancel
          </button>
        </div>
      </div>

      {/* ================= SHAKE ANIMATION (ONLY ADDITION) ================= */}
      <style>{`
        .shake {
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
          100% { transform: translateX(0); }
        }
      `}</style>

      {/* ORIGINAL CSS (UNCHANGED) */}
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
          background: red;
          color: white;
          transform: scale(1.05);
        }

        .cancel-btn {
          background: rgba(255,255,255,0.2);
          color: white;
        }

        .cancel-btn:hover {
          background: red;
          color: white;
        }
      `}</style>
    </div>
  );
}
