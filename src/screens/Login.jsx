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
        width: "260px",
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
          width: "280px",
          icon: "error",
          title: "Login Failed",
          text: errorText
        });
        return;
      }

      sessionStorage.setItem("user", JSON.stringify(data.user));

      Swal.fire({
        width: "260px",
        icon: "success",
        title: "Login Successful",
        html: `
          <div style="font-size:14px;">
            Welcome <span id="typedUser" style="color:#00d2ff; font-weight:bold;"></span>
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
        width: "260px",
        icon: "error",
        text: "Server Error"
      });
    }
  };

  return (
    <div className="airport-login-wrapper">
      {/* Background Layer */}
      <div className="bg-decorations">
        <div className="hd-airport-bg"></div>
        <div className="grid-perspective"></div>

        {/* Dynamic Animations */}
        <div className="airport-scene">

          {/* 1. PARKED GATE - AIRPLANE 1 */}
          <div className="plane-card parked-gate1">
            <div className="card-top">
              <img src="/images/plane.png" alt="Plane" className="mini-plane-img" />
              <span className="plane-badge">GATE 04</span>
            </div>
            <div className="plane-details">
              <strong>Boeing 777-300ER</strong>
              <span>Status: Parked / Boarding</span>
            </div>
          </div>

          {/* 2. PARKED GATE - AIRPLANE 2 */}
          <div className="plane-card parked-gate2">
            <div className="card-top">
              <img src="/images/plane.png" alt="Plane" className="mini-plane-img" />
              <span className="plane-badge gold">GATE 09</span>
            </div>
            <div className="plane-details">
              <strong>Airbus A350-900</strong>
              <span>Status: Standby / Umrah Flight</span>
            </div>
          </div>

          {/* 3. TAKEOFF ANIMATED AIRPLANE */}
          <div className="flying-jet jet-takeoff">
            <div className="jet-body">
              <img src="/images/plane.png" alt="Takeoff Plane" className="real-plane-img takeoff-flip" />
              <div className="jet-trail"></div>
            </div>
            <div className="jet-tag">
              <strong>PA-204</strong> (Takeoff - 1,200ft ↑)
            </div>
          </div>

          {/* 4. LANDING ANIMATED AIRPLANE */}
          <div className="flying-jet jet-landing">
            <div className="jet-body">
              <img src="/images/plane.png" alt="Landing Plane" className="real-plane-img landing-flip" />
              <div className="jet-trail landing-trail"></div>
            </div>
            <div className="jet-tag gold-tag">
              <strong>SV-786</strong> (Landing - 80ft ↓)
            </div>
          </div>

          {/* 5. CRUISING OVERHEAD AIRPLANE */}
          <div className="flying-jet jet-cruise">
            <div className="jet-body">
              <img src="/images/plane.png" alt="Cruising Plane" className="real-plane-img" />
            </div>
            <div className="jet-tag white-tag">
              <strong>EK-602</strong> (Cruising 36,000ft)
            </div>
          </div>

        </div>
      </div>

      {/* Login Box */}
      <div className={`login-card ${shake ? "shake" : ""}`}>
        <div className="logo-badge">
          <img src="/images/plane.png" alt="Logo" className="logo-plane-img" />
        </div>
        <h2 className="title">Makki Madni Travel & Tours</h2>
        <p className="subtitle">Traveling Management System</p>

        <div className="input-group">
          <input
            className="login-input"
            placeholder="User ID / Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyDown={(e) => {
              checkCapsLock(e);
              handleKeyDown(e);
            }}
            onKeyUp={checkCapsLock}
          />
        </div>

        <div className="input-group password-box">
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
            {loading ? "Authenticating..." : "Sign In"}
          </button>
          <button className="btn cancel-btn" onClick={cancel}>
            Clear
          </button>
        </div>

        <div className="footer-credits">
          Live Terminal Operations & Radar Control
        </div>
      </div>

      <style>{`
        /* ================= SCALED & SCROLL-FREE STYLES ================= */
        .airport-login-wrapper {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          background: #010a15;
          font-family: 'Segoe UI', Roboto, sans-serif;
          box-sizing: border-box;
        }

        .bg-decorations {
          position: absolute;
          inset: 0;
          pointer-events: none;
          overflow: hidden;
        }

        .hd-airport-bg {
          position: absolute;
          inset: 0;
          background-image: linear-gradient(to bottom, rgba(1, 10, 21, 0.8), rgba(1, 10, 21, 0.92)), 
                            url('https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=1920&q=80');
          background-size: cover;
          background-position: center;
          filter: brightness(0.65) contrast(1.1);
        }

        .grid-perspective {
          position: absolute;
          inset: 0;
          background-image: 
            linear-gradient(rgba(0, 210, 255, 0.08) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 210, 255, 0.08) 1px, transparent 1px);
          background-size: 40px 40px;
          opacity: 0.3;
        }

        /* ================= PLANE IMAGES (COMPACT SCALE) ================= */
        .real-plane-img {
          width: 85px;
          height: auto;
          filter: drop-shadow(0 0 10px rgba(0, 242, 254, 0.8));
          object-fit: contain;
        }

        .takeoff-flip {
          transform: rotate(-20deg);
        }

        .landing-flip {
          transform: rotate(160deg) scaleY(-1);
        }

        .mini-plane-img {
          width: 26px;
          height: auto;
          filter: drop-shadow(0 0 4px #00f2fe);
        }

        .logo-plane-img {
          width: 30px;
          height: auto;
          filter: drop-shadow(0 0 6px #ffffff);
        }

        /* Parked Gate Cards */
        .airport-scene {
          position: absolute;
          inset: 0;
        }

        .plane-card {
          position: absolute;
          background: rgba(0, 25, 50, 0.85);
          border: 1px solid rgba(0, 210, 255, 0.4);
          border-radius: 10px;
          padding: 8px 12px;
          color: #fff;
          backdrop-filter: blur(8px);
          box-shadow: 0 8px 20px rgba(0,0,0,0.6);
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .parked-gate1 { top: 12%; left: 5%; }
        .parked-gate2 { bottom: 12%; right: 5%; }

        .plane-badge {
          font-size: 10px;
          font-weight: 700;
          color: #00f2fe;
          letter-spacing: 0.5px;
        }
        .plane-badge.gold { color: #ffd700; }

        .plane-details strong {
          display: block;
          font-size: 12px;
        }
        .plane-details span {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.7);
        }

        /* Flying Jets */
        .flying-jet {
          position: absolute;
          display: flex;
          align-items: center;
          gap: 8px;
          z-index: 2;
        }

        .jet-body {
          position: relative;
          display: flex;
          align-items: center;
        }

        .jet-trail {
          position: absolute;
          width: 100px;
          height: 2px;
          background: linear-gradient(90deg, #00f2fe, transparent);
          right: 90%;
          top: 50%;
        }

        .landing-trail {
          background: linear-gradient(90deg, #ffd700, transparent);
        }

        .jet-tag {
          background: rgba(0, 20, 40, 0.9);
          border: 1px solid #00f2fe;
          padding: 4px 10px;
          border-radius: 6px;
          color: #00f2fe;
          font-size: 11px;
          white-space: nowrap;
          box-shadow: 0 0 10px rgba(0, 242, 254, 0.3);
        }

        .gold-tag { border-color: #ffd700; color: #ffd700; }
        .white-tag { border-color: #ffffff; color: #ffffff; }

        /* Animation Keyframes */
        .jet-takeoff {
          animation: animTakeoff 14s ease-in-out infinite;
        }
        @keyframes animTakeoff {
          0% { left: -20%; bottom: 10%; opacity: 0; }
          15% { opacity: 1; }
          85% { opacity: 1; }
          100% { left: 115%; bottom: 80%; opacity: 0; }
        }

        .jet-landing {
          animation: animLanding 16s ease-in-out infinite;
          animation-delay: 2s;
        }
        @keyframes animLanding {
          0% { right: -20%; top: 10%; opacity: 0; }
          15% { opacity: 1; }
          75% { opacity: 1; }
          100% { right: 115%; top: 80%; opacity: 0; }
        }

        .jet-cruise {
          animation: animCruise 22s linear infinite;
        }
        @keyframes animCruise {
          0% { left: -20%; top: 22%; opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { left: 115%; top: 38%; opacity: 0; }
        }

        /* ================= LOGIN CARD (COMPACT SIZE) ================= */
        .login-card {
          position: relative;
          z-index: 10;
          width: 340px;
          background: rgba(1, 16, 33, 0.88);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-radius: 16px;
          padding: 26px 24px;
          box-shadow: 
            0 15px 45px rgba(0, 0, 0, 0.9),
            0 0 25px rgba(0, 242, 254, 0.2),
            inset 0 0 2px rgba(255, 255, 255, 0.3);
          text-align: center;
          color: white;
          border: 1px solid rgba(0, 242, 254, 0.4);
          transition: all 0.3s ease;
        }

        .login-card:hover {
          border-color: rgba(0, 242, 254, 0.8);
          box-shadow: 
            0 20px 50px rgba(0, 0, 0, 0.95),
            0 0 35px rgba(0, 242, 254, 0.35);
        }

        .logo-badge {
          width: 48px;
          height: 48px;
          margin: 0 auto 10px;
          background: linear-gradient(135deg, #00c6ff, #0072ff);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 0 20px rgba(0, 198, 255, 0.6);
        }

        .title {
          font-size: 18px;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 2px;
        }

        .subtitle {
          font-size: 11px;
          color: #00f2fe;
          margin-bottom: 22px;
          text-transform: uppercase;
          letter-spacing: 1.2px;
          font-weight: 600;
        }

        .input-group {
          margin-bottom: 14px;
        }

        .login-input {
          width: 100%;
          padding: 11px 14px;
          border-radius: 8px;
          border: 1px solid rgba(0, 242, 254, 0.35);
          outline: none;
          font-size: 13px;
          background: rgba(1, 10, 22, 0.75);
          color: #ffffff;
          box-sizing: border-box;
          transition: all 0.3s ease;
        }

        .login-input::placeholder {
          color: rgba(255, 255, 255, 0.5);
        }

        .login-input:focus {
          background: rgba(1, 15, 32, 0.95);
          border-color: #00f2fe;
          box-shadow: 0 0 12px rgba(0, 242, 254, 0.4);
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
          font-size: 14px;
          opacity: 0.75;
        }

        .caps-warning {
          color: #ffd700;
          font-size: 11px;
          margin-bottom: 10px;
          font-weight: 600;
          text-align: left;
        }

        .btn-row {
          display: flex;
          gap: 10px;
          margin-top: 18px;
        }

        .btn {
          flex: 1;
          padding: 10px;
          border: none;
          border-radius: 8px;
          font-size: 13px;
          cursor: pointer;
          transition: all 0.3s ease;
          font-weight: 600;
        }

        .login-btn {
          background: linear-gradient(135deg, #00f2fe, #4facfe);
          color: #001830;
          box-shadow: 0 4px 14px rgba(0, 242, 254, 0.35);
        }

        .login-btn:hover:not(:disabled) {
          background: linear-gradient(135deg, #38f9d7, #4facfe);
          transform: translateY(-1px);
          box-shadow: 0 5px 18px rgba(0, 242, 254, 0.5);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cancel-btn {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .cancel-btn:hover {
          background: rgba(255, 255, 255, 0.15);
        }

        .footer-credits {
          margin-top: 16px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.45);
        }

        .shake {
          animation: shake 0.4s ease;
        }

        @keyframes shake {
          0% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
          100% { transform: translateX(0); }
        }

        @media (max-width: 768px) {
          .parked-gate1, .parked-gate2 { display: none; }
        }

        @media (max-width: 480px) {
          .login-card {
            width: 88%;
            padding: 22px 18px;
          }
        }
      `}</style>
    </div>
  );
}