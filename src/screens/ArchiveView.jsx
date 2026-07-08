import React, { useEffect, useState } from "react";
import API from "../api"; 

export default function ArchiveView({ archiveId, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div className="container p-5 text-center text-white">
        <div className="spinner-border text-primary mb-2"></div>
        <p>Loading Archive View Details...</p>
      </div>
    );
  }

  if (!data || !data.snapshot) {
    return (
      <div className="container-fluid p-4 text-white text-center">
        <h3>No Snapshot Data Found</h3>
        <button className="btn btn-warning mt-3" onClick={() => onNavigate("archiveList")}>
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="container-fluid p-4" style={{ color: "#fff", backgroundColor: "#0f172a", minHeight: "100vh" }}>
      
      {/* HEADER ROW */}
      <div
        className="d-flex justify-content-between align-items-center mb-4"
        style={{
          background: "linear-gradient(135deg,#667eea,#764ba2)",
          padding: "15px 20px",
          borderRadius: "12px",
        }}
      >
        <h2 className="mb-0 fw-bold" style={{ fontSize: "24px" }}>
          🔍 Snapshot Inspection #{archiveId}
        </h2>
        <button
          className="btn btn-light btn-sm fw-bold"
          onClick={() => onNavigate("archiveList")}
          style={{ borderRadius: "8px", padding: "8px 18px" }}
        >
          ← Back
        </button>
      </div>

      {/* METRICS CARDS ROW (FIXED VISIBILITY) */}
      <div className="row g-3 mb-4">
        <Card title="Opening Cash" value={data.snapshot.opening_cash} icon="💵" color="#10b981" money={money} />
        <Card title="Opening Bank" value={data.snapshot.opening_bank} icon="🏦" color="#3b82f6" money={money} />
        <Card title="Total Profit" value={data.snapshot.total_profit || data.snapshot.opening_profit} icon="📈" color="#f59e0b" money={money} />
        <Card title="Customers Receivable" value={data.snapshot.total_customer_receivable} icon="👥" color="#06b6d4" money={money} />
      </div>

      {/* TABLES ROW */}
      <div className="row g-4 mb-4">
        {/* Customers Table */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100" style={{ backgroundColor: "#1e293b", color: "#fff" }}>
            <div className="card-header bg-info text-dark fw-bold">👤 Customers Balance List</div>
            <div className="table-responsive" style={{ maxHeight: "350px", overflowY: "auto" }}>
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr className="table-info text-dark">
                    <th>Name</th>
                    <th className="text-end">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.customers || []).map((c, i) => (
                    <tr key={i}>
                      <td>{c.name}</td>
                      <td className="text-end text-info fw-bold">{money(c.balance)}</td>
                    </tr>
                  ))}
                  {(data.customers || []).length === 0 && (
                    <tr>
                      <td colSpan="2" className="text-center text-muted">No records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Suppliers Table */}
        <div className="col-md-6">
          <div className="card shadow-sm border-0 h-100" style={{ backgroundColor: "#1e293b", color: "#fff" }}>
            <div className="card-header bg-warning text-dark fw-bold">🏢 Suppliers Balance List</div>
            <div className="table-responsive" style={{ maxHeight: "350px", overflowY: "auto" }}>
              <table className="table table-dark table-hover mb-0">
                <thead>
                  <tr className="table-warning text-dark">
                    <th>Name</th>
                    <th className="text-end">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {(data.suppliers || []).map((s, i) => (
                    <tr key={i}>
                      <td>{s.name}</td>
                      <td className="text-end text-warning fw-bold">{money(s.balance)}</td>
                    </tr>
                  ))}
                  {(data.suppliers || []).length === 0 && (
                    <tr>
                      <td colSpan="2" className="text-center text-muted">No records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Profit Table */}
      <div className="card shadow-sm border-0 mt-4" style={{ backgroundColor: "#1e293b", color: "#fff" }}>
        <div className="card-header bg-success text-white fw-bold">📊 Monthly Profit Detail</div>
        <div className="table-responsive">
          <table className="table table-dark table-hover mb-0">
            <thead>
              <tr className="table-success text-dark">
                <th>Month</th>
                <th className="text-end">Sales</th>
                <th className="text-end">Purchase</th>
                <th className="text-end">Net Profit</th>
              </tr>
            </thead>
            <tbody>
              {(data.profit || []).map((p, i) => (
                <tr key={i}>
                  <td>{p.report_month}/{p.report_year}</td>
                  <td className="text-end text-success">{money(p.total_sales)}</td>
                  <td className="text-end text-danger">{money(p.total_purchase)}</td>
                  <td className="text-end">
                    <span className="badge bg-success fs-6 text-white">{money(p.net_profit)}</span>
                  </td>
                </tr>
              ))}
              {(data.profit || []).length === 0 && (
                <tr>
                  <td colSpan="4" className="text-center text-muted">No profit data saved</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// Solid Dark Background style component for Metrics Cards
function Card({ title, value, icon, color, money }) {
  return (
    <div className="col-md-3">
      <div 
        className="card shadow-sm h-100" 
        style={{ 
          backgroundColor: "#1e293b", 
          border: "none",
          borderLeft: `5px solid ${color}`,
          borderRadius: "10px"
        }}
      >
        <div className="card-body text-center p-3">
          <div style={{ fontSize: "28px", marginBottom: "5px" }}>{icon}</div>
          <h6 style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600", textTransform: "uppercase" }}>{title}</h6>
          <h4 className="fw-bold mb-0 mt-2" style={{ color: color, fontSize: "20px" }}>{money(value)} PKR</h4>
        </div>
      </div>
    </div>
  );
}
