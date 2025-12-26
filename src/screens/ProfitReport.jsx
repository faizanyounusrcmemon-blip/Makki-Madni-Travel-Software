import React, { useState } from "react";

// helper → no decimals, standard amount
const fmt = (v) => Math.round(v || 0).toLocaleString("en-US");

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
    <div className="container p-3">
      <button
        className="btn btn-secondary btn-sm mb-2"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Back
      </button>

      <h4 className="fw-bold mb-3">📈 PROFIT REPORT</h4>

      {/* FILTERS */}
      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <input
            className="form-control"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="Year"
          />
        </div>

        <div className="col-md-3">
          <select
            className="form-control"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
          >
            <option value="">All Months</option>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m => (
              <option key={m} value={m}>
                {new Date(0, m - 1).toLocaleString("en", { month: "long" })}
              </option>
            ))}
          </select>
        </div>

        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={load}>
            Load
          </button>
        </div>
      </div>

      {/* REPORT */}
      {data && (
        <table className="table table-bordered w-50">
          <tbody>
            <tr>
              <th>Total Sales (Display)</th>
              <td>{fmt(data.total_sales)}</td>
            </tr>

            <tr>
              <th>Total Purchase (Display)</th>
              <td>{fmt(data.total_purchase)}</td>
            </tr>

            <tr>
              <th>Base Profit (From Purchase)</th>
              <td className="text-success">
                {fmt(data.base_profit)}
              </td>
            </tr>

            <tr>
              <th>Purchase Adjustment (+)</th>
              <td className="text-success">
                {fmt(data.purchase_adjustment)}
              </td>
            </tr>

            <tr>
              <th>Customer Adjustment (–)</th>
              <td className="text-danger">
                {fmt(data.customer_adjustment)}
              </td>
            </tr>

            <tr>
              <th>Total Expense (–)</th>
              <td className="text-danger">
                {fmt(data.total_expense)}
              </td>
            </tr>

            <tr className="table-success">
              <th>NET PROFIT</th>
              <td className="fw-bold">
                {fmt(data.net_profit)}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
