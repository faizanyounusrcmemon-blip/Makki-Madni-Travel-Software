import React, { useEffect, useState } from "react";
import "./dashboard.css";

export default function Dashboard({ onNavigate }) {
  const [lastBackup, setLastBackup] = useState("");
  const [loading, setLoading] = useState(false);

  // ===========================
  // LOAD LAST BACKUP INFO
  // ===========================
  const loadLastBackup = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/backup/last`
      );
      const data = await res.json();
      if (data.success) {
        setLastBackup(data.last_backup);
      }
    } catch (err) {
      console.error("Backup info load failed", err);
    }
  };

  useEffect(() => {
    loadLastBackup();
  }, []);

  // ===========================
  // MANUAL BACKUP (PASSWORD)
  // ===========================
  const runBackup = async () => {
    const pass = prompt("Enter Backup Password:");
    if (pass !== "8515") {
      alert("❌ Wrong Password");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/backup/manual`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pass }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("✅ Backup Completed Successfully");
        loadLastBackup();
      } else {
        alert("❌ Backup Failed: " + (data.error || ""));
      }
    } catch (err) {
      alert("❌ Server Error while running backup");
    }

    setLoading(false);
  };

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <div className="dashboard-header">
        <h2>✈️ Makki Madni Travel</h2>

        {/* BACKUP PANEL */}
        <div
          style={{
            marginTop: 10,
            display: "flex",
            gap: 15,
            alignItems: "center",
          }}
        >
          <button
            onClick={runBackup}
            disabled={loading}
            style={{
              background: "linear-gradient(135deg, #ff9800, #ff5722)",
              border: "none",
              padding: "8px 16px",
              borderRadius: "20px",
              color: "white",
              fontWeight: "bold",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(0,0,0,0.3)",
            }}
          >
            {loading ? "⏳ Backup Running..." : "💾 Backup Now"}
          </button>

          <div
            style={{
              background: "#222",
              padding: "6px 12px",
              borderRadius: "12px",
              fontSize: "13px",
              color: "#ffd700",
            }}
          >
            🕙 Last Backup:
            <br />
            <b>{lastBackup || "Not yet"}</b>
          </div>
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
