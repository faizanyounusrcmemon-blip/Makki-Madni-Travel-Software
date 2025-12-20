import React, { useEffect, useState } from "react";

export default function PendingPurchase({ onNavigate }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase/pending`
    );
    const d = await r.json();
    if (d.success) setRows(d.rows);
  };

  return (
    <div className="container p-3">
      <button
        className="btn btn-secondary btn-sm mb-2"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Back
      </button>

      <h4 className="fw-bold text-danger">
        ⏳ Pending Purchases (Sale Done, Purchase Missing)
      </h4>

      <table className="table table-bordered table-sm mt-3">
        <thead className="table-light">
          <tr>
            <th>Ref No</th>
            <th>Type</th>
            <th>Date</th>
            <th>Action</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="4" className="text-center text-success">
                🎉 No pending purchases
              </td>
            </tr>
          )}

          {rows.map((r, i) => (
            <tr key={i}>
              <td className="fw-bold">{r.ref_no}</td>
              <td>{r.type}</td>
              <td>{new Date(r.created_at).toLocaleDateString()}</td>
              <td>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => onNavigate("purchase", r.ref_no)}
                >
                  ➕ Add Purchase
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
