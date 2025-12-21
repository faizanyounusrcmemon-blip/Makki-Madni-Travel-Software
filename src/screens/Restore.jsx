import React, { useEffect, useState } from "react";

export default function Restore({ onNavigate }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [table, setTable] = useState("");

  const TABLES = [
    "bookings","hotels","ticketing","visa","transport",
    "purchase_entries","users","bank_transactions",
    "customer_payments","purchase_payments",
  ];

  const formatDate = (d) =>
    new Date(d).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const loadBackups = async () => {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/backup/list`);
    const data = await res.json();
    if (data.success) setFiles(data.files);
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const restore = async (file, mode) => {
    const pass = prompt("Restore Password");
    if (pass !== "faisalyounus") return alert("❌ Wrong Password");

    setLoading(true);

    const url =
      mode === "full"
        ? "/api/backup/restore/full"
        : "/api/backup/restore/table";

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${url}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file, table }),
    });

    const data = await res.json();
    setLoading(false);
    alert(data.success ? "✅ Restore Completed" : "❌ Restore Failed");
  };

  const downloadBackup = (file) => {
    window.open(
      `${import.meta.env.VITE_BACKEND_URL}/api/backup/download/${file}`,
      "_blank"
    );
  };

  const deleteBackup = async (file) => {
    const pass = prompt("Delete Password");
    if (pass !== "faisalyounus") return alert("❌ Wrong Password");

    await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/backup/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ file }),
    });

    loadBackups();
  };

  return (
    <div className="container mt-4">
      <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>
        ⬅ Back
      </button>

      <h3 className="fw-bold mt-3">🗄 Backup & Restore</h3>

      {loading && <div className="alert alert-info">Processing...</div>}

      <table className="table table-bordered table-sm mt-3">
        <thead className="table-dark">
          <tr>
            <th>Backup</th>
            <th>Date & Time</th>
            <th>Restore</th>
            <th>Download</th>
            <th>Delete</th>
          </tr>
        </thead>

        <tbody>
          {files.map((f, i) => (
            <tr key={i}>
              <td className="fw-bold">{f.name}</td>
              <td>{formatDate(f.date)}</td>

              <td>
                <button className="btn btn-success btn-sm me-1" onClick={() => restore(f.name, "full")}>
                  Full
                </button>

                <select
                  className="form-select form-select-sm d-inline w-auto me-1"
                  onChange={(e) => setTable(e.target.value)}
                >
                  <option value="">Table</option>
                  {TABLES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>

                <button className="btn btn-primary btn-sm" onClick={() => restore(f.name, "table")}>
                  Single
                </button>
              </td>

              <td className="text-center">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => downloadBackup(f.name)}>
                  ⬇️
                </button>
              </td>

              <td className="text-center">
                <button className="btn btn-danger btn-sm" onClick={() => deleteBackup(f.name)}>
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
  );
}
