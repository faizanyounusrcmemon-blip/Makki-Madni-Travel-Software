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
        text: "Username & Password required",
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
          text: errorText,
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
        },
      });

      setTimeout(() => {
        onLogin();
      }, 1500);
    } catch (err) {
      setLoading(false);

      Swal.fire({
        width: "260px",
        icon: "error",
        text: "Server Error",
      });
    }
  };

  return (
    <div className="airport-login-wrapper">

      {/* ================= PREMIUM BACKGROUND ================= */}
      <div className="bg-decorations">

        {/* Main Airport Image */}
        <div className="hd-airport-bg"></div>

        {/* Dark premium overlay */}
        <div className="premium-overlay"></div>

        {/* Blue / Gold ambient lights */}
        <div className="ambient-light light-blue"></div>
        <div className="ambient-light light-gold"></div>
        <div className="ambient-light light-cyan"></div>

        {/* Premium grid */}
        <div className="grid-perspective"></div>

        {/* Horizon glow */}
        <div className="horizon-glow"></div>

        {/* Decorative light lines */}
        <div className="light-line line-one"></div>
        <div className="light-line line-two"></div>
        <div className="light-line line-three"></div>

        {/* Small floating particles */}
        <div className="particles">
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* ================= AIRPORT SCENE ================= */}
        <div className="airport-scene">

          {/* PARKED GATE 1 */}
          <div className="plane-card parked-gate1">
            <div className="card-top">
              <img
                src="/images/plane.png"
                alt="Plane"
                className="mini-plane-img"
              />
              <span className="plane-badge">GATE 04</span>
            </div>

            <div className="plane-details">
              <strong>Boeing 777-300ER</strong>
              <span>Status: Parked / Boarding</span>
            </div>
          </div>

          {/* PARKED GATE 2 */}
          <div className="plane-card parked-gate2">
            <div className="card-top">
              <img
                src="/images/plane.png"
                alt="Plane"
                className="mini-plane-img"
              />
              <span className="plane-badge gold">GATE 09</span>
            </div>

            <div className="plane-details">
              <strong>Airbus A350-900</strong>
              <span>Status: Standby / Umrah Flight</span>
            </div>
          </div>

          {/* TAKEOFF */}
          <div className="flying-jet jet-takeoff">
            <div className="jet-body">
              <img
                src="/images/plane.png"
                alt="Takeoff Plane"
                className="real-plane-img takeoff-flip"
              />
              <div className="jet-trail"></div>
            </div>

            <div className="jet-tag">
              <strong>PA-204</strong> (Takeoff - 1,200ft ↑)
            </div>
          </div>

          {/* LANDING */}
          <div className="flying-jet jet-landing">
            <div className="jet-body">
              <img
                src="/images/plane.png"
                alt="Landing Plane"
                className="real-plane-img landing-flip"
              />
              <div className="jet-trail landing-trail"></div>
            </div>

            <div className="jet-tag gold-tag">
              <strong>SV-786</strong> (Landing - 80ft ↓)
            </div>
          </div>

          {/* CRUISING */}
          <div className="flying-jet jet-cruise">
            <div className="jet-body">
              <img
                src="/images/plane.png"
                alt="Cruising Plane"
                className="real-plane-img"
              />
            </div>

            <div className="jet-tag white-tag">
              <strong>EK-602</strong> (Cruising 36,000ft)
            </div>
          </div>
        </div>
      </div>

      {/* ================= LOGIN CARD ================= */}
      <div className={`login-card ${shake ? "shake" : ""}`}>

        <div className="logo-badge">
          <img
            src="/images/plane.png"
            alt="Logo"
            className="logo-plane-img"
          />
        </div>

        <h2 className="title">
          Makki Madni Travel & Tours
        </h2>

        <p className="subtitle">
          Traveling Management System
        </p>

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

          <span
            className="eye"
            onClick={() => setShow(!show)}
          >
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

          <button
            className="btn cancel-btn"
            onClick={cancel}
          >
            Clear
          </button>
        </div>

        <div className="footer-credits">
          <span className="status-dot"></span>
          Live Terminal Operations & Radar Control
        </div>
      </div>

      {/* ================= ALL STYLES ================= */}
      <style>{`

        * {
          box-sizing: border-box;
        }

        /* =========================================
           MAIN BACKGROUND
        ========================================= */

        .airport-login-wrapper {
          position: fixed;
          inset: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;

          font-family:
            "Segoe UI",
            Roboto,
            Arial,
            sans-serif;

          background: #020914;
          color: white;
        }

        .bg-decorations {
          position: absolute;
          inset: 0;
          overflow: hidden;
          pointer-events: none;
        }

        /* =========================================
           AIRPORT IMAGE (UPDATED FOR HIGH VISIBILITY)
        ========================================= */

        .hd-airport-bg {
          position: absolute;
          inset: -20px;

          background-image:
            url("https://images.unsplash.com/photo-1542296332-2e4473faf563?auto=format&fit=crop&w=2200&q=90");

          background-size: cover;
          background-position: center;

          /* Brightness اور Saturate کو بڑھایا گیا ہے */
          filter:
            brightness(0.85)
            contrast(1.05)
            saturate(1);

          transform: scale(1.04);

          animation: backgroundSlowZoom 22s ease-in-out infinite alternate;
        }

        @keyframes backgroundSlowZoom {
          from {
            transform: scale(1.04);
          }

          to {
            transform: scale(1.10);
          }
        }

        /* =========================================
           PREMIUM OVERLAY (UPDATED TO BE MORE TRANSPARENT)
        ========================================= */

        .premium-overlay {
          position: absolute;
          inset: 0;

          /* اوورلے کو ہلکا کیا گیا ہے تاکہ ایئرپورٹ کی تصویر صاف نظر آئے */
          background:
            linear-gradient(
              135deg,
              rgba(1, 8, 20, 0.45) 0%,
              rgba(2, 18, 40, 0.35) 50%,
              rgba(1, 9, 22, 0.55) 100%
            );

          z-index: 1;
        }

        /* =========================================
           AMBIENT LIGHTS
        ========================================= */

        .ambient-light {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          z-index: 2;
          pointer-events: none;
        }

        .light-blue {
          width: 420px;
          height: 420px;
          left: -130px;
          top: -130px;

          background: rgba(0, 126, 255, 0.15);

          animation: ambientBlue 9s ease-in-out infinite alternate;
        }

        .light-gold {
          width: 360px;
          height: 360px;
          right: -120px;
          bottom: -100px;

          background: rgba(212, 175, 55, 0.12);

          animation: ambientGold 11s ease-in-out infinite alternate;
        }

        .light-cyan {
          width: 280px;
          height: 280px;
          left: 45%;
          top: 5%;

          background: rgba(0, 229, 255, 0.06);

          animation: ambientCyan 8s ease-in-out infinite alternate;
        }

        @keyframes ambientBlue {
          from {
            transform: translate(0, 0) scale(1);
          }

          to {
            transform: translate(100px, 70px) scale(1.25);
          }
        }

        @keyframes ambientGold {
          from {
            transform: translate(0, 0);
          }

          to {
            transform: translate(-90px, -70px) scale(1.2);
          }
        }

        @keyframes ambientCyan {
          from {
            opacity: 0.35;
            transform: scale(0.9);
          }

          to {
            opacity: 0.8;
            transform: scale(1.35);
          }
        }

        /* =========================================
           PREMIUM GRID
        ========================================= */

        .grid-perspective {
          position: absolute;
          inset: 0;

          z-index: 3;

          background-image:
            linear-gradient(
              rgba(67, 185, 255, 0.05) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(67, 185, 255, 0.05) 1px,
              transparent 1px
            );

          background-size: 55px 55px;

          opacity: 0.20;

          transform: perspective(500px) rotateX(55deg)
            translateY(30%);

          transform-origin: bottom;
        }

        /* =========================================
           HORIZON GLOW
        ========================================= */

        .horizon-glow {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 14%;

          height: 2px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(0, 210, 255, 0.0),
              rgba(0, 210, 255, 0.60),
              rgba(212, 175, 55, 0.60),
              rgba(0, 210, 255, 0.0),
              transparent
            );

          box-shadow:
            0 0 18px rgba(0, 210, 255, 0.40),
            0 0 40px rgba(212, 175, 55, 0.15);

          opacity: 0.6;

          z-index: 4;
        }

        /* =========================================
           LIGHT STREAKS
        ========================================= */

        .light-line {
          position: absolute;
          height: 1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(0, 210, 255, 0.8),
              transparent
            );

          opacity: 0.35;

          z-index: 4;
        }

        .line-one {
          width: 420px;
          top: 22%;
          left: -450px;

          animation: lineMove 12s linear infinite;
        }

        .line-two {
          width: 280px;
          top: 67%;
          left: -300px;

          animation: lineMove 17s linear infinite;
          animation-delay: 4s;
        }

        .line-three {
          width: 350px;
          top: 82%;
          left: -380px;

          animation: lineMove 20s linear infinite;
          animation-delay: 8s;
        }

        @keyframes lineMove {
          from {
            transform: translateX(0);
            opacity: 0;
          }

          10% {
            opacity: 0.45;
          }

          80% {
            opacity: 0.35;
          }

          to {
            transform: translateX(150vw);
            opacity: 0;
          }
        }

        /* =========================================
           FLOATING PARTICLES
        ========================================= */

        .particles {
          position: absolute;
          inset: 0;
          z-index: 5;
        }

        .particles span {
          position: absolute;
          width: 3px;
          height: 3px;

          border-radius: 50%;

          background: rgba(255, 255, 255, 0.75);

          box-shadow:
            0 0 8px rgba(0, 210, 255, 0.8);

          animation:
            particleFloat
            var(--duration, 7s)
            ease-in-out infinite;
        }

        .particles span:nth-child(1) {
          left: 12%;
          top: 22%;
          --duration: 8s;
        }

        .particles span:nth-child(2) {
          left: 82%;
          top: 17%;
          --duration: 11s;
        }

        .particles span:nth-child(3) {
          left: 22%;
          top: 76%;
          --duration: 9s;
        }

        .particles span:nth-child(4) {
          left: 73%;
          top: 71%;
          --duration: 12s;
        }

        .particles span:nth-child(5) {
          left: 91%;
          top: 44%;
          --duration: 10s;
        }

        .particles span:nth-child(6) {
          left: 7%;
          top: 52%;
          --duration: 13s;
        }

        .particles span:nth-child(7) {
          left: 59%;
          top: 11%;
          --duration: 9s;
        }

        .particles span:nth-child(8) {
          left: 42%;
          top: 87%;
          --duration: 11s;
        }

        @keyframes particleFloat {
          0%,
          100% {
            transform: translateY(0);
            opacity: 0.25;
          }

          50% {
            transform: translateY(-25px);
            opacity: 0.9;
          }
        }

        /* =========================================
           AIRPORT SCENE
        ========================================= */

        .airport-scene {
          position: absolute;
          inset: 0;
          z-index: 6;
        }

        /* =========================================
           PLANE IMAGE
        ========================================= */

        .real-plane-img {
          width: 85px;
          height: auto;

          filter:
            drop-shadow(0 0 8px rgba(0, 242, 254, 0.85))
            drop-shadow(0 0 18px rgba(0, 160, 255, 0.35));

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

          filter:
            drop-shadow(0 0 4px #00f2fe);
        }

        .logo-plane-img {
          width: 30px;
          height: auto;

          filter:
            drop-shadow(0 0 6px #ffffff);
        }

        /* =========================================
           GATE CARDS
        ========================================= */

        .plane-card {
          position: absolute;

          background:
            linear-gradient(
              135deg,
              rgba(3, 30, 58, 0.85),
              rgba(1, 12, 27, 0.85)
            );

          border:
            1px solid rgba(0, 210, 255, 0.45);

          border-radius: 12px;

          padding: 9px 13px;

          color: #fff;

          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);

          box-shadow:
            0 12px 30px rgba(0, 0, 0, 0.55),
            inset 0 1px 0 rgba(255, 255, 255, 0.10),
            0 0 20px rgba(0, 210, 255, 0.08);

          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .card-top {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .parked-gate1 {
          top: 12%;
          left: 5%;
        }

        .parked-gate2 {
          bottom: 12%;
          right: 5%;
        }

        .plane-badge {
          font-size: 10px;
          font-weight: 700;

          color: #00f2fe;

          letter-spacing: 0.7px;
        }

        .plane-badge.gold {
          color: #ffd700;
        }

        .plane-details strong {
          display: block;
          font-size: 12px;
        }

        .plane-details span {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.75);
        }

        /* =========================================
           FLYING PLANES
        ========================================= */

        .flying-jet {
          position: absolute;

          display: flex;
          align-items: center;
          gap: 8px;

          z-index: 7;
        }

        .jet-body {
          position: relative;

          display: flex;
          align-items: center;
        }

        .jet-trail {
          position: absolute;

          width: 120px;
          height: 2px;

          right: 90%;
          top: 50%;

          background:
            linear-gradient(
              90deg,
              #00f2fe,
              transparent
            );

          box-shadow:
            0 0 8px rgba(0, 242, 254, 0.5);
        }

        .landing-trail {
          background:
            linear-gradient(
              90deg,
              #ffd700,
              transparent
            );
        }

        .jet-tag {
          background:
            rgba(0, 20, 40, 0.90);

          border:
            1px solid #00f2fe;

          padding: 4px 10px;

          border-radius: 6px;

          color: #00f2fe;

          font-size: 11px;

          white-space: nowrap;

          box-shadow:
            0 0 12px rgba(0, 242, 254, 0.25);
        }

        .gold-tag {
          border-color: #ffd700;
          color: #ffd700;
        }

        .white-tag {
          border-color: #ffffff;
          color: #ffffff;
        }

        /* =========================================
           PLANE ANIMATIONS
        ========================================= */

        .jet-takeoff {
          animation:
            animTakeoff
            14s
            ease-in-out
            infinite;
        }

        @keyframes animTakeoff {
          0% {
            left: -20%;
            bottom: 10%;
            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          85% {
            opacity: 1;
          }

          100% {
            left: 115%;
            bottom: 80%;
            opacity: 0;
          }
        }

        .jet-landing {
          animation:
            animLanding
            16s
            ease-in-out
            infinite;

          animation-delay: 2s;
        }

        @keyframes animLanding {
          0% {
            right: -20%;
            top: 10%;
            opacity: 0;
          }

          15% {
            opacity: 1;
          }

          75% {
            opacity: 1;
          }

          100% {
            right: 115%;
            top: 80%;
            opacity: 0;
          }
        }

        .jet-cruise {
          animation:
            animCruise
            22s
            linear
            infinite;
        }

        @keyframes animCruise {
          0% {
            left: -20%;
            top: 22%;
            opacity: 0;
          }

          10% {
            opacity: 0.8;
          }

          90% {
            opacity: 0.8;
          }

          100% {
            left: 115%;
            top: 38%;
            opacity: 0;
          }
        }

        /* =========================================
           LOGIN CARD
        ========================================= */

        .login-card {
          position: relative;
          z-index: 20;

          width: 340px;

          background:
            linear-gradient(
              145deg,
              rgba(5, 25, 49, 0.88),
              rgba(1, 10, 23, 0.92)
            );

          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);

          border-radius: 18px;

          padding: 26px 24px;

          box-shadow:
            0 25px 70px rgba(0, 0, 0, 0.88),
            0 0 35px rgba(0, 180, 255, 0.13),
            inset 0 1px 0 rgba(255, 255, 255, 0.12);

          text-align: center;

          color: white;

          border:
            1px solid rgba(0, 210, 255, 0.40);

          transition:
            all 0.3s ease;
        }

        .login-card::before {
          content: "";

          position: absolute;

          top: 0;
          left: 12%;
          right: 12%;

          height: 1px;

          background:
            linear-gradient(
              90deg,
              transparent,
              rgba(0, 242, 254, 0.85),
              rgba(212, 175, 55, 0.85),
              transparent
            );

          box-shadow:
            0 0 10px rgba(0, 242, 254, 0.5);
        }

        .login-card::after {
          content: "";

          position: absolute;

          inset: 1px;

          border-radius: 17px;

          pointer-events: none;

          background:
            radial-gradient(
              circle at 50% 0%,
              rgba(0, 210, 255, 0.08),
              transparent 42%
            );
        }

        .login-card:hover {
          border-color:
            rgba(0, 242, 254, 0.70);

          box-shadow:
            0 30px 80px rgba(0, 0, 0, 0.92),
            0 0 45px rgba(0, 210, 255, 0.20),
            inset 0 1px 0 rgba(255, 255, 255, 0.14);
        }

        /* =========================================
           LOGO
        ========================================= */

        .logo-badge {
          position: relative;
          z-index: 2;

          width: 52px;
          height: 52px;

          margin:
            0 auto 10px;

          background:
            linear-gradient(
              135deg,
              #00c6ff,
              #006eff
            );

          border-radius: 50%;

          display: flex;

          align-items: center;
          justify-content: center;

          border:
            2px solid rgba(255, 255, 255, 0.22);

          box-shadow:
            0 0 22px rgba(0, 198, 255, 0.55),
            inset 0 0 12px rgba(255, 255, 255, 0.18);
        }

        .title {
          position: relative;
          z-index: 2;

          font-size: 18px;

          font-weight: 700;

          color: #ffffff;

          margin-bottom: 2px;

          letter-spacing: 0.1px;

          text-shadow:
            0 2px 12px rgba(0, 0, 0, 0.5);
        }

        .subtitle {
          position: relative;
          z-index: 2;

          font-size: 11px;

          color: #00f2fe;

          margin-bottom: 22px;

          text-transform: uppercase;

          letter-spacing: 1.2px;

          font-weight: 600;
        }

        /* =========================================
           INPUTS
        ========================================= */

        .input-group {
          position: relative;
          z-index: 2;

          margin-bottom: 14px;
        }

        .login-input {
          width: 100%;

          padding: 11px 14px;

          border-radius: 9px;

          border:
            1px solid rgba(0, 210, 255, 0.28);

          outline: none;

          font-size: 13px;

          background:
            rgba(0, 8, 20, 0.75);

          color: #ffffff;

          box-sizing: border-box;

          transition:
            all 0.3s ease;

          box-shadow:
            inset 0 1px 5px rgba(0, 0, 0, 0.35);
        }

        .login-input::placeholder {
          color:
            rgba(255, 255, 255, 0.55);
        }

        .login-input:focus {
          background:
            rgba(1, 15, 32, 0.92);

          border-color:
            #00f2fe;

          box-shadow:
            0 0 0 2px rgba(0, 242, 254, 0.08),
            0 0 15px rgba(0, 242, 254, 0.25),
            inset 0 1px 5px rgba(0, 0, 0, 0.4);
        }

        .password-box {
          position: relative;
        }

        .eye {
          position: absolute;

          right: 12px;
          top: 50%;

          transform:
            translateY(-50%);

          cursor: pointer;

          font-size: 14px;

          opacity: 0.75;

          z-index: 5;

          transition:
            transform 0.2s ease,
            opacity 0.2s ease;
        }

        .eye:hover {
          opacity: 1;

          transform:
            translateY(-50%)
            scale(1.12);
        }

        .caps-warning {
          position: relative;
          z-index: 2;

          color: #ffd700;

          font-size: 11px;

          margin-bottom: 10px;

          font-weight: 600;

          text-align: left;
        }

        /* =========================================
           BUTTONS
        ========================================= */

        .btn-row {
          position: relative;
          z-index: 2;

          display: flex;

          gap: 10px;

          margin-top: 18px;
        }

        .btn {
          flex: 1;

          padding: 10px;

          border: none;

          border-radius: 9px;

          font-size: 13px;

          cursor: pointer;

          transition:
            all 0.3s ease;

          font-weight: 600;
        }

        .login-btn {
          background:
            linear-gradient(
              135deg,
              #00f2fe,
              #4facfe
            );

          color: #001830;

          box-shadow:
            0 5px 16px rgba(0, 242, 254, 0.28);
        }

        .login-btn:hover:not(:disabled) {
          background:
            linear-gradient(
              135deg,
              #38f9d7,
              #4facfe
            );

          transform:
            translateY(-2px);

          box-shadow:
            0 7px 22px rgba(0, 242, 254, 0.45);
        }

        .login-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cancel-btn {
          background:
            rgba(255, 255, 255, 0.08);

          color: #ffffff;

          border:
            1px solid rgba(255, 255, 255, 0.22);
        }

        .cancel-btn:hover {
          background:
            rgba(255, 255, 255, 0.16);

          border-color:
            rgba(255, 255, 255, 0.4);

          transform:
            translateY(-1px);
        }

        /* =========================================
           FOOTER
        ========================================= */

        .footer-credits {
          position: relative;
          z-index: 2;

          margin-top: 17px;

          font-size: 10px;

          color:
            rgba(255, 255, 255, 0.60);

          letter-spacing: 0.2px;
        }

        .status-dot {
          display: inline-block;

          width: 6px;
          height: 6px;

          margin-right: 5px;

          border-radius: 50%;

          background: #39ff88;

          box-shadow:
            0 0 8px #39ff88;

          animation:
            statusPulse
            2s
            infinite;
        }

        @keyframes statusPulse {
          0%,
          100% {
            opacity: 1;
          }

          50% {
            opacity: 0.35;
          }
        }

        /* =========================================
           SHAKE
        ========================================= */

        .shake {
          animation:
            shake
            0.4s
            ease;
        }

        @keyframes shake {
          0% {
            transform: translateX(0);
          }

          20% {
            transform: translateX(-6px);
          }

          40% {
            transform: translateX(6px);
          }

          60% {
            transform: translateX(-4px);
          }

          80% {
            transform: translateX(4px);
          }

          100% {
            transform: translateX(0);
          }
        }

        /* =========================================
           RESPONSIVE
        ========================================= */

        @media (max-width: 768px) {

          .parked-gate1,
          .parked-gate2 {
            display: none;
          }

          .jet-tag {
            display: none;
          }

          .grid-perspective {
            opacity: 0.12;
          }

          .hd-airport-bg {
            background-position: center;
          }
        }

        @media (max-width: 480px) {

          .login-card {
            width: 88%;

            padding:
              22px 18px;
          }

          .title {
            font-size: 17px;
          }

          .subtitle {
            font-size: 10px;
          }

          .real-plane-img {
            width: 65px;
          }

          .light-blue {
            width: 280px;
            height: 280px;
          }

          .light-gold {
            width: 240px;
            height: 240px;
          }
        }

      `}</style>
    </div>
  );
}