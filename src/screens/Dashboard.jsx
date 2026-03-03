import React, { useEffect, useState } from "react";
import "./dashboard.css";

export default function Dashboard({ onNavigate }) {
  const [lastBackup, setLastBackup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);

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
        background:
          "linear-gradient(to top, #1e3c72, #2a5298)",
        color: "white",
      }}
    >
      {/* ☁ CLOUD LAYERS */}
      <div className="cloud cloud1"></div>
      <div className="cloud cloud2"></div>
      <div className="cloud cloud3"></div>
      {/* ✈ FLYING AIRPLANE */}
      <div className="airplane">
        🛫
      </div>

      {/* HEADER */}
      <div className="dashboard-header" style={{ textAlign: "center", paddingTop: 40 }}>
        <h2 style={{ fontSize: 32, margin: 0 }}>
          ✈ Makki Madni Travel
        </h2>
        <i>🌏 Live Travel Management Dashboard 🌏</i>
      </div>

      {/* TOP BAR */}
      <div className="dashboard-topbar" style={{ display: "flex", justifyContent: "flex-end", padding: 20 }}>
        <div className="backup-side-box">
          <button
            className="vip-backup-btn"
            onClick={runBackup}
            disabled={loading}
          >
            {loading ? "⏳ Backup Running..." : "💾 Backup Now"}
          </button>

          <div className="last-backup-box">
            <span>🕙 Last Backup</span>
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

      {/* CONTENT */}
      <div className="dashboard-content" style={{ padding: 40 }}>
        <div className="dash-card green small">
          <div className="dash-icon">📦</div>
          <h4>Packages</h4>
          <p>Create & manage travel packages</p>
          <button onClick={() => onNavigate("packages")}>
            Open
          </button>
        </div>
      </div>

      {/* CLOUD CSS */}
      <style>
        {`
        .cloud {
          position: absolute;
          background: rgba(255,255,255,0.8);
          border-radius: 50%;
          opacity: 0.6;
          filter: blur(8px);
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
          opacity: 0.4;
        }

        .cloud3 {
          width: 250px;
          height: 70px;
          top: 65%;
          left: -250px;
          animation: moveClouds 75s linear infinite;
          opacity: 0.5;
        }

        @keyframes moveClouds {
          from { transform: translateX(0); }
          to { transform: translateX(160vw); }
        }
      `}
      </style>
    </div>
  );
}