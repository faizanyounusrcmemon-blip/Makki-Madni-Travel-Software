import React, { useState, useEffect } from "react";
import API from "../api";
import Swal from "sweetalert2";

// Helper Function for Date Format: DD/MMM/YYYY
const formatCustomDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = String(date.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = months[date.getMonth()];
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

// 🌟 REUSABLE PROGRESS BAR MODAL
const showProgressModal = (title, barColor = "#2563eb", statusText = "Processing request...") => {
  let percent = 0;
  
  Swal.fire({
    title: title,
    background: "#ffffff",
    customClass: { popup: "rounded-4 border-0 shadow-lg" },
    html: `
      <div style="margin-top:15px">
        <div style="width:100%; height:18px; background:#e2e8f0; border-radius:50px; overflow:hidden;">
          <div id="swalProgressBar" style="width:0%; height:100%; background:${barColor}; transition:width .2s ease;"></div>
        </div>
        <div id="swalProgressPercent" style="margin-top:10px; font-size:15px; font-weight:800; color:#2563eb;">0%</div>
        <div style="margin-top:4px; font-size:12px; color:#64748b;">${statusText}</div>
      </div>
    `,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
  });

  const timer = setInterval(() => {
    if (percent >= 90) return;
    percent += 5;
    const bar = document.getElementById("swalProgressBar");
    const txt = document.getElementById("swalProgressPercent");
    if (bar) bar.style.width = `${percent}%`;
    if (txt) txt.innerHTML = `${percent}%`;
  }, 150);

  return {
    finish: () => {
      clearInterval(timer);
      const bar = document.getElementById("swalProgressBar");
      const txt = document.getElementById("swalProgressPercent");
      if (bar) bar.style.width = "100%";
      if (txt) txt.innerHTML = "100%";
    },
    updateProgress: (loadedPercent) => {
      const bar = document.getElementById("swalProgressBar");
      const txt = document.getElementById("swalProgressPercent");
      if (bar) bar.style.width = `${loadedPercent}%`;
      if (txt) txt.innerHTML = `${loadedPercent}%`;
    },
    stop: () => clearInterval(timer)
  };
};

/* ================= ARCHIVE DASHBOARD COMPONENT ================= */
function ArchiveDashboard() {
  const [liveStartDate, setLiveStartDate] = useState("Loading...");
  const [checkingTables, setCheckingTables] = useState(false);

  const targetTables = [
    "bookings", "hotels", "visa", "card", "ticketing", "transport", "ziyarat", "groups",
    "purchase_entries", "customer_payments", "supplier_payments", "expense_ledger",
    "bank_transactions", "cash_transactions"
  ];

  useEffect(() => {
    fetchLiveDatabaseStartDate();
  }, []);

  const fetchLiveDatabaseStartDate = async () => {
    try {
      setCheckingTables(true);
      const res = await API.get("/archive/live-data-start");

      if (res.data.success && res.data.first_date) {
        setLiveStartDate(formatCustomDate(res.data.first_date));
      } else {
        setLiveStartDate("No Data Found");
      }
    } catch (err) {
      console.error("Error fetching live start date:", err);
      setLiveStartDate("Error Loading");
    } finally {
      setCheckingTables(false);
    }
  };

  return (
    <div className="card border-0 shadow-sm mb-4 rounded-4 p-3 p-md-4" style={{ background: "#ffffff" }}>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill fw-bold" style={{ fontSize: "11px" }}>
              DATABASE LIVE CONNECTION {checkingTables && "⏳ Scanning..."}
            </span>
          </div>

          <div className="d-flex align-items-center gap-2 flex-wrap my-2">
            <span className="text-muted small">Live database transactions start date:</span>
            <span className="badge bg-light text-dark border px-3 py-2 rounded-3 fw-bold" style={{ fontSize: "13px" }}>
              📅 {liveStartDate}
            </span>
          </div>

          <div className="d-flex flex-wrap gap-1 align-items-center mt-2">
            <small className="text-muted fw-semibold me-1" style={{ fontSize: "11px" }}>Checked Tables:</small>
            {targetTables.map((tbl) => (
              <span key={tbl} className="badge bg-light text-secondary border px-2 py-1 rounded-2" style={{ fontSize: "10px" }}>
                {tbl}
              </span>
            ))}
          </div>
        </div>

        <div className="p-3 rounded-3 border bg-light text-dark" style={{ maxWidth: "340px", fontSize: "12px", lineHeight: "1.5" }}>
          💡 <strong className="text-primary">Important Tip:</strong> Snapshot create karte waqt <span className="fw-bold text-dark">"START DATE"</span> yahan se dekh kar set karein.
        </div>
      </div>
    </div>
  );
}

/* ================= ARCHIVE MANAGER MAIN COMPONENT ================= */
export default function ArchiveManager({ onNavigate }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [list, setList] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [snapshotId, setSnapshotId] = useState(null);

  const loadList = async () => {
    try {
      const res = await API.get("/archive/list");
      if (res.data.success) {
        setList(res.data.rows || res.data.data || []);
      }
    } catch (err) {
      console.error("Error loading list:", err);
    }
  };

  useEffect(() => {
    loadList();
  }, []);

  // 🔐 DYNAMIC PASSWORD CHECKER
  const checkPassword = async (actionName = "Archive Access") => {
    let showPassword = false;
    const result = await Swal.fire({
      width: "380px",
      padding: "1.25em",
      customClass: { popup: "rounded-4 border-0 shadow-lg" },
      html: `
        <div style="text-align:left; font-size:13px; line-height:1.6; color: #1e293b;">
          <div style="margin-bottom:12px; font-size:16px; font-weight:700; color:#2563eb; display:flex; align-items:center; gap:8px;">
            <span>🔐</span> Action Verification
          </div>
          <div style="background:#f8fafc; padding:8px 12px; border-radius:8px; border:1px solid #e2e8f0; margin-bottom:12px; font-weight:600; color:#0284c7;">
            [ ${actionName} ]
          </div>
          <div style="position:relative;">
            <input id="archive-password" type="password" class="swal2-input" 
              style="height:38px; font-size:13px; width:100%; box-sizing:border-box; padding-right:40px; margin:0; border-radius:8px;" 
              placeholder="Enter Access Password"/>
            <span id="toggle-password" style="
              position:absolute; right:12px; top:50%; transform:translateY(-50%);
              cursor:pointer; font-size:14px; user-select:none; color:#64748b;
            ">👁</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Confirm Action",
      confirmButtonColor: "#2563eb",
      focusConfirm: false,
      didOpen: () => {
        const input = document.getElementById("archive-password");
        const btn = document.getElementById("toggle-password");
        if (input) input.focus();
        if (btn && input) {
          btn.addEventListener("click", () => {
            showPassword = !showPassword;
            input.type = showPassword ? "text" : "password";
            btn.textContent = showPassword ? "🙈" : "👁";
          });
        }
      },
      preConfirm: () => {
        const val = document.getElementById("archive-password").value;
        if (!val) {
          Swal.showValidationMessage("Password is required");
        }
        return val;
      }
    });

    const password = result.value;
    if (!password) return false;

    try {
      const res = await API.post("/archive/verify-password", {
        key_name: "archive_management_pass",
        password: password
      });

      if (res.data.success) {
        return true;
      }
    } catch (err) {
      Swal.close();
      await Swal.fire({ 
        icon: "error", 
        title: "Wrong Password", 
        text: err.response?.data?.error || "Access Denied",
        customClass: { popup: "rounded-4 border-0 shadow-lg" }
      });
      return false;
    }

    return false;
  };

  // 1ST STEP PREVIEW
  const handlePreview = async () => {
    if (!from || !to) {
      return Swal.fire({ icon: "error", title: "Error", text: "Date range required" });
    }

    const prog = showProgressModal("🔍 Generating Preview...", "#2563eb", "Fetching operational stats from live db...");

    try {
      setLoading(true);
      const res = await API.post("/archive/preview", { date_from: from, date_to: to });
      prog.finish();
      await new Promise(r => setTimeout(r, 300));
      Swal.close();

      if (res.data.success) {
        setPreview(res.data);
      }
    } catch (err) {
      prog.stop();
      Swal.close();
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  // 2ND STEP SNAPSHOT
  const handleSnapshot = async () => {
    if (!(await checkPassword("Create Snapshot"))) return;
    if (!from || !to) {
      Swal.close();
      return Swal.fire({ icon: "error", title: "Date Required", text: "Please select dates" });
    }

    const confirm = await Swal.fire({
      title: "Create Snapshot?",
      text: "Archive snapshot will be created",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Create",
      confirmButtonColor: "#2563eb"
    });
    if (!confirm.isConfirmed) return;

    const prog = showProgressModal("💾 Creating Archive Snapshot...", "#2563eb", "Processing balances and calculating table records...");

    try {
      setLoading(true);
      const res = await API.post("/archive/snapshot", { from_date: from, to_date: to });
      prog.finish();
      await new Promise(r => setTimeout(r, 300));
      Swal.close();

      if (res.data.success) {
        const newSnapshotId = res.data.snapshotId;
        setSnapshotId(newSnapshotId);
        
        setPreview((prev) => ({
          ...(prev || {}),
          snapshotId: newSnapshotId,
          customer_count: res.data.customerCount || res.data.customer_count,
          supplier_count: res.data.supplierCount || res.data.supplier_count,
          opening_cash: res.data.opening_cash !== undefined ? res.data.opening_cash : prev?.opening_cash,
          opening_bank: res.data.opening_bank !== undefined ? res.data.opening_bank : prev?.opening_bank,
          opening_profit: res.data.opening_profit !== undefined ? res.data.opening_profit : prev?.opening_profit,
          customers: res.data.customers || prev?.customers || [],
          suppliers: res.data.suppliers || prev?.suppliers || [],
          bank_balances: res.data.bank_balances || prev?.bank_balances || []
        }));

        await Swal.fire({
          icon: "success",
          title: "Snapshot Created ✅",
          html: `
            <div style="text-align:left; font-size: 13px; color:#475569;">
              <b>ID:</b> ${newSnapshotId}<br><br>
              <b>Customers:</b> ${res.data.customerCount || 0}<br>
              <b>Suppliers:</b> ${res.data.supplierCount || 0}<br>
              <b>Cash:</b> PKR ${Number(res.data.opening_cash || 0).toLocaleString()}<br>
              <b>Bank:</b> PKR ${Number(res.data.opening_bank || 0).toLocaleString()}<br>
              <b>Profit:</b> PKR ${Number(res.data.opening_profit || 0).toLocaleString()}
            </div>
          `
        });
        loadList();
      }
    } catch (err) {
      prog.stop();
      Swal.close();
      Swal.fire({ icon: "error", title: "Server Error", text: err.response?.data?.error || err.message });
    } finally {
      setLoading(false);
    }
  };

  // 3RD STEP DOWNLOAD ZIP
  const handleBackup = async () => {
    if (!(await checkPassword("Download ZIP Backup"))) return;
    if (!from || !to) {
      Swal.close();
      return Swal.fire({ icon: "error", title: "Date Required", text: "Select dates" });
    }

    const confirm = await Swal.fire({
      title: "Download ZIP Backup?",
      text: "ZIP backup stream will start.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Download",
      confirmButtonColor: "#2563eb"
    });
    if (!confirm.isConfirmed) return;

    const prog = showProgressModal("📦 Streaming ZIP Backup...", "#0284c7", "Building ZIP file package from database...");

    try {
      setLoading(true);
      const response = await API.get(`/archive/download-stream?fromDate=${from}&toDate=${to}`, {
        responseType: "blob",
        onDownloadProgress: (e) => {
          if (e.total) {
            const p = Math.round((e.loaded * 100) / e.total);
            prog.updateProgress(p);
          }
        }
      });

      prog.finish();
      await new Promise(r => setTimeout(r, 300));
      Swal.close();

      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `archive-${from}-to-${to}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      loadList();
    } catch (err) {
      prog.stop();
      Swal.close();
      Swal.fire({ icon: "error", title: "Streaming Error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 4TH STEP DELETE LIVE DATA
  const handleDelete = async () => {
    if (!(await checkPassword("Delete Live Data"))) return;
    if (!from || !to) {
      return Swal.fire({ icon: "error", title: "Date Required", text: "Select dates first" });
    }

    const confirm = await Swal.fire({ 
      title: "Delete Live Data?", 
      text: "Warning: This will clear the live operational data. Make sure backup is created first!", 
      icon: "warning", 
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      confirmButtonColor: "#e11d48"
    });
    if (!confirm.isConfirmed) return;

    const prog = showProgressModal("🔥 Wiping Live System Data...", "#e11d48", "Clearing transactions and archiving state...");

    try {
      const res = await API.post("/archive/delete", { from_date: from, to_date: to });

      prog.finish();
      await new Promise(r => setTimeout(r, 300));
      Swal.close();
      
      if (res.data.success) {
        await Swal.fire({ icon: "success", title: "Wiped Successfully ✅", text: "Live data has been cleared." });
        setPreview(null);
        loadList();
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res.data.error || "Failed to delete live data" });
      }
    } catch (err) {
      prog.stop();
      Swal.close();
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.error || err.message });
    }
  };

  // RESTORE ZIP
  const handleRestore = async () => {
    if (!(await checkPassword("Restore ZIP Backup"))) return;
    const { value: file } = await Swal.fire({
      title: "Upload Backup ZIP",
      input: "file",
      inputAttributes: { accept: ".zip" },
      showCancelButton: true
    });
    if (!file) return;

    const confirm = await Swal.fire({ 
      title: "ARE YOU SURE?", 
      text: "This will restore system database state!", 
      icon: "warning", 
      showCancelButton: true,
      confirmButtonColor: "#d97706"
    });
    if (!confirm.isConfirmed) return;

    const prog = showProgressModal("📤 Restoring Database...", "#d97706", "Uploading ZIP and unzipping SQL database tables...");

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("backup_file", file);
      
      const res = await API.post("/archive/restore", formData, { 
        headers: { "Content-Type": "multipart/form-data" },
        onUploadProgress: (e) => {
          if (e.total) {
            const p = Math.round((e.loaded * 100) / e.total);
            prog.updateProgress(p);
          }
        }
      });

      prog.finish();
      await new Promise(r => setTimeout(r, 300));
      Swal.close();

      if (res.data.success) {
        await Swal.fire({ icon: "success", title: "System Restored! ✅" });
        loadList();
      }
    } catch (err) {
      prog.stop();
      Swal.close();
      Swal.fire({ icon: "error", title: "Server Error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    if (!(await checkPassword(`Inspect Snapshot #${id}`))) return;
    try {
      const res = await API.get(`/archive/view/${id}`);
      if (res.data.success) {
        setViewData(res.data);
        setSnapshotId(id);
      }
    } catch (err) {
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch archive view data" });
    }
  };

  // TABLE PULL ZIP
  const handleDownload = async (id) => {
    if (!(await checkPassword(`Pull ZIP Stream #${id}`))) return;
    const targetItem = list.find(item => item.id === id);
    if (!targetItem) return Swal.fire({ icon: "error", title: "Error", text: "Snapshot not found" });

    const prog = showProgressModal(`📥 Pulling ZIP #${id}...`, "#2563eb", "Fetching historical backup archive...");

    try {
      const res = await API.get(`/archive/download-stream?fromDate=${targetItem.date_from}&toDate=${targetItem.date_to}`, { 
        responseType: "blob",
        onDownloadProgress: (e) => {
          if (e.total) {
            const p = Math.round((e.loaded * 100) / e.total);
            prog.updateProgress(p);
          }
        }
      });

      prog.finish();
      await new Promise(r => setTimeout(r, 300));
      Swal.close();

      const blob = new Blob([res.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `archive-backup-#${id}-${targetItem.date_from}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      prog.stop();
      Swal.close();
      Swal.fire({ icon: "error", title: "Download Failed", text: err.message });
    }
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }} className="p-3 p-lg-4">
      
      {/* 🚀 APPLE/SAAS STYLE HEADER BANNER */}
      <div 
        className="card border-0 shadow-sm mb-4" 
        style={{ 
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", 
          borderRadius: "16px",
          color: "#ffffff" 
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3" style={{ background: "rgba(255, 255, 255, 0.2)" }}>🗄️</span>
              <h3 className="fw-bold mb-0">Archive Control Center</h3>
            </div>
            <p className="text-white-50 small mb-0 mt-1">Manage system snapshots, backups, and live data archives efficiently.</p>
          </div>

          <div>
            <button 
              className="btn btn-outline-light btn-sm rounded-pill px-3 py-2"
              onClick={() => onNavigate("dashboard")}
            >
              ← Back to Main
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Dashboard Component */}
      <ArchiveDashboard />

      {/* 🎛️ CONTROLS & DATE RANGE CARD */}
      <div className="card border-0 shadow-sm mb-4 rounded-4 p-3 p-md-4" style={{ background: "#ffffff" }}>
        <div className="row g-3 mb-3">
          <div className="col-md-6">
            <label className="form-label small fw-bold text-muted text-uppercase mb-1">Start Date</label>
            <input 
              type="date" 
              className="form-control border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              value={from} 
              onChange={(e) => setFrom(e.target.value)} 
            />
            <div className="mt-2">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-2 fw-bold" style={{ fontSize: "11px" }}>
                {from ? formatCustomDate(from) : "DD/MMM/YYYY"}
              </span>
            </div>
          </div>

          <div className="col-md-6">
            <label className="form-label small fw-bold text-muted text-uppercase mb-1">End Date</label>
            <input 
              type="date" 
              className="form-control border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
            />
            <div className="mt-2">
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-2 fw-bold" style={{ fontSize: "11px" }}>
                {to ? formatCustomDate(to) : "DD/MMM/YYYY"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="d-flex flex-wrap gap-2 pt-2 border-top">
          <button className="btn btn-light border fw-semibold rounded-pill px-3 py-2" style={{ fontSize: "12px" }} onClick={handlePreview}>
            🔍 1st Step Preview
          </button>
          <button className="btn btn-primary fw-semibold rounded-pill px-3 py-2 shadow-sm" style={{ fontSize: "12px" }} onClick={handleSnapshot}>
            💾 2nd Snapshot
          </button>
          <button className="btn btn-info text-white fw-semibold rounded-pill px-3 py-2 shadow-sm" style={{ fontSize: "12px" }} onClick={handleBackup}>
            📦 3rd Download ZIP
          </button>
          <button className="btn btn-danger fw-semibold rounded-pill px-3 py-2 shadow-sm" style={{ fontSize: "12px" }} onClick={handleDelete}>
            🔥 4th Delete Live Data
          </button>
          <button className="btn btn-warning text-white fw-semibold rounded-pill px-3 py-2 shadow-sm ms-auto" style={{ fontSize: "12px" }} onClick={handleRestore}>
            📤 Restore ZIP
          </button>
        </div>
      </div>

      {/* 📊 LIVE DATA PREVIEW PANEL */}
      {preview && (
        <div className="card border-0 shadow-sm mb-4 rounded-4 p-3 p-md-4" style={{ background: "#ffffff" }}>
          <div className="d-flex justify-content-between align-items-center pb-3 mb-3 border-bottom">
            <h5 className="fw-bold mb-0 text-dark">📊 Live System Data Preview</h5>
            <span className="text-muted small">Range: <strong>{formatCustomDate(from)}</strong> to <strong>{formatCustomDate(to)}</strong></span>
          </div>

          {/* Metric Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="p-3 rounded-4 border bg-light">
                <span className="text-muted small fw-semibold d-block mb-1">Opening Cash</span>
                <h4 className="fw-bold text-dark mb-0">PKR {Number(preview.opening_cash || 0).toLocaleString()}</h4>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 rounded-4 border bg-light">
                <span className="text-muted small fw-semibold d-block mb-1">Opening Bank (Total)</span>
                <h4 className="fw-bold text-primary mb-0">PKR {Number(preview.opening_bank || 0).toLocaleString()}</h4>
              </div>
            </div>
            <div className="col-md-4">
              <div className="p-3 rounded-4 border bg-light">
                <span className="text-muted small fw-semibold d-block mb-1">Opening Profit</span>
                <h4 className="fw-bold text-success mb-0">PKR {Number(preview.opening_profit || 0).toLocaleString()}</h4>
              </div>
            </div>
          </div>

          {/* Bank Accounts Breakdown */}
          {preview.bank_balances && preview.bank_balances.length > 0 && (
            <div className="mb-4">
              <h6 className="fw-bold text-primary mb-2" style={{ fontSize: "13px" }}>🏦 INDIVIDUAL BANK ACCOUNTS BREAKDOWN</h6>
              <div className="row g-2">
                {preview.bank_balances.map((b) => (
                  <div key={b.id} className="col-md-4 col-sm-6">
                    <div className="p-2 px-3 border rounded-3 bg-light">
                      <div className="fw-bold text-dark small">{b.bank_name}</div>
                      <div className="text-muted" style={{ fontSize: "11px" }}>{b.account_title} ({b.account_number || "N/A"})</div>
                      <div className="fw-bold text-primary mt-1" style={{ fontSize: "13px" }}>
                        PKR {Number(b.balance || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Customers and Suppliers Panels */}
          <div className="row g-3">
            <div className="col-md-6">
              <div className="border rounded-4 overflow-hidden">
                <div className="bg-light px-3 py-2 border-bottom fw-bold text-secondary" style={{ fontSize: "12px" }}>
                  👥 CUSTOMERS ({preview.customer_count || preview.customerCount || 0})
                </div>
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {preview.customers && preview.customers.length > 0 ? (
                    preview.customers.map((c, i) => (
                      <div key={i} className="d-flex justify-content-between align-items-center p-2 px-3 border-bottom" style={{ fontSize: "12px" }}>
                        <div>
                          <strong className="text-dark d-block">{c.customer_name}</strong>
                          <span className="text-muted" style={{ fontSize: "10px" }}>Code: {c.customer_code || "N/A"}</span>
                        </div>
                        <span className="fw-bold text-dark">PKR {Number(c.balance || 0).toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted small">No Customers Data Found</div>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-6">
              <div className="border rounded-4 overflow-hidden">
                <div className="bg-light px-3 py-2 border-bottom fw-bold text-secondary" style={{ fontSize: "12px" }}>
                  🏢 SUPPLIERS ({preview.supplier_count || preview.supplierCount || 0})
                </div>
                <div style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {preview.suppliers && preview.suppliers.length > 0 ? (
                    preview.suppliers.map((s, i) => (
                      <div key={i} className="d-flex justify-content-between align-items-center p-2 px-3 border-bottom" style={{ fontSize: "12px" }}>
                        <div>
                          <strong className="text-dark d-block">{s.supplier_name}</strong>
                          <span className="text-muted" style={{ fontSize: "10px" }}>Code: {s.supplier_code || "N/A"}</span>
                        </div>
                        <span className="fw-bold text-dark">PKR {Number(s.balance || 0).toLocaleString()}</span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 text-center text-muted small">No Suppliers Data Found</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📜 HISTORICAL SNAPSHOTS ENGINE */}
      <div className="card border-0 shadow-sm rounded-4 p-3 p-md-4" style={{ background: "#ffffff" }}>
        <h5 className="fw-bold mb-3 text-dark">📜 Historical Snapshots Engine</h5>
        <div className="d-flex flex-column gap-2">
          {(list || []).map((item) => (
            <div key={item.id} className="d-flex justify-content-between align-items-center p-3 border rounded-3 bg-light">
              <div>
                <span className="badge bg-secondary px-2 py-1 rounded-2" style={{ fontSize: "11px" }}>ID: #{item.id}</span>
                <div className="mt-1 small text-secondary">
                  Timeline: <strong className="text-dark">{formatCustomDate(item.date_from)}</strong> to <strong className="text-dark">{formatCustomDate(item.date_to)}</strong>
                </div>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-outline-secondary rounded-pill px-3 fw-semibold" style={{ fontSize: "11px" }} onClick={() => handleView(item.id)}>
                  Inspect
                </button>
                <button className="btn btn-sm btn-primary rounded-pill px-3 fw-semibold" style={{ fontSize: "11px" }} onClick={() => handleDownload(item.id)}>
                  Pull ZIP
                </button>
              </div>
            </div>
          ))}
          {(!list || list.length === 0) && (
            <div className="text-center py-4 text-muted small">
              No snapshot history available.
            </div>
          )}
        </div>
      </div>

    </div>
  );
}