import React, { useEffect, useState } from "react";
import "./restore.css";
import axios from "axios";
import Swal from "sweetalert2";
import UploadRestoreCard from "../components/UploadRestoreCard";

export default function Restore({ onNavigate }) {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [tableMap, setTableMap] = useState({});

  const TABLES = [
    "bookings","expense_ledger","hotels","ticketing","visa","card","groups",
    "transport","customers","purchase_entries","users","bank_transactions",
    "cash_transactions","customer_payments","purchase_payments",
    "supplier_payments","suppliers","ziyarat","archive_snapshots","archive_balances","archive_profit_monthly","archive_logs",
    "authority_settings","system_passwords",
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

  // LOADING POPUP
  Swal.fire({
    title: "Fixing Sequences...",
    text: "Please wait...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/backup/fix-sequences`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password: confirmed }) // Yeh password backend ke verifySystemPassword('backup_action_pass') se lookup hoga
      }
    );

    const data = await res.json();
    Swal.close();

    if (!data.success) {
      // Agar password wrong hoga toh backend se direct "Wrong password" ka error handle ho jayega
      return Swal.fire("❌ Error", data.error || "Something went wrong", "error");
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

const askPassword = async (title, fileObj) => {
  let show = false;

  const { value: password } = await Swal.fire({
    width: "360px", // 👈 compact popup
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
          <input id="swal-pass" type="password" class="swal2-input"
            style="height:34px;font-size:13px"
            placeholder="Enter password">

          <span id="toggle-pass" style="
            position:absolute;
            right:12px;
            top:50%;
            transform:translateY(-50%);
            cursor:pointer;
            font-size:14px;
          ">👁</span>
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

/* ================= RESTORE (WITH LIVE PROGRESS & STEPPER) ================= */

  const restore = async (file, mode) => {
    const fileObj = files.find((f) => f.name === file);

    const password = await askPassword(
      mode === "full" ? "Full Backup Restore" : "Table Backup Restore",
      fileObj
    );
    if (!password) return;

    if (mode === "table" && !tableMap[file]) {
      return Swal.fire("Error", "Please select a table to restore", "error");
    }

    let progressInterval = null;

    try {
      // 1. Progress Bar Popup with Stepper UI
      Swal.fire({
        title: "🔄 External Database Engine",
        html: `
          <div style="margin-top:15px; text-align: left;">
            <div style="width:100%; height:20px; background:#e5e7eb; border-radius:50px; overflow:hidden; margin-bottom: 15px;">
              <div id="restoreBar" style="width:0%; height:100%; background:linear-gradient(90deg, #3b82f6, #2563eb); transition:width 0.4s ease;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:800; font-size:16px; margin-bottom:15px;">
              <span>Status: <span id="restoreStatus" style="color:#2563eb;">Initiating Restore...</span></span>
              <span id="restorePercent">0%</span>
            </div>
            <div id="stepperContainer" style="font-size:13px; line-height: 2;">
              <div id="step1" style="color:#2563eb; font-weight:bold;">⏳ Step 1: Reading Backup File...</div>
              <div id="step2" style="color:#94a3b8;">⚪ Step 2: Extracting & Verifying Structures...</div>
              <div id="step3" style="color:#94a3b8;">⚪ Step 3: Purging Live Records & Overwriting Tables...</div>
              <div id="step4" style="color:#94a3b8;">⚪ Step 4: Finalizing Sequences & Triggers...</div>
            </div>
          </div>
        `,
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
      });

      // Helper function to update Progress & Steppers
      const updateProgressDOM = (pct, statusText, currentStep) => {
        const bar = document.getElementById("restoreBar");
        const txt = document.getElementById("restorePercent");
        const st = document.getElementById("restoreStatus");
        if (bar) bar.style.width = `${pct}%`;
        if (txt) txt.innerHTML = `${pct}%`;
        if (st) st.innerHTML = statusText;

        for (let i = 1; i <= 4; i++) {
          const el = document.getElementById(`step${i}`);
          if (el) {
            if (i < currentStep) {
              el.innerHTML = el.innerHTML.replace(/[⏳⚪✅]/, "✅");
              el.style.color = "#16a34a";
              el.style.fontWeight = "normal";
            } else if (i === currentStep) {
              el.innerHTML = el.innerHTML.replace(/[⏳⚪✅]/, "⏳");
              el.style.color = "#2563eb";
              el.style.fontWeight = "bold";
            } else {
              el.style.color = "#94a3b8";
              el.style.fontWeight = "normal";
            }
          }
        }
      };

      // 2. Simulated Dynamic Progress Steps
      let simulatedPct = 0;
      progressInterval = setInterval(() => {
        if (simulatedPct < 30) {
          simulatedPct += 5;
          updateProgressDOM(simulatedPct, "Reading Backup File...", 1);
        } else if (simulatedPct >= 30 && simulatedPct < 65) {
          simulatedPct += 3;
          updateProgressDOM(simulatedPct, "Extracting & verifying structures...", 2);
        } else if (simulatedPct >= 65 && simulatedPct < 90) {
          simulatedPct += 2;
          updateProgressDOM(simulatedPct, "Purging records & overwriting...", 3);
        }
      }, 250);

      // 3. Send REST request to backend
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}${
          mode === "full"
            ? "/api/backup/restore/full"
            : "/api/backup/restore/table"
        }`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ file, table: tableMap[file], password }),
        }
      );

      const data = await res.json();

      // Clear interval on server response
      if (progressInterval) clearInterval(progressInterval);

      if (!res.ok || !data.success) {
        Swal.close();
        return Swal.fire("Error", data.error || "Restore failed / Wrong password", "error");
      }

      // Final completion steps
      updateProgressDOM(96, "Finalizing sequences & triggers...", 4);
      await new Promise((r) => setTimeout(r, 600));
      updateProgressDOM(100, "Done!", 5);
      await new Promise((r) => setTimeout(r, 400));

      Swal.close();

      Swal.fire({
        icon: "success",
        title: "Restore Completed",
        text: "Database restored successfully!",
        confirmButtonColor: "#16a34a",
      });

    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
      Swal.close();
      Swal.fire("Error", "Restore failed", "error");
    }
  };

  /* ================= DOWNLOAD ================= */

  const downloadBackup = async (file) => {
    const fileObj = files.find(f => f.name === file);

    const password = await askPassword("Download Backup", fileObj);
    if (!password) return;

    Swal.fire({
  title: "⬇ Preparing Download",
  html: `
    <div style="
      padding:20px;
      font-size:15px;
      color:#2563eb;
      font-weight:700;
    ">
      Please wait...
    </div>
  `,
  allowOutsideClick:false,
  showConfirmButton:false
});

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
  html: `
    <div style="
      padding:20px;
      font-size:15px;
      color:#dc2626;
      font-weight:700;
    ">
      Removing backup...
    </div>
  `,
  allowOutsideClick:false,
  showConfirmButton:false
});

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
    gap: "10px"
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.transform = "translateY(-2px)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.transform = "translateY(0)";
  }}
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
                    ⬇ Download
                  </button>
                </td>

                <td className="text-center">
                  <button
                    className="vip-btn vip-danger"
                    onClick={() => deleteBackup(f.name)}
                  >
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
