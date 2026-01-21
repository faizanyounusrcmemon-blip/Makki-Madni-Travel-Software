
import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// VIP Visa Styles (Purple + Silver)
const styles = {
  container: {
    minHeight: "100vh",
    padding: "20px",
    background: "linear-gradient(to right, #f4f0ff, #f9f9ff)",
    fontFamily: "'Cairo', sans-serif",
  },
  card: {
    maxWidth: 1100,
    margin: "0 auto",
    background: "linear-gradient(to bottom, #ffffff, #f7f4ff)",
    borderRadius: 20,
    padding: 30,
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    border: "2px solid #c0c0c0",
  },
  mainHeader: {
    textAlign: "center",
    color: "#4b0082", // deep purple
    fontWeight: "bold",
    fontSize: "2rem",
    marginBottom: 0,
    letterSpacing: 2,
  },
  subHeader: {
    textAlign: "center",
    color: "#6a0dad", // violet accent
    fontSize: "1rem",
    marginBottom: 3,
  },
  quoteHeader: {
    textAlign: "center",
    color: "#6a0dad",
    fontWeight: "bold",
    fontSize: "1.4rem",
    marginTop: 10,
    marginBottom: 20,
  },
  sectionHeader: {
    background: "linear-gradient(to right, #6a0dad, #8a2be2)", // violet gradient
    color: "#fff",
    padding: "5px 10px",
    borderRadius: "5px",
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "600",
    letterSpacing: 1,
  },
  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0",
    borderRadius: "10px",
    overflow: "hidden",
  },
  th: {
    background: "#8a2be2", // violet
    color: "#fff",
    padding: "8px",
    textAlign: "left",
  },
  td: {
    padding: "8px",
    borderBottom: "1px solid #ddd",
  },
  button: {
    borderRadius: "50px",
    padding: "5px 15px",
    fontWeight: "bold",
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },
};

export default function Visa({ onNavigate }) {
  const [searchRef, setSearchRef] = useState("");
  const [refNo, setRefNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [rows, setRows] = useState([]);
  const [pkrRate, setPkrRate] = useState(0);
  const pdfRef = useRef(null);

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

  const loadVisa = async () => {
    if (!searchRef) return alert("Ref No likho");
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/visa/get/${searchRef}`
    );
    const data = await res.json();
    if (!data.success) return alert("Record not found");
    const d = data.row;
    setRefNo(d.ref_no);
    setCustomerName(d.customer_name);
    setBookingDate(d.booking_date);
    setRows(d.rows || []);
    setPkrRate(d.pkr_rate || 0);
    alert("✅ Visa Edit Mode load successfully!");
  };

  const saveData = async () => {
    const payload = {
      ref_no: refNo || null,
      customer_name: customerName,
      booking_date: bookingDate,
      rows,
      persons: rows.reduce((s, r) => s + Number(r.persons || 0), 0),
      rate: 0,
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
      alert("✅ Visa Saved Successfully! Ref#: " + data.ref_no);
      onNavigate("dashboard");
    } else {
      alert("ERROR: " + data.error);
    }
  };

  const exportPDF = async () => {
    const canvas = await html2canvas(pdfRef.current, { scale: 4 });
    const img = canvas.toDataURL("image/jpeg");
    const pdf = new jsPDF("l", "mm", "a4");
    pdf.addImage(
      img,
      "JPEG",
      0,
      0,
      pdf.internal.pageSize.getWidth(),
      pdf.internal.pageSize.getHeight()
    );
    pdf.save("visa.pdf");
  };

  return (
    <div style={styles.container}>
      <div className="d-flex justify-content-between mb-3">
        <button className="btn btn-dark btn-sm" style={styles.button} onClick={() => onNavigate("dashboard")}>
          ← Back
        </button>
        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm" style={styles.button} onClick={saveData}>💾 Save</button>
          <input
            className="form-control form-control-sm"
            style={{ width: 140, borderRadius: 50 }}
            placeholder="Search Ref"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
          />
          <button className="btn btn-warning btn-sm" style={styles.button} onClick={loadVisa}>🔄 Load / Edit</button>
          <button className="btn btn-success btn-sm" style={styles.button} onClick={exportPDF}>📄 Export PDF</button>
        </div>
      </div>

      <div ref={pdfRef} style={styles.card}>
        {/* VIP HEADER */}
        <h1 style={styles.mainHeader}>✈️ MAKKI MADNI TRAVEL</h1>
        <p style={styles.subHeader}>
          Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid<br />
          Garden West, Karachi<br />
          ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
        </p>

        <h4 style={styles.quoteHeader}>VISA QUOTATION</h4>

        {/* INFO */}
        <div className="d-flex gap-3 mb-3">
          <div>
            <label>Ref No</label>
            <input className="form-control form-control-sm" value={refNo} readOnly />
          </div>
          <div>
            <label>Customer Name</label>
            <input className="form-control form-control-sm" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label>Booking Date</label>
            <input type="date" className="form-control form-control-sm" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
          </div>
        </div>

        {/* TABLE */}
        <h5 style={styles.sectionHeader}>🛂 Visa Details</h5>
        <button className="btn btn-outline-primary btn-sm mb-2" style={styles.button} onClick={addRow}>➕ Add Visa Row</button>

        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.th}>Type</th>
              <th style={styles.th}>Persons</th>
              <th style={styles.th}>Rate (SAR)</th>
              <th style={styles.th}>Total (SAR)</th>
              <th style={styles.th}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} style={{ background: i % 2 === 0 ? "#f0e6ff" : "#fff" }}>
                <td style={styles.td}><input className="form-control form-control-sm" value={r.type} onChange={(e) => updateRow(i, "type", e.target.value)} /></td>
                <td style={styles.td}><input type="number" className="form-control form-control-sm" value={r.persons} onChange={(e) => updateRow(i, "persons", e.target.value)} /></td>
                <td style={styles.td}><input type="number" className="form-control form-control-sm" value={r.rate} onChange={(e) => updateRow(i, "rate", e.target.value)} /></td>
                <td style={{...styles.td, fontWeight: "bold"}}>{r.total}</td>
                <td style={{...styles.td, textAlign: "center"}}><button className="btn btn-sm btn-danger" onClick={() => removeRow(i)}>✖</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* SUMMARY */}
        <h5 style={styles.sectionHeader}>✨ Summary</h5>
        <table className="table table-sm">
          <tbody>
            <tr>
              <td>Total SAR</td>
              <td style={{ fontWeight: "bold" }}>{totalSAR}</td>
              <td>PKR Rate</td>
              <td><input className="form-control form-control-sm" type="number" value={pkrRate} onChange={(e) => setPkrRate(+e.target.value)} /></td>
              <td style={{ fontWeight: "bold" }}>{totalPKR.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
