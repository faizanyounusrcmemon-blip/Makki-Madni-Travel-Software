import React, { useState, useEffect } from "react";
import API from "../api"; // ✅ Central configuration setup untouched
import Swal from "sweetalert2";
import ArchiveDashboard from "../components/ArchiveDashboard";

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
      html: `<div style="margin-top:15px; font-size:18px;">⏳ Please wait...<br/>System is working</div>`,
      width: 320,
      allowOutsideClick: false,
      allowEscapeKey: false,
      didOpen: () => { Swal.showLoading(); }
    });
  };

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
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ icon: "error", title: "Server Error", text: err.response?.data?.error || err.message, width: 320 });
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    if (!(await checkPassword())) return;
    if (!from || !to) {
      Swal.close();
      return Swal.fire({ icon: "error", title: "Date Required", text: "Select dates", width: 320 });
    }

    const confirm = await Swal.fire({
      title: "Create Backup?",
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

  const handleDelete = async () => {
    if (!(await checkPassword())) return;
    Swal.close();
    const confirm = await Swal.fire({ 
      title: "Delete Live Data?", 
      text: "Warning: This will clear the live operational data. Make sure backup is created first!", 
      icon: "warning", 
      showCancelButton: true 
    });
    if (!confirm.isConfirmed) return;

    try {
      showLoading("Wiping Live System Data...");
      const res = await API.post("/archive/live-data-start", { 
        from_date: from, 
        to_date: to 
      });
      
      if (res.data.success) {
        Swal.close();
        await Swal.fire({ icon: "success", title: "Wiped Successfully", text: "Live data has been cleared.", width: 320 });
        loadList();
      }
    } catch (err) {
      Swal.close();
      Swal.fire("Error", err.response?.data?.error || err.message, "error");
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


      <div style={styles.headerBar}>
        <h2 style={{ margin: 0, fontSize: "24px", fontWeight: "900", letterSpacing: "1px" }}>🚀 ARCHIVE CONTROL CENTER</h2>
        <button onClick={() => onNavigate("dashboard")} style={styles.btnBack}>← BACK TO MAIN</button>
      </div>

            <div style={{ marginBottom: "20px" }}>
        <ArchiveDashboard />
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

      {/* 📊 FIXED: Added complete visual layout for Customers and Suppliers under Preview */}
      {preview && (
        <div style={styles.cardPreview}>
          <h3 style={{ color: "#fff", textTransform: "uppercase", fontWeight: "900", marginBottom: "20px", borderBottom: "2px dashed #f1c40f", paddingBottom: "10px" }}>📊 Live System Data Preview</h3>
          
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
            {/* CUSTOMERS PANEL */}
            <div style={styles.panelBox}>
              <div style={styles.panelHeaderCyan}>
                <span>👤 CUSTOMERS ({preview.customer_count || preview.customerCount || 0})</span>
              </div>
              <div style={styles.panelBody}>
                {preview.customers && preview.customers.length > 0 ? (
                  preview.customers.map((c, i) => (
                    <div key={i} style={styles.listItemSub}>
                      <div>
                        <b style={{ color: "#06b6d4" }}>{c.ref_no || "N/A"}</b> — {c.customer_name}<br />
                        <span style={{ fontSize: "12px", color: "#aaa" }}>Status: {c.payment_status || 'Pending'}</span>
                      </div>
                      <b style={{ color: "#fff" }}>{Number(c.balance || 0).toLocaleString()}</b>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyText}>No Customers Data Found</div>
                )}
              </div>
            </div>

            {/* SUPPLIERS PANEL */}
            <div style={styles.panelBox}>
              <div style={styles.panelHeaderPink}>
                <span>🏢 SUPPLIERS ({preview.supplier_count || preview.supplierCount || 0})</span>
              </div>
              <div style={styles.panelBody}>
                {preview.suppliers && preview.suppliers.length > 0 ? (
                  preview.suppliers.map((s, i) => (
                    <div key={i} style={styles.listItemSub}>
                      <div>
                        <b style={{ color: "#f43f5e" }}>{s.supplier_name}</b><br />
                        <span style={{ fontSize: "12px", color: "#aaa" }}>Code: {s.supplier_code || 'N/A'}</span>
                      </div>
                      <b style={{ color: "#fff" }}>{Number(s.balance || 0).toLocaleString()}</b>
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

      <div style={styles.cardLogs}>
        <h3 style={{ color: "#fff", letterSpacing: "1px", margin: "0 0 15px 0", fontWeight: "900" }}>📜 HISTORICAL SNAPSHOTS ENGINE</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {(list || []).map((item) => (
            <div key={item.id} style={styles.listItemLog}>
              <div>
                <span style={styles.badgeId}>BLOCK ID: #{item.id}</span>
                <div style={{ marginTop: "5px", fontSize: "14px", fontWeight: "bold" }}>Timeline: <span style={{ color: "#00f2fe" }}>{item.date_from}</span> to <span style={{ color: "#ff758c" }}>{item.date_to}</span></div>
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

const styles = {
  container: { padding: "25px", background: "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", minHeight: "100vh", color: "#fff" },
  headerBar: { display: "flex", justifyContent: "space-between", alignItems: "center", background: "linear-gradient(90deg, #ec4899 0%, #8b5cf6 50%, #6366f1 100%)", padding: "20px", borderRadius: "20px", marginBottom: "25px" },
  btnBack: { background: "#f59e0b", color: "#000", border: "none", padding: "10px 20px", borderRadius: "12px", cursor: "pointer", fontWeight: "900" },
  cardMain: { background: "#1e293b", padding: "25px", borderRadius: "24px", marginBottom: "25px" },
  row: { display: "flex", gap: "20px" },
  labelCyan: { display: "block", fontSize: "12px", fontWeight: "900", color: "#06b6d4" },
  labelPink: { display: "block", fontSize: "12px", fontWeight: "900", color: "#f43f5e" },
  inputCyan: { width: "100%", padding: "12px", background: "#0f172a", border: "2px solid #06b6d4", borderRadius: "14px", color: "#06b6d4" },
  inputPink: { width: "100%", padding: "12px", background: "#0f172a", border: "2px solid #f43f5e", borderRadius: "14px", color: "#f43f5e" },
  buttonRow: { marginTop: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" },
  btnBlue: { padding: "15px", background: "#0284c7", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "900" },
  btnPurple: { padding: "15px", background: "#9333ea", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "900" },
  btnGreen: { padding: "15px", background: "#16a34a", color: "#000", border: "none", borderRadius: "14px", fontWeight: "900" },
  btnRed: { padding: "15px", background: "#dc2626", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "900" },
  btnOrange: { padding: "15px", background: "#ea580c", color: "#fff", border: "none", borderRadius: "14px", fontWeight: "900" },
  cardPreview: { background: "#0f172a", padding: "25px", borderRadius: "24px" },
  blockCash: { background: "#059669", padding: "15px", borderRadius: "16px", flex: 1 },
  blockBank: { background: "#2563eb", padding: "15px", borderRadius: "16px", flex: 1 },
  blockProfit: { background: "#7e3af2", padding: "15px", borderRadius: "16px", flex: 1 },
  blockLabel: { display: "block", fontSize: "11px", color: "#fff" },
  blockValue: { margin: "5px 0 0 0", fontSize: "24px", fontWeight: "900" },
  
  // New Layout Style Engine
  tableGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginTop: "20px" },
  panelBox: { background: "#1e293b", borderRadius: "16px", overflow: "hidden", border: "1px solid #334155" },
  panelHeaderCyan: { background: "linear-gradient(90deg, #06b6d4, #0284c7)", padding: "12px 15px", fontWeight: "900", fontSize: "14px" },
  panelHeaderPink: { background: "linear-gradient(90deg, #f43f5e, #be123c)", padding: "12px 15px", fontWeight: "900", fontSize: "14px" },
  panelBody: { maxHeight: "200px", overflowY: "auto", padding: "5px" },
  listItemSub: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", borderBottom: "1px solid #334155" },
  emptyText: { padding: "20px", color: "#64748b", textAlign: "center", fontSize: "13px" },

  cardLogs: { background: "#1e293b", padding: "25px", borderRadius: "24px" },
  listItemLog: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "15px", background: "#0f172a", borderRadius: "16px" },
  badgeId: { background: "#4f46e5", padding: "4px 8px", borderRadius: "6px", fontSize: "11px" },
  smallBtnInspect: { padding: "8px 15px", background: "#a21caf", color: "#fff", border: "none", borderRadius: "10px" },
  smallBtnPull: { padding: "8px 15px", background: "#d97706", color: "#000", border: "none", borderRadius: "10px" }
};
