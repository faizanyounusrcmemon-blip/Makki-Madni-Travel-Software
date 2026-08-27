import React, { useEffect, useMemo, useState } from "react";

const API = `${import.meta.env.VITE_BACKEND_URL}/api/reports`;
const ACTION_LABELS = {
  CREATE: "Created",
  UPDATE: "Updated",
  DELETE: "Deleted",
  RESTORE: "Restored",
  PAYMENT: "Payment",
  LOGIN: "Login",
  LOGOUT: "Logout",
  VIEW: "Viewed",
  OTHER: "Activity",
};

const fmtTime = (v) =>
  v
    ? new Date(v).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      })
    : "-";

const fmtDate = (v) =>
  v
    ? new Date(v).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

const localISODate = (d = new Date()) => {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 10);
};

const getBadgeStyle = (action) => {
  if (action === "DELETE") return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
  if (action === "CREATE") return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
  if (action === "UPDATE") return { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" };
  if (action === "PAYMENT") return { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" };
  if (action === "LOGIN" || action === "LOGOUT") return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
  return { bg: "#f1f5f9", color: "#475569", border: "#cbd5e1" };
};

export default function ActivityReport({ onNavigate }) {
  const today = localISODate();
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [user, setUser] = useState("ALL");
  const [module, setModule] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (fromDate > toDate) return;
    setLoading(true);
    try {
      const q = new URLSearchParams({ from_date: fromDate, to_date: toDate });
      if (user !== "ALL") q.set("user", user);
      if (module !== "ALL") q.set("module", module);
      if (action !== "ALL") q.set("action", action);

      const r = await fetch(
  `${API}/activity?${q.toString()}`,
  {
    method: "GET",
    credentials: "include",
    headers: {
      Accept: "application/json",
    },
  }
);
      const d = await r.json();
      if (!d.success) throw Error(d.error || "Unable to load activity");
      setRows(d.rows || []);
      setUsers(d.users || []);
      setModules(d.modules || []);
    } catch (e) {
      console.error("ACTIVITY REPORT ERROR:", e);
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [fromDate, toDate, user, module, action]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.username, r.module, r.action, r.description, r.reference_no, r.method, r.path]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }, [rows, search]);

  const stats = useMemo(
    () => ({
      total: rows.length,
      created: rows.filter((r) => r.action === "CREATE").length,
      updated: rows.filter((r) => r.action === "UPDATE").length,
      deleted: rows.filter((r) => r.action === "DELETE").length,
      payments: rows.filter((r) => r.action === "PAYMENT").length,
    }),
    [rows]
  );

  const exportCsv = () => {
    const h = ["Date", "Time", "User", "Action", "Module", "Description", "Reference", "Method", "Path"];
    const csv = [
      h,
      ...filtered.map((r) => [
        fmtDate(r.created_at),
        fmtTime(r.created_at),
        r.username || "",
        ACTION_LABELS[r.action] || r.action || "",
        r.module || "",
        r.description || "",
        r.reference_no || "",
        r.method || "",
        r.path || "",
      ]),
    ]
      .map((line) => line.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `User-Activity-${fromDate}-to-${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const controlStyle = {
    width: "100%",
    height: 42,
    marginTop: 5,
    border: "1px solid #dbe3ef",
    borderRadius: 11,
    padding: "0 11px",
    background: "#fff",
    color: "#334155",
  };

  return (
    <div style={{ minHeight: "100vh", padding: 28, background: "radial-gradient(circle at 10% 5%, rgba(37,99,235,.13), transparent 27%), linear-gradient(135deg,#f7f9fc,#eef4ff)", fontFamily: "Inter,system-ui,sans-serif" }}>
      <style>{`.activity-card{background:#fff;border:1px solid #e5edf7;border-radius:20px;box-shadow:0 12px 32px rgba(15,23,42,.07)}.activity-row:hover{background:#f8fbff}.activity-btn{transition:.18s ease}.activity-btn:hover{transform:translateY(-2px)}@media(max-width:1050px){.activity-filters{grid-template-columns:repeat(2,1fr)!important}}@media(max-width:650px){.activity-filters{grid-template-columns:1fr!important}}`}</style>

      <div className="activity-card" style={{ maxWidth: 1450, margin: "0 auto 20px", overflow: "hidden", background: "linear-gradient(135deg,#081225,#17356e,#2563eb)", color: "#fff" }}>
        <div style={{ padding: "28px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, color: "#bfdbfe" }}>SECURITY • AUDIT • USER CONTROL</div>
            <h1 style={{ margin: "7px 0", fontSize: 30, fontWeight: 800 }}>🔐 User Activity & Audit Report</h1>
            <div style={{ color: "#dbeafe", fontSize: 13 }}>Complete user activity with date-to-date filtering.</div>
          </div>
          <button className="activity-btn" onClick={() => onNavigate("dashboard")} style={{ border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.1)", color: "#fff", borderRadius: 12, padding: "11px 17px", fontWeight: 800, cursor: "pointer" }}>← Dashboard</button>
        </div>
      </div>

      <div style={{ maxWidth: 1450, margin: "0 auto" }}>
        <div className="activity-card" style={{ padding: 16, marginBottom: 16 }}>
          <div className="activity-filters" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr 1fr 1.7fr auto", gap: 10, alignItems: "end" }}>
            <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800 }}>FROM DATE<input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} style={controlStyle} /></label>
            <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800 }}>TO DATE<input type="date" value={toDate} min={fromDate} onChange={(e) => setToDate(e.target.value)} style={controlStyle} /></label>
            <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800 }}>USER<select value={user} onChange={(e) => setUser(e.target.value)} style={controlStyle}><option value="ALL">All Users</option>{users.map((u) => <option key={u} value={u}>{u}</option>)}</select></label>
            <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800 }}>MODULE<select value={module} onChange={(e) => setModule(e.target.value)} style={controlStyle}><option value="ALL">All Modules</option>{modules.map((m) => <option key={m} value={m}>{m}</option>)}</select></label>
            <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800 }}>ACTION<select value={action} onChange={(e) => setAction(e.target.value)} style={controlStyle}><option value="ALL">All Activities</option>{Object.keys(ACTION_LABELS).map((a) => <option key={a} value={a}>{ACTION_LABELS[a]}</option>)}</select></label>
            <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800 }}>QUICK RANGE<select value="" onChange={(e) => { const v=e.target.value; if(v==="today"){setFromDate(today);setToDate(today)} if(v==="7"){const d=new Date();d.setDate(d.getDate()-6);setFromDate(localISODate(d));setToDate(today)} if(v==="30"){const d=new Date();d.setDate(d.getDate()-29);setFromDate(localISODate(d));setToDate(today)} }} style={controlStyle}><option value="">Select...</option><option value="today">Today</option><option value="7">Last 7 Days</option><option value="30">Last 30 Days</option></select></label>
            <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800 }}>SEARCH<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="User, reference, module..." style={controlStyle} /></label>
            <button className="activity-btn" onClick={exportCsv} style={{ height: 42, border: 0, borderRadius: 11, padding: "0 16px", background: "linear-gradient(135deg,#0f766e,#059669)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>📥 CSV</button>
          </div>
          {fromDate > toDate && <div style={{ color: "#b91c1c", fontSize: 12, fontWeight: 700, marginTop: 10 }}>To Date cannot be earlier than From Date.</div>}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 16 }}>
          {[["Total Activities",stats.total,"🔎","#eff6ff","#1d4ed8"],["Created",stats.created,"➕","#ecfdf5","#047857"],["Updated",stats.updated,"✏️","#fff7ed","#c2410c"],["Deleted",stats.deleted,"🗑️","#fef2f2","#b91c1c"],["Payments",stats.payments,"💰","#f5f3ff","#6d28d9"]].map(([l,v,i,b,c])=><div className="activity-card" key={l} style={{padding:16}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:10,color:"#64748b",fontWeight:800,letterSpacing:.7}}>{l.toUpperCase()}</div><div style={{fontSize:27,fontWeight:800,color:"#0f172a",marginTop:4}}>{v}</div></div><div style={{width:43,height:43,borderRadius:13,display:"grid",placeItems:"center",background:b,color:c,fontSize:20}}>{i}</div></div></div>)}
        </div>

        <div className="activity-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "17px 20px", borderBottom: "1px solid #edf2f7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div><div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>📋 Activity Timeline</div><div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{filtered.length} activities shown • {fmtDate(fromDate)} to {fmtDate(toDate)}</div></div>
            <button className="activity-btn" onClick={load} style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: 10, padding: "8px 14px", fontWeight: 800, color: "#334155", cursor: "pointer" }}>↻ Refresh</button>
          </div>
          <div className="table-responsive">
            <table className="table align-middle mb-0" style={{ fontSize: 12 }}>
              <thead><tr style={{ background: "#f8fafc" }}>{["DATE","TIME","USER","ACTION","MODULE","DESCRIPTION","REFERENCE","METHOD"].map((h)=><th key={h} style={{padding:"12px 14px",fontSize:10,color:"#64748b",letterSpacing:1}}>{h}</th>)}</tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={8} className="text-center py-5 text-muted">Loading activity logs...</td></tr> : filtered.map((r)=><tr className="activity-row" key={r.id}>
                  <td style={{padding:"12px 14px",fontWeight:700,whiteSpace:"nowrap"}}>{fmtDate(r.created_at)}</td>
                  <td style={{padding:"12px 14px",fontWeight:700,whiteSpace:"nowrap"}}>⏱️ {fmtTime(r.created_at)}</td>
                  <td style={{padding:"12px 14px",fontWeight:800,whiteSpace:"nowrap"}}>👤 {r.username || "Unknown User"}</td>
                  <td style={{padding:"12px 14px"}}>{(() => {const st=getBadgeStyle(r.action); return <span style={{display:"inline-block",padding:"5px 12px",borderRadius:999,fontSize:10,fontWeight:800,background:st.bg,color:st.color,border:`1px solid ${st.border}`}}>{ACTION_LABELS[r.action]||r.action||"Activity"}</span>})()}</td>
                  <td style={{padding:"12px 14px"}}><span style={{background:"#f1f5f9",color:"#334155",borderRadius:8,padding:"5px 10px",fontWeight:700}}>{r.module||"-"}</span></td>
                  <td style={{padding:"12px 14px",color:"#475569",minWidth:280}}>{r.description||"-"}</td>
                  <td style={{padding:"12px 14px",fontFamily:"monospace",fontWeight:700,color:"#2563eb"}}>{r.reference_no||"-"}</td>
                  <td style={{padding:"12px 14px",color:"#64748b",fontWeight:700}}>{r.method||"-"}</td>
                </tr>)}
                {!loading && !filtered.length && <tr><td colSpan={8} className="text-center py-5"><div style={{fontSize:34}}>🔎</div><b>No activity logs found</b><div className="text-muted small">Try another date, user, module or action.</div></td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
