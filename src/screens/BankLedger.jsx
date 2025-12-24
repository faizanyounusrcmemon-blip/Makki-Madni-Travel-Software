import React, { useEffect, useState } from "react";

/* ================= HELPERS ================= */

// 300000 → 300,000
const fmtAmount = (v) =>
  v ? Number(v).toLocaleString("en-US") : "-";

// NUMBER → WORDS (PROPER)
const numberToWords = (num) => {
  if (!num) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
    currencyDisplay: "name",
    maximumFractionDigits: 0,
  })
    .format(num)
    .replace("Pakistani rupees", "Rupees");
};

export default function BankLedger({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState(null);

  const [date, setDate] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("deposit");
  const [comment, setComment] = useState("");

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

  /* SAVE */
  const save = async () => {
    if (!date || !amount) {
      setMsg({ type: "danger", text: "Date & Amount required" });
      return;
    }

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger/transaction`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txn_date: date,
          type,
          amount: amount.replace(/,/g, ""),
          comment
        })
      }
    );

    const d = await r.json();

    if (d.success) {
      setMsg({ type: "success", text: d.message });
      setAmount("");
      setComment("");
      load();
    } else {
      setMsg({ type: "danger", text: d.error });
    }
  };

  /* DELETE */
  const del = async (id) => {
    const pass = prompt("Delete password");
    if (!pass) return;

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger/transaction/${id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass })
      }
    );

    const d = await r.json();

    if (d.success) {
      setMsg({ type: "success", text: d.message });
      load();
    } else {
      setMsg({ type: "danger", text: d.error });
    }
  };

  return (
    <div className="container p-3">

      <button
        className="btn btn-secondary btn-sm mb-2"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Back
      </button>

      <h4 className="fw-bold text-success mb-2">
        🏦 BANK LEDGER (AUTO + MANUAL)
      </h4>

      {/* MESSAGE */}
      {msg && (
        <div className={`alert alert-${msg.type} py-2`}>
          {msg.text}
        </div>
      )}

      {/* MANUAL ENTRY */}
      <div className="row g-2 mb-2">
        <div className="col-md-2">
          <input type="date" className="form-control"
            value={date}
            onChange={e => setDate(e.target.value)} />
        </div>

        <div className="col-md-2">
          <input
            className="form-control"
            placeholder="Amount"
            value={amount}
            onChange={e =>
              setAmount(
                e.target.value
                  .replace(/,/g, "")
                  .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
              )
            }
          />
        </div>

        <div className="col-md-2">
          <select className="form-control"
            value={type}
            onChange={e => setType(e.target.value)}>
            <option value="deposit">Deposit</option>
            <option value="withdraw">Withdraw</option>
          </select>
        </div>

        <div className="col-md-4">
          <input className="form-control"
            placeholder="Comment"
            value={comment}
            onChange={e => setComment(e.target.value)} />
        </div>

        <div className="col-md-2">
          <button className="btn btn-success w-100" onClick={save}>
            Save
          </button>
        </div>
      </div>

      {/* AMOUNT IN WORDS */}
      {amount && (
        <div className="text-muted mb-3">
          💬 <i>{numberToWords(amount.replace(/,/g, ""))}</i>
        </div>
      )}

      {/* TABLE */}
      <table className="table table-bordered table-sm">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Debit</th>
            <th>Credit</th>
            <th>Balance</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{new Date(r.txn_date).toLocaleDateString()}</td>
              <td>{r.description}</td>
              <td className="text-danger">{fmtAmount(r.debit)}</td>
              <td className="text-success">{fmtAmount(r.credit)}</td>
              <td><b>{fmtAmount(r.balance)}</b></td>
              <td>
                {r.source === "manual" && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => del(r.id)}
                  >
                    ❌
                  </button>
                )}
              </td>
            </tr>
          ))}

          {rows.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center">
                No entries
              </td>
            </tr>
          )}
        </tbody>
      </table>

    </div>
  );
}
