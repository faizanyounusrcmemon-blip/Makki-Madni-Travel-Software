import React, { useState } from "react";

/* =========================
   HELPERS
========================= */

// 300000 → 300,000
const fmtAmt = (v) => {
  if (v === null || v === undefined) return "-";
  return Number(v).toLocaleString("en-US");
};

// "300,000" → 300000
const parseAmt = (v) => Number(String(v).replace(/,/g, ""));

// NUMBER → WORDS
const numberToWords = (num) => {
  if (!num) return "";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six",
    "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
    "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const w = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + w(n % 100) : "");
    if (n < 1000000)
      return w(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + w(n % 1000) : "");
    return "";
  };

  return w(num) + " Only";
};

// DATE SAFE
const fmtDate = (d) => {
  if (!d) return "-";
  const x = new Date(d);
  if (isNaN(x.getTime())) return "-";
  return x.toLocaleDateString("en-GB");
};

export default function PurchaseLedger({ onNavigate }) {
  const [ref, setRef] = useState("");
  const [rows, setRows] = useState([]);

  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");

  const [date, setDate] = useState("");
  const [type, setType] = useState("payment");
  const [method, setMethod] = useState("Cash");

  /* =========================
     LOAD LEDGER
  ========================= */
  const load = async () => {
    if (!ref) return alert("Ref No required");

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase-ledger/${ref}`
    );
    const d = await r.json();
    if (d.success) setRows(d.rows || []);
    else alert(d.error);
  };

  /* =========================
     SAVE PAYMENT
  ========================= */
  const pay = async () => {
    if (!amountRaw || !date) return alert("Amount & Date required");

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase-ledger/payment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref_no: ref,
          payment_date: date,
          amount: amountRaw, // ✅ RAW NUMBER
          payment_method: method,
          type
        })
      }
    );

    const d = await r.json();
    if (d.success) {
      setAmountRaw(0);
      setAmountDisp("");
      setDate("");
      load();
    } else alert(d.error);
  };

  /* =========================
     DELETE ENTRY
  ========================= */
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
      <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>
        ⬅ Back
      </button>

      <h4 className="mt-2 text-warning fw-bold">
        🧾 PURCHASE LEDGER {ref && `— ${ref}`}
      </h4>

      {/* TOP */}
      <div className="d-flex gap-2 mt-3">
        <input
          className="form-control"
          placeholder="Ref No"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
        />
        <button className="btn btn-primary" onClick={load}>
          Load
        </button>
      </div>

      {/* ENTRY */}
      <div className="row g-2 mt-3">
        <div className="col-md-3">
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
            placeholder="Amount"
            value={amountDisp}
            onChange={(e) => {
              const raw = parseAmt(e.target.value);
              if (isNaN(raw)) return;
              setAmountRaw(raw);
              setAmountDisp(fmtAmt(raw));
            }}
          />
          {amountRaw > 0 && (
            <small className="text-success fw-bold">
              {numberToWords(amountRaw)}
            </small>
          )}
        </div>

        <div className="col-md-3">
          <select
            className="form-control"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="payment">Payment</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

        <div className="col-md-3">
          <select
            className="form-control"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            <option>Cash</option>
            <option>Bank</option>
          </select>
        </div>
      </div>

      <button className="btn btn-danger mt-2" onClick={pay}>
        💾 Save Entry
      </button>

      {/* TABLE */}
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
              <td>{fmtDate(r.date || r.created_at)}</td>
              <td>{r.description}</td>
              <td>{r.debit ? fmtAmt(r.debit) : "-"}</td>
              <td>{r.credit ? fmtAmt(r.credit) : "-"}</td>
              <td className="fw-bold">{fmtAmt(r.balance)}</td>
              <td>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => del(r.id)}
                >
                  Del
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
