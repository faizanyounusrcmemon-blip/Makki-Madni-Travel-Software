import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

export default function ArchiveView({ id, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchViewData();
  }, [id]);

  const fetchViewData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/archive/view/${id}`);
      if (res.data.success) {
        setData(res.data);
      } else {
        Swal.fire("Error", res.data.error || "Failed to load archive details", "error");
      }
    } catch (err) {
      console.error("Error fetching archive view:", err);
      Swal.fire("Error", "Server error while fetching data", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    const day = String(date.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}/${months[date.getMonth()]}/${date.getFullYear()}`;
  };

  if (loading) {
    return (
      <div className="text-center p-5" style={{ color: "#fff" }}>
        <div className="spinner-border text-primary"></div>
        <p className="mt-2">Loading Archive Block details...</p>
      </div>
    );
  }

  if (!data || !data.snapshot) {
    return (
      <div className="container p-4 text-center" style={{ color: "#fff" }}>
        <h3>No Data Found</h3>
        <button className="btn btn-warning mt-3" onClick={onBack}>← Back</button>
      </div>
    );
  }

  // I-destructure ang mga records mula sa backend packet para sa mas madaling paggamit
  const { snapshot, customers, suppliers, profit } = data;

  return (
    <div className="container-fluid p-4" style={{ backgroundColor: "#1a1d29", minHeight: "100vh", color: "#fff" }}>
      
      {/* 🟣 HEADER CONTROL BAR */}
      <div className="card mb-4 border-0 shadow" style={{ background: "linear-gradient(90deg, #111827, #1f2937)", borderRadius: "15px" }}>
        <div className="card-body p-4 d-flex justify-content-between align-items-center">
          <div>
            <h2 className="mb-1 fw-bold text-warning">🔍 INSPECTING SNAPSHOT #{snapshot.id}</h2>
            <p className="mb-0 text-white-50 small">
              Timeline Range: <b>{formatDate(snapshot.date_from)}</b> to <b>{formatDate(snapshot.date_to)}</b>
            </p>
          </div>
          <button onClick={onBack} className="btn btn-danger fw-bold px-4 rounded-pill">
            ← CLOSE INSPECTION
          </button>
        </div>
      </div>

      {/* 📊 CASH, BANK, PROFIT VISUAL COUNTERS */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 p-3 shadow-sm" style={{ background: "linear-gradient(135deg, #059669, #10b981)", borderRadius: "14px" }}>
            <small className="text-white-50 fw-bold text-uppercase" style={{ fontSize: "11px" }}>Opening Cash balance</small>
            <h2 className="fw-black mb-0 mt-1">{formatNumber(snapshot.opening_cash)} PKR</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 p-3 shadow-sm" style={{ background: "linear-gradient(135deg, #2563eb, #3b82f6)", borderRadius: "14px" }}>
            <small className="text-white-50 fw-bold text-uppercase" style={{ fontSize: "11px" }}>Opening Bank balance</small>
            <h2 className="fw-black mb-0 mt-1">{formatNumber(snapshot.opening_bank)} PKR</h2>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card border-0 p-3 shadow-sm" style={{ background: "linear-gradient(135deg, #7e3af2, #a855f7)", borderRadius: "14px" }}>
            <small className="text-white-50 fw-bold text-uppercase" style={{ fontSize: "11px" }}>Total Merged Profit Block</small>
            <h2 className="fw-black mb-0 mt-1">{formatNumber(snapshot.total_profit || snapshot.opening_profit)} PKR</h2>
          </div>
        </div>
      </div>

      {/* 👥 DOUBLE GRID: CUSTOMERS & SUPPLIERS DATA ENGINE */}
      <div className="row g-4">
        
        {/* CUSTOMERS COLUMN */}
        <div className="col-md-6">
          <div className="card border-0 p-3 shadow" style={{ backgroundColor: "#212534", borderRadius: "15px" }}>
            <h5 className="fw-bold text-info border-bottom border-secondary pb-2 mb-3">
              👤 CUSTOMER BALANCES LOG ({customers?.length || 0})
            </h5>
            <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "5px" }}>
              {customers?.length === 0 ? (
                <p className="text-muted text-center py-3">Walang customer records sa snapshot na ito.</p>
              ) : (
                customers?.map((c, idx) => (
                  <div key={c.id || idx} className="d-flex justify-content-between align-items-center p-2 mb-2 rounded shadow-sm" style={{ backgroundColor: "#1a1d29", borderLeft: "4px solid #06b6d4" }}>
                    <div>
                      <span className="fw-bold d-block text-white" style={{ fontSize: "14px" }}>{c.name}</span>
                      <small className="text-muted" style={{ fontSize: "11px" }}>Record Ref ID: #{c.id}</small>
                    </div>
                    <span className="badge bg-dark fs-6 text-info border border-secondary">{formatNumber(c.balance)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* SUPPLIERS COLUMN */}
        <div className="col-md-6">
          <div className="card border-0 p-3 shadow" style={{ backgroundColor: "#212534", borderRadius: "15px" }}>
            <h5 className="fw-bold text-danger border-bottom border-secondary pb-2 mb-3">
              🏢 SUPPLIER BALANCES LOG ({suppliers?.length || 0})
            </h5>
            <div style={{ maxHeight: "400px", overflowY: "auto", paddingRight: "5px" }}>
              {suppliers?.length === 0 ? (
                <p className="text-muted text-center py-3">Walang supplier records sa snapshot na ito.</p>
              ) : (
                suppliers?.map((s, idx) => (
                  <div key={s.id || idx} className="d-flex justify-content-between align-items-center p-2 mb-2 rounded shadow-sm" style={{ backgroundColor: "#1a1d29", borderLeft: "4px solid #f43f5e" }}>
                    <div>
                      <span className="fw-bold d-block text-white" style={{ fontSize: "14px" }}>{s.name}</span>
                      <small className="text-muted" style={{ fontSize: "11px" }}>Record Ref ID: #{s.id}</small>
                    </div>
                    <span className="badge bg-dark fs-6 text-danger border border-secondary">{formatNumber(s.balance)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* 📈 MONTHLY PROFIT BREAKDOWN REPORT MODULE */}
      <div className="card mt-4 border-0 p-4 shadow" style={{ backgroundColor: "#212534", borderRadius: "15px" }}>
        <h5 className="fw-bold text-warning mb-3">📈 ARCHIVED MONTHLY PROFIT MODULE STACK</h5>
        <div className="table-responsive">
          <table className="table table-dark table-hover align-middle mb-0">
            <thead>
              <tr className="text-muted" style={{ fontSize: "12px" }}>
                <th>REPORT TIMELINE</th>
                <th>TOTAL SALES VOLUME</th>
                <th>TOTAL PURCHASE ENTRIES</th>
                <th>NET PROFIT ACCRUED</th>
              </tr>
            </thead>
            <tbody>
              {profit?.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-3">Walang monthly profit breakdown data sa block na ito.</td>
                </tr>
              ) : (
                profit?.map((p, idx) => (
                  <tr key={p.id || idx}>
                    <td className="fw-bold text-info">📅 Month {p.report_month} / {p.report_year}</td>
                    <td>{formatNumber(p.total_sales)} PKR</td>
                    <td>{formatNumber(p.total_purchase)} PKR</td>
                    <td>
                      <span className="badge bg-success-subtle text-success border border-success px-3 py-2 fw-bold">
                        {formatNumber(p.net_profit)} PKR
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
