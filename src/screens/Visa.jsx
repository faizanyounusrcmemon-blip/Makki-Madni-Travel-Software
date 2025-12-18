import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Visa({ onNavigate }) {
  const [customerName, setCustomerName] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [refNo, setRefNo] = useState("");

  const [rows, setRows] = useState([]);
  const [pkrRate, setPkrRate] = useState(0);

  const addRow = () =>
    setRows([...rows, { type: "", persons: 0, rate: 0, total: 0 }]);

  const removeRow = (i) => setRows(rows.filter((_, x) => x !== i));

  const updateRow = (i, field, value) => {
    const copy = [...rows];
    copy[i][field] = value;

    const persons = Number(copy[i].persons) || 0;
    const rate = Number(copy[i].rate) || 0;
    copy[i].total = persons * rate;

    setRows(copy);
  };

  const totalSAR = rows.reduce((s, r) => s + r.total, 0);
  const totalPKR = totalSAR * pkrRate;

  const pdfRef = useRef(null);

  const exportPDF = async () => {
    const canvas = await html2canvas(pdfRef.current, { scale: 4 });
    const img = canvas.toDataURL("image/jpeg");

    const pdf = new jsPDF("l", "mm", "a4");
    pdf.addImage(img, "JPEG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    pdf.save("visa.pdf");
  };

  // ✅ SAVE (FIXED)
  const saveData = async () => {
    const payload = {
      customer_name: customerName,
      booking_date: bookingDate,

      rows,                 // ✅ full detail rows
      persons: rows.reduce((s, r) => s + Number(r.persons || 0), 0),
      rate: 0,               // not used but kept for compatibility

      total_sar: totalSAR,
      pkr_rate: pkrRate,
      total_pkr: totalPKR,
    };

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/visa/save`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.success) {
      setRefNo(data.ref_no);
      alert("Visa Saved Successfully!");
      onNavigate("dashboard");
    } else {
      alert("ERROR: " + data.error);
    }
  };

  return (
    <div className="container-fluid py-3" style={{ background: "#eef4f7" }}>
      {/* TOP BAR */}
      <div className="d-flex justify-content-between mb-3">
        <button className="btn btn-dark btn-sm" onClick={() => onNavigate("dashboard")}>
          ← Back
        </button>

        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={saveData}>💾 Save</button>
          <button className="btn btn-success btn-sm" onClick={exportPDF}>📄 Export PDF</button>
        </div>
      </div>

      <div ref={pdfRef} className="bg-white p-3 mx-auto" style={{ maxWidth: 1100 }}>
        <h3 className="text-center fw-bold">MAKKI MADNI TRAVEL</h3>
        <h4 className="fw-bold mb-3">VISA QUOTATION</h4>

        {/* INFO */}
        <div className="d-flex gap-3 mb-3">
          <div>
            <label>Ref No</label>
            <input className="form-control form-control-sm" value={refNo} readOnly />
          </div>

          <div>
            <label>Customer Name</label>
            <input className="form-control form-control-sm"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div>
            <label>Booking Date</label>
            <input type="date" className="form-control form-control-sm"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />
          </div>
        </div>

        {/* TABLE */}
        <h6 className="bg-info text-white p-1">Visa Details</h6>

        <button className="btn btn-outline-primary btn-sm mb-2" onClick={addRow}>
          ➕ Add Visa Row
        </button>

        <table className="table table-sm">
          <thead>
            <tr>
              <th>Type</th>
              <th>Persons</th>
              <th>Rate (SAR)</th>
              <th>Total (SAR)</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td><input className="form-control form-control-sm"
                  value={r.type}
                  onChange={(e) => updateRow(i, "type", e.target.value)}
                /></td>

                <td><input type="number" className="form-control form-control-sm"
                  value={r.persons}
                  onChange={(e) => updateRow(i, "persons", e.target.value)}
                /></td>

                <td><input type="number" className="form-control form-control-sm"
                  value={r.rate}
                  onChange={(e) => updateRow(i, "rate", e.target.value)}
                /></td>

                <td className="fw-bold">{r.total}</td>

                <td>
                  <button className="btn btn-link text-danger" onClick={() => removeRow(i)}>✖</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* SUMMARY */}
        <h6 className="bg-info text-white p-1">Summary</h6>

        <table className="table table-sm">
          <tbody>
            <tr>
              <td>Total SAR</td>
              <td className="fw-bold">{totalSAR}</td>

              <td>PKR Rate</td>
              <td>
                <input type="number" className="form-control form-control-sm"
                  value={pkrRate}
                  onChange={(e) => setPkrRate(+e.target.value)}
                />
              </td>

              <td className="fw-bold">{totalPKR.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
