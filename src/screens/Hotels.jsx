import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// =========================
// VIP Hotels Styles
// =========================
const styles = {
  container: {
    minHeight: "100vh",
    padding: "20px",
    background: "linear-gradient(to right, #e0f7fa, #f0f9ff)",
    fontFamily: "'Cairo', sans-serif",
  },
  card: {
    maxWidth: 1100,
    margin: "0 auto",
    background: "linear-gradient(to bottom, #ffffff, #f9fefd)",
    borderRadius: 20,
    padding: 25,
    boxShadow: "0 8px 20px rgba(0,0,0,0.15)",
    border: "2px solid #20c997", // teal border
  },
  header: {
    textAlign: "center",
    color: "#0d6efd", // primary blue
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
    color: "#20c997", // teal accent
    marginBottom: 15,
    fontSize: "1.2rem",
    fontWeight: "500",
  },
  sectionHeader: {
    background: "linear-gradient(to right, #0d6efd, #20c997)",
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
    borderSpacing: 0,
    borderRadius: "10px",
    overflow: "hidden",
  },
  th: {
    background: "#20c997", // teal
    color: "#fff",
    padding: "8px",
    textAlign: "left",
  },
  td: {
    padding: "6px",
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
    fontSize: "1rem",
    background: "#fff8dc",
    border: "1px solid #20c997",
  },
};

export default function Hotels({ onNavigate }) {
  const [searchRef, setSearchRef] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [agentName, setAgentName] = useState("");
  const [refNo, setRefNo] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [rows, setRows] = useState([]);
  const [sarRate, setSarRate] = useState(0);
  const pdfRef = useRef(null);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);


  const showDate = (val) => {
    if (!val) return "";
    const d = new Date(val);
    const day = String(d.getDate()).padStart(2, "0");
    const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = d.getFullYear();
    return `${day}/${mon}/${year}`;
  };

  const calcNights = (inD, outD) => {
    if (!inD || !outD) return "";
    const diff = (new Date(outD) - new Date(inD)) / (1000 * 60 * 60 * 24);
    return diff > 0 ? diff : "";
  };

  const hotelsTotal = rows.reduce((s, r) => s + (Number(r.total) || 0), 0);
  const hotelPKR = hotelsTotal * sarRate;

  const addRow = () =>
    setRows([...rows, { checkIn: "", checkOut: "", nights: "", location: "", hotel: "", rooms: "", type: "", rate: "", total: 0 }]);

  const removeRow = (i) => setRows(rows.filter((_, x) => x !== i));

  const updateRow = (i, field, value) => {
    const u = [...rows];
    u[i][field] = value;

    if (field === "checkIn" || field === "checkOut") {
      u[i].nights = calcNights(u[i].checkIn, u[i].checkOut);
    }

    const nights = Number(u[i].nights) || 0;
    const rooms = Number(u[i].rooms) || 0;
    const rate = Number(u[i].rate) || 0;

    u[i].total = nights * rooms * rate;
    setRows(u);
  };

  // ===== LOAD HOTEL WITH PURCHASE CHECK =====
  const loadHotel = async () => {
    if (!searchRef) return alert("Search Ref No likho");

    // Load hotel record
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/hotels/get/${searchRef}`);
    const data = await res.json();
    if (!data.success) return alert("Record not found");

    const d = data.row;

    // 🔹 CHECK PURCHASE ENTRIES BEFORE EDIT
    const purchaseRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase/check/${d.ref_no}`);
    const purchaseData = await purchaseRes.json();
    if (purchaseData.total > 0) {
      return alert("❌ Cannot edit. Purchase entries exist for this Ref No. Delete purchases first.");
    }

    setRefNo(d.ref_no);
    setCustomerName(d.customer_name);
    setAgentName(d.agent_name || "");
    setBookingDate(d.booking_date);
    setRows(d.hotels || []);
    setSarRate(d.sar_rate || 0);
    setIsEdit(true);

    alert("✅ Hotel Edit Mode load successfully!");
  };

const saveData = async () => {

  if (saving) return; // double click protection

  if (!customerName) return alert("Customer name required");
  if (!bookingDate) return alert("Booking date required");

  setSaving(true);

  const payload = {
    ref_no: refNo || null,
    customer_name: customerName,
    agent_name: agentName,
    booking_date: bookingDate,
    hotels: rows,
    hotels_total: hotelsTotal,
    sar_rate: sarRate,
    total_pkr: hotelPKR
  };

  try {

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/hotels/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await res.json();

    if (data.success) {
      setRefNo(data.ref_no);
      alert("✅ Hotels Saved Successfully! Ref#: " + data.ref_no);
      onNavigate("dashboard");
    } else {
      alert("ERROR: " + data.error);
    }

  } catch (err) {
    console.log(err);
    alert("Server Error");
  }

  setSaving(false);
};

  const exportPDF = async () => {
    const canvas = await html2canvas(pdfRef.current, { scale: 3 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    pdf.addImage(imgData, "PNG", 0, 0, pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight());
    pdf.save("hotels.pdf");
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
  disabled={saving}
>
  {saving ? "Saving..." : isEdit ? "✏ Update Save" : "💾 Save"}
</button>

          <input className="form-control form-control-sm" style={{ width: "140px" }} placeholder="Search Ref" value={searchRef} onChange={(e) => setSearchRef(e.target.value)} />
          <button className="btn btn-warning btn-sm" onClick={loadHotel}>🔄 Load / Edit</button>
          <button className="btn btn-success btn-sm" onClick={exportPDF}>📄 Export PDF</button>
        </div>
      </div>

      {/* Main Card */}
      <div ref={pdfRef} style={styles.card}>
        {/* Header */}
        <h3 style={styles.header}>✈️ MAKKI MADNI TRAVEL</h3>
        <div style={styles.contactInfo}>
          Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid<br />
          Garden West, Karachi<br />
          ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
        </div>
        <h4 style={styles.subHeader}>HOTEL QUOTATION</h4>

        {/* Customer Info */}
        <div className="d-flex gap-3 mb-3">
          <div><label>Ref No</label><input className="form-control form-control-sm" value={refNo} readOnly /></div>
          <div><label>Customer Name</label><input className="form-control form-control-sm" value={customerName} onChange={(e) => setCustomerName(e.target.value)} /></div>
          <div><label>Agent Name</label><input className="form-control form-control-sm" value={agentName} onChange={(e) => setAgentName(e.target.value)} placeholder="Agent name" /> </div>
          <div><label>Booking Date</label><input type="date" className="form-control form-control-sm" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} /><small className="text-muted">{showDate(bookingDate)}</small></div>
        </div>

{/* Hotels Table */}
<h6 style={styles.sectionHeader}>Hotels</h6>
<button className="btn btn-outline-primary btn-sm mb-2" onClick={addRow} style={styles.button}>➕ Add Row</button>

<table className="table table-sm">
  <tbody>
{rows.map((r, i) => (
  <React.Fragment key={i}>
    {/* HOTEL NAME HEADER */}
    <tr>
      <td colSpan={9} style={{ fontWeight: "700", textAlign: "left", padding: "5px 10px", background: "#cce5ff" }}>
        HOTEL NAME
      </td>
    </tr>

    {/* HOTEL NAME INPUT */}
    <tr>
      <td colSpan={9}>
        <input
          className="form-control form-control-sm"
          placeholder="Enter Hotel Name"
          value={r.hotel}
          onChange={(e) => updateRow(i, "hotel", e.target.value)}
        />
      </td>
    </tr>

    {/* FIELD NAMES */}
    <tr style={{ background: "#20c997", color: "#fff", fontWeight: "600", textAlign: "center" }}>
      <td>Check-in</td>
      <td>Check-out</td>
      <td>Nights</td>
      <td>Location</td>
      <td>Rooms</td>
      <td>Type</td>
      <td>Rate</td>
      <td>Total</td>
      <td></td>
    </tr>

    {/* FIELD INPUTS */}
    <tr>
      <td>
        <input
          type="date"
          className="form-control form-control-sm"
          value={r.checkIn}
          onChange={(e) => updateRow(i, "checkIn", e.target.value)}
        />
        <small className="text-muted">{showDate(r.checkIn)}</small>
      </td>

      <td>
        <input
          type="date"
          className="form-control form-control-sm"
          value={r.checkOut}
          onChange={(e) => updateRow(i, "checkOut", e.target.value)}
        />
        <small className="text-muted">{showDate(r.checkOut)}</small>
      </td>

      <td style={{ width: "70px" }}>
        <input
          type="number"
          className="form-control form-control-sm text-center"
          value={r.nights}
          readOnly
        />
      </td>

      <td style={{ minWidth: "220px" }}>
        <input
          className="form-control form-control-sm"
          value={r.location}
          onChange={(e) => updateRow(i, "location", e.target.value)}
          placeholder="City / Area"
        />
      </td>

      <td style={{ width: "80px" }}>
        <input
          type="number"
          className="form-control form-control-sm text-center"
          value={r.rooms}
          onChange={(e) => updateRow(i, "rooms", e.target.value)}
        />
      </td>

      <td>
        <input
          className="form-control form-control-sm"
          value={r.type}
          onChange={(e) => updateRow(i, "type", e.target.value)}
        />
      </td>

      <td>
        <input
          type="number"
          className="form-control form-control-sm"
          value={r.rate}
          onChange={(e) => updateRow(i, "rate", e.target.value)}
        />
      </td>

      <td className="fw-bold">{r.total}</td>

      <td>
        <button
          className="btn btn-link text-danger"
          onClick={() => removeRow(i)}
        >
          ✖
        </button>
      </td>
    </tr>
  </React.Fragment>
))}

  </tbody>
</table>




        {/* Summary */}
        <h6 style={styles.sectionHeader}>Summary</h6>
        <table className="table table-sm">
          <tbody>
            <tr>
              <td>Hotels SAR</td>
              <td className="fw-bold">{hotelsTotal}</td>
              <td>SAR Rate</td>
              <td><input type="number" className="form-control form-control-sm" value={sarRate} onChange={(e) => setSarRate(+e.target.value)} /></td>
              <td className="fw-bold">{hotelPKR.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}