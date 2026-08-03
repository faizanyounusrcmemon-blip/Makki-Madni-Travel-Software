import React, { useState, useEffect } from "react";
import API from "../api";
import Swal from "sweetalert2";

// Helper Function for Date Format: DD/MMM/YYYY (e.g. 01/Jul/2026)
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

// 🌟 REUSABLE PROGRESS BAR MODAL FOR ALL ACTIONS
const showProgressModal = (title, barColor = "#2563eb", statusText = "Processing request...") => {
  let percent = 0;
  
  Swal.fire({
    title: title,
    background: "#1e293b",
    color: "#f8fafc",
    html: `
      <div style="margin-top:15px">
        <div style="width:100%; height:20px; background:#0f172a; border-radius:50px; overflow:hidden; border:1px solid #334155;">
          <div id="swalProgressBar" style="width:0%; height:100%; background:${barColor}; transition:width .2s ease;"></div>
        </div>
        <div id="swalProgressPercent" style="margin-top:10px; font-size:16px; font-weight:800; color:#38bdf8;">0%</div>
        <div style="margin-top:5px; font-size:12px; color:#94a3b8;">${statusText}</div>
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
    <div style={styles.dashboardCard}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "16px" }}>
        <div style={{ flex: 1, minWidth: "280px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <span style={styles.dashboardTitle}>
              DATABASE LIVE CONNECTION {checkingTables && "⏳ Scanning..."}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", margin: "8px 0" }}>
            <span style={{ fontSize: "14px", color: "#94a3b8" }}>
              Live database transactions start date:
            </span>
            <span style={styles.dateBadge}>
              📅 {liveStartDate}
            </span>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "12px", alignItems: "center" }}>
            <small style={{ color: "#64748b", fontWeight: "600", fontSize: "11px", marginRight: "4px" }}>Checked Tables:</small>
            {targetTables.map((tbl) => (
              <span key={tbl} style={styles.tableChip}>
                {tbl}
              </span>
            ))}
          </div>
        </div>

        <div style={styles.tipBox}>
          💡 <strong style={{ color: "#f8fafc" }}>Important Tip:</strong> Snapshot create karte waqt <span style={{ color: "#38bdf8", fontWeight: "600" }}>"START DATE"</span> yahan se dekh kar set karein.
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
      title: `<div style="font-size:15px; font-weight:700; color:#f8fafc; line-height:1.4;">
                🔐 Action Verification<br>
                <span style="font-size:12px; color:#38bdf8; font-weight:600;">[ ${actionName} ]</span>
              </div>`,
      html: `
        <div style="position:relative; margin-top:12px;">
          <input id="archive-password" type="password" placeholder="Enter Password" 
            style="width:100%; padding:9px 38px 9px 12px; background:#0f172a; border:1px solid #334155; color:#f8fafc; border-radius:8px; font-size:13px; outline:none; box-sizing:border-box;" />
          <button id="toggle-password" type="button" 
            style="position:absolute; right:10px; top:50%; transform:translateY(-50%); border:none; background:none; cursor:pointer; font-size:15px; color:#94a3b8; padding:0; display:flex; align-items:center;">👁️</button>
        </div>
      `,
      width: 310,
      padding: "16px",
      background: "#1e293b",
      showCancelButton: true,
      confirmButtonText: "Confirm",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#334155",
      focusConfirm: false,
      didOpen: () => {
        const input = document.getElementById("archive-password");
        const btn = document.getElementById("toggle-password");
        
        if (input) input.focus();

        if (btn && input) {
          btn.addEventListener("click", () => {
            showPassword = !showPassword;
            input.type = showPassword ? "text" : "password";
            btn.innerHTML = showPassword ? "🙈" : "👁️";
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
        width: 300,
        background: "#1e293b",
        color: "#f8fafc"
      });
      return false;
    }

    return false;
  };

  // 1ST STEP PREVIEW (WITH PROGRESS BAR)
  const handlePreview = async () => {
    if (!from || !to) {
      return Swal.fire({ icon: "error", title: "Error", text: "Date range required", background: "#1e293b", color: "#f8fafc" });
    }

    const prog = showProgressModal("🔍 Generating Preview...", "#334155", "Fetching operational stats from live db...");

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
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.error || err.message, background: "#1e293b", color: "#f8fafc" });
    } finally {
      setLoading(false);
    }
  };

  // 2ND STEP SNAPSHOT (WITH PROGRESS BAR)
  const handleSnapshot = async () => {
    if (!(await checkPassword("Create Snapshot"))) return;
    if (!from || !to) {
      Swal.close();
      return Swal.fire({ icon: "error", title: "Date Required", text: "Please select dates", width: 320, background: "#1e293b", color: "#f8fafc" });
    }

    const confirm = await Swal.fire({
      title: "Create Snapshot?",
      text: "Archive snapshot will be created",
      icon: "warning",
      width: 320,
      showCancelButton: true,
      confirmButtonText: "Create",
      background: "#1e293b",
      color: "#f8fafc"
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
          suppliers: res.data.suppliers || prev?.suppliers || []
        }));

        await Swal.fire({
          icon: "success",
          title: "Snapshot Created ✅",
          width: 320,
          background: "#1e293b",
          color: "#f8fafc",
          html: `
            <div style="text-align:left; font-size: 14px; color:#cbd5e1;">
              <b>ID:</b> ${newSnapshotId}<br><br>
              <b>Customers:</b> ${res.data.customerCount || 0}<br>
              <b>Suppliers:</b> ${res.data.supplierCount || 0}<br>
              <b>Cash:</b> ${Number(res.data.opening_cash || 0).toLocaleString()}<br>
              <b>Bank:</b> ${Number(res.data.opening_bank || 0).toLocaleString()}<br>
              <b>Profit:</b> ${Number(res.data.opening_profit || 0).toLocaleString()}
            </div>
          `
        });
        loadList();
      }
    } catch (err) {
      prog.stop();
      Swal.close();
      Swal.fire({ icon: "error", title: "Server Error", text: err.response?.data?.error || err.message, width: 320, background: "#1e293b", color: "#f8fafc" });
    } finally {
      setLoading(false);
    }
  };

  // 3RD STEP DOWNLOAD ZIP (WITH REAL-TIME DOWNLOAD PROGRESS BAR)
  const handleBackup = async () => {
    if (!(await checkPassword("Download ZIP Backup"))) return;
    if (!from || !to) {
      Swal.close();
      return Swal.fire({ icon: "error", title: "Date Required", text: "Select dates", width: 320, background: "#1e293b", color: "#f8fafc" });
    }

    const confirm = await Swal.fire({
      title: "Download ZIP Backup?",
      text: "ZIP backup stream will start.",
      icon: "question",
      width: 320,
      showCancelButton: true,
      confirmButtonText: "Download",
      background: "#1e293b",
      color: "#f8fafc"
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
      Swal.fire({ icon: "error", title: "Streaming Error", text: err.message, width: 320, background: "#1e293b", color: "#f8fafc" });
    } finally {
      setLoading(false);
    }
  };

  // 4TH STEP DELETE LIVE DATA (WITH PROGRESS BAR)
  const handleDelete = async () => {
    if (!(await checkPassword("Delete Live Data"))) return;
    if (!from || !to) {
      return Swal.fire({ icon: "error", title: "Date Required", text: "Select dates first", width: 320, background: "#1e293b", color: "#f8fafc" });
    }

    const confirm = await Swal.fire({ 
      title: "Delete Live Data?", 
      text: "Warning: This will clear the live operational data. Make sure backup is created first!", 
      icon: "warning", 
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      confirmButtonColor: "#991b1b",
      background: "#1e293b",
      color: "#f8fafc"
    });
    if (!confirm.isConfirmed) return;

    const prog = showProgressModal("🔥 Wiping Live System Data...", "#dc2626", "Clearing transactions and archiving state...");

    try {
      const res = await API.post("/archive/delete", { 
        from_date: from, 
        to_date: to 
      });

      prog.finish();
      await new Promise(r => setTimeout(r, 300));
      Swal.close();
      
      if (res.data.success) {
        await Swal.fire({ icon: "success", title: "Wiped Successfully ✅", text: "Live data has been cleared.", width: 320, background: "#1e293b", color: "#f8fafc" });
        setPreview(null);
        loadList();
      } else {
        Swal.fire({ icon: "error", title: "Error", text: res.data.error || "Failed to delete live data", background: "#1e293b", color: "#f8fafc" });
      }
    } catch (err) {
      prog.stop();
      Swal.close();
      Swal.fire({ icon: "error", title: "Error", text: err.response?.data?.error || err.message, background: "#1e293b", color: "#f8fafc" });
    }
  };

  // RESTORE ZIP (WITH UPLOAD PROGRESS BAR)
  const handleRestore = async () => {
    if (!(await checkPassword("Restore ZIP Backup"))) return;
    const { value: file } = await Swal.fire({
      title: "📤 Upload Backup ZIP",
      input: "file",
      inputAttributes: { accept: ".zip" },
      showCancelButton: true,
      background: "#1e293b",
      color: "#f8fafc"
    });
    if (!file) return;

    const confirm = await Swal.fire({ 
      title: "⚠️ ARE YOU SURE?", 
      text: "This will restore data!", 
      icon: "warning", 
      showCancelButton: true,
      background: "#1e293b",
      color: "#f8fafc" 
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
        await Swal.fire({ icon: "success", title: "System Restored! ✅", width: 320, background: "#1e293b", color: "#f8fafc" });
        loadList();
      }
    } catch (err) {
      prog.stop();
      Swal.close();
      Swal.fire({ icon: "error", title: "Server Error", text: err.message, width: 320, background: "#1e293b", color: "#f8fafc" });
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
      Swal.fire({ icon: "error", title: "Error", text: "Failed to fetch archive view data", background: "#1e293b", color: "#f8fafc" });
    }
  };

  // TABLE PULL ZIP (WITH DOWNLOAD PROGRESS BAR)
  const handleDownload = async (id) => {
    if (!(await checkPassword(`Pull ZIP Stream #${id}`))) return;
    const targetItem = list.find(item => item.id === id);
    if (!targetItem) return Swal.fire({ icon: "error", title: "Error", text: "Snapshot not found", background: "#1e293b", color: "#f8fafc" });

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
      Swal.fire({ icon: "error", title: "Download Failed", text: err.message, width: 320, background: "#1e293b", color: "#f8fafc" });
    }
  };

  return (
    <div style={styles.container}>
      {/* Header Bar */}
      <div style={styles.headerBar}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", letterSpacing: "0.5px", color: "#f8fafc" }}>
            ARCHIVE CONTROL CENTER
          </h2>
          <small style={{ color: "#94a3b8", fontSize: "12px" }}>Manage system snapshots, backups, and live data archives</small>
        </div>
        <button onClick={() => onNavigate("dashboard")} style={styles.btnBack}>
          ← Back to Main
        </button>
      </div>

      {/* Embedded Dashboard Component */}
      <ArchiveDashboard />

      {/* Controls / Inputs Section */}
      <div style={styles.cardMain}>
        <div style={styles.row}>
          {/* START DATE */}
          <div style={{ flex: 1 }}>
            <label style={styles.inputLabel}>START DATE</label>
            <input 
              type="date" 
              value={from} 
              onChange={(e) => setFrom(e.target.value)} 
              style={styles.inputField} 
            />
            {/* Date Preview Badge */}
            <div style={styles.datePreviewBadge}>
              {from ? formatCustomDate(from) : "DD/MMM/YYYY"}
            </div>
          </div>

          {/* END DATE */}
          <div style={{ flex: 1 }}>
            <label style={styles.inputLabel}>END DATE</label>
            <input 
              type="date" 
              value={to} 
              onChange={(e) => setTo(e.target.value)} 
              style={styles.inputField} 
            />
            {/* Date Preview Badge */}
            <div style={styles.datePreviewBadge}>
              {to ? formatCustomDate(to) : "DD/MMM/YYYY"}
            </div>
          </div>
        </div>

        {/* Action Buttons Sequence */}
        <div style={styles.buttonRow}>
          <button style={styles.btnSecondary} onClick={handlePreview}>🔍 1st Step Preview</button>
          <button style={styles.btnPrimary} onClick={handleSnapshot}>💾 2nd Snapshot</button>
          <button style={styles.btnPrimary} onClick={handleBackup}>📦 3rd Download ZIP</button>
          <button style={styles.btnDanger} onClick={handleDelete}>🔥 4th Delete Live Data</button>
          <button style={styles.btnWarning} onClick={handleRestore}>📤 Restore ZIP</button>
        </div>
      </div>

      {/* Preview Section */}
      {preview && (
        <div style={styles.cardPreview}>
          <div style={styles.previewHeader}>
            <h3 style={{ color: "#f8fafc", fontSize: "16px", fontWeight: "700", margin: 0 }}>
              📊 LIVE SYSTEM DATA PREVIEW
            </h3>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              Range: {formatCustomDate(from)} to {formatCustomDate(to)}
            </span>
          </div>

          {/* Key Metrics */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "20px" }}>
            <div style={styles.summaryBlock}>
              <span style={styles.blockLabel}>Opening Cash</span>
              <h3 style={styles.blockValue}>PKR {Number(preview.opening_cash || 0).toLocaleString()}</h3>
            </div>
            <div style={styles.summaryBlock}>
              <span style={styles.blockLabel}>Opening Bank</span>
              <h3 style={styles.blockValue}>PKR {Number(preview.opening_bank || 0).toLocaleString()}</h3>
            </div>
            <div style={styles.summaryBlock}>
              <span style={styles.blockLabel}>Opening Profit</span>
              <h3 style={styles.blockValue}>PKR {Number(preview.opening_profit || 0).toLocaleString()}</h3>
            </div>
          </div>

          <div style={styles.tableGrid}>
            {/* CUSTOMERS PANEL */}
            <div style={styles.panelBox}>
              <div style={styles.panelHeader}>
                <span>👤 CUSTOMERS ({preview.customer_count || preview.customerCount || 0})</span>
              </div>
              <div style={styles.panelBody}>
                {preview.customers && preview.customers.length > 0 ? (
                  preview.customers.map((c, i) => (
                    <div key={i} style={styles.listItemSub}>
                      <div>
                        <b style={{ color: "#38bdf8", fontSize: "13px" }}>{c.customer_code || c.ref_no || "REG-CUST"}</b>
                        <span style={{ color: "#cbd5e1", marginLeft: "6px", fontSize: "13px" }}>{c.customer_name}</span>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>Type: {c.customer_type || 'Standard'}</div>
                      </div>
                      <b style={{ color: "#f8fafc", fontSize: "13px" }}>{Number(c.balance || 0).toLocaleString()}</b>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyText}>No Customers Data Found</div>
                )}
              </div>
            </div>

            {/* SUPPLIERS PANEL */}
            <div style={styles.panelBox}>
              <div style={styles.panelHeader}>
                <span>🏢 SUPPLIERS ({preview.supplier_count || preview.supplierCount || 0})</span>
              </div>
              <div style={styles.panelBody}>
                {preview.suppliers && preview.suppliers.length > 0 ? (
                  preview.suppliers.map((s, i) => (
                    <div key={i} style={styles.listItemSub}>
                      <div>
                        <b style={{ color: "#f8fafc", fontSize: "13px" }}>{s.supplier_name}</b>
                        <div style={{ fontSize: "11px", color: "#64748b" }}>Code: {s.supplier_code || 'N/A'}</div>
                      </div>
                      <b style={{ color: "#f8fafc", fontSize: "13px" }}>{Number(s.balance || 0).toLocaleString()}</b>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyText}>No Suppliers Data Found</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Historical Snapshots Logs */}
      <div style={styles.cardLogs}>
        <h3 style={{ color: "#f8fafc", margin: "0 0 16px 0", fontWeight: "700", fontSize: "16px" }}>
          📜 HISTORICAL SNAPSHOTS ENGINE
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {(list || []).map((item) => (
            <div key={item.id} style={styles.listItemLog}>
              <div>
                <span style={styles.badgeId}>ID: #{item.id}</span>
                <div style={{ marginTop: "6px", fontSize: "13px", color: "#cbd5e1" }}>
                  Timeline: <span style={{ color: "#38bdf8", fontWeight: "600" }}>{formatCustomDate(item.date_from)}</span> to <span style={{ color: "#38bdf8", fontWeight: "600" }}>{formatCustomDate(item.date_to)}</span>
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={styles.smallBtnSecondary} onClick={() => handleView(item.id)}>Inspect</button>
                <button style={styles.smallBtnPrimary} onClick={() => handleDownload(item.id)}>Pull ZIP</button>
              </div>
            </div>
          ))}
          {(!list || list.length === 0) && (
            <div style={{ textAlign: "center", padding: "20px", color: "#64748b", fontSize: "13px" }}>
              No snapshot history available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= SOBER & CLEAN STYLES ================= */
const styles = {
  container: {
    padding: "24px",
    background: "#0f172a",
    minHeight: "100vh",
    color: "#f8fafc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
  },
  headerBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "#1e293b",
    padding: "16px 20px",
    borderRadius: "12px",
    border: "1px solid #334155",
    marginBottom: "20px"
  },
  btnBack: {
    background: "#334155",
    color: "#f8fafc",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px"
  },
  dashboardCard: {
    background: "#1e293b",
    borderRadius: "12px",
    padding: "20px",
    border: "1px solid #334155",
    borderLeft: "4px solid #38bdf8",
    marginBottom: "20px"
  },
  dashboardTitle: {
    fontSize: "11px",
    fontWeight: "700",
    color: "#38bdf8",
    letterSpacing: "0.5px",
    textTransform: "uppercase"
  },
  dateBadge: {
    background: "#0f172a",
    color: "#f8fafc",
    padding: "4px 12px",
    borderRadius: "6px",
    border: "1px solid #334155",
    fontWeight: "600",
    fontSize: "14px"
  },
  tableChip: {
    fontSize: "10px",
    padding: "3px 8px",
    backgroundColor: "#0f172a",
    color: "#94a3b8",
    borderRadius: "4px",
    border: "1px solid #334155"
  },
  tipBox: {
    flex: "0 0 300px",
    background: "#0f172a",
    padding: "12px 14px",
    borderRadius: "8px",
    border: "1px solid #334155",
    fontSize: "12px",
    color: "#94a3b8",
    lineHeight: "1.4"
  },
  cardMain: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #334155",
    marginBottom: "20px"
  },
  row: {
    display: "flex",
    gap: "16px",
    flexWrap: "wrap"
  },
  inputLabel: {
    display: "block",
    fontSize: "11px",
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: "6px",
    letterSpacing: "0.5px"
  },
  inputField: {
    width: "100%",
    padding: "10px 12px",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "#f8fafc",
    outline: "none",
    fontSize: "13px"
  },
  buttonRow: {
    marginTop: "16px",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "10px"
  },
  btnPrimary: {
    padding: "10px 14px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer"
  },
  btnSecondary: {
    padding: "10px 14px",
    background: "#334155",
    color: "#f8fafc",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer"
  },
  btnDanger: {
    padding: "10px 14px",
    background: "#991b1b",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer"
  },
  btnWarning: {
    padding: "10px 14px",
    background: "#d97706",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "13px",
    cursor: "pointer"
  },
  cardPreview: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #334155",
    marginBottom: "20px"
  },
  previewHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #334155",
    paddingBottom: "10px",
    marginBottom: "16px"
  },
  summaryBlock: {
    background: "#0f172a",
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #334155",
    flex: 1,
    minWidth: "180px"
  },
  blockLabel: {
    display: "block",
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "600"
  },
  blockValue: {
    margin: "4px 0 0 0",
    fontSize: "18px",
    fontWeight: "700",
    color: "#f8fafc"
  },
  tableGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px"
  },
  panelBox: {
    background: "#0f172a",
    borderRadius: "8px",
    border: "1px solid #334155",
    overflow: "hidden"
  },
  panelHeader: {
    background: "#334155",
    padding: "10px 14px",
    fontWeight: "700",
    fontSize: "12px",
    color: "#f8fafc"
  },
  panelBody: {
    maxHeight: "220px",
    overflowY: "auto"
  },
  listItemSub: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 12px",
    borderBottom: "1px solid #1e293b"
  },
  emptyText: {
    padding: "20px",
    color: "#64748b",
    textAlign: "center",
    fontSize: "12px"
  },
  cardLogs: {
    background: "#1e293b",
    padding: "20px",
    borderRadius: "12px",
    border: "1px solid #334155"
  },
  listItemLog: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    background: "#0f172a",
    borderRadius: "8px",
    border: "1px solid #334155"
  },
  badgeId: {
    background: "#334155",
    color: "#f8fafc",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: "600"
  },
  smallBtnSecondary: {
    padding: "6px 12px",
    background: "#334155",
    color: "#f8fafc",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600"
  },
  datePreviewBadge: {
    marginTop: "6px",
    padding: "4px 8px",
    background: "#1e3a8a",
    color: "#93c5fd",
    borderRadius: "4px",
    fontSize: "12px",
    fontWeight: "700",
    display: "inline-block",
    border: "1px solid #1e40af"
  },
  smallBtnPrimary: {
    padding: "6px 12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "12px",
    fontWeight: "600"
  }
};