import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function CustomerLedger({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [rows, setRows] = useState([]);
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

    if (data.success) {
      setRows(data.rows || []);
      setCustomerName(data.customer_name || "");
    } else {
      alert(data.error);
    }
  };

  /* =========================
     SAVE PAYMENT
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
          payment_date: date, // ✅ correct date
          amount,
          payment_method: method,
          type
        })
      }
    );

    const data = await res.json();
    if (data.success) {
      setAmount("");
      setDate("");
      loadLedger();
    } else {
      alert(data.error);
    }
  };

  /* =========================
     DELETE ENTRY
  ========================= */
  const del = async (id) => {
    const pass = prompt("Enter password");
    if (!pass) return;

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/delete/${id}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass })
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
    const canvas = await html2canvas(pdfRef.current, { scale: 2 });
    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save(`${refNo}_ledger.pdf`);
  };

  return (
    <div className="container p-3">
      <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>
        ⬅ Back
      </button>

      <h4 className="mt-3 text-info fw-bold">
        📘 CUSTOMER LEDGER — {refNo}
      </h4>

      {customerName && (
        <div className="fw-bold text-light mb-2">
          Customer: {customerName}
        </div>
      )}

      {/* LOAD */}
      <div className="d-flex gap-2 mt-2">
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
          Export PDF
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
                <td>
                  {r.payment_date
                    ? new Date(r.payment_date).toLocaleDateString("en-GB")
                    : "-"}
                </td>
                <td>{r.description}</td>
                <td>{r.debit || "-"}</td>
                <td>{r.credit || "-"}</td>
                <td className="fw-bold">{r.balance}</td>
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
    </div>
  );
}
