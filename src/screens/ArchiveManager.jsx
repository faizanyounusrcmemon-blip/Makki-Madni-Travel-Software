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

  const checkPassword = async () => {
    let showPassword = false;
    const result = await Swal.fire({
      title: "🔐 Archive Access",
      html: `
        <div style="position:relative">
          <input id="archive-password" type="password" class="swal2-input" placeholder="Enter Password" style="margin:0;width:100%;padding-right:45px" />
          <button id="toggle-password" type="button" style="position:absolute;right:8px;top:8px;border:none;background:none;cursor:pointer;font-size:18px;">👁️</button>
        </div>
      `,
      width: 350,
      showCancelButton: true,
      confirmButtonText: "Login",
      focusConfirm: false,
      didOpen: () => {
        const input = document.getElementById("archive-password");
        const btn = document.getElementById("toggle-password");
        btn.addEventListener("click", () => {
          showPassword = !showPassword;
          input.type = showPassword ? "text" : "password";
          btn.innerHTML = showPassword ? "🙈" : "👁️";
        });
      },
      preConfirm: () => document.getElementById("archive-password").value
    });

    const password = result.value;
    if (!password) return false;
    if (password === "faizan") return true;

    Swal.close();
    await Swal.fire({ icon: "error", title: "Wrong Password", text: "Access Denied", width: 320 });
    return false;
  };

  const showLoading = (text = "Processing...") => {
    Swal.close();
    Swal.fire({
      title: text,
      html: `<div style="margin-top:15px; font-size:16px; color:#64748b;">⏳ Please wait...<br/>System is working</div>`,
      width: 320,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => { Swal.showLoading(); }
    });
  };

  // 1ST STEP PREVIEW
  const handlePreview = async () => {
    if (!from || !to) {
      return Swal.fire("Error", "Date range required", "error");
    }
    try {
      setLoading(true);
      const res = await API.post("/archive/preview", { date_from: from, date_to: to });
      if (res.data.success) {
        setPreview(res.data);
      }
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  // 2ND STEP SNAPSHOT
  const handleSnapshot = async () => {
    if (!(await checkPassword())) return;
    if (!from || !to) {
      Swal.close();
      return Swal.fire({ icon: "error", title: "Date Required", text: "Please select dates", width: 320 });
    }

    const confirm = await Swal.fire({
      title: "Create Snapshot?",
      text: "Archive snapshot will be created",
      icon: "warning",
      width: 320,
      showCancelButton: true,
      confirmButtonText: "Create"
    });
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      showLoading("Creating Snapshot...");
      const res = await API.post("/archive/snapshot", { from_date: from, to_date: to });
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

        Swal.close();
        await Swal.fire({
          icon: "success",
          title: "Snapshot Created",
          width: 320,
          html: `
            <div style="text-align:left; font-size: 14px;">
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
      Swal.close();
      Swal.fire({ icon: "error", title: "Server Error", text: err.response?.data?.error || err.message, width: 320 });
    } finally {
      setLoading(false);
    }
  };

  // 3RD STEP DOWNLOAD ZIP
  const handleBackup = async () => {
    if (!(await checkPassword())) return;
    if (!from || !to) {
      Swal.close();
      return Swal.fire({ icon: "error", title: "Date Required", text: "Select dates", width: 320 });
    }

    const confirm = await Swal.fire({
      title: "Download ZIP Backup?",
      text: "ZIP backup stream will start.",
      icon: "question",
      width: 320,
      showCancelButton: true,
      confirmButtonText: "Download"
    });
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      showLoading("Streaming ZIP Backup from Server...");
      const response = await API.get(`/archive/download-stream?fromDate=${from}&toDate=${to}`, { responseType: "blob" });
      const blob = new Blob([response.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `archive-${from}-to-${to}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      Swal.close();
      loadList();
    } catch (err) {
      Swal.close();
      Swal.fire({ icon: "error", title: "Streaming Error", text: err.message, width: 320 });
    } finally {
      setLoading(false);
    }
  };

  // 4TH STEP DELETE LIVE DATA
  const handleDelete = async () => {
    if (!(await checkPassword())) return;
    if (!from || !to) {
      return Swal.fire({ icon: "error", title: "Date Required", text: "Select dates first", width: 320 });
    }

    const confirm = await Swal.fire({ 
      title: "Delete Live Data?", 
      text: "Warning: This will clear the live operational data. Make sure backup is created first!", 
      icon: "warning", 
      showCancelButton: true,
      confirmButtonText: "Yes, Delete" 
    });
    if (!confirm.isConfirmed) return;

    try {
      showLoading("Wiping Live System Data...");
      const res = await API.post("/archive/delete", { 
        from_date: from, 
        to_date: to 
      });
      
      if (res.data.success) {
        Swal.close();
        await Swal.fire({ icon: "success", title: "Wiped Successfully", text: "Live data has been cleared.", width: 320 });
        setPreview(null);
        loadList();
      } else {
        Swal.close();
        Swal.fire("Error", res.data.error || "Failed to delete live data", "error");
      }
    } catch (err) {
      Swal.close();
      Swal.fire("Error", err.response?.data?.error || err.message, "error");
    }
  };

  const handleRestore = async () => {
    if (!(await checkPassword())) return;
    const { value: file } = await Swal.fire({
      title: "📤 Upload Backup ZIP",
      input: "file",
      inputAttributes: { accept: ".zip" },
      showCancelButton: true
    });
    if (!file) return;

    const confirm = await Swal.fire({ title: "⚠️ ARE YOU SURE?", text: "This will restore data!", icon: "warning", showCancelButton: true });
    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      showLoading("Restoring Database...");
      const formData = new FormData();
      formData.append("backup_file", file);
      const res = await API.post("/archive/restore", formData, { headers: { "Content-Type": "multipart/form-data" } });
      Swal.close();
      if (res.data.success) {
        await Swal.fire({ icon: "success", title: "System Restored!", width: 320 });
        loadList();
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ icon: "error", title: "Server Error", text: err.message, width: 320 });
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (id) => {
    if (!(await checkPassword())) return;
    try {
      const res = await API.get(`/archive/view/${id}`);
      if (res.data.success) {
        setViewData(res.data);
        setSnapshotId(id);
      }
    } catch (err) {
      Swal.fire("Error", "Failed to fetch archive view data", "error");
    }
  };

  const handleDownload = async (id) => {
    if (!(await checkPassword())) return;
    const targetItem = list.find(item => item.id === id);
    if (!targetItem) return Swal.fire("Error", "Snapshot not found", "error");

    try {
      showLoading("Pulling ZIP File Stream...");
      const res = await API.get(`/archive/download-stream?fromDate=${targetItem.date_from}&toDate=${targetItem.date_to}`, { responseType: "blob" });
      const blob = new Blob([res.data], { type: "application/zip" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `archive-backup-#${id}-${targetItem.date_from}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      Swal.close();
    } catch (err) {
      Swal.close();
      Swal.fire({ icon: "error", title: "Download Failed", text: err.message, width: 320 });
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
      {/* Date Preview Badge (Supplier Ledger Format) */}
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
      {/* Date Preview Badge (Supplier Ledger Format) */}
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
    background: "#0f172a", // Dark Sober Background
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
  background: "#1e3a8a", // Dark Blue Badge like Supplier Ledger
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