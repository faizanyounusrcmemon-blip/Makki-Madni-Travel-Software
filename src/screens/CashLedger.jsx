import React, { useEffect, useState } from "react";

/* ================= HELPERS ================= */
const fmtAmount = (v) =>
  v !== null && v !== undefined
    ? Number(v).toLocaleString("en-US")
    : "-";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d
    .toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .toUpperCase();
};

export default function CashLedger({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
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
      `${import.meta.env.VITE_BACKEND_URL}/api/cash-ledger`
    );
    const d = await r.json();
    if (d.success) {
      const list = d.rows.slice().reverse();
      setRows(list);
      setFiltered(list);
    }
  };

  /* ================= FILTER / SEARCH ================= */
  useEffect(() => {
    let temp = [...rows];

    if (fromDate)
      temp = temp.filter((r) => new Date(r.txn_date) >= new Date(fromDate));
    if (toDate)
      temp = temp.filter((r) => new Date(r.txn_date) <= new Date(toDate));

    if (search) {
      const s = search.toLowerCase();
      temp = temp.filter(
        (r) =>
          formatDate(r.txn_date).toLowerCase().includes(s) ||
          (r.description || "").toLowerCase().includes(s) ||
          (r.debit || "").toString().includes(s) ||
          (r.credit || "").toString().includes(s) ||
          (r.balance || "").toString().includes(s)
      );
    }

    setFiltered(temp);
  }, [fromDate, toDate, search, rows]);

  const save = async () => {
    if (!date || !amount) {
      setMsg({ type: "danger", text: "Date & Amount required" });
      return;
    }

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/cash-ledger/transaction`,
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
    const pass = prompt("Enter delete password");
    if (!pass) return;

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/cash-ledger/transaction/${id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      }
    );

    const d = await r.json();
    if (d.success) load();
    else alert(d.error);
  };

  const currentBalance = filtered.length ? filtered[0].balance : 0;

  return (
    <div className="container py-4">
      <div className="d-flex justify-content-between mb-3">
        <h4 className="fw-bold text-success">💵 Cash Ledger</h4>
        <button className="btn btn-outline-secondary btn-sm"
          onClick={() => onNavigate("dashboard")}>
          ⬅ Back
        </button>
      </div>

      <div className="card mb-3 shadow-sm border-0">
        <div className="card-body d-flex justify-content-between">
          <div>
            <small>Current Balance</small>
            <h3 className="fw-bold text-success">
              PKR {fmtAmount(currentBalance)}
            </h3>
          </div>
        </div>
      </div>

      {msg && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <input type="date" className="form-control form-control-sm"
            value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
        </div>
        <div className="col-md-3">
          <input type="date" className="form-control form-control-sm"
            value={toDate} onChange={(e) => setToDate(e.target.value)} />
        </div>
        <div className="col-md-6">
          <input className="form-control form-control-sm"
            placeholder="🔍 Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="row g-2 mb-3">
        <div className="col-md-2">
          <input type="date" className="form-control form-control-sm"
            value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div className="col-md-2">
          <input className="form-control form-control-sm"
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
          <select className="form-select form-select-sm"
            value={type}
            onChange={(e) => setType(e.target.value)}>
            <option value="deposit">➕ Deposit</option>
            <option value="withdraw">➖ Withdraw</option>
          </select>
        </div>
        <div className="col-md-4">
          <input className="form-control form-control-sm"
            placeholder="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)} />
        </div>
        <div className="col-md-2">
          <button className="btn btn-success btn-sm w-100" onClick={save}>
            Save
          </button>
        </div>
      </div>

      <table className="table table-hover">
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
          {filtered.map((r) => (
            <tr key={r.id}>
              <td>{formatDate(r.txn_date)}</td>
              <td className="fw-bold">{r.description}</td>
              <td className="text-danger">{fmtAmount(r.debit)}</td>
              <td className="text-success">{fmtAmount(r.credit)}</td>
              <td className="fw-bold">{fmtAmount(r.balance)}</td>
              <td>
                {r.source === "manual" && (
                  <button className="btn btn-outline-danger btn-sm"
                    onClick={() => del(r.id)}>
                    ❌
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
