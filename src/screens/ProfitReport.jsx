import React, { useState } from "react";

/* ================= FORMAT ================= */
const fmt = (v) =>
  Math.round(v || 0).toLocaleString("en-US");

export default function ProfitReport({ onNavigate }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState("");
  const [data, setData] = useState(null);

  const load = async () => {
    const qs = new URLSearchParams();
    if (year) qs.append("year", year);
    if (month) qs.append("month", month);

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/profit-report?${qs}`
    );
    const d = await r.json();
    if (d.success) setData(d.report);
    else alert(d.error);
  };

  return (
    <div className="profit-wrap">
      <div className="container py-4">

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold text-white mb-0">
              💰 Profit Dashboard
            </h3>
            <small className="text-white-50">
              Colorful business performance
            </small>
          </div>

          <button
            className="btn btn-light btn-sm"
            onClick={() => onNavigate("dashboard")}
          >
            ⬅ Back
          </button>
        </div>

        {/* FILTER CARD */}
        <div className="card glass-card mb-4">
          <div className="card-body">
            <div className="row g-2 align-items-end">
              <div className="col-md-3">
                <label className="form-label text-white">Year</label>
                <input
                  className="form-control"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label text-white">Month</label>
                <select
                  className="form-control"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                >
                  <option value="">All Months</option>
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
                    <option key={m} value={m}>
                      {new Date(0, m - 1).toLocaleString("en", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-md-2">
                <button
                  className="btn btn-warning w-100 fw-bold"
                  onClick={load}
                >
                  🚀 Load
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* DASHBOARD */}
        {data && (
          <>
            {/* SUMMARY CARDS */}
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="stat-card blue">
                  <span>Total Sales</span>
                  <h4>PKR {fmt(data.total_sales)}</h4>
                </div>
              </div>

              <div className="col-md-3">
                <div className="stat-card purple">
                  <span>Total Purchase</span>
                  <h4>PKR {fmt(data.total_purchase)}</h4>
                </div>
              </div>

              <div className="col-md-3">
                <div className="stat-card green">
                  <span>Base Profit</span>
                  <h4>PKR {fmt(data.base_profit)}</h4>
                </div>
              </div>

              <div className="col-md-3">
                <div className="stat-card red">
                  <span>Total Expense</span>
                  <h4>PKR {fmt(data.total_expense)}</h4>
                </div>
              </div>
            </div>

            {/* NET PROFIT */}
            <div className="card net-profit-card mb-4">
              <div className="card-body text-center">
                <small>🌟 NET PROFIT</small>
                <h2>
                  PKR {fmt(data.net_profit)}
                </h2>
              </div>
            </div>

            {/* DETAIL TABLE */}
            <div className="card glass-card">
              <div className="card-body">
                <h5 className="text-white fw-bold mb-3">
                  📊 Detailed Breakdown
                </h5>

                <table className="table table-borderless text-white">
                  <tbody>
                    <tr>
                      <td>Total Sales</td>
                      <td className="text-end text-info">
                        {fmt(data.total_sales)}
                      </td>
                    </tr>
                    <tr>
                      <td>Total Purchase</td>
                      <td className="text-end text-primary">
                        {fmt(data.total_purchase)}
                      </td>
                    </tr>
                    <tr>
                      <td>Base Profit</td>
                      <td className="text-end text-success fw-bold">
                        {fmt(data.base_profit)}
                      </td>
                    </tr>
                    <tr>
                      <td>Purchase Adjustment</td>
                      <td className="text-end text-warning fw-bold">
                        {fmt(data.purchase_adjustment)}
                      </td>
                    </tr>
                    <tr>
                      <td>Customer Adjustment</td>
                      <td className="text-end text-danger fw-bold">
                        {fmt(data.customer_adjustment)}
                      </td>
                    </tr>
                    <tr>
                      <td>Total Expense</td>
                      <td className="text-end text-danger fw-bold">
                        {fmt(data.total_expense)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* STYLES */}
      <style>{`
        .profit-wrap {
          min-height: 100vh;
          background: linear-gradient(135deg, #1d2671, #c33764);
        }

        .glass-card {
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(14px);
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.2);
        }

        .stat-card {
          padding: 18px;
          border-radius: 18px;
          color: white;
          box-shadow: 0 15px 35px rgba(0,0,0,0.25);
        }

        .stat-card span {
          font-size: 13px;
          opacity: 0.9;
        }

        .stat-card h4 {
          margin-top: 6px;
          font-weight: 800;
        }

        .blue {
          background: linear-gradient(135deg, #2193b0, #6dd5ed);
        }

        .purple {
          background: linear-gradient(135deg, #7f00ff, #e100ff);
        }

        .green {
          background: linear-gradient(135deg, #11998e, #38ef7d);
        }

        .red {
          background: linear-gradient(135deg, #cb2d3e, #ef473a);
        }

        .net-profit-card {
          background: linear-gradient(135deg, #f7971e, #ffd200);
          border-radius: 20px;
          box-shadow: 0 20px 45px rgba(0,0,0,0.3);
        }

        .net-profit-card small {
          color: #000;
          opacity: 0.7;
        }

        .net-profit-card h2 {
          font-weight: 900;
          color: #000;
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
}
