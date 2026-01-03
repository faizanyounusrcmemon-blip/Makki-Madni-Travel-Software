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
    <div className="profit-bg">
      <div className="container py-4">

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="fw-bold mb-0">Profit Report</h3>
            <small className="text-muted">
              Business performance summary
            </small>
          </div>

          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => onNavigate("dashboard")}
          >
            ⬅ Back
          </button>
        </div>

        {/* FILTERS */}
        <div className="card soft-card mb-4">
          <div className="card-body">
            <div className="row g-2 align-items-end">
              <div className="col-md-3">
                <label className="form-label small">Year</label>
                <input
                  className="form-control"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                />
              </div>

              <div className="col-md-3">
                <label className="form-label small">Month</label>
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
                  className="btn btn-success w-100"
                  onClick={load}
                >
                  Load Report
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* SUMMARY CARDS */}
        {data && (
          <>
            <div className="row g-3 mb-4">
              <div className="col-md-3">
                <div className="summary-card">
                  <small>Total Sales</small>
                  <h5>PKR {fmt(data.total_sales)}</h5>
                </div>
              </div>

              <div className="col-md-3">
                <div className="summary-card">
                  <small>Total Purchase</small>
                  <h5>PKR {fmt(data.total_purchase)}</h5>
                </div>
              </div>

              <div className="col-md-3">
                <div className="summary-card green">
                  <small>Base Profit</small>
                  <h5>PKR {fmt(data.base_profit)}</h5>
                </div>
              </div>

              <div className="col-md-3">
                <div className="summary-card red">
                  <small>Total Expense</small>
                  <h5>PKR {fmt(data.total_expense)}</h5>
                </div>
              </div>
            </div>

            {/* REPORT DETAIL */}
            <div className="card report-card">
              <div className="card-body">
                <h5 className="fw-bold mb-3">
                  Detailed Profit Calculation
                </h5>

                <table className="table mb-0">
                  <tbody>
                    <tr>
                      <td>Total Sales</td>
                      <td className="text-end">
                        {fmt(data.total_sales)}
                      </td>
                    </tr>

                    <tr>
                      <td>Total Purchase</td>
                      <td className="text-end">
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
                      <td>Purchase Adjustment (+)</td>
                      <td className="text-end text-warning fw-bold">
                        {fmt(data.purchase_adjustment)}
                      </td>
                    </tr>

                    <tr>
                      <td>Customer Adjustment (–)</td>
                      <td className="text-end text-danger fw-bold">
                        {fmt(data.customer_adjustment)}
                      </td>
                    </tr>

                    <tr>
                      <td>Total Expense (–)</td>
                      <td className="text-end text-danger fw-bold">
                        {fmt(data.total_expense)}
                      </td>
                    </tr>

                    <tr className="net-row">
                      <td>NET PROFIT</td>
                      <td className="text-end">
                        PKR {fmt(data.net_profit)}
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
        .profit-bg {
          min-height: 100vh;
          background: #f5f7fa;
        }

        .soft-card {
          border: none;
          border-radius: 16px;
          box-shadow: 0 12px 30px rgba(0,0,0,0.06);
        }

        .summary-card {
          background: white;
          padding: 16px;
          border-radius: 14px;
          box-shadow: 0 10px 25px rgba(0,0,0,0.06);
        }

        .summary-card small {
          color: #6b7280;
        }

        .summary-card h5 {
          margin-top: 6px;
          font-weight: 700;
        }

        .summary-card.green h5 {
          color: #0f766e;
        }

        .summary-card.red h5 {
          color: #b91c1c;
        }

        .report-card {
          border: none;
          border-radius: 18px;
          box-shadow: 0 18px 40px rgba(0,0,0,0.08);
        }

        .report-card table td {
          padding: 10px 6px;
        }

        .net-row td {
          font-weight: 800;
          font-size: 16px;
          border-top: 2px solid #e5e7eb;
        }
      `}</style>
    </div>
  );
}
