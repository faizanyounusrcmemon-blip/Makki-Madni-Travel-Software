import React, { useEffect, useState } from "react";
import API from "../api";

export default function ArchiveView({ archiveId, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Live Search States
  const [bankSearch, setBankSearch] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");

  useEffect(() => {
    if (archiveId) {
      load();
    } else {
      console.error("ArchiveView Error: archiveId is missing!");
      setLoading(false);
    }
  }, [archiveId]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await API.get(`/archive/view/${archiveId}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error("Error loading archive view detail:", err);
    } finally {
      setLoading(false);
    }
  };

  const money = (v) => {
    return Number(v || 0).toLocaleString();
  };

  // Live Search Filters matching your backend response schema
  const filteredBanks = (data?.banks || []).filter((b) => {
    const term = bankSearch.toLowerCase();
    const name = (b.name || "").toLowerCase();
    const code = String(b.bank_profile_id || b.code || "").toLowerCase();
    return name.includes(term) || code.includes(term);
  });

  const filteredCustomers = (data?.customers || []).filter((c) => {
    const term = customerSearch.toLowerCase();
    const name = (c.name || "").toLowerCase();
    const code = String(c.customer_code || c.code || "").toLowerCase();
    return name.includes(term) || code.includes(term);
  });

  const filteredSuppliers = (data?.suppliers || []).filter((s) => {
    const term = supplierSearch.toLowerCase();
    const name = (s.name || "").toLowerCase();
    const code = String(s.supplier_code || s.code || "").toLowerCase();
    return name.includes(term) || code.includes(term);
  });

  if (loading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner}></div>
        <p style={{ marginTop: "12px", color: "#94a3b8" }}>Loading Snapshot Details...</p>
      </div>
    );
  }

  if (!data || !data.snapshot) {
    return (
      <div style={styles.centerContainer}>
        <h3>No Snapshot Data Found</h3>
        <button style={styles.btnSecondary} onClick={() => onNavigate("archiveList")}>
          ← Back to List
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* HEADER BAR */}
      <div style={styles.headerBar}>
        <div>
          <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "700", color: "#f8fafc" }}>
            🔍 INSPECT SNAPSHOT #{archiveId}
          </h2>
        </div>
        <button style={styles.btnSecondary} onClick={() => onNavigate("archiveList")}>
          ← Back
        </button>
      </div>

      {/* METRICS CARDS */}
      <div style={styles.metricsGrid}>
        <MetricCard title="Opening Cash" value={data.snapshot.opening_cash} icon="💵" color="#10b981" money={money} />
        <MetricCard title="Opening Bank" value={data.snapshot.opening_bank} icon="🏦" color="#38bdf8" money={money} />
        <MetricCard title="Total Profit" value={data.snapshot.total_profit || data.snapshot.opening_profit} icon="📈" color="#f59e0b" money={money} />
        <MetricCard title="Receivables" value={data.snapshot.total_customer_receivable} icon="👥" color="#a855f7" money={money} />
      </div>

      {/* 🏦 BANKS TABLE (Rendered from data.banks) */}
      <div style={{ ...styles.panelBox, marginBottom: "20px" }}>
        <div style={styles.panelHeader}>
          <span>🏦 BANK ACCOUNTS LIST ({filteredBanks.length})</span>
          <input
            type="text"
            placeholder="Search bank..."
            value={bankSearch}
            onChange={(e) => setBankSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
        <div style={styles.panelBody}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Sr#</th>
                <th style={styles.th}>Code / Bank ID</th>
                <th style={styles.th}>Bank Name</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Balance</th>
              </tr>
            </thead>
            <tbody>
              {filteredBanks.map((b, i) => (
                <tr key={b.id || i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={{ ...styles.td, color: "#38bdf8", fontWeight: "600" }}>
                    {b.bank_profile_id || b.code || "N/A"}
                  </td>
                  <td style={styles.td}>{b.name}</td>
                  <td style={{ ...styles.td, textAlign: "right", color: "#38bdf8", fontWeight: "700" }}>
                    PKR {money(b.balance)}
                  </td>
                </tr>
              ))}
              {filteredBanks.length === 0 && (
                <tr>
                  <td colSpan="4" style={styles.emptyTd}>No bank records found for this snapshot</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CUSTOMERS & SUPPLIERS TABLES */}
      <div style={styles.tableGrid}>
        {/* CUSTOMERS TABLE */}
        <div style={styles.panelBox}>
          <div style={styles.panelHeader}>
            <span>👥 CUSTOMERS BALANCE LIST ({filteredCustomers.length})</span>
            <input
              type="text"
              placeholder="Search customer..."
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.panelBody}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Sr#</th>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Name</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c, i) => (
                  <tr key={c.id || i} style={styles.tr}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={{ ...styles.td, color: "#38bdf8", fontWeight: "600" }}>
                      {c.customer_code || c.code || "N/A"}
                    </td>
                    <td style={styles.td}>{c.name}</td>
                    <td style={{ ...styles.td, textAlign: "right", fontWeight: "700" }}>
                      {money(c.balance)}
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan="4" style={styles.emptyTd}>No customer records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* SUPPLIERS TABLE */}
        <div style={styles.panelBox}>
          <div style={styles.panelHeader}>
            <span>🏢 SUPPLIERS BALANCE LIST ({filteredSuppliers.length})</span>
            <input
              type="text"
              placeholder="Search supplier..."
              value={supplierSearch}
              onChange={(e) => setSupplierSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>
          <div style={styles.panelBody}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Sr#</th>
                  <th style={styles.th}>Code</th>
                  <th style={styles.th}>Name</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredSuppliers.map((s, i) => (
                  <tr key={s.id || i} style={styles.tr}>
                    <td style={styles.td}>{i + 1}</td>
                    <td style={{ ...styles.td, color: "#f59e0b", fontWeight: "600" }}>
                      {s.supplier_code || s.code || "N/A"}
                    </td>
                    <td style={styles.td}>{s.name}</td>
                    <td style={{ ...styles.td, textAlign: "right", fontWeight: "700" }}>
                      {money(s.balance)}
                    </td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan="4" style={styles.emptyTd}>No supplier records found</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MONTHLY PROFIT BREAKDOWN */}
      <div style={{ ...styles.panelBox, marginTop: "20px" }}>
        <div style={styles.panelHeader}>
          <span>📊 MONTHLY PROFIT BREAKDOWN</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Sr#</th>
                <th style={styles.th}>Month / Year</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Total Sales</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Total Purchase</th>
                <th style={{ ...styles.th, textAlign: "right" }}>Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {(data.profit || []).map((p, i) => (
                <tr key={p.id || i} style={styles.tr}>
                  <td style={styles.td}>{i + 1}</td>
                  <td style={styles.td}>{p.report_month}/{p.report_year}</td>
                  <td style={{ ...styles.td, textAlign: "right", color: "#10b981" }}>{money(p.total_sales)}</td>
                  <td style={{ ...styles.td, textAlign: "right", color: "#ef4444" }}>{money(p.total_purchase)}</td>
                  <td style={{ ...styles.td, textAlign: "right" }}>
                    <span style={styles.profitBadge}>PKR {money(p.net_profit)}</span>
                  </td>
                </tr>
              ))}
              {(data.profit || []).length === 0 && (
                <tr>
                  <td colSpan="5" style={styles.emptyTd}>No profit breakdown saved in snapshot</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// METRIC CARD COMPONENT
function MetricCard({ title, value, icon, color, money }) {
  return (
    <div style={{ ...styles.metricCard, borderLeft: `4px solid ${color}` }}>
      <div style={{ fontSize: "24px", marginBottom: "4px" }}>{icon}</div>
      <span style={styles.metricTitle}>{title}</span>
      <h3 style={{ ...styles.metricValue, color }}>PKR {money(value)}</h3>
    </div>
  );
}

/* ================= STYLES ================= */
const styles = {
  container: {
    padding: "24px",
    background: "#0f172a",
    minHeight: "100vh",
    color: "#f8fafc",
    fontFamily: "'Inter', system-ui, -apple-system, sans-serif"
  },
  centerContainer: {
    padding: "50px",
    textAlign: "center",
    background: "#0f172a",
    minHeight: "100vh",
    color: "#f8fafc"
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
  btnSecondary: {
    background: "#334155",
    color: "#f8fafc",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px"
  },
  metricsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "16px",
    marginBottom: "20px"
  },
  metricCard: {
    background: "#1e293b",
    padding: "16px",
    borderRadius: "10px",
    border: "1px solid #334155"
  },
  metricTitle: {
    fontSize: "11px",
    color: "#94a3b8",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  },
  metricValue: {
    margin: "6px 0 0 0",
    fontSize: "18px",
    fontWeight: "700"
  },
  tableGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "16px"
  },
  panelBox: {
    background: "#1e293b",
    borderRadius: "10px",
    border: "1px solid #334155",
    overflow: "hidden"
  },
  panelHeader: {
    background: "#0f172a",
    padding: "12px 16px",
    fontWeight: "700",
    fontSize: "12px",
    color: "#f8fafc",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #334155"
  },
  searchInput: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "6px",
    padding: "4px 10px",
    color: "#f8fafc",
    fontSize: "12px",
    outline: "none",
    width: "140px"
  },
  panelBody: {
    maxHeight: "350px",
    overflowY: "auto"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px"
  },
  th: {
    padding: "10px 14px",
    textAlign: "left",
    background: "#0f172a",
    color: "#94a3b8",
    fontWeight: "600",
    fontSize: "11px",
    borderBottom: "1px solid #334155"
  },
  tr: {
    borderBottom: "1px solid #334155"
  },
  td: {
    padding: "10px 14px",
    color: "#f8fafc"
  },
  emptyTd: {
    padding: "20px",
    textAlign: "center",
    color: "#64748b",
    fontSize: "12px"
  },
  profitBadge: {
    background: "#065f46",
    color: "#34d399",
    padding: "4px 8px",
    borderRadius: "6px",
    fontWeight: "700",
    fontSize: "12px"
  },
  spinner: {
    width: "32px",
    height: "32px",
    border: "3px solid #334155",
    borderTop: "3px solid #2563eb",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
    margin: "0 auto"
  }
};