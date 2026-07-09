import React, { useEffect, useState } from "react";
import "./restore.css";
import axios from "axios"; // ✅ Fixed: Using Axios for live progress tracking
import Swal from "sweetalert2";
import UploadRestoreCard from "../components/UploadRestoreCard";

export default function Restore({ onNavigate }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tableMap, setTableMap] = useState({});

  const TABLES = [
    "bookings","expense_ledger","hotels","ticketing","visa","card","groups",
    "transport","purchase_entries","users","bank_transactions",
    "cash_transactions","customer_payments","purchase_payments",
    "supplier_payments","suppliers","ziyarat","archive_snapshots","archive_balances","archive_profit_monthly","archive_logs",
  ];

  const fixSequences = async () => {
    let passwordValue = "";
    let showPassword = false;

    const { value: confirmed } = await Swal.fire({
      title: "🔐 Admin Authentication",
      html: `
        <div style="text-align:left">
          <label style="font-weight:600;">Enter Password</label>
          <div style="position:relative; margin-top:8px;">
            <input
              id="swal-pass"
              type="password"
              class="swal2-input"
              placeholder="Enter admin password"
              style="margin:0; width:100%; padding-right:40px;"
            />
            <button
              type="button"
              id="togglePass"
              style="
                position:absolute;
                right:10px;
                top:50%;
                transform:translateY(-50%);
                border:none;
                background:transparent;
                cursor:pointer;
                font-size:16px;
              "
            >👁️</button>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "🚀 Run Fix",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      preConfirm: () => {
        const input = document.getElementById("swal-pass").value;
        if (!input) {
          Swal.showValidationMessage("Password required!");
          return false;
        }
        return input;
      },
      didOpen: () => {
        const input = document.getElementById("swal-pass");
        const toggleBtn = document.getElementById("togglePass");

        toggleBtn.addEventListener("click", () => {
          showPassword = !showPassword;
          input.type = showPassword ? "text" : "password";
          toggleBtn.textContent = showPassword ? "🙈" : "👁️";
        });
      }
    });

    if (!confirmed) return;

    if (confirmed !== "8515") {
      return Swal.fire("❌ Error", "Wrong password!", "error");
    }

    Swal.fire({
      title: "Fixing Sequences...",
      text: "Please wait...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/backup/fix-sequences`);
      Swal.close();

      if (!res.data.success) {
        return Swal.fire("Error", res.data.error || "Something went wrong", "error");
      }

      Swal.fire("✅ Success", "All sequences fixed successfully", "success");
    } catch (err) {
      Swal.close();
      Swal.fire("Error", err.message, "error");
    }
  };

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
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/backup/list`);
      if (res.data.success) setFiles(res.data.files || []);
    } catch {
      Swal.fire("Error", "Backup list load failed", "error");
    }
  };

  useEffect(() => {
    loadBackups();
  }, []);

  const fromDate = files.length ? onlyDate(new Date(files.map(f => new Date(f.created_at)).sort((a, b) => a - b)[0])) : "-";
  const toDate = files.length ? onlyDate(new Date(files.map(f => new Date(f.created_at)).sort((a, b) => b - a)[0])) : "-";

  /* ================= PASSWORD POPUP ================= */
  const askPassword = async (title, fileObj) => {
    let show = false;
    const { value: password } = await Swal.fire({
      width: "360px",
      title,
      html: `
        <div style="text-align:left;font-size:13px;line-height:1.6">
          <div style="margin-bottom:8px">
            <b style="color:#0d6efd">📁 File:</b><br>
            <span style="font-size:12px">${fileObj.name}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:12px;margin-bottom:8px">
            <span>🕒 ${fmtDate(fileObj.created_at)}</span>
            <span>📦 ${fmtSize(fileObj.metadata?.size)}</span>
          </div>
          <div style="position:relative;margin-top:10px">
            <input id="swal-pass" type="password" class="swal2-input" style="height:34px;font-size:13px" placeholder="Enter password">
            <span id="toggle-pass" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);cursor:pointer;font-size:14px;">👁</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "OK",
      focusConfirm: false,
      preConfirm: () => {
        const val = document.getElementById("swal-pass").value;
        if (!val || val.trim() === "") {
          Swal.showValidationMessage("Password required");
        }
        return val ? val.trim() : "";
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

  /* ================= RESTORE (TRUE LIVE PROGRESS) ================= */
  const restore = async (file, mode) => {
    const fileObj = files.find(f => f.name === file);

    const password = await askPassword("Restore Backup", fileObj);
    if (!password) return;

    if (mode === "table" && !tableMap[file]) {
      return Swal.fire("Error", "Table select karo", "error");
    }

    // Opens Progress Box Container
    Swal.fire({
      title: "🔄 Restoring Backup",
      html: `
        <div style="margin-top:15px">
          <div style="width:100%; height:24px; background:#e5e7eb; border-radius:50px; overflow:hidden;">
            <div id="restoreBar" style="width:0%; height:100%; background:linear-gradient(90deg, #3b82f6, #2563eb); transition:width 0.2s ease;"></div>
          </div>
          <div id="restorePercent" style="margin-top:10px; font-size:18px; font-weight:800;">0%</div>
          <div id="restoreStatus" style="font-size:12px; color:#64748b; margin-top:5px;">Sending data to server...</div>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
    });

    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}${
        mode === "full" ? "/api/backup/restore/full" : "/api/backup/restore/table"
      }`;

      // ✅ Axios with true stream upload progress
      const res = await axios.post(url, {
        file,
        table: tableMap[file],
        password
      }, {
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || fileObj.metadata?.size || 100;
          const current = progressEvent.loaded;
          let percentCompleted = Math.round((current * 100) / total);

          if (percentCompleted > 99) percentCompleted = 99; // Hold at 99% until Database commits execution

          const bar = document.getElementById("restoreBar");
          const txt = document.getElementById("restorePercent");
          const status = document.getElementById("restoreStatus");

          if (bar) bar.style.width = `${percentCompleted}%`;
          if (txt) txt.innerHTML = `${percentCompleted}%`;
          if (status && percentCompleted > 85) status.innerHTML = "Processing database queries...";
        }
      });

      // Complete to 100% on actual HTTP success response
      const bar = document.getElementById("restoreBar");
      const txt = document.getElementById("restorePercent");
      if (bar) bar.style.width = "100%";
      if (txt) txt.innerHTML = "100%";

      await new Promise((r) => setTimeout(r, 600));
      Swal.close();

      if (!res.data.success) {
        return Swal.fire("Error", res.data.error || "Wrong password", "error");
      }

      Swal.fire("Success", "Restore completed successfully", "success");
    } catch (err) {
      Swal.close();
      Swal.fire("Error", err.response?.data?.error || "Restore failed", "error");
    }
  };

  /* ================= DOWNLOAD (TRUE LIVE PROGRESS) ================= */
  const downloadBackup = async (file) => {
    const fileObj = files.find(f => f.name === file);

    const password = await askPassword("Download Backup", fileObj);
    if (!password) return;

    Swal.fire({
      title: "⬇ Downloading Backup",
      html: `
        <div style="margin-top:15px">
          <div style="width:100%; height:24px; background:#e5e7eb; border-radius:50px; overflow:hidden;">
            <div id="downloadBar" style="width:0%; height:100%; background:linear-gradient(90deg, #10b981, #059669); transition:width 0.2s ease;"></div>
          </div>
          <div id="downloadPercent" style="margin-top:10px; font-size:18px; font-weight:800;">0%</div>
        </div>
      `,
      allowOutsideClick: false,
      showConfirmButton: false
    });

    try {
      // ✅ Axios with true chunk-by-chunk download stream progress tracking
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/backup/download`, {
        file,
        password
      }, {
        responseType: "blob",
        onDownloadProgress: (progressEvent) => {
          const total = progressEvent.total || fileObj.metadata?.size || 100;
          const current = progressEvent.loaded;
          const percentCompleted = Math.round((current * 100) / total);

          const bar = document.getElementById("downloadBar");
          const txt = document.getElementById("downloadPercent");

          if (bar) bar.style.width = `${percentCompleted}%`;
          if (txt) txt.innerHTML = `${percentCompleted}%`;
        }
      });

      Swal.close();

      // Trigger standard local saving action
      const blob = new Blob([res.data], { type: res.headers["content-type"] });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file;
      a.click();

      Swal.fire("Success", "Download started", "success");
    } catch (err) {
      Swal.close();
      Swal.fire("Error", "Download failed or invalid credentials.", "error");
    }
  };

  /* ================= DELETE ================= */
  const deleteBackup = async (file) => {
    const fileObj = files.find(f => f.name === file);

    const password = await askPassword("Delete Backup", fileObj);
    if (!password) return;

    const confirm = await Swal.fire({
      title: "Are you sure?",
      text: "Delete backup?",
      icon: "warning",
      showCancelButton: true,
    });

    if (!confirm.isConfirmed) return;

    Swal.fire({
      title: "🗑 Deleting Backup",
      html: `<div style="padding:20px; font-size:15px; color:#dc2626; font-weight:700;">Removing backup...</div>`,
      allowOutsideClick: false,
      showConfirmButton: false
    });

    try {
      const res = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/backup/delete`, { file, password });
      Swal.close();

      if (!res.data.success) {
        return Swal.fire("Error", res.data.error || "Wrong password", "error");
      }

      Swal.fire("Deleted", "Backup deleted successfully", "success");
      loadBackups();
    } catch {
      Swal.close();
      Swal.fire("Error", "Delete failed", "error");
    }
  };

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

        <button className="vip-btn vip-outline mb-3" onClick={() => onNavigate("dashboard")}>
          ⬅ Dashboard
        </button>

        <button
          onClick={fixSequences}
          style={{
            background: "linear-gradient(135deg,#f59e0b,#ea580c)",
            color: "#fff",
            border: "none",
            borderRadius: "14px",
            padding: "14px 24px",
            fontWeight: "700",
            fontSize: "15px",
            cursor: "pointer",
            boxShadow: "0 8px 20px rgba(234,88,12,.25)",
            transition: "all .3s ease",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginBottom: "15px"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          🔧 Fix Sequences After Restore
        </button>

        <UploadRestoreCard />

        <table className="table vip-table mt-3">
          <thead>
            <tr>
              <th>📁 Backup File</th>
              <th>🕒 Date & Time</th>
              <th>📦 Size</th>
              <th>♻ Restore</th>
              <th className="text-center">⬇ Download</th>
              <th className="text-center">🗑 Delete</th>
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
                <td className="vip-size">{fmtSize(f.metadata?.size)}</td>
                <td>
                  <button className="vip-btn vip-success me-1" onClick={() => restore(f.name, "full")}>
                    🔄 Full
                  </button>
                  <select
                    className="form-select form-select-sm d-inline w-auto me-1"
                    value={tableMap[f.name] || ""}
                    onChange={(e) => setTableMap({ ...tableMap, [f.name]: e.target.value })}
                  >
                    <option value="">Table</option>
                    {TABLES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button className="vip-btn vip-primary" onClick={() => restore(f.name, "table")}>
                    📦 Single
                  </button>
                </td>
                <td className="text-center">
                  <button className="vip-btn vip-outline" onClick={() => downloadBackup(f.name)}>
                    ⬇ Download
                  </button>
                </td>
                <td className="text-center">
                  <button className="vip-btn vip-danger" onClick={() => deleteBackup(f.name)}>
                    ❌ Delete
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
