import React, { useState, useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const fmt = (v) => Number(v || 0).toLocaleString("en-US");

export default function SaleChangeCheckReport({ onNavigate }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ref, setRef] = useState("");

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // 🔹 PURCHASE LIST
      const purchaseUrl = new URL(`${BACKEND_URL}/api/purchase/list`);
      if (from) purchaseUrl.searchParams.append("from", from);
      if (to) purchaseUrl.searchParams.append("to", to);
      if (ref) purchaseUrl.searchParams.append("ref", ref);

      const purchaseRes = await fetch(purchaseUrl.toString());
      if (!purchaseRes.ok) throw new Error("Failed to fetch purchase data");
      const purchaseData = await purchaseRes.json();
      if (!purchaseData.success) throw new Error(purchaseData.error || "Purchase API error");

      // Create map for faster lookup
      const purchaseMap = {};
      purchaseData.rows.forEach((p) => {
        const salePkr = parseFloat(p.sale_pkr) || 0;
        const purchasePkr = parseFloat(p.purchase_pkr) || 0;
        if (purchasePkr > 0) { // 🔹 Only include if purchase exists
          purchaseMap[p.ref_no] = salePkr;
        }
      });

      // 🔹 SALE DATA FROM REPORTS
      const reportRes = await fetch(`${BACKEND_URL}/api/reports/all`);
      if (!reportRes.ok) throw new Error("Failed to fetch reports");
      const reportData = await reportRes.json();

      // 🔹 COMBINE AND CALCULATE DIFF
      const combined = reportData
        .filter(r => r.total_pkr && purchaseMap[r.ref_no]) // 🔹 Only rows with purchase
        .map(r => {
          const saleFromPurchase = purchaseMap[r.ref_no] || 0;
          const saleFromReport = parseFloat(r.total_pkr) || 0;
          const diff = saleFromReport - saleFromPurchase;
          return {
            ref_no: r.ref_no,
            customer_name: r.customer_name,
            type: r.type,
            sale_report: saleFromReport,
            sale_purchase: saleFromPurchase,
            diff,
          };
        })
        .filter(row => row.diff !== 0); // 🔹 Hide rows where diff = 0

      setData(combined);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-4">
      {/* HEADING */}
      <div className="text-center mb-4">
        <h2 className="fw-bold text-primary">📊 Sale vs Purchase Check Report</h2>
        <p className="text-muted">Only showing mismatches and records with purchases</p>
      </div>

      {/* FILTERS */}
      <div className="row mb-3 g-2">
        <div className="col-md-3">
          <input
            type="date"
            className="form-control form-control-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            type="date"
            className="form-control form-control-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            type="text"
            className="form-control form-control-sm"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="Ref No / Customer"
          />
        </div>
        <div className="col-md-3 d-flex gap-2">
          <button className="btn btn-primary btn-sm w-50" onClick={loadData}>
            🔍 Load
          </button>
          <button className="btn btn-secondary btn-sm w-50" onClick={() => onNavigate && onNavigate("dashboard")}>
            ⬅ Back
          </button>
        </div>
      </div>

      {loading && <div>Loading...</div>}
      {error && <div className="text-danger">{error}</div>}

      {!loading && !error && (
        <div className="table-responsive">
          <table className="table table-bordered table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Ref No</th>
                <th>Customer Name</th>
                <th>Type</th>
                <th>Sale (Report)</th>
                <th>Sale (Purchase)</th>
                <th>Difference</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-muted">
                    No mismatches found
                  </td>
                </tr>
              )}
              {data.map((row, i) => (
                <tr key={row.ref_no}>
                  <td>{i + 1}</td>
                  <td>{row.ref_no}</td>
                  <td>{row.customer_name}</td>
                  <td>{row.type}</td>
                  <td>{fmt(row.sale_report)}</td>
                  <td>{fmt(row.sale_purchase)}</td>
                  <td style={{ color: "red", fontWeight: "bold" }}>
                    {fmt(row.diff)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
