import React, { useEffect, useState } from "react";

// helper
const fmt = (v) => (v ? Number(v).toLocaleString("en-US") : "-");

export default function ExpenseLedger({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [msg, setMsg] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [remarks, setRemarks] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/expense-ledger`
    );
    const d = await r.json();
    if (d.success) {
      setRows(d.rows);
      setFiltered(d.rows);
    }
  };

  /* FILTER */
  useEffect(() => {
    let temp = [...rows];

    if (fromDate)
      temp = temp.filter(
        (r) => new Date(r.expense_date) >= new Date(fromDate)
      );

    if (toDate)
      temp = temp.filter(
        (r) => new Date(r.expense_date) <= new Date(toDate)
      );

    setFiltered(temp);
  }, [fromDate, toDate, rows]);

  /* SAVE */
  const save = async () => {
    if (!date || !title || !amount) {
      setMsg({ type: "danger", text: "Date, Title & Amount required" });
      return;
    }

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/expense-ledger/add`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_date: date,
          title,
          amount: amount.replace(/,/g, ""),
          remarks,
        }),
      }
    );

    const d = await r.json();

    if (d.success) {
      setMsg({ type: "success", text: d.message });
      setTitle("");
      setAmount("");
      setRemarks("");
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
      `${import.meta.env.VITE_BACKEND_URL}/api/expense-ledger/delete/${id}`,
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
    <div className="container p-3">
      <button
        className="btn btn-secondary btn-sm mb-2"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Back
      </button>

      <h4 className="fw-bold text-danger mb-2">💸 EXPENSE LEDGER</h4>

      {msg && (
        <div className={`alert alert-${msg.type} py-2`}>
          {msg.text}
        </div>
      )}

      {/* DATE FILTER */}
      <div className="row g-2 mb-2">
        <div className="col-md-3">
          <input
            type="date"
            className="form-control"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>
        <div className="col-md-3">
          <input
            type="date"
            className="form-control"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>
      </div>

      {/* ENTRY */}
      <div className="row g-2 mb-3">
        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Expense Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <input
            className="form-control"
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

        <div className="col-md-3">
          <input
            className="form-control"
            placeholder="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <button className="btn btn-danger w-100" onClick={save}>
            Save
          </button>
        </div>
      </div>

      {/* TABLE */}
      <table className="table table-bordered table-sm">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Title</th>
            <th>Remarks</th>
            <th>Amount</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((r) => (
            <tr key={r.id}>
              <td>{new Date(r.expense_date).toLocaleDateString()}</td>
              <td>{r.title}</td>
              <td>{r.remarks}</td>
              <td className="text-danger fw-bold">
                {fmt(r.amount)}
              </td>
              <td>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => del(r.id)}
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}

          {filtered.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center">
                No expenses
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
