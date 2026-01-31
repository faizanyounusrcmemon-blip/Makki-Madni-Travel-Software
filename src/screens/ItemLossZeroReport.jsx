import React, { useState, useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
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
      console.log("API Response:", json); // 🔹 Debug
      if (!json.success) throw new Error("API returned error");

      // Ensure profit is numeric
      const rows = (json.rows || []).map(r => ({
        ...r,
        profit: Number(r.profit || 0),
        sale_pkr: Number(r.sale_pkr || 0),
        purchase_pkr: Number(r.purchase_pkr || 0),
      }));

      setData(rows);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Split data into Loss (<0) and Zero Profit (=0), ignore positive profit
  const lossData = data.filter(d => d.profit < 0);
  const zeroProfitData = data.filter(d => d.profit === 0 && d.purchase_pkr > 0);

  const renderTable = (rows) => (
    <div className="table-responsive mb-4">
      <table className="table table-bordered table-striped table-hover">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Ref No</th>
            <th>Item</th>
            <th>Supplier</th>
            <th>Sale (PKR)</th>
            <th>Purchase (PKR)</th>
            <th>Profit</th>
            <th>Booking Date</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="8" className="text-center text-muted">
                No records found
              </td>
            </tr>
          )}
          {rows.map((r, i) => (
            <tr key={r.id}>
              <td>{i + 1}</td>
              <td>{r.ref_no}</td>
              <td>{r.item}</td>
              <td>{r.supplier_name || "-"}</td>
              <td>{fmt(r.sale_pkr)}</td>
              <td>{fmt(r.purchase_pkr)}</td>
              <td
                style={{
                  color: r.profit < 0 ? "red" : "orange",
                  fontWeight: "bold",
                }}
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

  if (loading) return <div className="p-3">Loading...</div>;
  if (error) return <div className="text-danger p-3">{error}</div>;

  return (
    <div className="container my-4">
      {/* 🔹 Header & Back */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="fw-bold text-primary">📊 Item Loss & Zero Profit Report</h2>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate && onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
      </div>

      {/* 🔹 Loss Report */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-danger text-white fw-bold">
          Loss Report (Profit &lt; 0)
        </div>
        <div className="card-body p-2">
          {renderTable(lossData)}
        </div>
      </div>

      {/* 🔹 Zero Profit Report */}
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-warning text-dark fw-bold">
          Zero Profit Report (Profit = 0)
        </div>
        <div className="card-body p-2">
          {renderTable(zeroProfitData)}
        </div>
      </div>
    </div>
  );
}
