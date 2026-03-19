import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* =========================
   HELPERS (NO -0 EVER)
========================= */
const normalizeZero = (n) => Math.abs(Number(n || 0)) < 0.005 ? 0 : Number(n);

const fmtAmt = (v) => {
  let n = normalizeZero(v);
  return n.toLocaleString("en-US");
};

const parseAmt = (v) => {
  const n = Number(String(v).replace(/,/g, ""));
  return normalizeZero(Math.round(n || 0));
};

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
    if (n < 10000000)
      return w(Math.floor(n / 100000)) + " Lac" + (n % 100000 ? " " + w(n % 100000) : "");
    if (n < 100000000)
      return w(Math.floor(n / 1000000)) + " Million" + (n % 1000000 ? " " + w(n % 1000000) : "");

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
  const [type, setType] = useState("Payment");
  const [saving, setSaving] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [ledgerView, setLedgerView] = useState([]);
  const pdfRef = useRef(null);
   
  /* =========================
     LOAD PENDING / PARTIAL
  ========================== */
  const loadPendingAlways = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/pending`);
      const d = await res.json();
      if (d.success) {
        const clean = (d.pending || [])
          .map(p => ({
            ...p,
            pending_amount: normalizeZero(p.pending_amount),
            total_purchase: normalizeZero(p.total_purchase),
            total_paid: normalizeZero(p.total_paid)
          }))
          .filter(p => p.status !== "PAID")
          .sort((a, b) => b.pending_amount - a.pending_amount);
        setPending(clean);
      }
    } catch (e) {
      console.error("Pending load error:", e);
    }
  };

  /* =========================
     LOAD LEDGER
  ========================== */
  const loadLedger = async (code = supplierCode) => {
    if (!code) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/${code}`);
      const d = await res.json();
      if (d.success) {
        const mapped = (d.ledger || []).map(row => {
          const t = (row.type || "").toLowerCase();
          const isPay = t === "payment" || t === "adjustment";

          const debit = Math.round(normalizeZero(row.debit));
          const credit = Math.round(normalizeZero(row.credit));
          const balance = Math.round(normalizeZero(row.balance));

          return {
            ...row,
            entry_type: isPay ? "payment" : "purchase",
            id: isPay ? (row.id || row.payment_id) : null,
            type: isPay ? t.charAt(0).toUpperCase() + t.slice(1) : "Purchase",
            detail: row.item || "Purchase Entry",
            debit,
            credit,
            balance,
            ref_no: row.ref_no || row.purchase_ref || row.invoice_no || "-"   // ✅ NEW
          };
        });
        setLedger(mapped);
        setLedgerView(mapped);
      } else {
        alert(d.error || "Failed to load ledger");
        setLedger([]);
      }
    } catch (e) {
      console.error("Ledger load error:", e);
    }
  };

  useEffect(() => { loadPendingAlways(); }, []);

  /* =========================
     AUTO DATE FILTER
  ========================== */
  useEffect(() => {
    let rows = [...ledger];

    if (fromDate)
      rows = rows.filter((r) => new Date(r.date) >= new Date(fromDate));
    if (toDate)
      rows = rows.filter((r) => new Date(r.date) <= new Date(toDate));

    setLedgerView([...rows].reverse());
  }, [fromDate, toDate, ledger]);

  /* =========================
     SAVE ENTRY
  ========================== */
  const saveEntry = async () => {
    if (!supplierCode) return alert("Supplier Code required");
    if (!amountRaw || amountRaw <= 0) return alert("Amount required");

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
        await loadLedger();
        await loadPendingAlways();
        alert("✅ Entry saved");
      }
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     DELETE ENTRY
  ========================== */
  const deleteEntry = async (entry) => {
    if (entry.entry_type !== "payment" || !entry.id) return;

    const pwd = prompt("Enter password");
    if (pwd !== "786") return alert("Wrong password");

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/delete/${entry.id}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          password: pwd,
          type: "payment", // 🔥 THIS WAS MISSING
        }),
      }
    );

    const d = await res.json();
    if (!d.success) {
      alert(d.error || "Delete failed");
      return;
    }

    await loadLedger();
    await loadPendingAlways();
    alert("✅ Entry deleted");
  };

/* =========================
   EXPORT PDF (PRO VERSION)
========================= */
const exportPDF = async () => {
  if (!pdfRef.current) return;

  const canvas = await html2canvas(pdfRef.current, {
    scale: 2,
    useCORS: true
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = 210;
  const pageHeight = 297;

  const margin = 10;
  const headerHeight = 30;

  const usableWidth = pageWidth - margin * 2;
  const usableHeight = pageHeight - headerHeight - margin;

  const imgWidth = usableWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  const totalPages = Math.ceil(imgHeight / usableHeight);

  const supplierRow = ledger.find(r => r.supplier_name);
  const supplierName = supplierRow?.supplier_name || "Supplier";

  const rangeText =
    fromDate || toDate
      ? `${formatDate(fromDate)} → ${formatDate(toDate)}`
      : "All Dates";

  const safeName = supplierName
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, "_");

  for (let page = 0; page < totalPages; page++) {

    if (page > 0) pdf.addPage();

    /* HEADER */

    pdf.setFillColor(18,97,160);
    pdf.rect(0,0,pageWidth,20,"F");

    pdf.setTextColor(255,255,255);
    pdf.setFontSize(16);
    pdf.text("MAKKI MADNI TRAVEL", pageWidth/2,10,{align:"center"});

    pdf.setFontSize(10);
    pdf.text("Supplier Ledger Statement", pageWidth/2,16,{align:"center"});

    pdf.setTextColor(0,0,0);
    pdf.setFontSize(11);

    pdf.text(`Supplier: ${supplierName}`,margin,26);
    pdf.text(`Code: ${supplierCode}`,pageWidth-margin,26,{align:"right"});

    pdf.setFontSize(9);
    pdf.text(`Date Range: ${rangeText}`,pageWidth/2,31,{align:"center"});

    /* IMAGE POSITION */

    const yOffset = -(usableHeight * page);

    pdf.addImage(
      imgData,
      "PNG",
      margin,
      headerHeight + yOffset,
      imgWidth,
      imgHeight
    );

    /* FOOTER */

    pdf.setFontSize(9);
    pdf.setTextColor(120);

    pdf.text(
      `Page ${page + 1} / ${totalPages}`,
      pageWidth - margin,
      pageHeight - 5,
      { align: "right" }
    );
  }

  pdf.save(`${supplierCode}-${safeName}-ledger.pdf`);
};
   
   /* =========================
   UI
========================= */
return (
  <div className="container p-3">

    {/* HEADER */}
    <div className="card shadow-sm mb-3">
      <div className="card-body d-flex justify-content-between align-items-center">
        <h4 className="fw-bold mb-0">📘 SUPPLIER LEDGER — {supplierCode}</h4>
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>⬅ Back</button>
      </div>
    </div>

    {/* PENDING LIST */}
    <div className="card shadow-sm mb-3">
      <div className="card-header fw-bold text-danger">⏳ Pending / Partial</div>
      <ul className="list-group list-group-flush">
        {pending.length === 0 && <li className="list-group-item text-success">✅ No pending</li>}
        {pending.map((p,i)=>(
          <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <b>{p.supplier_code} — <span className="text-primary">{p.supplier_name}</span></b>
              <span className={`badge ms-2 ${
                p.status === "EXTRA PAID"
                  ? "bg-primary"        // 🔵 BLUE
                  : normalizeZero(p.pending_amount) === 0
                  ? "bg-success"
                  : p.status === "PARTIAL"
                  ? "bg-warning text-dark"
                  : "bg-danger"
              }`}>
                {normalizeZero(p.pending_amount) === 0 ? "PAID" : p.status}
              </span>

            </div>
            <button className="btn btn-sm btn-outline-primary"
              onClick={()=>{setSupplierCode(p.supplier_code); loadLedger(p.supplier_code);}}>
              Load Ledger
            </button>
          </li>
        ))}
      </ul>
    </div>

    {/* FILTER */}
    <div className="card mb-3">
      <div className="card-body d-flex gap-2">
        <input type="date" className="form-control" value={fromDate} onChange={e => setFromDate(e.target.value)} />
        <input type="date" className="form-control" value={toDate} onChange={e => setToDate(e.target.value)} />
        <input className="form-control" placeholder="Supplier Code" value={supplierCode} onChange={e => setSupplierCode(e.target.value)} />
        <button className="btn btn-primary" onClick={() => loadLedger()}>Load</button>
        <button className="btn btn-success" onClick={exportPDF}>PDF</button>
      </div>
    </div>

    {/* PAYMENT ENTRY */}
    <div className="card shadow-sm mb-3">
      <div className="card-body row g-2 align-items-end">
        <div className="col-md-2">
          <input type="date" className="form-control" value={payDate} onChange={e=>setPayDate(e.target.value)} />
          <small className="text-muted">{formatDate(payDate)}</small>
        </div>
        <div className="col-md-3">
          <input className="form-control" placeholder="Amount" value={amountDisp}
            onChange={e=>{
              const raw = parseAmt(e.target.value);
              setAmountRaw(raw);
              setAmountDisp(fmtAmt(raw));
            }} />
          {amountRaw > 0 && (
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "green" }}>
              {numberToWords(amountRaw)}
            </span>
          )}
        </div>
        <div className="col-md-2">
          <select className="form-control" value={type} onChange={e=>setType(e.target.value)}>
            <option>Payment</option>
            <option>Adjustment</option>
          </select>
        </div>
        <div className="col-md-2">
          <select className="form-control" value={method} onChange={e=>setMethod(e.target.value)}>
            <option>Bank</option>
            <option>Cash<option>
          </select>
        </div>
        <div className="col-md-3">
          <button className="btn btn-success btn-sm w-100" disabled={saving} onClick={saveEntry}>
            {saving ? "Saving..." : "💾 Save Entry"}
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
              <th>Ref No</th>
              <th>Supplier</th>
              <th>Item Detail</th>
              <th>Payment Method</th>
              <th>Debit</th>
              <th>Credit</th>
              <th>Balance</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {ledger.length === 0 &&
              <tr><td colSpan="10" className="text-center text-muted">No ledger entries</td></tr>}
            {ledgerView.map((r,i)=>(
              <tr key={i}>
                <td className="text-center fw-bold small">{formatDate(r.date)}</td>
                <td className="text-center">
                  <span className={`badge ${
                    r.type?.toLowerCase() === "purchase" ? "bg-danger"
                    : r.type?.toLowerCase() === "payment" ? "bg-success"
                    : "bg-primary"
                  }`}>
                    {r.type}
                  </span>
                </td>
                <td className="text-center fw-bold text-secondary small">{r.ref_no || "-"}</td>
                <td className="text-start fw-bold text-primary small">{r.entry_type === "purchase" ? r.supplier_name : "-"}</td>
                <td className="text-start fw-bold text-success small">{r.entry_type === "purchase" ? r.detail : "-"}</td>
                <td className="text-center small">
                  {r.payment_method ? (
                    <span className={`badge ${
                      r.payment_method.toLowerCase() === "cash" ? "bg-success" : "bg-primary"
                    }`}>{r.payment_method}</span>
                  ) : "-"}
                </td>
                <td className={normalizeZero(r.debit) > 0 ? "text-danger fw-bold" : ""}>{fmtAmt(r.debit)}</td>
                <td className={normalizeZero(r.credit) > 0 ? "text-success fw-bold" : ""}>{fmtAmt(r.credit)}</td>
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








