import React, { useState } from "react";

/* ================= FORMAT ================= */
const fmt = (v) => Math.round(v || 0).toLocaleString("en-US");

export default function ProfitReport({ onNavigate }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");
  const [data, setData] = useState(null);

  const load = async () => {
    try {
      const qs = new URLSearchParams();
      if (year) qs.append("year", year);
      if (month) qs.append("month", month);

      const r = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/profit-report?${qs}`
      );
      const d = await r.json();
      if (d.success) setData(d.report);
      else alert(d.error || "Failed to load report");
    } catch (err) {
      console.error("LOAD PROFIT REPORT ERROR:", err);
      alert("Error loading report");
    }
  };

  return (
    <div className="container-fluid py-3">
      {/* HEADER BAR */}
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body py-2 px-3 d-flex justify-content-between align-items-center">
          <div>
            <h5 className="mb-0 fw-bold text-primary">💰 Profit Dashboard</h5>
            <small className="text-muted">Business performance summary</small>
          </div>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* FILTER CARD */}
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

            <div className="col-md-3">
              <label className="form-label small fw-bold mb-1">Month</label>
              <select
                className="form-select form-select-sm"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              >
                <option value="">All Months</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                  <option key={m} value={m}>
                    {new Date(0, m - 1).toLocaleString("en", { month: "long" })}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-md-2">
              <button
                className="btn btn-primary btn-sm w-100 fw-bold"
                onClick={load}
              >
                🚀 Load Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DASHBOARD */}
      {data && (
        <>
          {/* STAT CARDS */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card shadow-sm border-0 border-start border-info border-4 h-100">
                <div className="card-body p-3">
                  <span className="text-muted small fw-bold">Total Sales</span>
                  <h4 className="text-info fw-bold mb-0 mt-1">
                    PKR {fmt(data.total_sales)}
                  </h4>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm border-0 border-start border-primary border-4 h-100">
                <div className="card-body p-3">
                  <span className="text-muted small fw-bold">Total Purchase</span>
                  <h4 className="text-primary fw-bold mb-0 mt-1">
                    PKR {fmt(data.total_purchase)}
                  </h4>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm border-0 border-start border-success border-4 h-100">
                <div className="card-body p-3">
                  <span className="text-muted small fw-bold">Base Profit</span>
                  <h4 className="text-success fw-bold mb-0 mt-1">
                    PKR {fmt(data.base_profit)}
                  </h4>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card shadow-sm border-0 border-start border-warning border-4 h-100">
                <div className="card-body p-3">
                  <span className="text-muted small fw-bold">Supplier Adj.</span>
                  <h4 className="text-warning fw-bold mb-0 mt-1">
                    PKR {fmt(data.supplier_adjustment)}
                  </h4>
                </div>
              </div>
            </div>
          </div>

          {/* NET PROFIT CARD */}
          <div className="card bg-success text-white shadow-sm border-0 mb-4">
            <div className="card-body text-center py-3">
              <span className="text-white-50 text-uppercase fw-bold small">
                🌟 Net Profit
              </span>
              <h2 className="fw-extrabold text-white mb-0 mt-1">
                PKR {fmt(data.net_profit)}
              </h2>
            </div>
          </div>

          {/* DETAIL TABLE */}
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-2">
              <h6 className="mb-0 fw-bold text-dark">📊 Detailed Breakdown</h6>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0">
                  <tbody style={{ fontSize: "14px" }}>
                    <tr>
                      <td className="ps-3 fw-bold">Total Sales</td>
                      <td className="text-end pe-3 text-info fw-bold fs-6">
                        {fmt(data.total_sales)}
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3 fw-bold">Total Purchase</td>
                      <td className="text-end pe-3 text-primary fw-bold fs-6">
                        {fmt(data.total_purchase)}
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3 fw-bold">Base Profit</td>
                      <td className="text-end pe-3 text-success fw-bold fs-6">
                        {fmt(data.base_profit)}
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3 fw-bold">Supplier Adjustment</td>
                      <td className="text-end pe-3 text-warning fw-bold fs-6">
                        {fmt(data.supplier_adjustment)}
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3 fw-bold">Customer Adjustment</td>
                      <td className="text-end pe-3 text-danger fw-bold fs-6">
                        {fmt(data.customer_adjustment)}
                      </td>
                    </tr>
                    <tr>
                      <td className="ps-3 fw-bold">Total Expense</td>
                      <td className="text-end pe-3 text-danger fw-bold fs-6">
                        {fmt(data.total_expense)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}