import React, { useEffect, useState } from "react";
import API from "../api"; // ✅ Fixed: Import central API routing file instead of raw axios

export default function ArchiveView({ archiveId, onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (archiveId) {
      load();
    }
  }, [archiveId]);

  const load = async () => {
    try {
      console.log("ArchiveView ID =", archiveId);
      setLoading(true);

      // ✅ Fixed path router mismatch mapping
      const res = await API.get(`/archive/view/${archiveId}`);
      console.log("ArchiveView Response =", res.data);

      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const money = (v) => {
    return Number(v || 0).toLocaleString();
  };

  if (loading) {
    return (
      <div className="container-fluid p-4">
        <div
          className="d-flex justify-content-between align-items-center mb-4"
          style={{
            background: "linear-gradient(135deg,#667eea,#764ba2)",
            padding: "15px 20px",
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.25)"
          }}
        >
          <h2 className="mb-0 fw-bold" style={{ color: "#fff", fontSize: "26px" }}>📦 Archive Snapshot</h2>
          <button className="btn btn-light btn-sm fw-bold" onClick={() => onNavigate("archiveList")}>← Back</button>
        </div>
        <div className="text-center mt-5">
          <div className="spinner-border text-primary" style={{ width: "50px", height: "50px" }}></div>
          <h5 className="mt-3 text-white">Loading Archive Snapshot...</h5>
        </div>
      </div>
    );
  }

  if (!data || !data.snapshot) {
    return (
      <div className="p-4">
        <div className="alert alert-warning">📦 No Archive Found</div>
        <button className="btn btn-secondary" onClick={() => onNavigate("archiveList")}>← Back</button>
      </div>
    );
  }

  const s = data.snapshot;
  
  // Dynamic fallback mapping backend data array ke mutabiq
  const monthlyProfits = data.monthly_profits || data.monthlyProfits || data.months || [];

  return (
    <div className="container-fluid p-4">
      <div
        className="d-flex justify-content-between align-items-center mb-4"
        style={{
          background: "linear-gradient(135deg,#667eea,#764ba2)",
          padding: "15px 20px",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.25)"
        }}
      >
        <h2 className="mb-0 fw-bold" style={{ color: "#fff", fontSize: "26px" }}>📦 Archive Snapshot #{s.id}</h2>
        <button className="btn btn-light btn-sm fw-bold" onClick={() => onNavigate("archiveList")} style={{ borderRadius: "8px", padding: "8px 18px" }}>← Back</button>
      </div>

      <div className="row g-3 mb-4">
        <Card title="Opening Cash" value={s.opening_cash} icon="💵" color="success" money={money} />
        <Card title="Opening Bank" value={s.opening_bank} icon="🏦" color="primary" money={money} />
        <Card title="Opening Profit" value={s.opening_profit} icon="📈" color="warning" money={money} />
        <Card title="Total Profit" value={s.total_profit || s.opening_profit} icon="💰" color="danger" money={money} />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card shadow border-0 h-100">
            <div className="card-header bg-info text-dark fw-bold">👥 Customer Balances</div>
            <div className="table-responsive" style={{ maxHeight: "350px", overflowY: "auto" }}>
              <table className="table table-hover mb-0">
                <thead className="table-dark sticky-top">
                  <tr><th>Customer</th><th className="text-end">Balance</th></tr>
                </thead>
                <tbody>
                  {(data.customers || []).length === 0 ? (
                    <tr><td colSpan="2" className="text-center text-muted py-2">No customer balances found.</td></tr>
                  ) : (
                    (data.customers || []).map((x) => (
                      <tr key={x.id}><td>{x.name}</td><td className="text-end fw-bold text-success">{money(x.balance)}</td></tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="col-md-6">
          <div className="card shadow border-0 h-100">
            <div className="card-header bg-dark text-white fw-bold">🏪 Supplier Balances</div>
            <div className="table-responsive" style={{ maxHeight: "350px", overflowY: "auto" }}>
              <table className="table table-hover mb-0">
                <thead className="table-dark sticky-top">
                  <tr><th>Supplier</th><th className="text-end">Balance</th></tr>
                </thead>
                <tbody>
                  {(data.suppliers || []).length === 0 ? (
                    <tr><td colSpan="2" className="text-center text-muted py-2">No supplier balances found.</td></tr>
                  ) : (
                    (data.suppliers || []).map((x) => (
                      <tr key={x.id}><td>{x.name}</td><td className="text-end fw-bold text-danger">{money(x.balance)}</td></tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ✅ NEW: Month Wise Profit Panel Block Added */}
      <div className="row g-3 mb-4">
        <div className="col-12">
          <div className="card shadow border-0">
            <div className="card-header text-white fw-bold" style={{ backgroundColor: "#7e3af2" }}>
              📅 Month Wise Profit Records
            </div>
            <div className="table-responsive" style={{ maxHeight: "300px", overflowY: "auto" }}>
              <table className="table table-hover mb-0">
                <thead className="table-dark sticky-top">
                  <tr>
                    <th>Month / Period</th>
                    <th className="text-end">Profit Value</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyProfits.length === 0 ? (
                    <tr>
                      <td colSpan="2" className="text-center text-muted py-3">
                        No monthly profit records compiled in this snapshot.
                      </td>
                    </tr>
                  ) : (
                    monthlyProfits.map((m, index) => (
                      <tr key={m.id || index}>
                        <td className="fw-bold text-secondary">
                          {m.month_name || m.month || m.period || `Month Record #${index + 1}`}
                        </td>
                        <td className="text-end fw-bold text-primary">
                          {money(m.profit_amount || m.profit || m.amount)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

function Card({ title, value, icon, color, money }) {
  return (
    <div className="col-md-3">
      <div className={`card shadow-sm border-${color} h-100`}>
        <div className="card-body text-center">
          <h2>{icon}</h2>
          <h6 className="text-muted">{title}</h6>
          <h4 className="fw-bold">{money(value)}</h4>
        </div>
      </div>
    </div>
  );
}
