import React, { useEffect, useState } from "react";
import "./restore.css";
import Swal from "sweetalert2";

export default function Restore({ onNavigate }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tableMap, setTableMap] = useState({});

  const TABLES = [
    "bookings","expense_ledger","hotels","ticketing","visa","card",
    "transport","purchase_entries","users","bank_transactions",
    "cash_transactions","customer_payments","purchase_payments",
    "supplier_payments","suppliers","ziyarat",
  ];

  /* ================= HELPERS ================= */

  const fmtDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: true,
    });
  };

  const onlyDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
    });
  };

  const fmtSize = (bytes) => {
    if (!bytes) return "-";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024)
      return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  /* ================= LOAD ================= */

  const loadBackups = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/backup/list`);
      const data = await res.json();
      if (data.success) setFiles(data.files || []);
    } catch {
      Swal.fire("Error", "Backup list load failed", "error");
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  /* ================= SUMMARY ================= */

  const backupCount = files.length;

  const sortedDates = files.map((f) => new Date(f.created_at)).sort((a, b) => a - b);

  const fromDate = sortedDates.length ? onlyDate(sortedDates[0]) : "-";
  const toDate = sortedDates.length ? onlyDate(sortedDates[sortedDates.length - 1]) : "-";

  /* ================= PASSWORD POPUP (SHOW/HIDE) ================= */

  const askPassword = async (title) => {
    let show = false;

    const { value: password } = await Swal.fire({
      title,
      html: `
        <div style="position:relative">
          <input id="swal-pass" type="password" class="swal2-input" placeholder="Enter password">
          <span id="toggle-pass" style="
            position:absolute;
            right:20px;
            top:50%;
            transform:translateY(-50%);
            cursor:pointer;
            font-size:14px;
            color:#555;">👁</span>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      preConfirm: () => {
        return document.getElementById("swal-pass").value;
      },
      didOpen: () => {
        const input = document.getElementById("swal-pass");
        const toggle = document.getElementById("toggle-pass");

        toggle.addEventListener("click", () => {
          show = !show;
          input.type = show ? "text" : "password";
          toggle.textContent = show ? "🙈" : "👁";
        });
      }
    });

    return password;
  };

  /* ================= LOADING POPUP ================= */

  const showLoader = (text = "Processing...") => {
    Swal.fire({
      title: text,
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  };

  /* ================= RESTORE ================= */

  const restore = async (file, mode) => {
    const password = await askPassword("Restore Password");
    if (!password) return;

    if (mode === "table" && !tableMap[file]) {
      return Swal.fire("Error", "Table select karo", "error");
    }

    showLoader("Restoring...");

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}${
        mode === "full"
          ? "/api/backup/restore/full"
          : "/api/backup/restore/table"
      }`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file, table: tableMap[file], password }),
      });

      const data = await res.json();
      Swal.close();

      if (!res.ok || !data.success) {
        return Swal.fire("Error", data.error || "Wrong password", "error");
      }

      Swal.fire("Success", "Restore completed successfully", "success");
    } catch {
      Swal.close();
      Swal.fire("Error", "Restore failed", "error");
    }
  };

  /* ================= DOWNLOAD ================= */

  const downloadBackup = async (file) => {
    const password = await askPassword("Download Password");
    if (!password) return;

    showLoader("Preparing Download...");

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/backup/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file, password }),
      });

      const contentType = res.headers.get("content-type");

      if (contentType && contentType.includes("application/json")) {
        const data = await res.json();
        Swal.close();
        return Swal.fire("Error", data.error || "Wrong password", "error");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = file;
      a.click();

      Swal.close();
      Swal.fire("Success", "Download started", "success");
    } catch {
      Swal.close();
      Swal.fire("Error", "Download failed", "error");
    }
  };

  /* ================= DELETE ================= */

  const deleteBackup = async (file) => {
    const password = await askPassword("Delete Password");
    if (!password) return;

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Delete backup?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    showLoader("Deleting...");

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/backup/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ file, password }),
      });

      const data = await res.json();
      Swal.close();

      if (!res.ok || !data.success) {
        return Swal.fire("Error", data.error || "Wrong password", "error");
      }

      Swal.fire("Deleted", "Backup deleted successfully", "success");
      loadBackups();
    } catch {
      Swal.close();
      Swal.fire("Error", "Delete failed", "error");
    }
  };

  /* ================= UI ================= */

  return (
    <div className="restore-wrapper">
      <div className="restore-card">

        <div className="restore-header d-flex justify-content-between align-items-center">
          <div>
            <h2>🛡 VIP Backup & Restore</h2>
            <p>Secure • Reliable • Professional</p>
          </div>

          <div className="vip-summary text-end">
            <div>📦 <strong>Total:</strong> {files.length}</div>
            <div>📅 <strong>From:</strong> {fromDate}</div>
            <div>📅 <strong>To:</strong> {toDate}</div>
          </div>
        </div>

        <button
          className="vip-btn vip-outline mb-3"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Dashboard
        </button>

        <table className="table vip-table mt-3">
          <thead>
            <tr>
              <th>📁 Backup File</th>
              <th>🕒 Date & Time</th>
              <th>📦 Size</th>
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

                <td className="vip-size">
                  {fmtSize(f.metadata?.size)}
                </td>

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
          </tbody>
        </table>

      </div>
    </div>
  );
}