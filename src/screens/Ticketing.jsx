import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// =========================
// VIP Ticketing Styles
// =========================
const styles = {
  container: {
    minHeight: "100vh",
    padding: "20px",
    background: "linear-gradient(to right, #fff3e0, #fff9f1)", // warm gradient
    fontFamily: "'Cairo', sans-serif",
  },
  card: {
    maxWidth: 1100,
    margin: "0 auto",
    background: "linear-gradient(to bottom, #ffffff, #fefaf5)",
    borderRadius: 20,
    padding: 25,
    boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
    border: "2px solid #ff6f61", // coral accent
  },
  header: {
    textAlign: "center",
    color: "#d84315", // deep orange
    fontWeight: "bold",
    fontSize: "2rem",
    marginBottom: 5,
    letterSpacing: 2,
  },
  contactInfo: {
    textAlign: "center",
    fontSize: "0.9rem",
    color: "#555",
    marginBottom: 20,
  },
  subHeader: {
    textAlign: "center",
    color: "#ff6f61", // coral accent
    marginBottom: 15,
    fontSize: "1.2rem",
    fontWeight: "500",
  },
  sectionHeader: {
    background: "linear-gradient(to right, #ff6f61, #ffa07a)",
    color: "#fff",
    padding: "5px 10px",
    borderRadius: "5px",
    marginTop: 20,
    marginBottom: 10,
    fontWeight: "600",
    letterSpacing: 1,
  },
};

export default function Ticketing({ onNavigate }) {
  const [searchRef, setSearchRef] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [refNo, setRefNo] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [isEdit, setIsEdit] = useState(false);


  // ===== FLIGHTS =====
  const [flights, setFlights] = useState([
    { from: "", to: "", date: "", airline: "" },
    { from: "", to: "", date: "", airline: "" },
  ]);

  const addFlightRow = () => setFlights([...flights, { from: "", to: "", date: "", airline: "" }]);

  const [adultQty, setAdultQty] = useState(0);
  const [adultRate, setAdultRate] = useState(0);
  const [childQty, setChildQty] = useState(0);
  const [childRate, setChildRate] = useState(0);
  const [infantQty, setInfantQty] = useState(0);
  const [infantRate, setInfantRate] = useState(0);
  const [ticketRate, setTicketRate] = useState(0);

  const pdfRef = useRef(null);

  const totalSAR = adultQty * adultRate + childQty * childRate + infantQty * infantRate;
  const totalPKR = totalSAR * ticketRate;

  // ===== LOAD TICKETING =====
// ===== LOAD TICKETING WITH PURCHASE CHECK =====
  const loadTicketing = async () => {
    if (!searchRef) return alert("Search Ref No likho");

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ticketing/get/${searchRef}`);
    const data = await res.json();
    if (!data.success) return alert("Record not found");

    const d = data.row;

    // 🔹 CHECK IF PURCHASE ENTRIES EXIST
    const purchaseRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase/check/${d.ref_no}`);
    const purchaseData = await purchaseRes.json();
    if (purchaseData.total > 0) {
      return alert("❌ Cannot edit. Purchase entries exist for this Ref No. Delete purchases first.");
    }

    // 🔹 LOAD DATA
    setRefNo(d.ref_no);
    setCustomerName(d.customer_name);
    setBookingDate(d.booking_date);
    setFlights(d.flight_from.map((_, i) => ({
      from: d.flight_from[i],
      to: d.flight_to[i],
      date: d.flight_date[i],
      airline: d.airline?.[i] || "",
    })));
    setAdultQty(d.adult_qty);
    setAdultRate(d.adult_rate);
    setChildQty(d.child_qty);
    setChildRate(d.child_rate);
    setInfantQty(d.infant_qty);
    setInfantRate(d.infant_rate);
    setTicketRate(d.pkr_rate);
    setIsEdit(true);

    alert("✅ Ticketing Edit Mode load successfully!");
  };

  // ===== SAVE DATA =====
  const saveData = async () => {
    const payload = {
      ref_no: refNo || null,
      customer_name: customerName,
      booking_date: bookingDate,
      flights,
      adultQty,
      adultRate,
      childQty,
      childRate,
      infantQty,
      infantRate,
      total_sar: totalSAR,
      pkr_rate: ticketRate,
      total_pkr: totalPKR,
    };
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ticketing/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        setRefNo(data.ref_no);
        alert("✅ Ticketing Saved Successfully! Ref#: " + data.ref_no);
        onNavigate("dashboard");
      } else alert("Error: " + data.error);
    } catch (err) {
      alert("Network Error: " + err.message);
    }
  };

  // ===== EXPORT PDF =====
  const exportPDF = async () => {
    const canvas = await html2canvas(pdfRef.current, { scale: 4 });
    const img = canvas.toDataURL("image/jpeg");
    const pdf = new jsPDF("l", "mm", "a4");
    pdf.addImage(img, "JPEG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    pdf.save(`${refNo || "ticketing"}.pdf`);
  };

  return (
    <div style={styles.container}>
      {/* Top Buttons */}
      <div className="d-flex justify-content-between mb-3">
        <button className="btn btn-dark btn-sm" onClick={() => onNavigate("dashboard")}>← Back</button>
        <div className="d-flex gap-2">
          <button
            className={`btn btn-sm ${
              isEdit ? "btn-warning text-dark" : "btn-primary"
            }`}
            style={styles.button}
            onClick={saveData}
          >
            {isEdit ? "✏ Update Save" : "💾 Save"}
          </button>

          <input className="form-control form-control-sm" style={{ width: 140 }} placeholder="Search Ref" value={searchRef} onChange={(e) => setSearchRef(e.target.value)} />
          <button className="btn btn-warning btn-sm" onClick={loadTicketing}>🔄 Load / Edit</button>
          <button className="btn btn-success btn-sm" onClick={exportPDF}>📄 Export PDF</button>
        </div>
      </div>

      {/* PDF Card */}
      <div ref={pdfRef} style={styles.card}>
        <h3 style={styles.header}>✈️ MAKKI MADNI TRAVEL</h3>
        <div style={styles.contactInfo}>
          Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid<br />
          Garden West, Karachi<br />
          ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
        </div>
        <h4 style={styles.subHeader}>TICKETING QUOTATION</h4>

        {/* Customer Info */}
        <div className="d-flex gap-3 mb-3">
          <div><label>Ref No</label><input className="form-control form-control-sm" value={refNo} readOnly /></div>
          <div><label>Customer Name</label><input className="form-control form-control-sm" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
          <div><label>Booking Date</label><input type="date" className="form-control form-control-sm" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} /></div>
        </div>

        {/* Flight Details */}
        <h6 style={styles.sectionHeader}>Flight Details</h6>
        <button className="btn btn-outline-primary btn-sm mb-2" onClick={addFlightRow}>➕ Add Flight</button>
        <table className="table table-sm">
          <thead>
            <tr><th>From</th><th>To</th><th>Date</th><th>Airline</th><th></th></tr>
          </thead>
          <tbody>
            {flights.map((f, i) => (
              <tr key={i}>
                <td><input className="form-control form-control-sm" value={f.from} onChange={(e) => { const u = [...flights]; u[i].from = e.target.value; setFlights(u); }} /></td>
                <td><input className="form-control form-control-sm" value={f.to} onChange={(e) => { const u = [...flights]; u[i].to = e.target.value; setFlights(u); }} /></td>
                <td><input type="date" className="form-control form-control-sm" value={f.date} onChange={(e) => { const u = [...flights]; u[i].date = e.target.value; setFlights(u); }} /></td>
                <td><input className="form-control form-control-sm" placeholder="PIA / SAUDIA" value={f.airline} onChange={(e) => { const u = [...flights]; u[i].airline = e.target.value; setFlights(u); }} /></td>
                <td><button className="btn btn-sm btn-link text-danger" onClick={() => setFlights(flights.filter((_, x) => x !== i))}>✖</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Passenger Fares */}
        <h6 style={styles.sectionHeader}>Passenger Fares</h6>
        <table className="table table-sm">
          <tbody>
            <tr><td>Adult</td><td><input type="number" className="form-control form-control-sm" value={adultQty} onChange={(e) => setAdultQty(+e.target.value)} /></td><td><input type="number" className="form-control form-control-sm" value={adultRate} onChange={(e) => setAdultRate(+e.target.value)} /></td><td className="fw-bold">{adultQty*adultRate}</td></tr>
            <tr><td>Child</td><td><input type="number" className="form-control form-control-sm" value={childQty} onChange={(e) => setChildQty(+e.target.value)} /></td><td><input type="number" className="form-control form-control-sm" value={childRate} onChange={(e) => setChildRate(+e.target.value)} /></td><td className="fw-bold">{childQty*childRate}</td></tr>
            <tr><td>Infant</td><td><input type="number" className="form-control form-control-sm" value={infantQty} onChange={(e) => setInfantQty(+e.target.value)} /></td><td><input type="number" className="form-control form-control-sm" value={infantRate} onChange={(e) => setInfantRate(+e.target.value)} /></td><td className="fw-bold">{infantQty*infantRate}</td></tr>
            <tr className="table-info"><td className="fw-bold">Total SAR</td><td></td><td></td><td className="fw-bold">{totalSAR}</td></tr>
          </tbody>
        </table>

        {/* Summary */}
        <h6 style={styles.sectionHeader}>Summary</h6>
        <table className="table table-sm">
          <tbody>
            <tr>
              <td>Total SAR</td>
              <td className="fw-bold">{totalSAR}</td>
              <td>Rate</td>
              <td><input type="number" className="form-control form-control-sm" value={ticketRate} onChange={(e) => setTicketRate(+e.target.value)} /></td>
              <td className="fw-bold">{totalPKR.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  );
}
