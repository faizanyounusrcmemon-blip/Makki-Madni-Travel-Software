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
  OTHER: "Activity" 
};

// Time Formatting Helper (Fixed 12-Hour AM/PM)
const fmtTime = (v) => {
  if (!v) return "-";
  return new Date(v).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: true });
};

const fmtDate = (v) => {
  if (!v) return "-";
  return new Date(v).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export default function ActivityReport({ onNavigate }) {
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [user, setUser] = useState("ALL");
  const [module, setModule] = useState("ALL");
  const [action, setAction] = useState("ALL");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState([]);
  const [users, setUsers] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ date });
      if (user !== "ALL") q.set("user", user);
      if (module !== "ALL") q.set("module", module);
      if (action !== "ALL") q.set("action", action);

      const r = await fetch(`${API}/activity?${q}`);
      const d = await r.json();
      if (!d.success) throw Error(d.error);

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
  }, [date, user, module, action]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q
      ? rows.filter((r) =>
          [r.username, r.module, r.action, r.description, r.reference_no, r.method, r.path]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(q)
        )
      : rows;
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
        r.action || "",
        r.module || "",
        r.description || "",
        r.reference_no || "",
        r.method || "",
        r.path || "",
      ]),
    ]
      .map((a) => a.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(","))
      .join("\n");

    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    a.download = `User-Activity-${date}.csv`;
    a.click();
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
    outline: "none",
    fontWeight: "600"
  };

  // Badge Style Generator
  const getBadgeStyle = (act) => {
    switch (act) {
      case "DELETE":
        return { bg: "#fef2f2", color: "#b91c1c", border: "#fecaca" };
      case "CREATE":
        return { bg: "#ecfdf5", color: "#047857", border: "#a7f3d0" };
      case "UPDATE":
        return { bg: "#fff7ed", color: "#c2410c", border: "#fed7aa" };
      case "PAYMENT":
        return { bg: "#f5f3ff", color: "#6d28d9", border: "#ddd6fe" };
      default:
        return { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" };
    }
  };

  return (
    <div style={{ minHeight: "100vh", padding: 28, background: "radial-gradient(circle at 10% 5%,rgba(37,99,235,.13),transparent 27%),linear-gradient(135deg,#f7f9fc,#eef4ff)", fontFamily: "Inter,system-ui,sans-serif" }}>
      <style>{`
        .activity-card { background: #fff; border: 1px solid #e5edf7; border-radius: 20px; box-shadow: 0 12px 32px rgba(15,23,42,.06); }
        .activity-row:hover { background: #f8fbff; }
        .activity-btn { transition: all .18s ease; }
        .activity-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        @media(max-width:900px){ .activity-filters { grid-template-columns: 1fr!important; } }
      `}</style>

      {/* Header Banner */}
      <div className="activity-card" style={{ maxWidth: 1450, margin: "0 auto 20px", overflow: "hidden", background: "linear-gradient(135deg,#081225,#17356e,#2563eb)", color: "#fff" }}>
        <div style={{ padding: "28px 30px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2.5, color: "#bfdbfe" }}>SECURITY • AUDIT • USER CONTROL</div>
            <h1 style={{ margin: "7px 0", fontSize: 30, fontWeight: 800 }}>🔐 User Activity & Audit Report</h1>
            <div style={{ color: "#dbeafe", fontSize: 13 }}>See who used the software, what they did, and when they did it.</div>
          </div>
          <button className="activity-btn" onClick={() => onNavigate("dashboard")} style={{ border: "1px solid rgba(255,255,255,.2)", background: "rgba(255,255,255,.1)", color: "#fff", borderRadius: 12, padding: "11px 17px", fontWeight: 800, cursor: "pointer" }}>
            ← Dashboard
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1450, margin: "0 auto" }}>
        {/* Filters */}
        <div className="activity-filters" style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1fr 1fr 2fr auto", gap: 10, alignItems: "end", marginBottom: 16 }}>
          {[
            ["Date", <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />],
            ["User", <select value={user} onChange={(e) => setUser(e.target.value)}><option value="ALL">All Users</option>{users.map((u) => (<option key={u} value={u}>{u}</option>))}</select>],
            ["Module", <select value={module} onChange={(e) => setModule(e.target.value)}><option value="ALL">All Modules</option>{modules.map((m) => (<option key={m} value={m}>{m}</option>))}</select>],
            ["Action", <select value={action} onChange={(e) => setAction(e.target.value)}><option value="ALL">All Activities</option>{Object.entries(ACTION_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}</select>],
          ].map(([l, c]) => (
            <label key={l} style={{ fontSize: 11, color: "#64748b", fontWeight: 800 }}>
              {l}
              {React.cloneElement(c, { style: controlStyle })}
            </label>
          ))}
          <label style={{ fontSize: 11, color: "#64748b", fontWeight: 800 }}>
            Search
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="User, reference, module..." style={controlStyle} />
          </label>
          <button className="activity-btn" onClick={exportCsv} style={{ height: 42, border: 0, borderRadius: 11, padding: "0 18px", background: "linear-gradient(135deg,#0f766e,#059669)", color: "#fff", fontWeight: 800, cursor: "pointer" }}>
            📥 CSV
          </button>
        </div>

        {/* Stats Summary Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(170px,1fr))", gap: 12, marginBottom: 16 }}>
          {[
            ["Total Activities", stats.total, "🔎", "#eff6ff", "#1d4ed8"],
            ["Created", stats.created, "➕", "#ecfdf5", "#047857"],
            ["Updated", stats.updated, "✏️", "#fff7ed", "#c2410c"],
            ["Deleted", stats.deleted, "🗑️", "#fef2f2", "#b91c1c"],
            ["Payments", stats.payments, "💰", "#f5f3ff", "#6d28d9"],
          ].map(([l, v, i, b, c]) => (
            <div className="activity-card" key={l} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, color: "#64748b", fontWeight: 800, letterSpacing: 0.7 }}>{l.toUpperCase()}</div>
                  <div style={{ fontSize: 27, fontWeight: 800, color: "#0f172a", marginTop: 4 }}>{v}</div>
                </div>
                <div style={{ width: 43, height: 43, borderRadius: 13, display: "grid", placeItems: "center", background: b, color: c, fontSize: 20 }}>{i}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Data Table */}
        <div className="activity-card" style={{ overflow: "hidden" }}>
          <div style={{ padding: "17px 20px", borderBottom: "1px solid #edf2f7", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 17, fontWeight: 800, color: "#0f172a" }}>📋 Activity Timeline</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>{filtered.length} activities shown for {date}</div>
            </div>
            <button className="activity-btn" onClick={load} style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: 10, padding: "8px 14px", fontWeight: 800, color: "#334155", cursor: "pointer" }}>
              ↻ Refresh
            </button>
          </div>

          <div className="table-responsive">
            <table className="table align-middle mb-0" style={{ fontSize: 12 }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {["TIME", "USER", "ACTION", "MODULE", "DESCRIPTION", "REFERENCE", "METHOD"].map((h) => (
                    <th key={h} style={{ padding: "12px 14px", fontSize: 10, color: "#64748b", letterSpacing: 1 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">Loading activity logs...</td>
                  </tr>
                ) : (
                  filtered.map((r) => {
                    const st = getBadgeStyle(r.action);
                    return (
                      <tr className="activity-row" key={r.id}>
                        {/* 🕒 TIME COLUMN (FIXED) */}
                        <td style={{ padding: "12px 14px", fontWeight: 700, color: "#1e293b", whiteSpace: "nowrap" }}>
                          ⏱️ {fmtTime(r.created_at)}
                        </td>

                        {/* 👤 USER COLUMN */}
                        <td style={{ padding: "12px 14px", fontWeight: 800, color: "#0f172a", whiteSpace: "nowrap" }}>
                          👤 {r.username && r.username !== "System User" ? r.username : "System User"}
                        </td>

                        {/* 🏷️ ACTION BADGE */}
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ display: "inline-block", padding: "5px 12px", borderRadius: 999, fontSize: 10, fontWeight: 800, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>
                            {ACTION_LABELS[r.action] || r.action}
                          </span>
                        </td>

                        {/* 📦 MODULE */}
                        <td style={{ padding: "12px 14px" }}>
                          <span style={{ background: "#f1f5f9", color: "#334155", borderRadius: 8, padding: "5px 10px", fontWeight: 700 }}>
                            {r.module || "-"}
                          </span>
                        </td>

                        {/* 📝 DESCRIPTION */}
                        <td style={{ padding: "12px 14px", color: "#475569", minWidth: 280 }}>
                          {r.description || "-"}
                        </td>

                        {/* 🔢 REFERENCE */}
                        <td style={{ padding: "12px 14px", fontFamily: "monospace", fontWeight: "700", color: "#2563eb" }}>
                          {r.reference_no || "-"}
                        </td>

                        {/* 🌐 METHOD */}
                        <td style={{ padding: "12px 14px", color: "#64748b", fontWeight: "700" }}>
                          {r.method || "-"}
                        </td>
                      </tr>
                    );
                  })
                )}

                {!loading && !filtered.length && (
                  <tr>
                    <td colSpan={7} className="text-center py-5">
                      <div style={{ fontSize: 34 }}>🔎</div>
                      <b>No activity logs found</b>
                      <div className="text-muted small">Try selecting another date or filter criteria.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}