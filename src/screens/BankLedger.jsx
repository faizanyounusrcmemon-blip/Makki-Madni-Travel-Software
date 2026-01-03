import React, { useEffect, useState } from "react";

/* ================= HELPERS ================= */

const fmtAmount = (v) =>
  v !== null && v !== undefined
    ? Number(v).toLocaleString("en-US")
    : "-";

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
  const [filtered, setFiltered] = useState([]);
  const [msg, setMsg] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("deposit");
  const [comment, setComment] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger`
    );
    const d = await r.json();
    if (d.success) {
      const list = d.rows.slice().reverse();
      setRows(list);
      setFiltered(list);
    }
  };

  useEffect(() => {
    let temp = [...rows];
    if (fromDate)
      temp = temp.filter(
        (r) => new Date(r.txn_date) >= new Date(fromDate)
      );
    if (toDate)
      temp = temp.filter(
        (r) => new Date(r.txn_date) <= new Date(toDate)
      );
    setFiltered(temp);
  }, [fromDate, toDate, rows]);

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
          comment,
        }),
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

  const del = async (id) => {
    const pass = prompt("Delete password");
    if (!pass) return;

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger/transaction/${id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
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

  const currentBalance =
    filtered.length > 0 ? filtered[0].balance : 0;

  return (
    <div className="container py-4">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold">
          🏦 Bank Ledger
        </h4>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
      </div>

      {/* BALANCE CARD */}
      <div className="card shadow-sm mb-3 border-0">
        <div className="card-body d-flex justify-content-between align-items-center">
          <div>
            <small className="text-muted">Current Balance</small>
            <h3 className="fw-bold text-success mb-0">
              PKR {fmtAmount(currentBalance)}
            </h3>
          </div>
          <div className="fs-1">💳</div>
        </div>
      </div>

      {/* MESSAGE */}
      {msg && (
        <div className={`alert alert-${msg.type} py-2`}>
          {msg.text}
        </div>
      )}

      {/* FILTER */}
      <div className="card shadow-sm mb-3 border-0">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <input
                type="date"
                className="form-control form-control-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <input
                type="date"
                className="form-control form-control-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ENTRY */}
      <div className="card shadow-sm mb-3 border-0">
        <div className="card-body">
          <h6 className="fw-bold mb-3">➕ New Transaction</h6>

          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <input
                type="date"
                className="form-control form-control-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <input
                className="form-control form-control-sm"
                placeholder="Amount"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                      .replace(/,/g, "")
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  )
                }
              />
            </div>

            <div className="col-md-2">
              <select
                className="form-select form-select-sm"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="deposit">➕ Deposit</option>
                <option value="withdraw">➖ Withdraw</option>
              </select>
            </div>

            <div className="col-md-4">
              <input
                className="form-control form-control-sm"
                placeholder="Comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <button
                className="btn btn-success btn-sm w-100"
                onClick={save}
              >
                Save
              </button>
            </div>
          </div>

          {amount && (
            <div className="text-muted small mt-2">
              💬 {numberToWords(amount.replace(/,/g, ""))}
            </div>
          )}
        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th>Date</th>
                <th>Description</th>
                <th className="text-danger">Debit</th>
                <th className="text-success">Credit</th>
                <th>Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, i) => (
                <tr key={i}>
                  <td>{new Date(r.txn_date).toLocaleDateString()}</td>
                  <td>{r.description}</td>
                  <td className="text-danger">
                    {fmtAmount(r.debit)}
                  </td>
                  <td className="text-success">
                    {fmtAmount(r.credit)}
                  </td>
                  <td className="fw-bold">
                    {fmtAmount(r.balance)}
                  </td>
                  <td>
                    {r.source === "manual" && (
                      <button
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => del(r.id)}
                      >
                        ❌
                      </button>
                    )}
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-3">
                    No entries
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
