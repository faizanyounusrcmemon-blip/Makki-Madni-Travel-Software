import React, { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";

export default function UploadRestoreCard() {
  const [zipFile, setZipFile] = useState(null);
  const [zipSingleFile, setZipSingleFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);

  const [zipTable, setZipTable] = useState("");
  const [csvTable, setCsvTable] = useState("");

  const TABLES = [
    "banks",
    "bookings",
    "expense_ledger",
    "hotels",
    "ticketing",
    "visa",
    "card",
    "transport",
    "customers",
    "users",
    "bank_transactions",
    "cash_transactions",
    "customer_payments",
    "purchase_payments",
    "supplier_payments",
    "suppliers",
    "ziyarat",
    "archive_snapshots",
    "archive_balances",
    "archive_profit_monthly",
    "archive_logs",
    "authority_settings",
    "system_passwords",
    "activity_logs",
  ];

  /* ================= UPLOAD REQUEST WITH TERMINAL, STEPS & TABLE QTY COUNTER ================= */
  const uploadRequest = async (
    url,
    fileField,
    file,
    table = null,
    title = "Restore"
  ) => {
    if (!file) {
      return Swal.fire("Error", "Please select a file", "error");
    }

    const password = await askPassword(title, file);
    if (!password) return;

    const fd = new FormData();
    fd.append(fileField, file);
    fd.append("password", password);

    if (table) {
      fd.append("table", table);
    }

    let progressInterval = null;
    let timerInterval = null;

    try {
      Swal.fire({
        title: "🔄 External Database Engine",
        width: "750px",
        html: `
          <div style="display: flex; gap: 16px; margin-top: 15px; text-align: left; font-family: system-ui, -apple-system, sans-serif;">
            
            <!-- LEFT SIDE: TERMINAL / CMD STYLE LOG -->
            <div style="flex: 1.2; background: #000; color: #00ff00; padding: 12px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 11px; height: 230px; overflow-y: auto; display: flex; flex-direction: column; gap: 3px; border: 1px solid #333;" id="uploadLogContainer">
              <div style="color: #888; border-bottom: 1px solid #333; padding-bottom: 4px; margin-bottom: 4px; font-weight: bold;">C:\\DATABASE_UPLOAD_ENGINE></div>
              <div style="color: #38bdf8;">[INIT] Preparing upload stream for: ${file.name}</div>
            </div>

            <!-- RIGHT SIDE: PROGRESS & METRICS -->
            <div style="flex: 0.8; display: flex; flex-direction: column; justify-content: space-between;">
              <div>
                <!-- Progress Bar -->
                <div style="width:100%; height:12px; background:#e2e8f0; border-radius:10px; overflow:hidden; margin-bottom: 10px;">
                  <div id="uploadBar" style="width:5%; height:100%; background:linear-gradient(90deg, #2563eb, #3b82f6); transition:width 0.3s ease;"></div>
                </div>

                <!-- Percentage & Timers -->
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                  <span id="uploadPercent" style="font-weight:800; font-size:20px; color:#1e293b;">0%</span>
                  
                  <div style="text-align:right; font-size:11px; color:#64748b; line-height:1.3;">
                    <div>⏱ Elapsed: <strong id="timeElapsed" style="color:#0f172a;">00:00</strong></div>
                    <div>⏳ Remaining: <strong id="timeRemaining" style="color:#2563eb;">Calculating...</strong></div>
                  </div>
                </div>

                <!-- Tables Count Qty Display -->
                <div style="font-size: 11px; color: #475569; font-weight: 600; margin-bottom: 8px; background: #f1f5f9; padding: 4px 8px; border-radius: 6px; display: flex; justify-content: space-between;">
                  <span>📊 Tables Qty:</span>
                  <span id="tableQtyCount" style="color: #2563eb;">0 / ${TABLES.length} Done</span>
                </div>

                <!-- Current Task Label -->
                <div style="background:#f8fafc; padding:8px 12px; border-radius:8px; font-size:12px; color:#334155; border:1px solid #e2e8f0; margin-bottom:10px; display:flex; align-items:center; gap:6px;">
                  <span id="uploadSpinner" style="display:inline-block; animation: spin 1s linear infinite;">🔄</span>
                  <span id="uploadStatus" style="font-weight:600;">Connecting...</span>
                </div>
              </div>

              <!-- Stepper Checklist -->
              <div id="stepperContainer" style="font-size:11px; line-height: 1.7; color:#64748b;">
                <div id="step1" style="color:#2563eb; font-weight:bold;">⏳ Step 1: Uploading stream data...</div>
                <div id="step2">⚪ Step 2: Extracting & Verifying Structures...</div>
                <div id="step3">⚪ Step 3: Purging Live Records & Overwriting Tables...</div>
                <div id="step4">⚪ Step 4: Finalizing Sequences & Triggers...</div>
              </div>
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

      const appendLog = (msg, color = "#00ff00") => {
        const logContainer = document.getElementById("uploadLogContainer");
        if (logContainer) {
          const div = document.createElement("div");
          div.style.color = color;
          div.innerHTML = msg;
          logContainer.appendChild(div);
          logContainer.scrollTop = logContainer.scrollHeight;
        }
      };

      const formatMMSS = (totalSecs) => {
        const m = Math.floor(totalSecs / 60).toString().padStart(2, "0");
        const s = (totalSecs % 60).toString().padStart(2, "0");
        return `${m}:${s}`;
      };

      const updateProgressDOM = (pct, statusText, currentStep, elapsedSecs, remainingSecs, tablesDone) => {
        const bar = document.getElementById("uploadBar");
        const txt = document.getElementById("uploadPercent");
        const st = document.getElementById("uploadStatus");
        const elapsedEl = document.getElementById("timeElapsed");
        const remainingEl = document.getElementById("timeRemaining");
        const tableQtyEl = document.getElementById("tableQtyCount");

        if (bar) bar.style.width = `${pct}%`;
        if (txt) txt.innerHTML = `${pct}%`;
        if (st) st.innerHTML = statusText;
        if (elapsedEl) elapsedEl.innerHTML = formatMMSS(elapsedSecs);
        if (tableQtyEl) tableQtyEl.innerText = `${tablesDone} / ${TABLES.length} Done`;

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

      const startTime = Date.now();
      let currentPct = 0;
      let tablesDoneCount = 0;

      // Live Timer Engine
      timerInterval = setInterval(() => {
        const elapsedSecs = Math.floor((Date.now() - startTime) / 1000);
        let remainingSecs = null;

        if (currentPct > 5) {
          const totalEstimatedSecs = (elapsedSecs / currentPct) * 100;
          remainingSecs = Math.max(0, Math.ceil(totalEstimatedSecs - elapsedSecs));
        }

        let step = 1;
        let statusMsg = "Uploading stream data...";
        if (currentPct >= 20 && currentPct < 50) {
          step = 2;
          statusMsg = "Extracting & verifying structures...";
        } else if (currentPct >= 50 && currentPct < 90) {
          step = 3;
          statusMsg = "Purging records & overwriting tables...";
        } else if (currentPct >= 90) {
          step = 4;
          statusMsg = "Finalizing sequences & triggers...";
        }

        updateProgressDOM(currentPct, statusMsg, step, elapsedSecs, remainingSecs, tablesDoneCount);
      }, 300);

      appendLog("[INFO] Uploading file packets to server...", "#fbbf24");

      // Axios Call with Upload Progress & Simulated Table Logs
      const res = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}${url}`,
        fd,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (evt) => {
            if (!evt.total) return;
            const percent = Math.round((evt.loaded * 100) / evt.total);

            currentPct = Math.min(Math.round((percent * 30) / 100), 30);

            if (percent >= 100 && !progressInterval) {
              appendLog("[SUCCESS] File upload complete. Processing database...", "#38bdf8");
              
              let tableIdx = 0;
              progressInterval = setInterval(() => {
                if (currentPct < 95) {
                  currentPct += 2;
                  
                  // Live Table-by-Table Terminal Logs & Qty Counter
                  if (tableIdx < TABLES.length && currentPct % 2 === 0) {
                    appendLog(`> RESTORING TABLE: ${TABLES[tableIdx]}`, "#fbbf24");
                    tablesDoneCount = tableIdx + 1;
                    tableIdx++;
                  }
                }
              }, 180);
            }
          },
        }
      );

      if (progressInterval) clearInterval(progressInterval);
      if (timerInterval) clearInterval(timerInterval);

      if (!res.data.success) {
        appendLog("FAILED: " + (res.data.error || "Operation failed"), "#f43f5e");
        await new Promise((r) => setTimeout(r, 1500));
        Swal.close();
        return Swal.fire("Error", res.data.error || "Restore failed", "error");
      }

      currentPct = 100;
      tablesDoneCount = TABLES.length;
      appendLog("====================================", "#ffffff");
      appendLog("ALL TABLES RESTORED SUCCESSFULLY!", "#00ff00");
      const totalElapsedSecs = Math.floor((Date.now() - startTime) / 1000);
      updateProgressDOM(100, "Done!", 4, totalElapsedSecs, 0, TABLES.length);

      await new Promise((r) => setTimeout(r, 800));
      Swal.close();

      Swal.fire({
        icon: "success",
        title: "Restore Completed",
        html: `<div style="font-size:14px">External backup data successfully injected into database.</div>`,
        confirmButtonColor: "#16a34a",
      });

    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
      if (timerInterval) clearInterval(timerInterval);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Restore Failed",
        text: err?.response?.data?.error || err.message || "Unknown Error",
      });
    }
  };

  const askPassword = async (title, fileObj) => {
    let show = false;

    const { value: password } = await Swal.fire({
      width: "380px",
      title,
      html: `
        <div style="text-align:left;font-size:13px">
          <div style="
            background:#f8fafc;
            border:1px solid #e2e8f0;
            border-radius:10px;
            padding:10px;
            margin-bottom:12px;
          ">
            <div style="font-weight:700;color:#2563eb">📁 Selected File</div>
            <div style="margin-top:5px; font-size:12px; word-break:break-all;">${fileObj?.name || "-"}</div>
            <div style="margin-top:5px; color:#64748b; font-size:11px;">
              ${fileObj?.size ? (fileObj.size / 1024 / 1024).toFixed(2) + " MB" : "-"}
            </div>
          </div>
          <div style="position:relative">
            <input id="swal-pass" type="password" class="swal2-input" placeholder="Enter Password" style="width:100%; margin:0; height:42px; font-size:13px;" />
            <span id="toggle-pass" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); cursor:pointer; font-size:16px;">👁</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Restore",
      cancelButtonText: "Cancel",
      focusConfirm: false,
      preConfirm: () => {
        const val = document.getElementById("swal-pass").value;
        if (!val || !val.trim()) {
          Swal.showValidationMessage("Password required");
          return false;
        }
        return val.trim();
      },
      didOpen: () => {
        const input = document.getElementById("swal-pass");
        const toggle = document.getElementById("toggle-pass");
        toggle.addEventListener("click", () => {
          show = !show;
          input.type = show ? "text" : "password";
          toggle.textContent = show ? "🙈" : "👁";
        });
      },
    });

    return password;
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: "1200px", margin: "auto" }}>
      {/* HEADER */}
      <div
        className="mb-4 p-4"
        style={{
          borderRadius: "20px",
          background: "linear-gradient(135deg,#0f172a,#1e3a8a,#2563eb)",
          color: "#fff",
          boxShadow: "0 15px 40px rgba(37,99,235,.25)",
        }}
      >
        <h2 className="fw-bold mb-1">🔄 External Backup Restore Center</h2>
        <div style={{ opacity: 0.9, fontSize: 14 }}>
          Restore complete backups, single tables, and CSV data securely.
        </div>
      </div>

      <div className="row g-4">
        {/* FULL RESTORE */}
        <div className="col-lg-4">
          <div className="restore-card h-100">
            <div className="restore-top success">
              <span>📦</span>
              <div>
                <h5>Full Backup Restore</h5>
                <small>Restore Entire Database</small>
              </div>
            </div>

            <div className="modern-upload">
              <div className="upload-icon">📦</div>
              <div className="fw-bold mb-2">{zipFile ? zipFile.name : "No ZIP File Selected"}</div>
              <label className="browse-btn">
                📁 Choose ZIP File
                <input type="file" hidden accept=".zip" onChange={(e) => setZipFile(e.target.files[0])} />
              </label>
              <small className="mt-2 d-block">Click button to browse ZIP backup</small>
            </div>

            <button
              className="btn btn-success w-100 mt-3 py-2 fw-bold"
              onClick={() =>
                uploadRequest(
                  "/api/backup/restore/upload/full",
                  "backup",
                  zipFile,
                  null,
                  "ZIP Full Restore"
                )
              }
            >
              Restore Complete Backup
            </button>
          </div>
        </div>

        {/* ZIP TABLE */}
        <div className="col-lg-4">
          <div className="restore-card h-100">
            <div className="restore-top primary">
              <span>🗂️</span>
              <div>
                <h5>ZIP Table Restore</h5>
                <small>Restore Single Table</small>
              </div>
            </div>

            <div className="modern-upload">
              <div className="upload-icon">🗂️</div>
              <div className="fw-bold mb-2">{zipSingleFile ? zipSingleFile.name : "No ZIP File Selected"}</div>
              <label className="browse-btn">
                📁 Choose ZIP File
                <input type="file" hidden accept=".zip" onChange={(e) => setZipSingleFile(e.target.files[0])} />
              </label>
              <small className="mt-2 d-block">Click button to browse ZIP backup</small>
            </div>

            <select className="form-select mt-3" value={zipTable} onChange={(e) => setZipTable(e.target.value)}>
              <option value="">Select Table</option>
              {TABLES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              className="btn btn-primary w-100 mt-3 py-2 fw-bold"
              onClick={() => {
                if (!zipTable) {
                  return Swal.fire("Error", "Select a table", "error");
                }
                uploadRequest(
                  "/api/backup/restore/upload/table",
                  "backup",
                  zipSingleFile,
                  zipTable,
                  "ZIP Single Table Restore"
                );
              }}
            >
              Restore Selected Table
            </button>
          </div>
        </div>

        {/* CSV */}
        <div className="col-lg-4">
          <div className="restore-card h-100">
            <div className="restore-top danger">
              <span>📄</span>
              <div>
                <h5>CSV Restore</h5>
                <small>Import Table Data</small>
              </div>
            </div>

            <div className="modern-upload">
              <div className="upload-icon">📄</div>
              <div className="fw-bold mb-2">{csvFile ? csvFile.name : "No CSV File Selected"}</div>
              <label className="browse-btn">
                📁 Choose CSV File
                <input type="file" hidden accept=".csv" onChange={(e) => setCsvFile(e.target.files[0])} />
              </label>
              <small className="mt-2 d-block">Click button to browse CSV backup</small>
            </div>

            <select className="form-select mt-3" value={csvTable} onChange={(e) => setCsvTable(e.target.value)}>
              <option value="">Select Table</option>
              {TABLES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <button
              className="btn btn-danger w-100 mt-3 py-2 fw-bold"
              onClick={() => {
                if (!csvTable) {
                  return Swal.fire("Error", "Select a table", "error");
                }
                uploadRequest(
                  "/api/backup/restore/csv",
                  "csv",
                  csvFile,
                  csvTable,
                  "CSV Restore"
                );
              }}
            >
              Restore CSV Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}