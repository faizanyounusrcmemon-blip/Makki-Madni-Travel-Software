import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* =========================
   DATE FORMATTER (SAFE)
========================= */
const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt)) return "-";
  return dt.toLocaleDateString("en-GB");
};

export default function CustomerLedger({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [type, setType] = useState("payment");
  const [method, setMethod] = useState("Cash");

  const pdfRef = useRef(null);

  /* =========================
     LOAD LEDGER
  ========================= */
  const loadLedger = async () => {
    if (!refNo) return alert("Ref No required");

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/${refNo}`
    );
    const data = await res.json();

    if (!data.success) return alert(data.error);

    setRows(data.rows || []);

    // 🔥 customer name (sale row se)
    const saleRow = data.rows?.find((r) => r.id === "SALE");
    if (saleRow?.customer_name) {
      setCustomerName(saleRow.customer_name);
    }
  };

  /* =========================
     SAVE PAYMENT / ADJUSTMENT
  ========================= */
  const saveEntry = async () => {
    if (!amount || !date) return alert("Amount & Date required");

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/payment`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref_no: refNo,
          payment_date: date,
          amount,
          payment_method: method,
          type,
        }),
      }
    );

    const data = await res.json();
    if (!data.success) return alert(data.error);

    setAmount("");
    setDate("");
    loadLedger();
  };

  /* =========================
     DELETE ENTRY
  ========================= */
  const del = async (id) => {
    if (id === "SALE") return;

    const pass = prompt("Enter password");
    if (!pass) return;

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/delete/${id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
,
      }
    );

    const d = await r.json();
    if (d.success) loadLedger();
    else alert(d.error);
  };

  /* =========================
     EXPORT PDF
  ========================= */
  const exportPDF = async () => {
    if (!rows.length) return alert("No data to export");

    const canvas = await html2canvas(pdfRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const img = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF("p", "mm", "a4");

    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;

    pdf.setFontSize(14);
    pdf.text("CUSTOMER LEDGER", w / 2, 10, { align: "center" });

    pdf.setFontSize(10);
    pdf.text(`Ref No: ${refNo}`, 10, 18);
    if (customerName) pdf.text(`Customer: ${customerName}`, 10, 24);

    pdf.addImage(img, "JPEG", 0, 30, w, h);
    pdf.save(`Ledger-${refNo}.pdf`);
  };

  return (
    <div className="container p-3">
      <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>
        ⬅ Back
      </button>

      <h4 className="mt-2 text-info fw-bold">
        📘 CUSTOMER LEDGER {refNo && `— ${refNo}`}
      </h4>

      {/* LOAD */}
      <div className="d-flex gap-2 mt-3">
        <input
          className="form-control"
          placeholder="Ref No"
          value={refNo}
          onChange={(e) => setRefNo(e.target.value)}
        />
        <button className="btn btn-primary" onClick={loadLedger}>
          Load
        </button>
        <button className="btn btn-success" onClick={exportPDF}>
          📄 Export PDF
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
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
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

      <button className="btn btn-success mt-2" onClick={saveEntry}>
        Save Entry
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
                <td>{fmtDate(r.date)}</td>
                <td>{r.description}</td>
                <td>{r.debit || "-"}</td>
                <td>{r.credit || "-"}</td>
                <td className="fw-bold">{r.balance}</td>
                <td>
                  {r.id !== "SALE" && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => del(r.id)}
                    >
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
