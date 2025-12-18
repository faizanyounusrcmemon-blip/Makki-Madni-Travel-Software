import React, { useEffect, useState } from "react";

export default function BankLedger({ onNavigate }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger`
    );
    const d = await r.json();
    if (d.success) setRows(d.rows);
  };

  return (
    <div className="container p-3">
      <button className="btn btn-secondary btn-sm mb-2" onClick={() => onNavigate("dashboard")}>
        ⬅ Back
      </button>

      <h4 className="text-success fw-bold mb-3">
        🏦 BANK LEDGER (AUTO CALCULATED)
      </h4>

      <table className="table table-bordered table-sm">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>In</th>
            <th>Out</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan="5" className="text-center">No entries</td></tr>
          )}

          {rows.map((r, i) => (
            <tr key={i}>
              <td>{new Date(r.date).toLocaleDateString()}</td>
              <td>{r.desc}</td>
              <td>{r.in || "-"}</td>
              <td>{r.out || "-"}</td>
              <td><b>{r.balance}</b></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
