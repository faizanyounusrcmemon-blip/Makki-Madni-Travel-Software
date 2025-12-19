import React, { useEffect, useState } from "react";

export default function BankLedger({ onNavigate }) {
  const [rows, setRows] = useState([]);

  // MANUAL ENTRY STATES
  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("deposit");
  const [comment, setComment] = useState("");

  useEffect(() => {
    load();
  }, []);

  // LOAD AUTO + MANUAL LEDGER
  const load = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger`
    );
    const d = await r.json();
    if (d.success) setRows(d.rows);
  };

  // SAVE MANUAL ENTRY
  const save = async () => {
    if (!date || !amount) {
      alert("Date & Amount required");
      return;
    }

    await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger/transaction`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txn_date: date,
          type,
          amount,
          comment
        })
      }
    );

    setAmount("");
    setComment("");
    load();
  };

  return (
    <div className="container p-3">

      {/* BACK */}
      <button
        className="btn btn-secondary btn-sm mb-2"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Back
      </button>

      {/* HEADING */}
      <h4 className="fw-bold text-success mb-3">
        🏦 BANK LEDGER (AUTO + MANUAL)
      </h4>

      {/* MANUAL ENTRY */}
      <div className="row g-2 mb-3">
        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <input
            type="number"
            className="form-control"
            placeholder="Amount"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <select
            className="form-control"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="deposit">Deposit</option>
            <option value="withdraw">Withdraw</option>
          </select>
        </div>

        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Comment / Reason"
            value={comment}
            onChange={e => setComment(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <button className="btn btn-success w-100" onClick={save}>
            Save
          </button>
        </div>
      </div>

      {/* LEDGER TABLE */}
      <table className="table table-bordered table-sm">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Debit (Out)</th>
            <th>Credit (In)</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center">
                No entries
              </td>
            </tr>
          )}

          {rows.map((r, i) => (
            <tr key={i}>
              <td>
                {r.txn_date
                  ? new Date(r.txn_date).toLocaleDateString()
                  : r.date
                  ? new Date(r.date).toLocaleDateString()
                  : "-"}
              </td>
              <td>{r.description || r.comment || "-"}</td>
              <td className="text-danger">
                {r.debit || r.out || "-"}
              </td>
              <td className="text-success">
                {r.credit || r.in || "-"}
              </td>
              <td><b>{r.balance}</b></td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
