import React, { useEffect, useState } from "react";

const fmt = (v) => Number(v || 0).toLocaleString("en-US");

export default function PurchaseAdjustmentReport({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase-payments`
    );
    const d = await r.json();

    if (d.success) {
      const adj = d.rows.filter((r) => r.type === "adjustment");
      setRows(adj);
    }
  };

  const filtered = rows.filter(
    (r) =>
      (r.supplier_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.ref_no || "").toLowerCase().includes(search.toLowerCase())
  );

  const total = filtered.reduce((s, r) => s + Number(r.amount || 0), 0);

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between mb-3">
        <h4 className="fw-bold text-danger">📉 Purchase Adjustment Report</h4>
        <button className="btn btn-sm btn-outline-secondary"
          onClick={() => onNavigate("dashboard")}>
          ⬅ Back
        </button>
      </div>

      <input
        className="form-control form-control-sm mb-3"
        placeholder="🔍 Search supplier / ref"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <table className="table table-bordered table-sm">
        <thead className="table-light">
          <tr>
            <th>Date</th>
            <th>Supplier</th>
            <th>Ref No</th>
            <th>Amount</th>
            <th>Note</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r, i) => (
            <tr key={i}>
              <td>{r.payment_date}</td>
              <td className="fw-bold">{r.supplier_name}</td>
              <td>{r.ref_no}</td>
              <td className="text-danger fw-bold">{fmt(r.amount)}</td>
              <td>{r.note || "-"}</td>
            </tr>
          ))}
          <tr className="table-secondary fw-bold">
            <td colSpan="3">TOTAL</td>
            <td>{fmt(total)}</td>
            <td></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
