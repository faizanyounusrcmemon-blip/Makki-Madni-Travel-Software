import React, { useEffect, useState } from "react";
import "./dashboard.css";

export default function Dashboard({ onNavigate }) {
  const [lastBackup, setLastBackup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);

  // ✅ BACKGROUND IMAGES
  const images = [
    "/images/haram1.jpg",
    "/images/haram2.jpg",
    "/images/haram3.jpg",
    "/images/haram4.jpg",
    "/images/haram5.jpg",
    "/images/haram6.jpg",
    "/images/haram7.jpg",
    "/images/haram8.jpg",
    "/images/haram9.jpg",
    "/images/haram10.jpg",
    "/images/haram11.jpg",
    "/images/haram12.jpg",
  ];

  const [bgIndex, setBgIndex] = useState(0);

  // ✅ AUTO SLIDER
  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex((prev) => (prev + 1) % images.length);
    }, 4000); // every 4 sec

    return () => clearInterval(interval);
  }, []);

  const loadLastBackup = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/backup/last`
      );
      const data = await res.json();
      if (data.success) setLastBackup(data.last_backup);
    } catch {
      setMessage({ type: "danger", text: "❌ Backup info load failed" });
    }
  };

  useEffect(() => {
    loadLastBackup();
  }, []);

  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        })
      : "-";

  const runBackup = async () => {
    const pass = prompt("Enter Backup Password");
    if (pass !== "8515") {
      setMessage({ type: "danger", text: "❌ Wrong password" });
      return;
    }

    setLoading(true);
    setProgress(10);
    setMessage(null);

    try {
      setProgress(40);
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/backup/manual`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pass }),
        }
      );

      setProgress(80);
      const data = await res.json();
      setProgress(100);

      if (data.success) {
        setMessage({
          type: "success",
          text: "✅ Backup completed successfully",
        });
        loadLastBackup();
      } else {
        setMessage({ type: "danger", text: "❌ Backup failed" });
      }
    } catch {
      setMessage({ type: "danger", text: "❌ Server error during backup" });
    }

    setTimeout(() => {
      setLoading(false);
      setProgress(0);
    }, 900);
  };

  return (
    <div
      className="dashboard-container"
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        color: "white",

        // ✅ SLIDER IMAGE
        backgroundImage: `url(${images[bgIndex]})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",

        // ✅ SMOOTH FADE EFFECT
        transition: "background-image 1s ease-in-out",
      }}
    >
      {/* LIGHT OVERLAY */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0,0,0,0.25)",
          zIndex: 0,
        }}
      ></div>

      {/* CONTENT */}
      <div style={{ position: "relative", zIndex: 2 }}>
        {/* ☁ CLOUDS */}
        <div className="cloud cloud1"></div>
        <div className="cloud cloud2"></div>
        <div className="cloud cloud3"></div>

        {/* ✈ AIRPLANE */}
        <div className="airplane">
           <img src="/images/plane.png" alt="plane" />
           <div className="trail"></div>
        </div>

        {/* HEADER */}
        <div style={{ textAlign: "center", paddingTop: 40 }}>
          <h2 style={{ fontSize: 32, margin: 0 }}>Makki Madni Travel</h2>
          <i>Live Travel Management Dashboard</i>
        </div>

        {/* TOP BAR */}
        <div style={{ display: "flex", justifyContent: "flex-end", padding: 20 }}>
          <div className="backup-side-box">
<button
  className="vip-backup-btn"
  onClick={runBackup}
  disabled={loading}
>
{loading ? (
  <>
    <span className="btn-loader"></span>
    Backing up...
  </>
) : (
  "Backup Now"
)}
</button>

            <div className="last-backup-box">
              <span>Last Backup</span>
              <b>
                {lastBackup
                  ? `${lastBackup.name} · ${formatDate(
                      lastBackup.created_at
                    )}`
                  : "Not yet"}
              </b>
            </div>

            {loading && (
              <div className="vip-progress">
                <div
                  className="vip-progress-bar"
                  style={{ width: `${progress}%` }}
                >
                  {progress}%
                </div>
              </div>
            )}

            {message && (
              <div className={`vip-alert ${message.type}`}>
                {message.text}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SHADOW */}
        <div className="ground"></div>
      </div>

      {/* CSS */}
      <style>
        {`
          .cloud {
            position: absolute;
            background: rgba(255,255,255,0.7);
            border-radius: 50%;
            opacity: 0.5;
            filter: blur(10px);
          }

          .cloud1 {
            width: 300px;
            height: 80px;
            top: 20%;
            left: -300px;
            animation: moveClouds 60s linear infinite;
          }

          .cloud2 {
            width: 400px;
            height: 100px;
            top: 40%;
            left: -400px;
            animation: moveClouds 90s linear infinite;
          }

          .cloud3 {
            width: 250px;
            height: 70px;
            top: 65%;
            left: -250px;
            animation: moveClouds 75s linear infinite;
          }

          @keyframes moveClouds {
            from { transform: translateX(0); }
            to { transform: translateX(160vw); }
          }

          .airplane {
            position: absolute;
            top: 30%;
            left: -50px;
            font-size: 38px;
            animation: fly 25s linear infinite;
            z-index: 2;
          }

          @keyframes fly {
            from { transform: translateX(0) translateY(0); }
            to { transform: translateX(120vw) translateY(-60px); }
          }

          .ground {
            position: absolute;
            bottom: 0;
            width: 100%;
            height: 100px;
            background: linear-gradient(to top, rgba(0,0,0,0.7), transparent);
          }
        `}
      </style>
    </div>
  );
}