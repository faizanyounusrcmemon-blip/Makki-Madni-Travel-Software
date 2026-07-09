import React, { useState, useEffect } from "react";
import API from "../api"; 
import Swal from "sweetalert2";
import ArchiveDashboard from "../components/ArchiveDashboard";

export default function ArchiveManager({ onNavigate }) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [list, setList] = useState([]);
  const [activeTab, setActiveTab] = useState("manager"); // manager | reports

  // Advanced Reports States
  const [yoyData, setYoyData] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditing, setAuditing] = useState(false);

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

  const loadYoYReport = async () => {
    try {
      const res = await API.get("/archive/analytics/yoy");
      if (res.data.success) setYoyData(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const runIntegrityAudit = async () => {
    try {
      setAuditing(true);
      const res = await API.get("/archive/analytics/integrity-check");
      if (res.data.success) {
        setAuditLogs(res.data.audit || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAuditing(false);
    }
  };

  const handleGlobalSearch = async (e) => {
    e.preventDefault();
    if (!searchKeyword.trim()) return;
    try {
      setSearching(true);
      const res = await API.get(`/archive/analytics/global-search?keyword=${searchKeyword}`);
      if (res.data.success) {
        setSearchResults(res.data.balances || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
    }
  };

  useEffect(() => {
    if (activeTab === "reports") {
      loadYoYReport();
      runIntegrityAudit();
    }
  }, [activeTab]);

  const checkPassword = async () => {
    let showPassword = false;
    const result = await Swal.fire({
      title: "🔐 Archive Access Verification",
      html: `
        <div style="position:relative">
          <input id="archive-password" type="password" class="swal2-input" placeholder="Enter Password" style="margin:0;width:100%;padding-right:40px;">
          <button id="toggle-pass-btn" type="button" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);border:none;background:transparent;cursor:pointer;font-size:18px;">👁️</button>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Confirm Password",
      didOpen: () => {
        const input = document.getElementById("archive-password");
        const btn = document.getElementById("toggle-pass-btn");
        btn.addEventListener("click", () => {
          showPassword = !showPassword;
          input.type = showPassword ? "text" : "password";
          btn.textContent = showPassword ? "🙈" : "👁️";
        });
      },
      preConfirm: () => {
        const pass = document.getElementById("archive-password").value;
        if (!pass) {
          Swal.showValidationMessage("Password required");
        }
        return pass;
      }
    });

    if (result.isConfirmed) {
      if (result.value !== "8515") {
        Swal.fire("Access Denied", "Incorrect Security Password", "error");
        return false;
      }
      return true;
    }
    return false;
  };

  const handlePreview = async (e) => {
    e.preventDefault();
    if (!from || !to) return Swal.fire("Fields Missing", "Select From & To Date", "warning");
    
    setLoading(true);
    try {
      const res = await API.post("/archive/preview", { fromDate: from, toDate: to });
      if (res.data.success) {
        setPreview(res.data);
      } else {
        Swal.fire("Error", res.data.error || "Preview failed", "error");
      }
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "Server connection error", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmArchive = async () => {
    const authenticated = await checkPassword();
    if (!authenticated) return;

    Swal.fire({
      title: "🚀 Compiling Master Snapshot...",
      html: `
        <div style="margin-top:15px; text-align: left;">
          <div style="width:100%; height:20px; background:#e5e7eb; border-radius:50px; overflow:hidden; margin-bottom: 15px;">
            <div id="archiveBar" style="width:5%; height:100%; background:linear-gradient(90deg, #ec4899, #be123c); transition:width 0.4s ease;"></div>
          </div>
          <div style="display:flex; justify-content:space-between; font-weight:800; font-size:16px; margin-bottom:15px;">
            <span>Status: <span id="archiveStatus" style="color:#be123c;">Compressing...</span></span>
            <span id="archivePercent">5%</span>
          </div>
          <div style="font-size:13px; line-height: 2;">
            <div id="arcStep1" style="color:#be123c; font-weight:bold;">⏳ Step 1: Querying Financial Ledgers...</div>
            <div id="arcStep2" style="color:#94a3b8;">⚪ Step 2: Extracting Rows to ZIP Block Stream...</div>
            <div id="arcStep3" style="color:#94a3b8;">⚪ Step 3: Generating Balance & Profit Snapshot...</div>
          </div>
        </div>
      `,
      showConfirmButton: false,
      allowOutsideClick: false,
    });

    const updateArcDOM = (pct, text, step) => {
      const bar = document.getElementById("archiveBar");
      const txt = document.getElementById("archivePercent");
      const st = document.getElementById("archiveStatus");
      if (bar) bar.style.width = `${pct}%`;
      if (txt) txt.innerHTML = `${pct}%`;
      if (st) st.innerHTML = text;

      for (let i = 1; i <= 3; i++) {
        const el = document.getElementById(`arcStep${i}`);
        if (el) {
          if (i < step) { el.innerHTML = el.innerHTML.replace(/[⏳⚪✅]/, "✅"); el.style.color = "#16a34a"; el.style.fontWeight = "normal"; }
          else if (i === step) { el.innerHTML = el.innerHTML.replace(/[⏳⚪✅]/, "⏳"); el.style.color = "#be123c"; el.style.fontWeight = "bold"; }
          else { el.style.color = "#94a3b8"; }
        }
      }
    };

    let pct = 5;
    const interval = setInterval(() => {
      if (pct < 40) { pct += 4; updateArcDOM(pct, "Calculating totals...", 1); }
      else if (pct >= 40 && pct < 85) { pct += 2; updateArcDOM(pct, "Packaging dump files...", 2); }
    }, 200);

    try {
      const res = await API.post("/archive/confirm", { fromDate: from, toDate: to }, { responseType: "blob" });
      clearInterval(interval);

      updateArcDOM(95, "Saving snapshots safely...", 3);
      await new Promise(r => setTimeout(r, 600));
      updateArcDOM(100, "Done!", 4);
      await new Promise(r => setTimeout(r, 400));
      Swal.close();

      const blob = new Blob([res.data], { type: "application/zip" });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `archive_backup_${from}_to_${to}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      Swal.fire("Archived & Secured", "Data snapshot compiled and exported successfully.", "success");
      setPreview(null);
      setFrom("");
      setTo("");
      loadList();
    } catch (err) {
      clearInterval(interval);
      Swal.close();
      Swal.fire("Archive Failed", "Could not generate financial closing snapshot.", "error");
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Delete Archive Snapshot?",
      text: "This action cannot be undone!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      confirmButtonText: "Yes, Delete It",
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await API.delete(`/archive/delete-snapshot/${id}`);
      if (res.data.success) {
        Swal.fire("Deleted", "Snapshot deleted successfully", "success");
        loadList();
      } else {
        Swal.fire("Error", res.data.error || "Delete failed", "error");
      }
    } catch (err) {
      Swal.fire("Error", "Server delete request failed", "error");
    }
  };

  const fmtMoney = (v) => Number(v || 0).toLocaleString("en-PK", { minimumFractionDigits: 0 });

  return (
    <div style={styles.wrapper}>
      {/* TABS NAVBAR */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div className="btn-group shadow-sm">
          <button 
            className={`btn px-4 fw-bold ${activeTab === "manager" ? "btn-primary" : "btn-outline-light text-white"}`}
            onClick={() => setActiveTab("manager")}
          >
            ⚙️ Archive Master Console
          </button>
          <button 
            className={`btn px-4 fw-bold ${activeTab === "reports" ? "btn-info text-dark" : "btn-outline-light text-white"}`}
            onClick={() => setActiveTab("reports")}
          >
            📊 Advanced Audit & YoY Reports
          </button>
        </div>
        <button className="btn btn-secondary fw-bold shadow-sm" onClick={() => onNavigate("archiveList")}>
          📋 Go To Saved Snapshots List →
        </button>
      </div>

      {activeTab === "manager" ? (
        <>
          <ArchiveDashboard />

          <div style={styles.container}>
            <div style={styles.header}>
              <h4 style={{ margin: 0, fontWeight: "900", color: "#38bdf8" }}>🔒 Create Historical Closing Archive</h4>
              <p style={{ margin: "5px 0 0 0", opacity: 0.8, fontSize: "12px" }}>
                Select your targeted dates range below to run pre-archive data streaming analysis.
              </p>
            </div>

            <form onSubmit={handlePreview} style={styles.formContainer}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>📅 Target Start Date</label>
                <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={styles.input} />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>📅 Target End Date (Lock Limit)</label>
                <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={styles.input} />
              </div>
              <button type="submit" disabled={loading} style={styles.btnPreview}>
                {loading ? "Analyzing Data Streams..." : "🔍 Run Pre-Archive Analysis (Preview)"}
              </button>
            </form>

            {/* PREVIEW CONTAINER (ORIGINAL BALANCES DESIGN REINSTATED) */}
            {preview && (
              <div style={{ marginTop: "30px", animation: "fadeIn 0.5s ease" }}>
                <h5 style={{ color: "#38bdf8", fontWeight: "800", marginBottom: "15px" }}>
                  📊 Pre-Archive Data Stream Preview Summary
                </h5>
                
                <div style={styles.tableGrid}>
                  <div style={styles.panelBox}>
                    <div style={styles.panelHeaderCyan}>💵 Calculated Closing Balances ({preview.balances?.length || 0})</div>
                    <div style={styles.panelBody}>
                      {preview.balances?.map((b, idx) => (
                        <div key={idx} style={styles.listItemSub}>
                          <span style={{ fontSize: "13px" }}>{b.account_name} <small style={{ color: "#94a3b8" }}>({b.account_type})</small></span>
                          <span className="fw-bold text-cyan">Rs. {fmtMoney(b.closing_balance)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={styles.panelBox}>
                    <div style={styles.panelHeaderPink}>📈 Estimated Net Profit Metrics ({preview.profit?.length || 0})</div>
                    <div style={styles.panelBody}>
                      {preview.profit?.map((p, idx) => (
                        <div key={idx} style={styles.listItemSub}>
                          <span style={{ fontSize: "13px" }}>{p.month}</span>
                          <span className="fw-bold text-success">Net: Rs. {fmtMoney(p.net_profit)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="alert alert-warning border border-warning bg-dark text-warning mt-4 p-3 rounded">
                  ⚠️ <b>Crucial Operational Warning:</b> Executing this command will write all assets, liabilities, and monthly profits into permanent snapshots. Please verify all ledger balances match before confirmation.
                </div>

                <button onClick={handleConfirmArchive} style={styles.btnConfirm}>
                  🚀 Lock Data & Generate Secured Archive Download (Snapshot)
                </button>
              </div>
            )}
          </div>

          {/* HISTORICAL SAVED SNAPSHOTS TABLE BLOCK (DIRECTLY IN CONSOLE) */}
          <div style={{ ...styles.container, marginTop: "30px" }}>
            <h4 className="fw-bold mb-3 text-white">📋 Quick View: Saved System Snapshots</h4>
            <div className="table-responsive">
              <table className="table table-dark table-striped align-middle">
                <thead>
                  <tr>
                    <th>Snapshot Reference ID</th>
                    <th>📅 Closed Range</th>
                    <th>🕒 Archived On</th>
                    <th className="text-center">Action Control</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id}>
                      <td className="text-cyan font-monospace">{r.id.substring(0, 8)}...</td>
                      <td><b>{r.from_date}</b> to <b>{r.to_date}</b></td>
                      <td>{new Date(r.created_at).toLocaleString()}</td>
                      <td className="text-center">
                        <button className="btn btn-sm btn-info me-2 fw-bold" onClick={() => onNavigate("archiveView", r.id)}>👁️ View</button>
                        <button className="btn btn-sm btn-warning me-2 fw-bold" onClick={() => onNavigate("archiveLogs", r.id)}>📋 Logs</button>
                        <button className="btn btn-sm btn-danger fw-bold" onClick={() => handleDelete(r.id)}>❌ Delete</button>
                      </td>
                    </tr>
                  ))}
                  {list.length === 0 && (
                    <tr><td colSpan="4" className="text-center text-muted">No system snapshots compiled yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        /* ADVANCED AUDIT & YOY REPORTS VIEW TAB */
        <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
          
          <div style={styles.container}>
            <h4 className="text-info fw-bold mb-3">📊 Year-on-Year (YoY) Historical Comparison</h4>
            <div className="table-responsive">
              <table className="table table-dark table-striped align-middle">
                <thead>
                  <tr className="table-primary text-dark">
                    <th>📅 Archived Period</th>
                    <th className="text-end">💼 Total Volume Sales</th>
                    <th className="text-end">📦 Total Purchases</th>
                    <th className="text-end">💰 Net Snapshot Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {yoyData.map((row, i) => (
                    <tr key={i}>
                      <td><b>{row.from_date}</b> to <b>{row.to_date}</b></td>
                      <td className="text-end text-success fw-bold">Rs. {fmtMoney(row.total_sales)}</td>
                      <td className="text-end text-warning">Rs. {fmtMoney(row.total_purchase)}</td>
                      <td className="text-end text-info fw-bold">Rs. {fmtMoney(row.net_profit)}</td>
                    </tr>
                  ))}
                  {yoyData.length === 0 && (
                    <tr><td colSpan="4" className="text-center text-muted">No historical snapshot data found.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.container}>
            <h4 className="text-warning fw-bold mb-2">🔍 Cross-Snapshot Historical Search</h4>
            <p className="text-muted small mb-3">Dhoondye saalon puraane customer ya supplier accounts ka final closing snapshot status ek click par.</p>
            <form onSubmit={handleGlobalSearch} className="d-flex gap-2 mb-3">
              <input 
                type="text" 
                className="form-control bg-dark text-white border-secondary"
                placeholder="Enter party name or ledger account title..."
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <button type="submit" className="btn btn-warning fw-bold px-4" disabled={searching}>
                {searching ? "Searching..." : "Search"}
              </button>
            </form>
            
            {searchResults.length > 0 && (
              <div className="table-responsive bg-dark p-2 rounded border border-secondary">
                <table className="table table-dark table-hover m-0">
                  <thead>
                    <tr>
                      <th>👤 Account Title</th>
                      <th>🗂️ Type</th>
                      <th>📅 Archive Period</th>
                      <th className="text-end">💵 Closing Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((res, index) => (
                      <tr key={index}>
                        <td>{res.account_name}</td>
                        <td><span className="badge bg-secondary">{res.account_type}</span></td>
                        <td>{res.from_date} to {res.to_date}</td>
                        <td className="text-end text-cyan fw-bold">Rs. {fmtMoney(res.closing_balance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div style={styles.container}>
            <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
              <h4 className="text-danger fw-bold m-0">🛡️ Archive Data Integrity Auditor</h4>
              <button className="btn btn-outline-danger btn-sm fw-bold" onClick={runIntegrityAudit} disabled={auditing}>
                {auditing ? "Verifying..." : "🔄 Run Security Verification"}
              </button>
            </div>
            <div className="row g-3">
              {auditLogs.map((log, i) => (
                <div className="col-md-4" key={i}>
                  <div className="card bg-dark border border-secondary text-white h-100 shadow-sm">
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="badge bg-danger">Snapshot ID: #{log.snapshot_id.substring(0,6)}</span>
                        <span className={`fw-bold ${log.status.includes("SECURE") ? "text-success" : "text-warning"}`}>{log.status}</span>
                      </div>
                      <h6 className="mb-1 text-muted small">Period:</h6>
                      <p className="fw-bold small text-white mb-2">{log.period}</p>
                      <hr className="bg-secondary my-2" />
                      <div className="d-flex justify-content-between small text-muted">
                        <span>Total Ledgers:</span>
                        <span className="text-white fw-bold">{log.total_accounts_archived} rows</span>
                      </div>
                      <div className="d-flex justify-content-between small text-muted mt-1">
                        <span>Sum Profit:</span>
                        <span className="text-success fw-bold">Rs. {fmtMoney(log.calculated_profit)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

const styles = {
  wrapper: { padding: "20px", color: "#fff", background: "#0f172a", minHeight: "100vh" },
  container: { background: "#1e293b", borderRadius: "16px", padding: "30px", boxShadow: "0 10px 30px rgba(0,0,0,0.25)", border: "1px solid #334155" },
  header: { borderBottom: "2px solid #334155", paddingBottom: "15px", marginBottom: "25px" },
  formContainer: { display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "flex-end" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px", flex: "1", minWidth: "200px" },
  label: { fontSize: "13px", fontWeight: "700", color: "#94a3b8" },
  input: { padding: "12px", borderRadius: "10px", border: "1px solid #475569", background: "#0f172a", color: "#fff", fontSize: "14px", outline: "none" },
  btnPreview: { background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#fff", border: "none", borderRadius: "10px", padding: "13px 25px", fontWeight: "700", fontSize: "14px", cursor: "pointer", transition: "all 0.3s ease", boxShadow: "0 4px 15px rgba(37,99,235,0.3)" },
  btnConfirm: { width: "100%", background: "linear-gradient(135deg, #db2777, #be123c)", color: "#fff", border: "none", borderRadius: "12px", padding: "15px", fontWeight: "800", fontSize: "16px", cursor: "pointer", marginTop: "25px", transition: "all 0.3s ease", boxShadow: "0 6px 20px rgba(219,39,119,0.3)" },
  tableGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginTop: "20px" },
  panelBox: { background: "#0f172a", borderRadius: "16px", overflow: "hidden", border: "1px solid #334155" },
  panelHeaderCyan: { background: "linear-gradient(90deg, #06b6d4, #0284c7)", padding: "12px 15px", fontWeight: "900", fontSize: "14px", color: "#fff" },
  panelHeaderPink: { background: "linear-gradient(90deg, #f43f5e, #be123c)", padding: "12px 15px", fontWeight: "900", fontSize: "14px", color: "#fff" },
  panelBody: { maxHeight: "200px", overflowY: "auto", padding: "5px" },
  listItemSub: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 15px", borderBottom: "1px solid #334155" }
};
