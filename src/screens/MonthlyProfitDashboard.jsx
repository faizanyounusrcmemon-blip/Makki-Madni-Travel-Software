import React, { useEffect, useState } from "react";

const fmt = (v) => Math.round(v || 0).toLocaleString("en-US");

export default function MonthlyProfitDashboard({ onNavigate }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [months, setMonths] = useState([]);

  const loadData = async (y = year) => {
    try {
      const r = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/monthly-profit-report?year=${y}`
      );

      const d = await r.json();

      if (d.success) {
        setMonths(d.months || []);
      } else {
        alert(d.error || "Failed to load");
      }
    } catch (err) {
      console.error(err);
      alert("Error loading report");
    }
  };

  useEffect(() => {
    loadData(year);
  }, []);

  return (
    <div className="container-fluid py-3">
      {/* HEADER BAR */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body py-2 px-3 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 fw-bold text-primary">
              📅 Monthly Profit Dashboard
            </h5>
            <small className="text-muted">
              Full year monthly business report breakdown
            </small>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* YEAR FILTER CARD */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body p-3">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label small fw-bold mb-1">Year</label>
              <input
                className="form-control form-control-sm"
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-primary btn-sm w-100 fw-bold"
                onClick={() => loadData(year)}
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MONTH CARDS GRID */}
      <div className="row g-3 mb-4">
        {months.map((m, i) => (
          <div className="col-xl-3 col-lg-4 col-md-6" key={i}>
            <div className="card shadow-sm border-0 h-100 overflow-hidden">
              
              {/* BEAUTIFIED MONTH HEADER */}
              <div 
                className="py-2 px-3 text-white text-center fw-bold shadow-sm"
                style={{
                  background: "linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)",
                  letterSpacing: "1px",
                  fontSize: "15px",
                  textTransform: "uppercase",
                  borderBottom: "2px solid #084298"
                }}
              >
                🗓️ {m.month_name}
              </div>

              <div className="card-body p-3" style={{ fontSize: "14px" }}>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Total Sales</span>
                  <b className="text-info fs-6">{fmt(m.total_sales)}</b>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Purchase</span>
                  <b className="text-primary fs-6">{fmt(m.total_purchase)}</b>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Base Profit</span>
                  <b className="text-success fs-6">{fmt(m.base_profit)}</b>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Supplier Adj</span>
                  <b className="text-warning fs-6">{fmt(m.supplier_adjustment)}</b>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Customer Adj</span>
                  <b className="text-danger fs-6">{fmt(m.customer_adjustment)}</b>
                </div>

                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Expense</span>
                  <b className="text-danger fs-6">{fmt(m.total_expense)}</b>
                </div>

                <hr className="my-2" />

                <div className="bg-light p-2 rounded text-center">
                  <small className="text-muted fw-bold d-block">NET PROFIT</small>
                  <h5 className="fw-bold text-dark mb-0 mt-1 fs-6">
                    PKR {fmt(m.net_profit)}
                  </h5>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* FULL YEAR SUMMARY CARD */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-header bg-primary text-white py-2 fw-bold">
          📊 FULL YEAR SUMMARY
        </div>
        <div className="card-body p-3">
          <div className="row g-3">
            <div className="col-md-2 col-6">
              <div className="p-2 border rounded text-center bg-light">
                <span className="text-muted small d-block">Total Sales</span>
                <h6 className="text-info fw-bold mb-0 mt-1 fs-6">
                  {fmt(months.reduce((a, b) => a + Number(b.total_sales || 0), 0))}
                </h6>
              </div>
            </div>

            <div className="col-md-2 col-6">
              <div className="p-2 border rounded text-center bg-light">
                <span className="text-muted small d-block">Purchase</span>
                <h6 className="text-primary fw-bold mb-0 mt-1 fs-6">
                  {fmt(months.reduce((a, b) => a + Number(b.total_purchase || 0), 0))}
                </h6>
              </div>
            </div>

            <div className="col-md-2 col-6">
              <div className="p-2 border rounded text-center bg-light">
                <span className="text-muted small d-block">Base Profit</span>
                <h6 className="text-success fw-bold mb-0 mt-1 fs-6">
                  {fmt(months.reduce((a, b) => a + Number(b.base_profit || 0), 0))}
                </h6>
              </div>
            </div>

            <div className="col-md-2 col-6">
              <div className="p-2 border rounded text-center bg-light">
                <span className="text-muted small d-block">Supplier Adj</span>
                <h6 className="text-warning fw-bold mb-0 mt-1 fs-6">
                  {fmt(months.reduce((a, b) => a + Number(b.supplier_adjustment || 0), 0))}
                </h6>
              </div>
            </div>

            <div className="col-md-2 col-6">
              <div className="p-2 border rounded text-center bg-light">
                <span className="text-muted small d-block">Customer Adj</span>
                <h6 className="text-danger fw-bold mb-0 mt-1 fs-6">
                  {fmt(months.reduce((a, b) => a + Number(b.customer_adjustment || 0), 0))}
                </h6>
              </div>
            </div>

            <div className="col-md-2 col-6">
              <div className="p-2 border rounded text-center bg-light">
                <span className="text-muted small d-block">Expense</span>
                <h6 className="text-danger fw-bold mb-0 mt-1 fs-6">
                  {fmt(months.reduce((a, b) => a + Number(b.total_expense || 0), 0))}
                </h6>
              </div>
            </div>
          </div>

          <div className="bg-success text-white rounded text-center p-3 mt-3">
            <small className="text-white-50 text-uppercase fw-bold">
              🌟 FULL YEAR NET PROFIT
            </small>
            <h3 className="fw-extrabold mb-0 mt-1">
              PKR {fmt(months.reduce((a, b) => a + Number(b.net_profit || 0), 0))}
            </h3>
          </div>
        </div>
      </div>
    </div>
  );
}