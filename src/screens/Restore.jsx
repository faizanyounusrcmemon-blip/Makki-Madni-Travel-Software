import React, { useEffect, useState } from "react";

export default function Restore({ onNavigate }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tableMap, setTableMap] = useState({});

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

  /* ================= LOAD BACKUPS ================= */
  const loadBackups = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/backup/list`
      );
      const data = await res.json();
      if (data.success) setFiles(data.files || []);
    } catch {
      alert("❌ Backup list load failed");
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  /* ================= RESTORE ================= */
  const restore = async (file, mode) => {
    const password = prompt("Restore Password");
    if (!password) return;

    if (mode === "table" && !tableMap[file]) {
      return alert("❌ Please select table first");
    }

    setLoading(true);
    setProgress(20);

    const url =
      mode === "full"
        ? "/api/backup/restore/full"
        : "/api/backup/restore/table";

    try {
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

      setProgress(70);
      const data = await res.json();
      setProgress(100);
      setLoading(false);

      if (data.success) {
        alert("✅ Restore completed successfully");
      } else {
        alert("❌ Restore failed: " + data.error);
      }
    } catch {
      setLoading(false);
      alert("❌ Restore error");
    }
  };

  /* ================= DOWNLOAD ================= */
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

      if (!res.ok) throw new Error();

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = file;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      alert("❌ Download failed");
    }
  };

  /* ================= DELETE ================= */
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
      if (!data.success) return alert("❌ Delete failed");

      loadBackups();
    } catch {
      alert("❌ Delete error");
    }
  };

  return (
    <div className="container mt-4">
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Back
      </button>

      <h3 className="fw-bold mt-3">🗄 Backup & Restore</h3>

      {loading && (
        <div className="progress my-2">
          <div
            className="progress-bar progress-bar-striped progress-bar-animated"
            style={{ width: `${progress}%` }}
          >
            {progress}%
          </div>
        </div>
      )}

      <table className="table table-bordered table-sm mt-3">
        <thead className="table-dark">
          <tr>
            <th>Backup File</th>
            <th>Restore</th>
            <th>Download</th>
            <th>Delete</th>
          </tr>
        </thead>

        <tbody>
          {files.map((f) => (
            <tr key={f.name}>
              <td>{f.name}</td>

              <td>
                <button
                  className="btn btn-success btn-sm me-1"
                  onClick={() => restore(f.name, "full")}
                >
                  Full
                </button>

                <select
                  className="form-select form-select-sm d-inline w-auto me-1"
                  value={tableMap[f.name] || ""}
                  onChange={(e) =>
                    setTableMap({
                      ...tableMap,
                      [f.name]: e.target.value,
                    })
                  }
                >
                  <option value="">Table</option>
                  {TABLES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => restore(f.name, "table")}
                >
                  Single
                </button>
              </td>

              <td className="text-center">
                <button
                  className="btn btn-outline-secondary btn-sm"
                  onClick={() => downloadBackup(f.name)}
                >
                  ⬇️
                </button>
              </td>

              <td className="text-center">
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => deleteBackup(f.name)}
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}

          {files.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center text-muted">
                No backups found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
