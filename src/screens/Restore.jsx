import React, { useEffect, useState } from "react";
import "./restore.css";

export default function Restore({ onNavigate }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tableMap, setTableMap] = useState({});
  const [message, setMessage] = useState(null);

  const TABLES = [
    "bookings",
    "hotels",
    "ticketing",
    "visa",
    "transport",
    "purchase_entries",
    "users",
    "bank_transactions",
    "customer_payments",
    "purchase_payments",
  ];

  const fmtDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const loadBackups = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/backup/list`
      );
      const data = await res.json();
      if (data.success) setFiles(data.files || []);
    } catch {
      setMessage({ type: "danger", text: "❌ Backup list load failed" });
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const restore = async (file, mode) => {
    const password = prompt("Restore Password");
    if (!password) return;

    if (mode === "table" && !tableMap[file]) {
      return alert("❌ Table select karo");
    }

    setLoading(true);
    setProgress(10);
    setMessage(null);

    const url =
      mode === "full"
        ? "/api/backup/restore/full"
        : "/api/backup/restore/table";

    try {
      setProgress(40);
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}${url}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            file,
            table: tableMap[file],
            password,
          }),
        }
      );

      setProgress(80);
      const data = await res.json();
      setProgress(100);
      setLoading(false);

      setMessage(
        data.success
          ? { type: "success", text: "✅ Restore completed successfully" }
          : { type: "danger", text: "❌ Restore failed: " + data.error }
      );
    } catch {
      setLoading(false);
      setMessage({ type: "danger", text: "❌ Restore error" });
    }
  };

  const downloadBackup = async (file) => {
    const password = prompt("Download Password");
    if (!password) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/backup/download`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file, password }),
        }
      );

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = file;
      a.click();

      setMessage({ type: "success", text: "⬇️ Download started" });
    } catch {
      setMessage({ type: "danger", text: "❌ Download failed" });
    }
  };

  const deleteBackup = async (file) => {
    const password = prompt("Delete Password");
    if (!password) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/backup/delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file, password }),
        }
      );

      const data = await res.json();
      if (data.success) {
        setMessage({ type: "success", text: "🗑 Backup deleted successfully" });
        loadBackups();
      }
    } catch {
      setMessage({ type: "danger", text: "❌ Delete error" });
    }
  };

  return (
    <div className="restore-wrapper">
      <div className="restore-card">

        <div className="restore-header">
          <h2>🛡 VIP Backup & Restore</h2>
          <p>Secure • Reliable • Professional</p>
        </div>

        <button
          className="vip-btn vip-outline mb-3"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Dashboard
        </button>

        {message && (
          <div className={`alert alert-${message.type} text-center`}>
            {message.text}
          </div>
        )}

        {loading && (
          <div className="vip-progress">
            <div className="vip-progress-bar" style={{ width: `${progress}%` }}>
              {progress}%
            </div>
          </div>
        )}

        <table className="table vip-table mt-3">
          <thead>
            <tr>
              <th>📁 Backup File</th>
              <th>🕒 Date & Time</th>
              <th>♻ Restore</th>
              <th className="text-center">⬇</th>
              <th className="text-center">🗑</th>
            </tr>
          </thead>

          <tbody>
            {files.map((f, i) => (
              <tr key={f.name} className="vip-row">
                <td>
                  <div className="vip-file">
                    <span className="vip-badge">{i + 1}</span>
                    {f.name}
                  </div>
                </td>

                <td className="vip-date">{fmtDate(f.created_at)}</td>

                <td>
                  <button
                    className="vip-btn vip-success me-1"
                    onClick={() => restore(f.name, "full")}
                  >
                    🔄 Full
                  </button>

                  <select
                    className="form-select form-select-sm d-inline w-auto me-1"
                    value={tableMap[f.name] || ""}
                    onChange={(e) =>
                      setTableMap({ ...tableMap, [f.name]: e.target.value })
                    }
                  >
                    <option value="">Table</option>
                    {TABLES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>

                  <button
                    className="vip-btn vip-primary"
                    onClick={() => restore(f.name, "table")}
                  >
                    📦 Single
                  </button>
                </td>

                <td className="text-center">
                  <button
                    className="vip-btn vip-outline"
                    onClick={() => downloadBackup(f.name)}
                  >
                    ⬇
                  </button>
                </td>

                <td className="text-center">
                  <button
                    className="vip-btn vip-danger"
                    onClick={() => deleteBackup(f.name)}
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}

            {files.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-muted">
                  No backups found
                </td>
              </tr>
            )}
          </tbody>
        </table>

      </div>
    </div>
  );
}
