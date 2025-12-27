import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* =========================
   HELPERS
========================= */

const fmtAmt = (v) =>
  v === null || v === undefined ? "-" : Number(v).toLocaleString("en-US");

const parseAmt = (v) => Number(String(v).replace(/,/g, "")) || 0;

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

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "-";

export default function PurchaseLedger({ onNavigate }) {
  const [ref, setRef] = useState("");
  const [rows, setRows] = useState([]);
  const [pending, setPending] = useState([]);

  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("payment");
  const [method, setMethod] = useState("Cash");

  const pdfRef = useRef(null);

  /* =========================
     LOAD PENDING LIST
  ========================= */
  const loadPending = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase-ledger/pending/list`
    );
    const d = await r.json();
    if (d.success) setPending(d.rows || []);
  };

  useEffect(() => {
    loadPending();
  }, []);

  /* =========================
     LOAD LEDGER
  ========================= */
  const load = async (r = ref) => {
    if (!r) return alert("Ref No required");
    setRef(r);

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase-ledger/${r}`
    );
    const d = await res.json();
    if (d.success) setRows(d.rows || []);
    else alert(d.error);
  };

  /* =========================
     SAVE PAYMENT
  ========================= */
  const pay = async () => {
    if (!amountRaw || !date) return alert("Amount & Date required");

    await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase-ledger/payment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref_no: ref,
          payment_date: date,
          amount: amountRaw,
          payment_method: method,
          type
        })
      }
    );

    setAmountRaw(0);
    setAmountDisp("");
    setDate("");
    load(ref);
    loadPending();
  };

  /* =========================
     DELETE
  ========================= */
  const del = async (id) => {
    if (!id || isNaN(id)) {
      alert("یہ entry delete نہیں ہو سکتی");
      return;
    }

    const pass = prompt("Password?");
    if (!pass) return;

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase-ledger/delete/${id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass })
      }
    );

    const d = await r.json();
    if (d.success) {
      load(ref);
      loadPending();
    } else alert(d.error);
  };

  /* =========================
     EXPORT PDF (OLD SAFE)
  ========================= */
  const exportPDF = async () => {
    const canvas = await html2canvas(pdfRef.current, { scale: 3 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(img, "PNG", 10, 10, 190, (canvas.height * 190) / canvas.width);
    pdf.save(`${ref || "purchase-ledger"}.pdf`);
  };

  return (
    <div className="container p-3">
      <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>
        ⬅ Back
      </button>

      <h4 className="mt-2 text-warning fw-bold">
        🧾 PURCHASE LEDGER — {ref}
      </h4>

      {/* ⏳ PENDING LIST */}
      <div className="mb-3">
        <h6 className="fw-bold text-danger">⏳ Pending / Partial Purchases</h6>
        {pending.length === 0 ? (
          <div className="text-success">✅ No pending purchases</div>
        ) : (
          <ul className="list-group">
            {pending.map((p, i) => (
              <li key={i} className="list-group-item d-flex justify-content-between">
                <div>
                  <b>{p.ref_no}</b>
                  <span className={`badge ms-2 ${p.status==="PENDING"?"bg-danger":"bg-warning text-dark"}`}>
                    {p.status}
                  </span>
                  <div className="small text-muted">{p.note}</div>
                </div>
                <button className="btn btn-sm btn-outline-primary" onClick={() => load(p.ref_no)}>
                  Load
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* TOP */}
      <div className="d-flex gap-2 mt-2">
        <input className="form-control" placeholder="Ref No"
          value={ref} onChange={(e)=>setRef(e.target.value)} />
        <button className="btn btn-primary" onClick={() => load()}>Load</button>
        <button className="btn btn-success" onClick={exportPDF}>📄 Export PDF</button>
      </div>

      {/* ENTRY */}
      <div className="row g-2 mt-3">
        <div className="col-md-3">
          <input type="date" className="form-control"
            value={date} onChange={(e)=>setDate(e.target.value)} />
        </div>

        <div className="col-md-3">
          <input className="form-control" placeholder="Amount"
            value={amountDisp}
            onChange={(e)=>{
              const raw = parseAmt(e.target.value);
              if (!isNaN(raw)) {
                setAmountRaw(raw);
                setAmountDisp(fmtAmt(raw));
              }
            }} />
          {amountRaw > 0 && (
            <small className="text-success fw-bold">
              {numberToWords(amountRaw)}
            </small>
          )}
        </div>

        <div className="col-md-3">
          <select className="form-control" value={type}
            onChange={(e)=>setType(e.target.value)}>
            <option value="payment">Payment</option>
            <option value="adjustment">Adjustment</option>
          </select>
        </div>

        <div className="col-md-3">
          <select className="form-control" value={method}
            onChange={(e)=>setMethod(e.target.value)}>
            <option>Cash</option>
            <option>Bank</option>
          </select>
        </div>
      </div>

      <button className="btn btn-danger mt-2" onClick={pay}>
        💾 Save Entry
      </button>

      {/* TABLE */}
      <div ref={pdfRef}>
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
                <td>{fmtDate(r.created_at)}</td>
                <td>{r.description}</td>
                <td>{r.debit ? fmtAmt(r.debit) : "-"}</td>
                <td>{r.credit ? fmtAmt(r.credit) : "-"}</td>
                <td className="fw-bold">{fmtAmt(r.balance)}</td>
                <td>
                  {r.id !== "PURCHASE" && (
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
