import React, { useEffect, useState } from "react";

export default function Ledger({ onNavigate }) {
  const [rows, setRows] = useState([]);

  const loadLedger = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/ledger/list`
    );
    const data = await res.json();
    if (data.success) setRows(data.rows);
  };

  useEffect(() => {
    loadLedger();
  }, []);

  let balance = 0;

  return (
    <div className="container p-3">
      <div className="d-flex justify-content-between mb-3">
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>
          ⬅ Back
        </button>
        <h4>📒 Ledger</h4>
      </div>

      <table className="table table-bordered table-sm">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Ref No</th>
            <th>Description</th>
            <th>Debit (Purchase)</th>
            <th>Credit (Sale)</th>
            <th>Balance</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((r, i) => {
            balance += Number(r.credit) - Number(r.debit);
            return (
              <tr key={i}>
                <td>{new Date(r.date).toLocaleDateString()}</td>
                <td>{r.ref_no}</td>
                <td>{r.description}</td>
                <td>{r.debit ? r.debit.toLocaleString() : "-"}</td>
                <td>{r.credit ? r.credit.toLocaleString() : "-"}</td>
                <td className="fw-bold">{balance.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
