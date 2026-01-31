import React, { useState, useEffect } from "react";
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// Formatter
const fmt = (v) => Number(v || 0).toLocaleString("en-US");

export default function ItemLossZeroReport({ onNavigate }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${BACKEND_URL}/api/reports/supplier-purchase`);
      if (!res.ok) throw new Error("Failed to fetch data");
      const json = await res.json();
      if (!json.success) throw new Error("API returned error");

      const filtered = (json.rows || []).filter(r => r.purchase_pkr > 0);
      setData(filtered);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const lossData = data.filter(d => d.profit < 0);
  const zeroProfitData = data.filter(d => d.profit === 0);

  const renderTable = (rows) => (
    <div className="table-responsive">
      <table className="table table-bordered table-hover align-middle text-center">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Ref No</th>
            <th>Item</th>
            <th>Supplier</th>
            <th>Sale SAR</th>
            <th>Sale Rate</th>
            <th>Sale PKR</th>
            <th>Purchase SAR</th>
            <th>Purchase Rate</th>
            <th>Purchase PKR</th>
            <th>Profit</th>
            <th>Booking Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="12" className="text-muted py-3">
                No records found
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={r.id}>
              <td>{i + 1}</td>
              <td className="fw-bold">{r.ref_no}</td>
              <td>{r.item}</td>
              <td>{r.supplier_name}</td>
              <td>{fmt(r.sale_sar)}</td>
              <td>{fmt(r.sale_rate)}</td>
              <td>{fmt(r.sale_pkr)}</td>
              <td>{fmt(r.purchase_sar)}</td>
              <td>{fmt(r.purchase_rate)}</td>
              <td>{fmt(r.purchase_pkr)}</td>
              <td
                style={{ color: r.profit < 0 ? "#d9534f" : "#f0ad4e", fontWeight: "bold" }}
              >
                {fmt(r.profit)}
              </td>
              <td>{new Date(r.booking_date).toLocaleDateString("en-GB")}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  if (loading) return <div className="p-5 text-center fs-5">Loading report...</div>;
  if (error) return <div className="p-5 text-center text-danger fs-5">{error}</div>;

  return (
    <div className="container my-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold text-primary">
          📊 Item Loss & Zero Profit Report
        </h2>
        <button
          className="btn btn-outline-secondary"
          onClick={() => onNavigate && onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
      </div>

      {/* 🔹 Loss Report Card */}
      <div className="card mb-5 border-danger shadow-sm">
        <div className="card-header bg-danger text-white fw-bold">
          Loss Report (Profit &lt; 0)
        </div>
        <div className="card-body p-0">{renderTable(lossData)}</div>
      </div>

      {/* 🔹 Zero Profit Report Card */}
      <div className="card mb-5 border-warning shadow-sm">
        <div className="card-header bg-warning text-dark fw-bold">
          Zero Profit Report (Profit = 0)
        </div>
        <div className="card-body p-0">{renderTable(zeroProfitData)}</div>
      </div>
    </div>
  );
}
