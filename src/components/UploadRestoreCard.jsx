import React, { useState } from "react";
import Swal from "sweetalert2";
import axios from "axios";

export default function UploadRestoreCard() {
  const [zipFile, setZipFile] = useState(null);
  const [zipSingleFile, setZipSingleFile] = useState(null);
  const [csvFile, setCsvFile] = useState(null);

  const [zipTable, setZipTable] = useState("");
  const [csvTable, setCsvTable] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const TABLES = [
    "bookings",
    "expense_ledger",
    "hotels",
    "ticketing",
    "visa",
    "card",
    "transport",
    "customers",
    "purchase_entries",
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
  ];

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

    try {
      Swal.fire({
        title: "🔄 External Database Engine",
        html: `
          <div style="margin-top:15px; text-align: left;">
            <div style="width:100%; height:20px; background:#e5e7eb; border-radius:50px; overflow:hidden; margin-bottom: 15px;">
              <div id="uploadBar" style="width:0%; height:100%; background:linear-gradient(90deg, #3b82f6, #2563eb); transition:width 0.4s ease;"></div>
            </div>
            <div style="display:flex; justify-content:space-between; font-weight:800; font-size:16px; margin-bottom:15px;">
              <span>Status: <span id="uploadStatus" style="color:#2563eb;">Uploading dump file...</span></span>
              <span id="uploadPercent">0%</span>
            </div>
            <div id="stepperContainer" style="font-size:13px; line-height: 2;">
              <div id="step1" style="color:#2563eb; font-weight:bold;">⏳ Step 1: Sending Streams & Uploading Backup...</div>
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

      const updateProgressDOM = (pct, statusText, currentStep) => {
        const bar = document.getElementById("uploadBar");
        const txt = document.getElementById("uploadPercent");
        const st = document.getElementById("uploadStatus");
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

      // 1. Send network request with standard network stream tracking
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
            
            // Map actual upload progress from 0% to 40% range
            const scaledPercent = Math.min(Math.round((percent * 40) / 100), 40);
            updateProgressDOM(scaledPercent, "Uploading dump file...", 1);

            // Once network transmission hits 100%, trigger smooth step incrementers
            if (percent >= 100) {
              let simulatedPct = 40;
              if (!progressInterval) {
                progressInterval = setInterval(() => {
                  if (simulatedPct < 65) {
                    simulatedPct += 2;
                    updateProgressDOM(simulatedPct, "Extracting & verifying structures...", 2);
                  } else if (simulatedPct >= 65 && simulatedPct < 92) {
                    simulatedPct += 1;
                    updateProgressDOM(simulatedPct, "Purging records & overwriting...", 3);
                  }
                }, 250);
              }
            }
          },
        }
      );

      // Clean up the running loops
      if (progressInterval) clearInterval(progressInterval);

      if (!res.data.success) {
        Swal.close();
        return Swal.fire("Error", res.data.error || "Restore failed", "error");
      }

      // Final dynamic steps sync up instantly on server true response
      updateProgressDOM(96, "Finalizing sequences & triggers...", 4);
      await new Promise((r) => setTimeout(r, 600));
      updateProgressDOM(100, "Done!", 5);
      await new Promise((r) => setTimeout(r, 400));

      Swal.close();

      Swal.fire({
        icon: "success",
        title: "Restore Completed",
        html: `<div style="font-size:14px">External backup data successfully injected into database.</div>`,
        confirmButtonColor: "#16a34a",
      });

    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
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