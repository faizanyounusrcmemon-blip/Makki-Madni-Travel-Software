import React, { useEffect, useState } from "react";

export default function ExpenseLedger({ onNavigate }) {
  const today = new Date().toISOString().slice(0, 10);

  const [rows, setRows] = useState([]);

  // ADD EXPENSE STATES
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [remarks, setRemarks] = useState("");

  // FILTER STATES
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  /* =========================
     LOAD LEDGER
  ========================= */
  const load = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/expenseledger`
    );
    const d = await r.json();
    if (d.success) setRows(d.rows || []);
  };

  useEffect(() => {
    load();
  }, []);

  /* =========================
     SAVE EXPENSE
  ========================= */
  const save = async () => {
    if (!date || !title || !amount) return alert("Missing fields");

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/expenseledger/add`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_date: date,
          title,
          amount: amount.replace(/,/g, ""),
          payment_method: method,
          remarks,
        }),
      }
    );

    const d = await r.json();
    if (d.success) {
      setTitle("");
      setAmount("");
      setRemarks("");
      load();
    } else alert(d.error);
  };

  /* =========================
     DELETE EXPENSE
  ========================= */
  const del = async (id) => {
    const pass = prompt("Password");
    if (!pass) return;

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/expenseledger/delete/${id}`,
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

  /* =========================
     FILTERED ROWS
  ========================= */
  const filteredRows = rows.filter((r) => {
    const d = r.expense_date?.slice(0, 10);

    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;

    if (
      search &&
      !r.title?.toLowerCase().includes(search.toLowerCase())
    )
      return false;

    return true;
  });

  /* =========================
     TOTAL (FULL / FILTERED)
  ========================= */
  const totalAmount = filteredRows.reduce(
    (sum, r) => sum + Number(r.amount || 0),
    0
  );

  const isFiltered = fromDate || toDate || search;

  return (
    <div className="container p-3">
      <button
        className="btn btn-secondary btn-sm mb-2"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Back
      </button>

      <h4 className="text-warning fw-bold mb-2">
        💸 Expense Ledger
      </h4>

      {/* =========================
         ADD EXPENSE
      ========================= */}
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
            placeholder="Title"
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

        <div className="col-md-2">
          <select
            className="form-control"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option>Cash</option>
            <option>Bank</option>
          </select>
        </div>

        <div className="col-md-2">
          <input
            className="form-control"
            placeholder="Remarks"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        <div className="col-md-1">
          <button className="btn btn-success w-100" onClick={save}>
            Save
          </button>
        </div>
      </div>

      {/* =========================
         FILTERS
      ========================= */}
      <div className="row g-2 mb-2">
        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
        </div>

        <div className="col-md-2">
          <input
            type="date"
            className="form-control"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
        </div>

        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Search by title"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* =========================
         TABLE
      ========================= */}
      <table className="table table-bordered table-sm">
        <thead className="table-dark">
          <tr>
            <th>Date</th>
            <th>Title</th>
            <th>Amount</th>
            <th>Method</th>
            <th>Remarks</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {filteredRows.map((r) => (
            <tr key={r.id}>
              <td>
                {new Date(r.expense_date).toLocaleDateString()}
              </td>
              <td>{r.title}</td>
              <td>{Number(r.amount).toLocaleString()}</td>
              <td>{r.payment_method}</td>
              <td>{r.remarks}</td>
              <td>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => del(r.id)}
                >
                  ❌
                </button>
              </td>
            </tr>
          ))}

          {filteredRows.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center">
                No expenses found
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* =========================
         TOTAL (VISIBLE)
      ========================= */}
      <div className="d-flex justify-content-end mt-3">
        <div
          style={{
            background: "#111",
            color: "#ffc107",
            padding: "10px 18px",
            borderRadius: "6px",
            fontSize: "18px",
            fontWeight: "bold",
            minWidth: "260px",
            textAlign: "right",
          }}
        >
          {isFiltered ? "Filtered Total" : "Total Expense"}:{" "}
          {totalAmount.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
