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
    if (n < 100) return b[Math.floor(n/10)] + (n%10 ? " "+a[n%10] : "");
    if (n < 1000)
      return a[Math.floor(n/100)]+" Hundred"+(n%100 ? " "+w(n%100) : "");
    if (n < 1000000)
      return w(Math.floor(n/1000))+" Thousand"+(n%1000 ? " "+w(n%1000) : "");
    return "";
  };
  return w(num) + " Only";
};

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "-";

// ✅ Default today
const today = new Date().toISOString().split("T")[0];

export default function PurchaseLedger({ onNavigate }) {
  const [ref, setRef] = useState("");
  const [rows, setRows] = useState([]);
  const [pending, setPending] = useState([]);

  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");
  const [date, setDate] = useState(today);
  const [type, setType] = useState("payment");
  const [method, setMethod] = useState("Cash");

  const [saving, setSaving] = useState(false);
  const pdfRef = useRef(null);

  /* =========================
     LOAD PENDING LIST
  ========================= */
  const loadPending = async () => {
    const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase-ledger/pending/list`);
    const d = await r.json();
    if (d.success) setPending(d.rows || []);
  };

  useEffect(() => { loadPending(); }, []);

  /* =========================
     LOAD LEDGER
  ========================= */
  const load = async (r = ref) => {
    if (!r) return alert("Ref No required");
    setRef(r);

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase-ledger/${r}`);
    const d = await res.json();
    if (d.success) setRows(d.rows || []);
    else alert(d.error);
  };

  /* =========================
     SAVE PAYMENT
  ========================= */
  const pay = async () => {
    if (!amountRaw || !date) return alert("Amount & Date required");

    setSaving(true);
    try {
      const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase-ledger/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref_no: ref, payment_date: date, amount: amountRaw, payment_method: method, type }),
      });

      const d = await r.json();
      if (!d.success) alert(d.error || "Save failed");
      else {
        setAmountRaw(0);
        setAmountDisp("");
        setDate(today); // Reset to today
        await load(ref);
        await loadPending();
      }
    } finally { setSaving(false); }
  };

  /* =========================
     DELETE
  ========================= */
  const del = async (id) => {
    if (!id || isNaN(id)) { alert("یہ entry delete نہیں ہو سکتی"); return; }
    const pass = prompt("Password?");
    if (!pass) return;

    const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase-ledger/delete/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass })
    });

    const d = await r.json();
    if (d.success) { load(ref); loadPending(); }
    else alert(d.error);
  };

  /* =========================
     EXPORT PDF
  ========================= */
  const exportPDF = async () => {
    const canvas = await html2canvas(pdfRef.current, { scale: 3 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();

    pdf.setFillColor(18,97,160);
    pdf.rect(0,0,w,25,"F");
    pdf.setTextColor(255,255,255);
    pdf.setFontSize(16);
    pdf.text("MAKKI MADNI TRAVEL", w/2, 15, { align:"center" });
    pdf.setFontSize(10);
    pdf.text("Purchase Ledger Statement", w/2, 22, { align:"center" });

    pdf.addImage(img,"PNG",10,30,190,(canvas.height*190)/canvas.width);
    pdf.save(`${ref || "purchase-ledger"}.pdf`);
  };

  return (
    <div className="container p-3">

      {/* HEADER */}
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">🧾 PURCHASE LEDGER — {ref}</h4>
          <button className="btn btn-secondary btn-sm" onClick={()=>onNavigate("dashboard")}>⬅ Back</button>
        </div>
      </div>

      {/* PENDING LIST */}
      <div className="card shadow-sm mb-3">
        <div className="card-header fw-bold text-danger">⏳ Pending / Partial Purchases</div>
        <div className="card-body p-2">
          {pending.length === 0 ? (
            <p className="text-success mb-0">✅ No pending purchases</p>
          ) : (
            <ul className="list-group list-group-flush">
              {pending.map((p,i)=>(
                <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <b>{p.ref_no} — <span className="text-primary">{p.customer_name || "-"}</span></b>
                    <span className={`badge ms-2 ${p.status==="PENDING"?"bg-danger":"bg-warning text-dark"}`}>{p.status}</span>
                    {/* ✅ Removed small note to reduce row height */}
                  </div>
                  <button className="btn btn-sm btn-outline-primary" onClick={()=>load(p.ref_no)}>Load</button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* CONTROLS */}
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex gap-2">
          <input className="form-control" placeholder="Ref No" value={ref} onChange={e=>setRef(e.target.value)} />
          <button className="btn btn-primary" onClick={()=>load()}>Load</button>
          <button className="btn btn-success" onClick={exportPDF}>📄 Export PDF</button>
        </div>
      </div>

      {/* ENTRY FORM */}
      <div className="card shadow-sm mb-3">
        <div className="card-body row g-2">
          <div className="col-md-3">
            <input type="date" className="form-control" value={date} onChange={e=>setDate(e.target.value)} />
          </div>
          <div className="col-md-3">
            <input className="form-control" placeholder="Amount" value={amountDisp} 
              onChange={e=>{
                const raw = parseAmt(e.target.value);
                if(!isNaN(raw)){ setAmountRaw(raw); setAmountDisp(fmtAmt(raw)); }
              }} 
            />
            {amountRaw>0 && <small className="text-success fw-bold">{numberToWords(amountRaw)}</small>}
          </div>
          <div className="col-md-3">
            <select className="form-control" value={type} onChange={e=>setType(e.target.value)}>
              <option value="payment">Payment</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
          <div className="col-md-3">
            <select className="form-control" value={method} onChange={e=>setMethod(e.target.value)}>
              <option>Cash</option>
              <option>Bank</option>
            </select>
          </div>
        </div>
        <div className="card-body">
          <button className="btn btn-success" disabled={saving} onClick={pay}>{saving?"Saving...":"💾 Save Entry"}</button>
        </div>
      </div>

      {/* LEDGER TABLE */}
      <div ref={pdfRef} className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-bordered table-sm mb-0">
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
              {rows.length===0 && (
                <tr><td colSpan="6" className="text-center text-muted">No ledger entries</td></tr>
              )}
              {rows.map(r=>(
                <tr key={r.id}>
                  <td>{fmtDate(r.created_at)}</td>
                  <td>{r.description}</td>
                  <td>{r.debit?fmtAmt(r.debit):"-"}</td>
                  <td>{r.credit?fmtAmt(r.credit):"-"}</td>
                  <td className="fw-bold">{fmtAmt(r.balance)}</td>
                  <td>
                    {r.id!=="PURCHASE" && (
                      <button className="btn btn-danger btn-sm" onClick={()=>del(r.id)}>Del</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
