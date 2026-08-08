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


/* ================= FIX SEQUENCES (BEAUTIFUL POPUP + LIVE TIMER & PROGRESS BAR) ================= */

const fixSequences = async () => {
  let showPassword = false;

  const { value: confirmed } = await Swal.fire({
    width: "380px",
    title: "🔐 Admin Authentication",
    html: `
      <div style="text-align:left; font-size:13px; font-family: system-ui, -apple-system, sans-serif;">
        
        <!-- Action Info Card -->
        <div style="
          background:#fff7ed;
          border:1px solid #ffedd5;
          border-radius:10px;
          padding:12px;
          margin-bottom:14px;
        ">
          <div style="font-weight:700; color:#ea580c; font-size:13px; display:flex; align-items:center; gap:6px;">
            <span>🔧 Sequence Realignment</span>
          </div>
          <div style="margin-top:4px; color:#9a3412; font-size:11px; line-height:1.4;">
            This action will recalculate and fix auto-increment primary key IDs across all database tables.
          </div>
        </div>

        <label style="font-weight:600; color:#334155; font-size:12px; display:block; margin-bottom:6px;">
          Enter Admin Password
        </label>

        <!-- Compact Password Input -->
        <div style="position:relative;">
          <input
            id="swal-pass"
            type="password"
            class="swal2-input"
            placeholder="Enter password"
            style="width:100%; margin:0; height:40px; font-size:13px; border-radius:8px; padding-right:40px;"
          />

          <span
            id="togglePass"
            style="
              position:absolute;
              right:12px;
              top:50%;
              transform:translateY(-50%);
              cursor:pointer;
              font-size:15px;
              user-select:none;
            "
          >👁️</span>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "🚀 Run Fix",
    confirmButtonColor: "#ea580c",
    cancelButtonText: "Cancel",
    focusConfirm: false,
    preConfirm: () => {
      const input = document.getElementById("swal-pass").value;
      if (!input || !input.trim()) {
        Swal.showValidationMessage("Password required!");
        return false;
      }
      return input.trim();
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

  let progressInterval = null;

  try {
    // App Store Downloading Style Modal for Sequences Fix
    Swal.fire({
      title: "🔧 Fixing Database Sequences",
      html: `
        <div style="margin-top:15px; text-align: left; font-family: system-ui, -apple-system, sans-serif;">
          
          <!-- Progress Bar -->
          <div style="width:100%; height:12px; background:#e2e8f0; border-radius:10px; overflow:hidden; margin-bottom: 12px;">
            <div id="fixBar" style="width:0%; height:100%; background:linear-gradient(90deg, #ea580c, #f59e0b); transition:width 0.3s ease;"></div>
          </div>

          <!-- App Store Style Percentage & Live Counters -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <span id="fixPercent" style="font-weight:800; font-size:22px; color:#1e293b;">0%</span>
            
            <div style="text-align:right; font-size:12px; color:#64748b; line-height:1.4;">
              <div>⏱ Elapsed: <strong id="timeElapsed" style="color:#0f172a;">00:00</strong></div>
              <div>⏳ Remaining: <strong id="timeRemaining" style="color:#ea580c;">Calculating...</strong></div>
            </div>
          </div>

          <!-- Current Task Label -->
          <div style="background:#f8fafc; padding:10px 14px; border-radius:10px; font-size:13px; color:#334155; border:1px solid #e2e8f0; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
            <span style="display:inline-block; animation: spin 1s linear infinite;">🔄</span>
            <span id="fixStatus" style="font-weight:600;">Authenticating & Reading Schema...</span>
          </div>

          <!-- Stepper Checklist -->
          <div id="stepperContainer" style="font-size:12px; line-height: 2; color:#64748b;">
            <div id="step1" style="color:#ea580c; font-weight:bold;">⏳ Step 1: Scanning Database Tables & Sequences...</div>
            <div id="step2">⚪ Step 2: Calculating Maximum Primary Keys...</div>
            <div id="step3">⚪ Step 3: Syncing Auto-Increment Sequence IDs...</div>
            <div id="step4">⚪ Step 4: Verifying Database Integrity...</div>
          </div>
        </div>

        <style>
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    const formatMMSS = (totalSecs) => {
      const m = Math.floor(totalSecs / 60).toString().padStart(2, "0");
      const s = (totalSecs % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    };

    const updateProgressDOM = (pct, statusText, currentStep, elapsedSecs, remainingSecs) => {
      const bar = document.getElementById("fixBar");
      const txt = document.getElementById("fixPercent");
      const st = document.getElementById("fixStatus");
      const elapsedEl = document.getElementById("timeElapsed");
      const remainingEl = document.getElementById("timeRemaining");

      if (bar) bar.style.width = `${pct}%`;
      if (txt) txt.innerHTML = `${pct}%`;
      if (st) st.innerHTML = statusText;
      if (elapsedEl) elapsedEl.innerHTML = formatMMSS(elapsedSecs);

      if (remainingEl) {
        if (remainingSecs === null) {
          remainingEl.innerHTML = "Calculating...";
        } else if (remainingSecs <= 0) {
          remainingEl.innerHTML = "Finishing...";
        } else {
          remainingEl.innerHTML = formatMMSS(remainingSecs);
        }
      }

      for (let i = 1; i <= 4; i++) {
        const el = document.getElementById(`step${i}`);
        if (el) {
          if (i < currentStep) {
            el.innerHTML = el.innerHTML.replace(/[⏳⚪✅]/, "✅");
            el.style.color = "#16a34a";
            el.style.fontWeight = "normal";
          } else if (i === currentStep) {
            el.innerHTML = el.innerHTML.replace(/[⏳⚪✅]/, "⏳");
            el.style.color = "#ea580c";
            el.style.fontWeight = "bold";
          } else {
            el.style.color = "#94a3b8";
            el.style.fontWeight = "normal";
          }
        }
      }
    };

    // Live Progress Simulation
    let simulatedPct = 0;
    const startTime = Date.now();

    progressInterval = setInterval(() => {
      if (simulatedPct < 30) {
        simulatedPct += 5;
      } else if (simulatedPct >= 30 && simulatedPct < 75) {
        simulatedPct += 4;
      } else if (simulatedPct >= 75 && simulatedPct < 90) {
        simulatedPct += 2;
      }

      const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
      let remainingSecs = null;

      if (simulatedPct > 5) {
        const totalEstimatedSecs = (elapsedSecs / simulatedPct) * 100;
        remainingSecs = Math.max(0, Math.ceil(totalEstimatedSecs - elapsedSecs));
      }

      let step = 1;
      let statusMsg = "Scanning Tables & Sequences...";
      if (simulatedPct >= 30 && simulatedPct < 75) {
        step = 2;
        statusMsg = "Calculating Maximum Primary Keys...";
      } else if (simulatedPct >= 75) {
        step = 3;
        statusMsg = "Syncing Auto-Increment Sequence IDs...";
      }

      updateProgressDOM(simulatedPct, statusMsg, step, elapsedSecs, remainingSecs);
    }, 300);

    // Backend Request
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/backup/fix-sequences`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ password: confirmed })
      }
    );

    const data = await res.json();

    if (progressInterval) clearInterval(progressInterval);

    if (!data.success) {
      Swal.close();
      return Swal.fire("❌ Error", data.error || "Something went wrong", "error");
    }

    // Completion Steps
    const totalElapsedSecs = Math.floor((Date.now() - startTime) / 1000);
    updateProgressDOM(98, "Verifying Database Integrity...", 4, totalElapsedSecs, 0);
    await new Promise((r) => setTimeout(r, 400));
    updateProgressDOM(100, "Done!", 5, totalElapsedSecs, 0);
    await new Promise((r) => setTimeout(r, 300));

    Swal.close();

    Swal.fire("✅ Success", "All sequences fixed successfully", "success");

  } catch (err) {
    if (progressInterval) clearInterval(progressInterval);
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

/* ================= RESTORE (APP STORE STYLE LIVE TIMER & ETA) ================= */

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
    // 1. App Store Downloading Style Modal
    Swal.fire({
      title: "🔄 Restoring Database",
      html: `
        <div style="margin-top:15px; text-align: left; font-family: system-ui, -apple-system, sans-serif;">
          
          <!-- Progress Bar -->
          <div style="width:100%; height:12px; background:#e2e8f0; border-radius:10px; overflow:hidden; margin-bottom: 12px;">
            <div id="restoreBar" style="width:0%; height:100%; background:linear-gradient(90deg, #2563eb, #3b82f6); transition:width 0.3s ease;"></div>
          </div>

          <!-- App Store Style Percentage & Live Counters -->
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:15px;">
            <span id="restorePercent" style="font-weight:800; font-size:22px; color:#1e293b;">0%</span>
            
            <div style="text-align:right; font-size:12px; color:#64748b; line-height:1.4;">
              <div>⏱ Elapsed: <strong id="timeElapsed" style="color:#0f172a;">00:00</strong></div>
              <div>⏳ Remaining: <strong id="timeRemaining" style="color:#2563eb;">Calculating...</strong></div>
            </div>
          </div>

          <!-- Current Task Label -->
          <div style="background:#f8fafc; padding:10px 14px; border-radius:10px; font-size:13px; color:#334155; border:1px solid #e2e8f0; margin-bottom:15px; display:flex; align-items:center; gap:8px;">
            <span id="restoreSpinner" style="display:inline-block; animation: spin 1s linear infinite;">🔄</span>
            <span id="restoreStatus" style="font-weight:600;">Initiating process...</span>
          </div>

          <!-- Stepper Checklist -->
          <div id="stepperContainer" style="font-size:12px; line-height: 2; color:#64748b;">
            <div id="step1" style="color:#2563eb; font-weight:bold;">⏳ Step 1: Reading Backup File...</div>
            <div id="step2">⚪ Step 2: Extracting & Verifying Structures...</div>
            <div id="step3">⚪ Step 3: Purging Live Records & Overwriting Tables...</div>
            <div id="step4">⚪ Step 4: Finalizing Sequences & Triggers...</div>
          </div>
        </div>

        <style>
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    // Seconds ko MM:SS format me convert karne ke liye helper
    const formatMMSS = (totalSecs) => {
      const m = Math.floor(totalSecs / 60).toString().padStart(2, "0");
      const s = (totalSecs % 60).toString().padStart(2, "0");
      return `${m}:${s}`;
    };

    // DOM Updates Handler
    const updateProgressDOM = (pct, statusText, currentStep, elapsedSecs, remainingSecs) => {
      const bar = document.getElementById("restoreBar");
      const txt = document.getElementById("restorePercent");
      const st = document.getElementById("restoreStatus");
      const elapsedEl = document.getElementById("timeElapsed");
      const remainingEl = document.getElementById("timeRemaining");

      if (bar) bar.style.width = `${pct}%`;
      if (txt) txt.innerHTML = `${pct}%`;
      if (st) st.innerHTML = statusText;
      if (elapsedEl) elapsedEl.innerHTML = formatMMSS(elapsedSecs);
      
      if (remainingEl) {
        if (remainingSecs === null) {
          remainingEl.innerHTML = "Calculating...";
        } else if (remainingSecs <= 0) {
          remainingEl.innerHTML = "Finishing...";
        } else {
          remainingEl.innerHTML = formatMMSS(remainingSecs);
        }
      }

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

    // Timer logic variables
    let simulatedPct = 0;
    const startTime = Date.now();

    progressInterval = setInterval(() => {
      // Dynamic speed simulation
      if (simulatedPct < 25) {
        simulatedPct += 5;
      } else if (simulatedPct >= 25 && simulatedPct < 70) {
        simulatedPct += 3;
      } else if (simulatedPct >= 70 && simulatedPct < 90) {
        simulatedPct += 2;
      }

      // Calculations
      const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
      
      let remainingSecs = null;
      if (simulatedPct > 5) {
        const totalEstimatedSecs = (elapsedSecs / simulatedPct) * 100;
        remainingSecs = Math.max(0, Math.ceil(totalEstimatedSecs - elapsedSecs));
      }

      let step = 1;
      let statusMsg = "Reading Backup File...";
      if (simulatedPct >= 25 && simulatedPct < 70) {
        step = 2;
        statusMsg = "Extracting & verifying structures...";
      } else if (simulatedPct >= 70) {
        step = 3;
        statusMsg = "Purging live records & overwriting...";
      }

      updateProgressDOM(simulatedPct, statusMsg, step, elapsedSecs, remainingSecs);
    }, 400);

    // REST Call Backend Engine
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

    if (progressInterval) clearInterval(progressInterval);

    if (!res.ok || !data.success) {
      Swal.close();
      return Swal.fire("Error", data.error || "Restore failed / Wrong password", "error");
    }

    // Final Completion Step
    const totalElapsedSecs = Math.floor((Date.now() - startTime) / 1000);
    updateProgressDOM(98, "Finalizing sequences & triggers...", 4, totalElapsedSecs, 0);
    await new Promise((r) => setTimeout(r, 500));
    updateProgressDOM(100, "Done!", 5, totalElapsedSecs, 0);
    await new Promise((r) => setTimeout(r, 300));

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
