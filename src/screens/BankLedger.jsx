import React, { useEffect, useState } from "react";

/* ================= HELPERS ================= */

// 300000 → 300,000
const fmtAmount = (v) =>
  v ? Number(v).toLocaleString("en-US") : "-";

// NUMBER → WORDS
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

  /* ================= FILTER ================= */
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

  /* ================= SAVE ================= */
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

  /* ================= DELETE ================= */
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

  return (
    <div className="container py-4">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="fw-bold text-success mb-0">
          🏦 Bank Ledger
        </h4>
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
      </div>

      {/* MESSAGE */}
      {msg && (
        <div className={`alert alert-${msg.type} py-2`}>
          {msg.text}
        </div>
      )}

      {/* FILTER CARD */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-3">
              <label className="form-label small">From Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label small">To Date</label>
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

      {/* ENTRY CARD */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h6 className="fw-bold mb-2">➕ Add Transaction</h6>

          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <label className="form-label small">Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <label className="form-label small">Amount</label>
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
              <label className="form-label small">Type</label>
              <select
                className="form-control form-control-sm"
                value={type}
                onChange={(e) => setType(e.target.value)}
              >
                <option value="deposit">Deposit</option>
                <option value="withdraw">Withdraw</option>
              </select>
            </div>

            <div className="col-md-4">
              <label className="form-label small">Comment</label>
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
                💾 Save
              </button>
            </div>
          </div>

          {amount && (
            <div className="text-muted small mt-2">
              💬 <i>{numberToWords(amount.replace(/,/g, ""))}</i>
            </div>
          )}
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0">
              <thead className="table-light">
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
                {filtered.map((r, i) => (
                  <tr key={i}>
                    <td>
                      {new Date(r.txn_date).toLocaleDateString("en-GB")}
                    </td>
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
                    <td className="text-center">
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

    </div>
  );
}
