import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* =========================
   HELPERS
========================= */

// DATE
const getRowDate = (r) => {
  if (!r?.date) return "-";
  const d = new Date(r.date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB");
};

// FORMAT (comma + decimal safe)
const fmtAmt = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  const n = Number(String(v).replace(/,/g, ""));
  if (isNaN(n)) return v;
  return n.toLocaleString("en-US", { maximumFractionDigits: 2 });
};

// PARSE
const parseAmt = (v) => {
  if (v === "" || v === null || v === undefined) return "";
  const x = String(v).replace(/,/g, "");
  if (x === "." || x.endsWith(".")) return x;
  const n = parseFloat(x);
  return isNaN(n) ? 0 : n;
};

// NUMBER → WORDS
const numberToWords = (num) => {
  if (!num) return "";
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
  "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  const w = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n/10)] + (n%10?" "+a[n%10]:"");
    if (n < 1000) return a[Math.floor(n/100)]+" Hundred"+(n%100?" "+w(n%100):"");
    if (n < 1000000) return w(Math.floor(n/1000))+" Thousand"+(n%1000?" "+w(n%1000):"");
    return "";
  };
  return w(num) + " Only";
};

export default function CustomerLedger({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("payment");
  const [method, setMethod] = useState("Cash");

  const pdfRef = useRef(null);

  /* =========================
     LOAD LEDGER
  ========================= */
  const loadLedger = async () => {
    if (!refNo) return alert("Ref No required");

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/${refNo}`
    );
    const d = await r.json();

    if (d.success) setRows(d.rows || []);
    else alert(d.error);
  };

  /* =========================
     SAVE ENTRY (FIXED)
  ========================= */
  const saveEntry = async () => {
    if (!refNo || amountRaw <= 0 || !date) {
      alert("Ref No, Amount & Date required");
      return;
    }

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/payment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref_no: refNo,
          amount: amountRaw,
          payment_date: date,
          payment_method: method,
          type,
        }),
      }
    );

    const d = await r.json();
    if (d.success) {
      setAmountRaw(0);
      setAmountDisp("");
      setDate("");
      loadLedger();
    } else alert(d.error);
  };

  /* =========================
     DELETE ENTRY
  ========================= */
  const del = async (id) => {
    if (id === "SALE" || id === "CUSTOMER") {
      alert("یہ entry delete نہیں ہو سکتی");
      return;
    }

    const pass = prompt("Password?");
    if (!pass) return;

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/delete/${id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      }
    );

    const d = await r.json();
    if (d.success) loadLedger();
    else alert(d.error);
  };

  return (
    <div className="container p-3">
      <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>
        ⬅ Back
      </button>

      <h4 className="mt-2 text-info fw-bold">
        📘 CUSTOMER LEDGER — {refNo}
      </h4>

      <div className="d-flex gap-2 mt-2">
        <input
          className="form-control"
          value={refNo}
          onChange={(e) => setRefNo(e.target.value)}
        />
        <button className="btn btn-primary" onClick={loadLedger}>
          Load
        </button>
      </div>

      {/* ENTRY FORM */}
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
              setAmountDisp(e.target.value);
              if (typeof raw === "number") setAmountRaw(raw);
            }}
          />
          {amountRaw > 0 && (
            <small className="text-success fw-bold">
              {numberToWords(amountRaw)}
            </small>
          )}
        </div>

        <div className="col-md-3">
          <select className="form-control" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="payment">Payment</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

        <div className="col-md-3">
          <select className="form-control" value={method} onChange={(e) => setMethod(e.target.value)}>
            <option>Cash</option>
            <option>Bank</option>
          </select>
        </div>
      </div>

      <button className="btn btn-success mt-2" onClick={saveEntry}>
        💾 Save Entry
      </button>

      {/* LEDGER TABLE */}
      <div ref={pdfRef}>
        <table className="table table-bordered table-sm mt-3">
          <thead className="table-dark">
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
              <th>❌</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{getRowDate(r)}</td>
                <td className={r.id === "CUSTOMER" ? "fw-bold text-primary" : ""}>
                  {r.description}
                </td>
                <td>{fmtAmt(r.debit)}</td>
                <td>{fmtAmt(r.credit)}</td>
                <td className="fw-bold">{fmtAmt(r.balance)}</td>
                <td>
                  {r.id !== "SALE" && r.id !== "CUSTOMER" && (
                    <button className="btn btn-danger btn-sm" onClick={() => del(r.id)}>
                      Del
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
