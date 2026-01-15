import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* =========================
   HELPERS
========================= */
const fmtAmt = (v) =>
  v === null || v === undefined || v === ""
    ? "-"
    : Math.round(Number(v)).toLocaleString("en-US");

const parseAmt = (v) =>
  Math.round(Number(String(v).replace(/,/g, "")) || 0);

const formatDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  const day = String(dt.getDate()).padStart(2, "0");
  const month = dt.toLocaleString("en-US", { month: "short" });
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
};

const numberToWords = (num) => {
  if (!num) return "";
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];
  const w = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + w(n % 100) : "");
    if (n < 1000000) return w(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + w(n % 1000) : "");
    return "";
  };
  return w(num) + " Only";
};

const today = new Date().toISOString().split("T")[0];

export default function SupplierLedger({ onNavigate }) {
  const [supplierCode, setSupplierCode] = useState("");
  const [ledger, setLedger] = useState([]);
  const [pending, setPending] = useState([]);
  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");
  const [payDate, setPayDate] = useState(today);
  const [method, setMethod] = useState("Cash");
  const [type, setType] = useState("Payment"); // Payment or Adjustment
  const [saving, setSaving] = useState(false);
  const pdfRef = useRef(null);

  /* =========================
     LOAD PENDING / PARTIAL ALWAYS
  ========================== */
  const loadPendingAlways = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/pending`);
      const d = await res.json();
      if (d.success) {
        const sorted = (d.pending || []).sort((a,b) => b.pending_amount - a.pending_amount);
        setPending(sorted);
      }
    } catch(e) { console.error("Pending load error:", e); }
  };

  /* =========================
     LOAD LEDGER BY SUPPLIER CODE
  ========================== */
  const loadLedger = async (code = supplierCode) => {
    if (!code) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/${code}`);
      const d = await res.json();
      if (d.success) {
        const mappedLedger = (d.ledger || []).map(row => {
          const typeLower = (row.type || "").toLowerCase();
          const isPayment = typeLower === "payment" || typeLower === "adjustment";
          return {
            ...row,
            entry_type: isPayment ? "payment" : "purchase",
            id: isPayment ? (row.id || row.payment_id) : null,
            type: isPayment ? typeLower.charAt(0).toUpperCase() + typeLower.slice(1) : "Purchase",
            detail: row.item || row.item || "Purchase Entry"
          };
        });
        mappedLedger.sort((a,b)=> new Date(b.date) - new Date(a.date));
        setLedger(mappedLedger);
      } else {
        alert(d.error || "Failed to load ledger");
        setLedger([]);
      }
    } catch(e) { console.error("Ledger load error:", e); }
  };

  useEffect(() => { loadPendingAlways(); }, []);

  /* =========================
     SAVE PAYMENT / ADJUSTMENT
  ========================== */
  const saveEntry = async () => {
    if (!supplierCode) return alert("Supplier Code required");
    if (!amountRaw || amountRaw <= 0) return alert("Amount required");
    if (!payDate) return alert("Date required");

    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplier_code: supplierCode,
          payment_date: payDate,
          payment_method: method,
          amount: amountRaw,
          type
        }),
      });
      const d = await res.json();
      if (!d.success) alert(d.error || "Save failed");
      else {
        setAmountRaw(0);
        setAmountDisp("");
        setPayDate(today);
        await loadLedger();
        await loadPendingAlways();
        alert("✅ Entry saved");
      }
    } finally { setSaving(false); }
  };

  /* =========================
     DELETE LEDGER ENTRY
  ========================== */
  const deleteEntry = async (entry) => {
    if(entry.entry_type !== "payment" || !entry.id) return;

    const pass = prompt("Enter password to delete this entry");
    if(pass !== "786") return alert("❌ Invalid password");

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/delete/${entry.id}`, {
        method:"DELETE",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({password: pass, type: "payment"})
      });
      const d = await res.json();
      if(d.success) {
        alert("✅ Entry deleted permanently");
        await loadLedger();
        await loadPendingAlways();
      } else alert(d.error || "Delete failed");
    } catch(e){ console.error(e); alert("Delete failed"); }
  };

  /* =========================
     EXPORT PDF
  ========================== */
  const exportPDF = async () => {
    if(!pdfRef.current) return;
    const canvas = await html2canvas(pdfRef.current, { scale: 3 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    pdf.setFillColor(18, 97, 160);
    pdf.rect(0, 0, w, 25, "F");
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(16);
    pdf.text("Supplier Ledger Statement", w / 2, 15, { align: "center" });
    pdf.addImage(img, "PNG", 10, 30, 190, (canvas.height * 190) / canvas.width);
    pdf.save(`${supplierCode}-ledger.pdf`);
  };

  return (
    <div className="container p-3">

      {/* HEADER */}
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">📘 SUPPLIER LEDGER — {supplierCode}</h4>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>⬅ Back</button>
        </div>
      </div>

      {/* PENDING / PARTIAL */}
      <div className="card shadow-sm mb-3">
        <div className="card-header fw-bold text-danger">⏳ Pending / Partial Payments</div>
        <ul className="list-group list-group-flush">
          {pending.length === 0 && <li className="list-group-item text-success">✅ No pending</li>}
          {pending.map((p, i) => (
            <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <b>{p.supplier_code} — <span className="text-primary">{p.supplier_name}</span></b>
                <span className={`badge ms-2 ${
                  p.status === "PENDING" ? "bg-danger" :
                  p.status === "PARTIAL" ? "bg-warning text-dark" : "bg-success text-white"
                }`}>{p.status}</span>
              </div>
              <button className="btn btn-sm btn-outline-primary" onClick={() => { setSupplierCode(p.supplier_code); loadLedger(p.supplier_code); }}>Load Ledger</button>
            </li>
          ))}
        </ul>
      </div>

      {/* CONTROLS */}
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex gap-2">
          <input className="form-control" placeholder="Supplier Code" value={supplierCode} onChange={(e)=>setSupplierCode(e.target.value)} />
          <button className="btn btn-primary" onClick={()=>loadLedger()}>Load</button>
          <button className="btn btn-success" onClick={exportPDF}>📄 Export PDF</button>
        </div>
      </div>

      {/* PAYMENT / ADJUSTMENT ENTRY */}
      <div className="card shadow-sm mb-3">
        <div className="card-body row g-2 align-items-end">
          <div className="col-md-2">
            <input type="date" className="form-control" value={payDate} onChange={e=>setPayDate(e.target.value)} />
            <small className="text-muted">{formatDate(payDate)}</small>
          </div>
          <div className="col-md-3">
            <input className="form-control" placeholder="Amount" value={amountDisp} onChange={e=>{
              const raw=parseAmt(e.target.value); if(!isNaN(raw)){setAmountRaw(raw); setAmountDisp(fmtAmt(raw));}
            }} />
            {amountRaw>0 && <small className="text-success fw-bold">{numberToWords(amountRaw)}</small>}
          </div>
          <div className="col-md-2">
            <select className="form-control" value={type} onChange={e=>setType(e.target.value)}>
              <option>Payment</option>
              <option>Adjustment</option>
            </select>
          </div>
          <div className="col-md-2">
            <select className="form-control" value={method} onChange={e=>setMethod(e.target.value)}>
              <option>Cash</option>
              <option>Bank</option>
            </select>
          </div>
          <div className="col-md-3">
            <button className="btn btn-success btn-sm w-100" disabled={saving} onClick={saveEntry}>
              {saving?"Saving...":"💾 Save Entry"}
            </button>
          </div>
        </div>
      </div>

      {/* LEDGER TABLE */}
      <div ref={pdfRef} className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-bordered table-sm mb-0 text-end">
            <thead className="table-dark text-center">
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Item</th>
                <th>Payment Method</th>
                <th>Debit</th>
                <th>Credit</th>
                <th>Balance</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {ledger.length===0 && <tr><td colSpan="8" className="text-center text-muted">No ledger entries</td></tr>}
              {ledger.map((r,i)=>(
                <tr key={i}>
                  <td className="text-center">{formatDate(r.date)}</td>
                  <td className="text-center fw-bold">{r.type}</td>
                  <td className="text-start">{r.detail}</td>
                  <td className="text-center">{r.payment_method||"-"}</td>
                  <td>{fmtAmt(r.debit)}</td>
                  <td>{fmtAmt(r.credit)}</td>
                  <td className="fw-bold">{fmtAmt(r.balance)}</td>
                  <td className="text-center">
                    {r.entry_type === "payment" && r.id ? (
                      <button className="btn btn-sm btn-danger" onClick={()=>deleteEntry(r)}>Delete</button>
                    ) : "-"}
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
