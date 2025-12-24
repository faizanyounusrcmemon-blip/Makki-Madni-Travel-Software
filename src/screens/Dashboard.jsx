import React, { useEffect, useState } from "react";
import "./dashboard.css";

export default function Dashboard({ onNavigate }) {
  const [lastBackup, setLastBackup] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState(null);

  /* LOAD LAST BACKUP */
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

  /* DATE FORMAT AM / PM */
  const formatDate = (d) =>
    d
      ? new Date(d).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
      : "-";

  /* RUN BACKUP */
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
        setMessage({ type: "success", text: "✅ Backup completed successfully" });
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
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <h2>✈️ Makki Madni Travel</h2>
        <i>Travel Management Dashboard</i>
      </div>

      {/* TOP BAR */}
      <div className="dashboard-topbar">
        {/* LEFT EMPTY / TITLE SPACE */}
        <div />

        {/* RIGHT BACKUP BOX */}
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
                ? `${lastBackup.name} · ${formatDate(lastBackup.created_at)}`
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
      <div className="dashboard-content">
        <div className="dash-card green small">
          <div className="dash-icon">📦</div>
          <h4>Packages</h4>
          <p>Create & manage travel packages</p>
          <button onClick={() => onNavigate("packages")}>Open</button>
        </div>
      </div>
    </div>
  );
}
