import React, { useState } from "react";

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
      <button className="btn btn-secondary btn-sm mb-2"
        onClick={() => onNavigate("dashboard")}>
        ⬅ Back
      </button>

      <h4>📈 PROFIT REPORT</h4>

      {/* FILTERS */}
      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <input
            className="form-control"
            value={year}
            onChange={e => setYear(e.target.value)}
            placeholder="Year"
          />
        </div>

        <div className="col-md-3">
          <select
            className="form-control"
            value={month}
            onChange={e => setMonth(e.target.value)}
          >
            <option value="">All Months</option>
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(m=>(
              <option key={m} value={m}>
                {new Date(0,m-1).toLocaleString("en",{month:"long"})}
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
              <th>Total Sales</th>
              <td>{data.total_sales.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Total Purchase</th>
              <td>{data.total_purchase.toLocaleString()}</td>
            </tr>
            <tr>
              <th>Purchase Adjustment (+)</th>
              <td className="text-success">
                {data.purchase_adjustment.toLocaleString()}
              </td>
            </tr>
            <tr>
              <th>Customer Adjustment (–)</th>
              <td className="text-danger">
                {data.customer_adjustment.toLocaleString()}
              </td>
            </tr>
            <tr className="table-success">
              <th>NET PROFIT</th>
              <td className="fw-bold">
                {data.profit.toLocaleString()}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
