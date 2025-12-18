import React, { useState } from "react";

export default function PurchaseLedger({ onNavigate }) {
  const [ref, setRef] = useState("");
  const [rows, setRows] = useState([]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("payment");
  const [method, setMethod] = useState("Cash");

  const load = async () => {
    if (!ref) return alert("Ref No required");

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase-ledger/${ref}`
    );
    const d = await r.json();
    if (d.success) setRows(d.rows);
    else alert(d.error);
  };

  const pay = async () => {
    if (!amount || !date) return alert("Amount & Date required");

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase-ledger/payment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref_no: ref,
          payment_date: date,
          amount,
          payment_method: method,
          type
        })
      }
    );
    const d = await r.json();
    if (d.success) {
      setAmount("");
      load();
    } else alert(d.error);
  };

  const del = async (id) => {
    const pass = prompt("Enter password");
    if (!pass) return;

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase-ledger/delete/${id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass })
      }
    );
    const d = await r.json();
    if (d.success) load();
    else alert(d.error);
  };

  return (
    <div className="container p-3">
      <button onClick={() => onNavigate("dashboard")}>⬅ Back</button>

      <h4 className="mt-2 text-warning fw-bold">
        🧾 PURCHASE LEDGER {ref && `— ${ref}`}
      </h4>

      <div className="d-flex gap-2 mt-3">
        <input className="form-control" placeholder="Ref No"
          value={ref} onChange={(e) => setRef(e.target.value)} />
        <button className="btn btn-primary" onClick={load}>Load</button>
      </div>

      <div className="row g-2 mt-3">
        <div className="col-md-3">
          <input type="date" className="form-control"
            value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="col-md-3">
          <input className="form-control" placeholder="Amount"
            value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div className="col-md-3">
          <select className="form-control" value={type}
            onChange={(e) => setType(e.target.value)}>
            <option value="payment">Payment</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>
        <div className="col-md-3">
          <select className="form-control" value={method}
            onChange={(e) => setMethod(e.target.value)}>
            <option>Cash</option>
            <option>Bank</option>
          </select>
        </div>
      </div>

      <button className="btn btn-danger mt-2" onClick={pay}>
        Save Entry
      </button>

      <table className="table table-bordered table-sm mt-3">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Balance</th>
            <th width="60">❌</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center text-muted">
                No ledger entries
              </td>
            </tr>
          )}
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{new Date(r.created_at).toLocaleDateString()}</td>
              <td>{r.description}</td>
              <td>{r.debit || "-"}</td>
              <td>{r.credit || "-"}</td>
              <td className="fw-bold">{r.balance}</td>
              <td>
                <button className="btn btn-danger btn-sm"
                  onClick={() => del(r.id)}>Del</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
