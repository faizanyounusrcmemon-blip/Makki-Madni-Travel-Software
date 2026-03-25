import React, { useState, useRef, useEffect } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* =========================
   HELPERS
========================= */
const getRowDate = (r) => {
  if (!r?.date) return "-";

  const d = new Date(r.date);
  if (isNaN(d.getTime())) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

const fmtAmt = (v) =>
  v === null || v === undefined || v === "" ? "-" : Number(v).toLocaleString("en-US");

const parseAmt = (v) => Number(String(v).replace(/,/g, "") || 0);

const numberToWords = (num) => {
  if (!num) return "";
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  const w = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + w(n % 100) : "");
    if (n < 1000000)
      return w(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + w(n % 1000) : "");
    if (n < 10000000)
      return w(Math.floor(n / 100000)) + " Lac" + (n % 100000 ? " " + w(n % 100000) : "");
    if (n < 100000000)
      return w(Math.floor(n / 1000000)) + " Million" + (n % 1000000 ? " " + w(n % 1000000) : "");

    return "";
  };

  return w(num) + " Only";
};

// ✅ Today date for default calendar
const today = new Date().toISOString().split("T")[0];

export default function CustomerLedger({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [pending, setPending] = useState([]);
  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");
  const [date, setDate] = useState(today); // ✅ Default to today
  const [type, setType] = useState("payment");
  const [method, setMethod] = useState("Bank");
  const [saving, setSaving] = useState(false);
  const pdfRef = useRef(null);

  /* =========================
     LOAD PENDING LIST
  ========================== */
  const loadPending = async () => {
    const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/pending/list`);
    const d = await r.json();
    if (d.success) setPending(d.rows || []);
  };

  useEffect(() => { loadPending(); }, []);

  /* =========================
     LOAD LEDGER
  ========================== */
  const loadLedger = async (r = refNo) => {
    if (!r) return alert("Ref No required");
    setRefNo(r);

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/${r}`);
    const d = await res.json();
    if (d.success) setRows(d.rows || []);
    else alert(d.error);
  };

  /* =========================
     SAVE ENTRY
  ========================== */
  const saveEntry = async () => {
    if (!refNo) return alert("Ref No required");
    if (!amountRaw || amountRaw <= 0) return alert("Amount required");
    if (!date) return alert("Date required");

    setSaving(true);
    try {
      const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref_no: refNo, amount: Number(amountRaw), payment_date: date, payment_method: method, type }),
      });

      const d = await r.json();
      if (!d.success) alert(d.error || "Save failed");
      else {
        setAmountRaw(0);
        setAmountDisp("");
        setDate(today); // ✅ Reset to today after save
        await loadLedger(refNo);
        await loadPending();
        alert("✅ Entry Saved Successfully");
      }
    } finally { setSaving(false); }
  };

  /* =========================
     DELETE ENTRY
  ========================== */
  const del = async (id) => {
    if (id === "SALE" || id === "CUSTOMER") {
      alert("یہ entry delete نہیں ہو سکتی"); return;
    }

    const pass = prompt("Password?");
    if (!pass) return;

    const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/delete/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: pass }),
    });

    const d = await r.json();
    if (d.success) { loadLedger(refNo); loadPending(); }
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

  pdf.setFillColor(18, 97, 160);
  pdf.rect(0, 0, w, 25, "F");

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(16);
  pdf.text("MAKKI MADNI TRAVEL", w / 2, 15, { align: "center" });
  pdf.setFontSize(10);
  pdf.text("Customer Ledger Statement", w / 2, 22, { align: "center" });

  pdf.addImage(img, "PNG", 10, 30, 190, (canvas.height * 190) / canvas.width);

  // ✅ Get Customer Name
  let customerName = "Customer";
  const customerRow = rows.find(r => r.id === "CUSTOMER");

  if (customerRow && customerRow.description) {
    customerName = customerRow.description
      .replace(/[^a-zA-Z0-9 ]/g, "")   // remove special chars
      .replace(/\s+/g, "_");          // space to underscore
  }

  // ✅ Save as Ref + CustomerName
  pdf.save(`${refNo}-${customerName}-Ledger.pdf`);
};
   
  return (
    <div className="container p-3">

      {/* HEADER */}
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">📘 CUSTOMER LEDGER — {refNo}</h4>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>⬅ Back</button>
        </div>
      </div>

    {/* PENDING LIST */}
    <div className="card shadow-sm mb-3">
      <div className="card-header fw-bold text-danger">⏳ Pending / Partial Ledgers</div>
      <div className="card-body p-2">
        {pending.length === 0 ? (
          <p className="text-success mb-0">✅ No pending ledgers</p>
        ) : (
          <ul className="list-group list-group-flush">
            {pending.map((p, i) => (
              <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                <div>
                  <b>
                    {p.ref_no} — <span className="text-primary">{p.customer_name || "-"}</span>
                  </b>
                  <span className={`badge ms-2 ${p.status === "PENDING" ? "bg-danger" : "bg-warning text-dark"}`}>
                    {p.status}
                  </span>
                </div>
                <button className="btn btn-sm btn-outline-primary" onClick={() => loadLedger(p.ref_no)}>Load</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>

      {/* CONTROLS */}
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex gap-2">
          <input className="form-control" placeholder="Ref No" value={refNo} onChange={(e) => setRefNo(e.target.value)} />
          <button className="btn btn-primary" onClick={() => loadLedger()}>Load</button>
          <button className="btn btn-success" onClick={exportPDF}>📄 Export PDF</button>
        </div>
      </div>

      {/* ENTRY FORM */}
      <div className="card shadow-sm mb-3">
        <div className="card-body row g-2">
          <div className="col-md-3">
            <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          <div className="col-md-3">
            <input className="form-control" placeholder="Amount" value={amountDisp} onChange={(e) => {
              const raw = parseAmt(e.target.value);
              if (!isNaN(raw)) { setAmountRaw(raw); setAmountDisp(fmtAmt(raw)); }
            }} />
          {amountRaw > 0 && (
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "green" }}>
              {numberToWords(amountRaw)}
            </span>
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
              <option>Bank</option>
              <option>Cash</option>
            </select>
          </div>
        </div>
        <div className="card-body">
          <button className="btn btn-success" disabled={saving} onClick={saveEntry}>{saving ? "Saving..." : "💾 Save Entry"}</button>
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
                <th>❌</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr><td colSpan="6" className="text-center text-muted">No ledger entries</td></tr>
              )}
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{getRowDate(r)}</td>
                  <td className={r.id === "CUSTOMER" ? "fw-bold text-primary" : ""}>{r.description}</td>
                  <td>{fmtAmt(r.debit)}</td>
                  <td>{fmtAmt(r.credit)}</td>
                  <td className="fw-bold">{fmtAmt(r.balance)}</td>
                  <td>
                    {r.id !== "SALE" && r.id !== "CUSTOMER" && (
                      <button className="btn btn-danger btn-sm" onClick={() => del(r.id)}>Del</button>
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



