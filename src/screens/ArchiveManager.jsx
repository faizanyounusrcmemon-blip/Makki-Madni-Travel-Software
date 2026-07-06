import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import ArchiveDashboard from "../components/ArchiveDashboard";
import API from "../api"; // ✅ Sirf ye ek line add karni hai top par

export default function ArchiveManager({ onNavigate }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [list, setList] = useState([]);
  const [viewData, setViewData] = useState(null);
  const [snapshotId, setSnapshotId] = useState(null);

  /* =========================
      LOAD LIST
  ========================= */
  const loadList = async () => {
    try {
      const res = await api.get("/list");
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

  /* =========================
      PASSWORD SYSTEM
  ========================= */
  const checkPassword = async () => {
    let showPassword = false;

    const result = await Swal.fire({
      title: "🔐 Archive Access",
      html: `
        <div style="position:relative">
          <input
            id="archive-password"
            type="password"
            class="swal2-input"
            placeholder="Enter Password"
            style="margin:0;width:100%;padding-right:45px"
          />
          <button
            id="toggle-password"
            type="button"
            style="
              position:absolute;
              right:8px;
              top:8px;
              border:none;
              background:none;
              cursor:pointer;
              font-size:18px;
            "
          >
            👁️
          </button>
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
      preConfirm: () => {
        return document.getElementById("archive-password").value;
      }
    });

    const password = result.value;
    if (!password) return false;

    if (password === "1234") return true;

    Swal.close();
    await Swal.fire({
      icon: "error",
      title: "Wrong Password",
      text: "Access Denied",
      width: 320
    });
    return false;
  };

  const showLoading = (text = "Processing...") => {
    Swal.close();
    Swal.fire({
      title: text,
      html: `
        <div style="margin-top:15px; font-size:18px;">
          ⏳ Please wait...<br/>System is working
        </div>
      `,
      width: 320,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
  };

  /* =========================
      PREVIEW NO PASSWORD
  ========================= */
  const handlePreview = async () => {
    if (!from || !to) {
      return Swal.fire("Error", "Date range required", "error");
    }

    try {
      setLoading(true);
      const res = await api.post("/preview", {
        date_from: from,
        date_to: to
      });

      if (res.data.success) {
        setPreview(res.data);
      }
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* =========================
      SNAPSHOT
  ========================= */
  const handleSnapshot = async () => {
    if (!(await checkPassword())) return;

    if (!from || !to) {
      Swal.close();
      return Swal.fire({
        icon: "error",
        title: "Date Required",
        text: "Please select From and To dates",
        width: 320
      });
    }

    const confirm = await Swal.fire({
      title: "Create Snapshot?",
      text: "Archive snapshot will be created",
      icon: "warning",
      width: 320,
      showCancelButton: true,
      confirmButtonText: "Create",
      cancelButtonText: "Cancel"
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      showLoading("Creating Snapshot...");

      const res = await api.post("/snapshot", {
        from_date: from,
        to_date: to
      });

      console.log("SNAPSHOT RESPONSE:", res.data);

      if (res.data.success) {
        const newSnapshotId = res.data.snapshotId;
        setSnapshotId(newSnapshotId);

        setPreview((prev) => ({
          ...(prev || {}),
          snapshotId: newSnapshotId,
          customer_count: res.data.customerCount,
          supplier_count: res.data.supplierCount,
          opening_cash: res.data.opening_cash,
          opening_bank: res.data.opening_bank,
          opening_profit: res.data.opening_profit
        }));

        Swal.close();
        await Swal.fire({
          icon: "success",
          title: "Snapshot Created",
          width: 320,
          html: `
            <div style="text-align:left">
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
      } else {
        Swal.close();
        Swal.fire({
          icon: "error",
          title: "Snapshot Failed",
          text: res.data.error || "Unknown Error",
          width: 320
        });
      }
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: err.response?.data?.error || err.message,
        width: 320
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================================
      UPDATED BACKUP BUTTON (FOR STREAM DOWNLOAD)
  ========================================================================= */
  const handleBackup = async () => {
    if (!(await checkPassword())) return;

    if (!from || !to) {
      Swal.close();
      return Swal.fire({
        icon: "error",
        title: "Date Required",
        text: "Please select From and To dates",
        width: 320
      });
    }

    const confirm = await Swal.fire({
      title: "Create Backup?",
      text: "ZIP backup file will be generated & streamed directly.",
      icon: "question",
      width: 320,
      showCancelButton: true,
      confirmButtonText: "Download",
      cancelButtonText: "Cancel"
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      showLoading("Streaming ZIP Backup from Server...");

      const response = await api.get(`/download-stream?fromDate=${from}&toDate=${to}`, {
        responseType: "blob"
      });

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
      await Swal.fire({
        icon: "success",
        title: "Backup Downloaded",
        text: "ZIP file stream successfully completed!",
        width: 320
      });

      loadList();
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Streaming Error",
        text: err.response?.data?.error || err.message,
        width: 320
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================================================================
      RESTORE BACKUP SYSTEM
  ========================================================================= */
  const handleRestore = async () => {
    if (!(await checkPassword())) return;

    const { value: file } = await Swal.fire({
      title: "📤 Upload Backup ZIP",
      text: "Select the archive ZIP file from your computer to restore the database.",
      input: "file",
      inputAttributes: {
        accept: ".zip",
        "aria-label": "Upload your archive backup ZIP file"
      },
      showCancelButton: true,
      confirmButtonText: "Upload & Restore",
      cancelButtonText: "Cancel",
      width: 400
    });

    if (!file) return;

    const confirm = await Swal.fire({
      title: "⚠️ ARE YOU SURE?",
      text: "This will merge or overwrite current live data with the backup file data. This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Restore Data!",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#d33",
      width: 350
    });

    if (!confirm.isConfirmed) return;

    try {
      setLoading(true);
      showLoading("Extracting & Restoring Database... Please wait.");

      const formData = new FormData();
      formData.append("backup_file", file);

      const res = await api.post("/restore", formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      });

      Swal.close();
      if (res.data.success) {
        await Swal.fire({
          icon: "success",
          title: "System Restored!",
          text: res.data.message || "All tables have been populated from backup.",
          width: 320
        });
        loadList();
      } else {
        Swal.fire({
          icon: "error",
          title: "Restore Failed",
          text: res.data.error || "Unknown error occurred",
          width: 320
        });
      }
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Server Error",
        text: err.response?.data?.error || err.message,
        width: 320
      });
    } finally {
      setLoading(false);
    }
  };

  /* =========================
      DELETE
  ========================= */
  const handleDelete = async () => {
    if (!(await checkPassword())) return;

    Swal.close();
    const confirm = await Swal.fire({
      title: "Delete Data?",
      text: "Backup must be created first",
      icon: "warning",
      showCancelButton: true
    });

    if (!confirm.isConfirmed) return;

    try {
      showLoading("Deleting Archive Data...");
      const res = await api.post("/delete", {
        from_date: from,
        to_date: to,
        backup_file: ""
      });

      if (res.data.success) {
        Swal.close();
        await Swal.fire({
          icon: "success",
          title: "Deleted",
          text: "Archive Completed",
          width: 320
        });
        loadList();
      }
    } catch (err) {
      Swal.close();
      Swal.fire("Error", err.response?.data?.error || err.message, "error");
    }
  };

  /* =========================
      VIEW
  ========================= */
  const handleView = async (id) => {
    if (!(await checkPassword())) return;

    try {
      const res = await api.get(`/view/${id}`);
      if (res.data.success) {
        setViewData(res.data);
        setSnapshotId(id);
      }
    } catch (err) {
      Swal.fire("Error", "Failed to fetch archive view data", "error");
    }
  };

  /* =========================================================================
      UPDATED DOWNLOAD ZIP FROM LIST (PULL ZIP)
  ========================================================================= */
  const handleDownload = async (id) => {
    if (!(await checkPassword())) return;

    const targetItem = list.find(item => item.id === id);
    if (!targetItem) {
      return Swal.fire("Error", "Snapshot details not found in list", "error");
    }

    try {
      showLoading("Pulling ZIP File Stream...");
      
      const res = await api.get(`/download-stream?fromDate=${targetItem.date_from}&toDate=${targetItem.date_to}`, {
        responseType: "blob"
      });

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
      await Swal.fire({
        icon: "success",
        title: "Download Complete",
        text: "ZIP file saved on your PC Downloads folder",
        width: 320
      });
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Download Failed",
        text: err.response?.data?.error || err.message,
        width: 320
      });
    }
  };

  return (
    <div style={styles.container}>
      {/* 📊 INTEGRATED ARCHIVE DASHBOARD COMPONENT AT THE TOP */}
      <div style={{ marginBottom: "20px" }}>
        <ArchiveDashboard />
      </div>

      <div style={styles.headerBar}>
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "900", letterSpacing: "1px" }}>
          🚀 ARCHIVE CONTROL CENTER
        </h2>
        <button onClick={() => onNavigate("dashboard")} style={styles.btnBack}>
          ← BACK TO MAIN
        </button>
      </div>



      <div style={styles.cardMain}>
        <div style={styles.row}>
          <div style={{ flex: 1 }}>
            <label style={styles.labelCyan}>⚡ START DATE</label>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={styles.inputCyan} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={styles.labelPink}>⚡ END DATE</label>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={styles.inputPink} />
          </div>
        </div>

        <div style={styles.buttonRow}>
          <button style={styles.btnBlue} onClick={handlePreview}>🔍 LOAD PREVIEW</button>
          <button style={styles.btnPurple} onClick={handleBackup}>📦 COMPILE ZIP</button>
          <button style={styles.btnGreen} onClick={handleSnapshot}>💾 SAVE SNAPSHOT</button>
          <button style={styles.btnOrange} onClick={handleRestore}>📤 RESTORE ZIP</button>
          <button style={styles.btnRed} onClick={handleDelete}>🔥 WIPE LIVE DATA</button>
        </div>
      </div>

      {preview && (
        <div style={styles.cardPreview}>
          <h3 style={{ color: "#fff", textTransform: "uppercase", fontWeight: "900", marginBottom: "20px", borderBottom: "2px dashed #f1c40f", paddingBottom: "10px" }}>
            📊 Live System Data Preview
          </h3>
          
          <div style={{ display: "flex", gap: 15, marginBottom: 20 }}>
            <div style={styles.blockCash}>
              <span style={styles.blockLabel}>Opening Cash</span>
              <h2 style={styles.blockValue}>{Number(preview.opening_cash || 0).toLocaleString()}</h2>
            </div>
            <div style={styles.blockBank}>
              <span style={styles.blockLabel}>Opening Bank</span>
              <h2 style={styles.blockValue}>{Number(preview.opening_bank || 0).toLocaleString()}</h2>
            </div>
            <div style={styles.blockProfit}>
              <span style={styles.blockLabel}>Opening Profit</span>
              <h2 style={styles.blockValue}>{Number(preview.opening_profit || 0).toLocaleString()}</h2>
            </div>
          </div>

          <div style={styles.tableGrid}>
            <div style={styles.panelBox}>
              <div style={styles.panelHeaderCyan}>
                <span>👤 CUSTOMERS ({preview.customer_count || 0})</span>
              </div>
              <div style={styles.panelBody}>
                {preview.customers?.map((c, i) => (
                  <div key={i} style={styles.listItemSub}>
                    <div>
                      <b style={{ color: "#00f2fe" }}>{c.ref_no}</b> — {c.customer_name}<br />
                      <span style={{ fontSize: "12px", color: "#bbb" }}>Status: {c.payment_status} | Total: {Number(c.total_pkr || 0).toLocaleString()} | Rec: {Number(c.received || 0).toLocaleString()}</span>
                    </div>
                    <b style={{ color: "#fff", fontSize: "16px" }}>{Number(c.balance || 0).toLocaleString()}</b>
                  </div>
                ))}
              </div>
            </div>

            <div style={styles.panelBox}>
              <div style={styles.panelHeaderPink}>
                <span>🏢 SUPPLIERS ({preview.supplier_count || 0})</span>
              </div>
              <div style={styles.panelBody}>
                {preview.suppliers?.map((s, i) => (
                  <div key={i} style={styles.listItemSub}>
                    <div>
                      <b style={{ color: "#ff758c" }}>{s.supplier_name}</b><br />
                      <span style={{ fontSize: "12px", color: "#bbb" }}>Pur: {Number(s.purchase_total || 0).toLocaleString()} | Paid: {Number(s.paid || 0).toLocaleString()}</span>
                    </div>
                    <b style={{ color: "#fff", fontSize: "16px" }}>{Number(s.balance || 0).toLocaleString()}</b>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div style={styles.cardLogs}>
        <h3 style={{ color: "#fff", letterSpacing: "1px", margin: "0 0 15px 0", fontWeight: "900" }}>
          📜 HISTORICAL SNAPSHOTS ENGINE
        </h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(list || []).map((item) => (
            <div key={item.id} style={styles.listItemLog}>
              <div>
                <span style={styles.badgeId}>BLOCK ID: #{item.id}</span>
                <div style={{ marginTop: "5px", fontSize: "14px", fontWeight: "bold" }}>
                  Timeline: <span style={{ color: "#00f2fe" }}>{item.date_from}</span> to <span style={{ color: "#ff758c" }}>{item.date_to}</span>
                </div>
                <div style={{ fontSize: "12px", color: "#aaa", marginTop: "3px" }}>
                  Profit Block: {Number(item.total_profit || item.opening_profit || 0).toLocaleString()} PKR
                </div>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button style={styles.smallBtnInspect} onClick={() => handleView(item.id)}>INSPECT</button>
                <button style={styles.smallBtnPull} onClick={() => handleDownload(item.id)}>PULL ZIP</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ======================
      VIBRANT STYLES
====================== */
const styles = {
  container: { 
    padding: "25px", 
    fontFamily: "'Segoe UI', Roboto, sans-serif", 
    background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", 
    minHeight: "100vh",
    color: "#fff"
  },
  headerBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    background: "linear-gradient(90deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)",
    padding: "20px",
    borderRadius: "20px",
    marginBottom: "25px",
    boxShadow: "0 10px 25px rgba(139, 92, 246, 0.25)"
  },
  btnBack: {
    background: "#f59e0b",
    color: "#000",
    border: "none",
    padding: "10px 20px",
    borderRadius: "12px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "0.5px"
  },
  cardMain: { 
    background: "#1e293b", 
    padding: "25px", 
    borderRadius: "24px", 
    marginBottom: "25px", 
    border: "2px solid rgba(139, 92, 246, 0.2)",
    boxShadow: "0 15px 35px rgba(0,0,0,0.3)" 
  },
  row: { display: "flex", gap: "20px" },
  labelCyan: { display: "block", fontSize: "12px", fontWeight: "900", color: "#06b6d4", marginBottom: "6px", letterSpacing: "1px" },
  labelPink: { display: "block", fontSize: "12px", fontWeight: "900", color: "#f43f5e", marginBottom: "6px", letterSpacing: "1px" },
  inputCyan: { width: "100%", padding: "12px", background: "#0f172a", border: "2px solid #06b6d4", borderRadius: "14px", color: "#06b6d4", fontWeight: "bold", outline: "none", boxSizing: "border-box" },
  inputPink: { width: "100%", padding: "12px", background: "#0f172a", border: "2px solid #f43f5e", borderRadius: "14px", color: "#f43f5e", fontWeight: "bold", outline: "none", boxSizing: "border-box" },
  buttonRow: { marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" },
  
  btnBlue: { padding: "15px", background: "linear-gradient(to bottom, #38bdf8, #0284c7)", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "900", fontSize: "14px", cursor: "pointer", borderBottom: "4px solid #0369a1" },
  btnPurple: { padding: "15px", background: "linear-gradient(to bottom, #c084fc, #9333ea)", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "900", fontSize: "14px", cursor: "pointer", borderBottom: "4px solid #7e22ce" },
  btnGreen: { padding: "15px", background: "linear-gradient(to bottom, #4ade80, #16a34a)", color: "#000", border: "none", borderRadius: "14px", fontWeight: "900", fontSize: "14px", cursor: "pointer", borderBottom: "4px solid #15803d" },
  btnRed: { padding: "15px", background: "linear-gradient(to bottom, #fb7185, #dc2626)", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "900", fontSize: "14px", cursor: "pointer", borderBottom: "4px solid #991b1b" },
  btnOrange: { padding: "15px", background: "linear-gradient(to bottom, #f97316, #ea580c)", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "900", fontSize: "14px", cursor: "pointer", borderBottom: "4px solid #c2410c" },
  
  cardPreview: { background: "#0f172a", padding: "25px", borderRadius: "24px", marginBottom: "25px", border: "1px solid #334155" },
  blockCash: { background: "linear-gradient(135deg, #10b981 0%, #059669 100%)", padding: "15px", borderRadius: "16px", flex: 1, boxShadow: "0 8px 20px rgba(16, 185, 129, 0.2)" },
  blockBank: { background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", padding: "15px", borderRadius: "16px", flex: 1, boxShadow: "0 8px 20px rgba(59, 130, 246, 0.2)" },
  blockProfit: { background: "linear-gradient(135deg, #a855f7 0%, #7e3af2 100%)", padding: "15px", borderRadius: "16px", flex: 1, boxShadow: "0 8px 20px rgba(168, 85, 247, 0.2)" },
  blockLabel: { display: "block", fontSize: "11px", fontWeight: "900", color: "rgba(255,255,255,0.8)", letterSpacing: "0.5px" },
  blockValue: { margin: "5px 0 0 0", fontSize: "24px", fontWeight: "900" },
  
  tableGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginTop: "20px" },
  panelBox: { background: "#1e293b", borderRadius: "16px", overflow: "hidden", border: "1px solid #334155" },
  panelHeaderCyan: { background: "linear-gradient(90deg, #0891b2, #0369a1)", padding: "12px 15px", fontWeight: "900", fontSize: "14px" },
  panelHeaderPink: { background: "linear-gradient(90deg, #db2777, #9d174d)", padding: "12px 15px", fontWeight: "900", fontSize: "14px" },
  panelBody: { maxHeight: "250px", overflowY: "auto", padding: "10px" },
  listItemSub: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px", borderBottom: "1px solid #334155" },
  
  cardLogs: { background: "#1e293b", padding: "25px", borderRadius: "24px", border: "1px solid #334155" },
  listItemLog: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", background: "#0f172a", borderRadius: "16px", borderLeft: "5px solid #f59e0b" },
  badgeId: { background: "linear-gradient(90deg, #7c3aed, #4f46e5)", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", fontWeight: "900" },
  smallBtnInspect: { padding: "8px 15px", background: "linear-gradient(to bottom, #d946ef, #a21caf)", color: "#fff", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "11px" },
  smallBtnPull: { padding: "8px 15px", background: "linear-gradient(to bottom, #f59e0b, #d97706)", color: "#000", border: "none", borderRadius: "10px", fontWeight: "bold", cursor: "pointer", fontSize: "11px" }
};
