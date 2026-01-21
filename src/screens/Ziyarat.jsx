import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// VIP Ziyarat CSS Inline Styles (Green Theme)
const styles = {
  container: {
    minHeight: "100vh",
    padding: "20px",
    background: "linear-gradient(to right, #e0f7fa, #fff9f0)",
    fontFamily: "'Cairo', sans-serif",
  },
  card: {
    maxWidth: 1000,
    margin: "0 auto",
    background: "linear-gradient(to bottom, #ffffff, #fffef5)",
    borderRadius: 20,
    padding: 30,
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    border: "2px solid #ffd700",
  },
  mainHeader: {
    textAlign: "center",
    color: "#006400", // dark green
    fontWeight: "bold",
    fontSize: "2rem",
    marginBottom: 0,
    letterSpacing: 2,
  },
  subHeader: {
    textAlign: "center",
    color: "#8b4513",
    fontSize: "1rem",
    marginBottom: 3,
  },
  quoteHeader: {
    textAlign: "center",
    color: "#006400",
    fontWeight: "bold",
    fontSize: "1.4rem",
    marginTop: 10,
    marginBottom: 20,
  },
  sectionHeader: {
    background: "linear-gradient(to right, #006400, #32cd32)",
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
    background: "#32cd32",
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
  summaryInput: {
    fontWeight: "bold",
    fontSize: "1.1rem",
    background: "#fff8dc",
    border: "1px solid #ffd700",
  },
};

export default function Ziyarat({ onNavigate }) {
  const [searchRef, setSearchRef] = useState("");
  const [refNo, setRefNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [rows, setRows] = useState([]);
  const [pkrRate, setPkrRate] = useState(0);

  const quoteRef = useRef(null);

  const addRow = () => setRows([...rows, { description: "", sar: 0 }]);
  const updateRow = (i, field, value) => {
    const copy = [...rows];
    copy[i][field] = field === "description" ? value : Number(value) || 0;
    setRows(copy);
  };
  const removeRow = (i) => setRows(rows.filter((_, x) => x !== i));

  const totalSar = rows.reduce((s, r) => s + (Number(r.sar) || 0), 0);
  const totalPkr = totalSar * pkrRate;

  const loadZiyarat = async () => {
    if (!searchRef) return alert("Ref No likho");
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ziyarat/get/${searchRef}`);
    const data = await res.json();
    if (!data.success) return alert("Record not found");
    const d = data.row;
    setRefNo(d.ref_no);
    setCustomerName(d.customer_name);
    setBookingDate(d.booking_date);
    setRows(d.rows || []);
    setPkrRate(d.pkr_rate || 0);
    alert("✅ Ziyarat Edit Mode load successfully!");
  };

  const saveData = async () => {
    if (!customerName || !bookingDate) {
      alert("Customer name & booking date required");
      return;
    }
    const payload = { ref_no: refNo || null, customer_name: customerName, booking_date: bookingDate, rows, total_sar: totalSar, pkr_rate: pkrRate, total_pkr: totalPkr };
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ziyarat/save`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (data.success) {
      setRefNo(data.ref_no);
      alert("✅ Ziyarat Saved Successfully! Ref#: " + data.ref_no);
      onNavigate("dashboard");
    } else alert(data.error || "Save failed");
  };

  const exportPDF = async () => {
    const canvas = await html2canvas(quoteRef.current, { scale: 3 });
    const img = canvas.toDataURL("image/jpeg");
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(img, "JPEG", 0, 0, 210, 297);
    pdf.save(`${refNo || "ziyarat"}.pdf`);
  };

  return (
    <div style={styles.container}>
      {/* Header Buttons */}
      <div className="d-flex justify-content-between mb-4">
        <button className="btn btn-outline-success fw-bold" style={styles.button} onClick={() => onNavigate("dashboard")}>🕌 Back</button>

        <div className="d-flex gap-2">
          <button className="btn btn-warning fw-bold" style={styles.button} onClick={saveData}>💾 Save</button>
          <input className="form-control" style={{ width: 150, borderRadius: 50 }} placeholder="Search Ref" value={searchRef} onChange={(e) => setSearchRef(e.target.value)} />
          <button className="btn btn-info fw-bold" style={styles.button} onClick={loadZiyarat}>🔄 Load / Edit</button>
          <button className="btn btn-success fw-bold" style={styles.button} onClick={exportPDF}>📄 Export PDF</button>
        </div>
      </div>

      {/* Ziyarat Card */}
      <div ref={quoteRef} style={styles.card}>
        <h1 style={styles.mainHeader}>✈️ MAKKI MADNI TRAVEL</h1>
        <p style={styles.subHeader}>
          Shop #4 Daimon City Building, Near Zeenat-ul-Islam Masjid<br />
          Garden West, Karachi<br />
          ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
        </p>
        <h4 style={styles.quoteHeader}>ZIYARAT QUOTATION</h4>

        {/* Customer Info */}
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <label className="form-label fw-semibold">Ref No</label>
            <input className="form-control" value={refNo} readOnly />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Customer Name</label>
            <input className="form-control" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div className="col-md-4">
            <label className="form-label fw-semibold">Booking Date</label>
            <input type="date" className="form-control" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
          </div>
        </div>

        {/* Ziyarat Table */}
        <div className="mb-3">
          <h5 style={styles.sectionHeader}>🕌 Ziyarat</h5>
          <button className="btn btn-outline-success btn-sm mb-2" style={styles.button} onClick={addRow}>➕ Add Row</button>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Description</th>
                <th style={styles.th}>SAR</th>
                <th style={styles.th}>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} style={{ background: i % 2 === 0 ? "#f0fff0" : "#fff" }}>
                  <td style={styles.td}><input className="form-control" value={r.description} onChange={(e) => updateRow(i, "description", e.target.value)} /></td>
                  <td style={styles.td}><input type="number" className="form-control" value={r.sar} onChange={(e) => updateRow(i, "sar", e.target.value)} /></td>
                  <td style={{ ...styles.td, textAlign: "center" }}><button className="btn btn-sm btn-danger" onClick={() => removeRow(i)}>✖</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="mb-3">
          <h5 style={styles.sectionHeader}>✨ Summary</h5>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Total SAR</label>
              <input className="form-control" value={totalSar} readOnly style={styles.summaryInput} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">PKR Rate</label>
              <input type="number" className="form-control" value={pkrRate} onChange={(e) => setPkrRate(Number(e.target.value) || 0)} style={styles.summaryInput} />
            </div>
            <div className="col-md-4">
              <label className="form-label fw-semibold">Total PKR</label>
              <input className="form-control text-success" value={totalPkr.toLocaleString()} readOnly style={{ ...styles.summaryInput, fontWeight: "bold", fontSize: "1.2rem" }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
