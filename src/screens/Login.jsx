import React, { useState } from "react";
import Swal from "sweetalert2";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [capsLock, setCapsLock] = useState(false);

  const checkCapsLock = (e) => {
    if (e.getModifierState) {
      setCapsLock(e.getModifierState("CapsLock"));
    }
  };

  const cancel = () => {
    setUsername("");
    setPassword("");
  };

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

      if (!data.success) {
        setShake(true);
        setTimeout(() => setShake(false), 500);

        const msg = (data.error || "").toLowerCase();
        let errorText = "Invalid login";

        if (msg.includes("missing")) {
          errorText = "⚠️ Please enter username and password";
        } else if (msg.includes("inactive")) {
          errorText = "⛔ Your account is deactivated. Contact admin";
        } else if (msg.includes("invalid login")) {
          errorText = "❌ Username or password is incorrect";
        } else if (msg.includes("username")) {
          errorText = "❌ Username is incorrect";
        } else if (msg.includes("password")) {
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
            if (i >= text.length) clearInterval(typing);
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
          onKeyDown={(e) => {
            checkCapsLock(e);
            handleKeyDown(e);
          }}
          onKeyUp={checkCapsLock}
        />

        <div className="password-box">
          <input
            className="login-input"
            type={show ? "text" : "password"}
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              checkCapsLock(e);
              handleKeyDown(e);
            }}
            onKeyUp={checkCapsLock}
          />
          <span className="eye" onClick={() => setShow(!show)}>
            {show ? "🙈" : "👁️"}
          </span>
        </div>

        {capsLock && (
          <div className="caps-warning">
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

      <style>{`
        .login-wrapper {
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #1e3c72 0%, #2a5298 50%, #000428 100%);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }

        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .login-card {
          width: 380px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 32px;
          box-shadow: 0 25px 45px rgba(0, 0, 0, 0.2);
          text-align: center;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.3s ease;
        }

        .login-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 35px 55px rgba(0, 0, 0, 0.3);
        }

        .title {
          font-size: 26px;
          font-weight: bold;
          color: #ffd700;
          margin-bottom: 8px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .subtitle {
          font-size: 14px;
          opacity: 0.9;
          margin-bottom: 24px;
          letter-spacing: 1px;
        }

        .login-input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.3);
          margin-bottom: 16px;
          outline: none;
          font-size: 15px;
          background: rgba(255, 255, 255, 0.1);
          color: white;
          transition: all 0.3s ease;
        }

        .login-input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        .login-input:focus {
          background: rgba(255, 255, 255, 0.15);
          border-color: #ffd700;
          box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
        }

        .password-box {
          position: relative;
        }

        .eye {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          font-size: 18px;
          opacity: 0.8;
          transition: opacity 0.3s;
        }

        .eye:hover {
          opacity: 1;
        }

        .caps-warning {
          color: #ffd700;
          font-size: 13px;
          margin-bottom: 16px;
          font-weight: bold;
          text-align: left;
          padding-left: 8px;
        }

        .btn-row {
          display: flex;
          gap: 12px;
          margin-top: 20px;
        }

        .btn {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 25px;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
        }

        .login-btn {
          background: linear-gradient(135deg, #ffd700, #ffb347);
          color: #000;
          box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
        }

        .login-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #ffed4a, #ffc107);
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(255, 215, 0, 0.4);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .cancel-btn {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .cancel-btn:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: scale(1.05);
        }

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

        @media (max-width: 480px) {
          .login-card {
            width: 90%;
            padding: 24px;
          }
          
          .title {
            font-size: 22px;
          }
        }
      `}</style>
    </div>
  );
}