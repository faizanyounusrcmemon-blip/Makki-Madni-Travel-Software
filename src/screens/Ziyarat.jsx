import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Ziyarat({ onNavigate }) {
  // =========================
  // BASIC STATES
  // =========================
  const [searchRef, setSearchRef] = useState("");
  const [refNo, setRefNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [bookingDate, setBookingDate] = useState("");

  // =========================
  // ZIYARAT ROWS
  // =========================
  const [rows, setRows] = useState([]);

  // =========================
  // SUMMARY
  // =========================
  const [pkrRate, setPkrRate] = useState(0);

  const quoteRef = useRef(null);

  // =========================
  // ROW HANDLERS
  // =========================
  const addRow = () => {
    setRows([...rows, { description: "", sar: 0 }]);
  };

  const updateRow = (i, field, value) => {
    const copy = [...rows];
    copy[i][field] = field === "description" ? value : Number(value) || 0;
    setRows(copy);
  };

  const removeRow = (i) => {
    setRows(rows.filter((_, x) => x !== i));
  };

  // =========================
  // TOTALS
  // =========================
  const totalSar = rows.reduce((s, r) => s + (Number(r.sar) || 0), 0);
  const totalPkr = totalSar * pkrRate;

  // =========================
  // LOAD / EDIT
  // =========================
  const loadZiyarat = async () => {
    if (!searchRef) return alert("Ref No likho");

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/ziyarat/get/${searchRef}`
    );
    const data = await res.json();

    if (!data.success) return alert("Record not found");

    const d = data.row;

    setRefNo(d.ref_no);
    setCustomerName(d.customer_name);
    setBookingDate(d.booking_date);
    setRows(d.rows || []);
    setPkrRate(d.pkr_rate || 0);

    alert("Ziyarat load ho gayi — ab edit karo");
  };

  // =========================
  // SAVE
  // =========================
  const saveData = async () => {
    if (!customerName || !bookingDate) {
      alert("Customer name & booking date required");
      return;
    }

    const payload = {
      ref_no: refNo || null,
      customer_name: customerName,
      booking_date: bookingDate,
      rows,
      total_sar: totalSar,
      pkr_rate: pkrRate,
      total_pkr: totalPkr,
    };

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/ziyarat/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    if (data.success) {
      setRefNo(data.ref_no);
      alert("Ziyarat saved successfully");
      onNavigate("dashboard");
    } else {
      alert(data.error || "Save failed");
    }
  };

  // =========================
  // PDF
  // =========================
  const exportPDF = async () => {
    const canvas = await html2canvas(quoteRef.current, { scale: 3 });
    const img = canvas.toDataURL("image/jpeg");

    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(img, "JPEG", 0, 0, 210, 297);
    pdf.save(`${refNo || "ziyarat"}.pdf`);
  };

  // =========================
  // UI
  // =========================
  return (
    <div className="container-fluid py-3" style={{ background: "#eef4f7" }}>
      <div className="d-flex justify-content-between mb-3">
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>
          ⬅ Back
        </button>

        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={saveData}>💾 Save</button>

          <input
            className="form-control form-control-sm"
            style={{ width: 140 }}
            placeholder="Search Ref"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
          />

          <button className="btn btn-warning btn-sm" onClick={loadZiyarat}>
            🔄 Load / Edit
          </button>

          <button className="btn btn-success btn-sm" onClick={exportPDF}>
            📄 Export PDF
          </button>
        </div>
      </div>

      <div ref={quoteRef} className="mx-auto bg-white p-3" style={{ maxWidth: 1000 }}>
        <h3 className="text-center fw-bold">MAKKI MADNI TRAVEL</h3>
        <h5 className="fw-bold mb-3">ZIYARAT QUOTATION</h5>

        <div className="row g-2 mb-3">
          <div className="col">
            <label>Ref No</label>
            <input className="form-control form-control-sm" value={refNo} readOnly />
          </div>
          <div className="col">
            <label>Customer Name</label>
            <input className="form-control form-control-sm" value={customerName}
              onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="col">
            <label>Booking Date</label>
            <input type="date" className="form-control form-control-sm"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)} />
          </div>
        </div>

        <h6 className="bg-info text-white p-1">Ziyarat</h6>

        <button className="btn btn-outline-primary btn-sm mb-2" onClick={addRow}>
          ➕ Add Ziyarat Row
        </button>

        <table className="table table-sm">
          <thead>
            <tr>
              <th>Description</th>
              <th style={{ width: 150 }}>SAR</th>
              <th style={{ width: 80 }}></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>
                  <input className="form-control form-control-sm"
                    value={r.description}
                    onChange={(e) => updateRow(i, "description", e.target.value)} />
                </td>
                <td>
                  <input type="number" className="form-control form-control-sm"
                    value={r.sar}
                    onChange={(e) => updateRow(i, "sar", e.target.value)} />
                </td>
                <td>
                  <button className="btn btn-link text-danger" onClick={() => removeRow(i)}>✖</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <h6 className="bg-info text-white p-1 mt-3">Summary</h6>

        <div className="row g-2">
          <div className="col-md-4">
            <label>Total SAR</label>
            <input className="form-control form-control-sm" value={totalSar} readOnly />
          </div>
          <div className="col-md-4">
            <label>PKR Rate</label>
            <input type="number" className="form-control form-control-sm"
              value={pkrRate}
              onChange={(e) => setPkrRate(Number(e.target.value) || 0)} />
          </div>
          <div className="col-md-4">
            <label>Total PKR</label>
            <input className="form-control form-control-sm fw-bold"
              value={totalPkr.toLocaleString()} readOnly />
          </div>
        </div>
      </div>
    </div>
  );
}
