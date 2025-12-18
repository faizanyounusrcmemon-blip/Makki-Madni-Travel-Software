import React, { useState } from "react";

export default function CustomerLedger({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("payment");
  const [method, setMethod] = useState("Cash");

  const loadLedger = async () => {
    if (!refNo) return alert("Ref No required");

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/${refNo}`
    );
    const data = await res.json();
    if (data.success) setRows(data.rows);
    else alert(data.error);
  };

  const saveEntry = async () => {
    if (!amount || !date) return alert("Amount & Date required");

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/payment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref_no: refNo,
          payment_date: date,
          amount,
          payment_method: method,
          type
        })
      }
    );

    const data = await res.json();
    if (data.success) {
      setAmount("");
      loadLedger();
    } else alert(data.error);
  };

  const del = async (id) => {
    const pass = prompt("Enter password");
    if (!pass) return;

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/delete/${id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass })
      }
    );
    const d = await r.json();
    if (d.success) loadLedger();
    else alert(d.error);
  };

  return (
    <div className="container p-3">
      <button onClick={() => onNavigate("dashboard")}>⬅ Back</button>

      <h4 className="mt-2 text-info fw-bold">
        📘 CUSTOMER LEDGER {refNo && `— ${refNo}`}
      </h4>

      <div className="d-flex gap-2 mt-3">
        <input
          className="form-control"
          placeholder="Ref No"
          value={refNo}
          onChange={(e) => setRefNo(e.target.value)}
        />
        <button className="btn btn-primary" onClick={loadLedger}>
          Load
        </button>
      </div>

      <div className="row g-2 mt-3">
        <div className="col-md-3">
          <input type="date" className="form-control" value={date}
            onChange={(e) => setDate(e.target.value)} />
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

      <button className="btn btn-success mt-2" onClick={saveEntry}>
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
