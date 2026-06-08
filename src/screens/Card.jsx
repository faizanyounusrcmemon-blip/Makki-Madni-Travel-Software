import React, { useState, useRef } from "react";
import usePdf from "../hooks/usePdf";
import Swal from "sweetalert2";
import Header from "../components/Header";

const showDate = (val) => {
  if (!val) return "";
  const d = new Date(val);

  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", {
    month: "short",
  });
  const year = d.getFullYear();

  return `${day}/${mon}/${year}`;
};


// VIP Card Styles (Purple + Silver)
// VIP Visa Styles (Royal Blue + Gold Luxury Theme)
const styles = {
  container: {
    minHeight: "100vh",
    padding: "25px",
    background: "linear-gradient(135deg, #eef2ff, #ffffff)",
    fontFamily: "'Cairo', sans-serif",
  },

  card: {
    maxWidth: 1100,
    margin: "0 auto",
    background: "linear-gradient(to bottom, #ffffff, #f8fbff)",
    borderRadius: 22,
    padding: 35,
    boxShadow: "0 12px 35px rgba(0,0,0,0.12)",
    border: "1px solid rgba(212,175,55,0.4)",
  },



  sectionHeader: {
    background: "linear-gradient(to right, #0b3d91, #1e5eff)",
    color: "#fff",
    padding: "7px 14px",
    borderRadius: "8px",
    marginTop: 25,
    marginBottom: 12,
    fontWeight: "600",
    letterSpacing: 1,
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0",
    borderRadius: "12px",
    overflow: "hidden",
    boxShadow: "0 5px 15px rgba(0,0,0,0.06)",
  },

  th: {
    background: "linear-gradient(to right, #0b3d91, #1e5eff)",
    color: "#fff",
    padding: "10px",
    textAlign: "left",
    fontWeight: "600",
  },

  td: {
    padding: "10px",
    borderBottom: "1px solid #eee",
    background: "#fff",
  },

  button: {
    borderRadius: "50px",
    padding: "7px 18px",
    fontWeight: "600",
    border: "none",
    color: "#fff",
    background: "linear-gradient(to right, #d4af37, #f5d76e)",
    boxShadow: "0 5px 15px rgba(0,0,0,0.15)",
    cursor: "pointer",
    transition: "0.3s",
  },
};

export default function Card({ onNavigate }) {
  const [searchRef, setSearchRef] = useState("");
  const [refNo, setRefNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [bookingDate, setBookingDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [rows, setRows] = useState([]);
  const [pkrRate, setPkrRate] = useState(0);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const pdfRef = useRef(null);

const { exportPDF, printPDF } = usePdf(pdfRef, {
  filePrefix: "Card",
  customerName: customerName,
  bookingDate: bookingDate,
  orientation: "p",
});

  // -------------------- Row Management --------------------
  const addRow = () => setRows([...rows, { type: "", persons: 0, rate: 0, total: 0 }]);
  const removeRow = (i) => setRows(rows.filter((_, x) => x !== i));

  const updateRow = (i, field, value) => {
    const copy = [...rows];
    copy[i][field] = value;
    const persons = Number(copy[i].persons) || 0;
    const rate = Number(copy[i].rate) || 0;
    copy[i].total = persons * rate; // total SAR
    setRows(copy);
  };

  // -------------------- Load Existing Card --------------------
const loadCard = async () => {

  if (!searchRef) {
    return Swal.fire({
      width: "300px",
      icon: "error",
      text: "Ref No likho"
    });
  }

  const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/card/get/${searchRef}`);
  const data = await res.json();

  if (!data.success) {
    return Swal.fire({
      width: "300px",
      icon: "error",
      text: "Record not found"
    });
  }

  const purchaseRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase/check/${data.row.ref_no}`);
  const purchaseData = await purchaseRes.json();

  if (purchaseData.total > 0) {
    return Swal.fire({
      width: "300px",
      icon: "error",
      text: "❌ Cannot edit. Purchase exists Delete purchases first."
    });
  }

  const d = data.row;

  setRefNo(d.ref_no);
  setCustomerName(d.customer_name);
  setBookingDate(d.booking_date);
  setRows(d.rows || []);
  setPkrRate(d.pkr_rate || 0);
  setIsEdit(true);

  Swal.fire({
    width: "300px",
    icon: "success",
    text: "Card loaded for edit"
  });
};

  // -------------------- Save / Update --------------------
const saveData = async () => {

  if (saving) return;

  if (!customerName || !bookingDate) {
    return Swal.fire({
      width: "300px",
      icon: "error",
      text: "Customer name & booking date required"
    });
  }

  const confirm = await Swal.fire({
    width: "300px",
    icon: "question",
    text: "Do you want to save this Card?",
    showCancelButton: true,
    confirmButtonText: "Save",
    cancelButtonText: "Cancel"
  });

  if (!confirm.isConfirmed) return;

  setSaving(true);

  Swal.fire({
    width: "260px",
    title: "Saving...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  const payload = {
    ref_no: refNo || null,
    customer_name: customerName,
    booking_date: bookingDate,
    rows,
    pkr_rate: pkrRate,
  };

  try {

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/card/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();

    Swal.close();

if (data.success) {

  await Swal.fire({
    width: "320px",
    icon: "success",
    title: "Saved Successfully",
    html: `
      <div style="text-align:left">
        <b>Ref#:</b> ${data.ref_no}<br/>
        <b>Customer:</b> ${customerName}
      </div>
    `
  });

      onNavigate("dashboard");
    } else {
      Swal.fire({
        width: "300px",
        icon: "error",
        text: data.error
      });
    }

  } catch (err) {
    Swal.close();

    Swal.fire({
      width: "300px",
      icon: "error",
      text: "Network Error"
    });
  }

  setSaving(false);
};



  // -------------------- Calculated Totals --------------------
  const totalSAR = rows.reduce((s, r) => s + Number(r.total || 0), 0);
  const totalPKR = totalSAR * (Number(pkrRate) || 0);

  // -------------------- JSX --------------------
  return (
    <div style={styles.container}>
      <div className="d-flex justify-content-between mb-3">
        <button className="btn btn-dark btn-sm" style={styles.button} onClick={() => onNavigate("dashboard")}>← Back</button>
        <div className="d-flex gap-2">
<button
  className={`btn btn-sm ${isEdit ? "btn-warning text-dark" : "btn-primary"}`}
  style={styles.button}
  onClick={saveData}
  disabled={saving}
>
  {saving ? "Saving..." : isEdit ? "✏ Update Save" : "💾 Save"}
</button>
          <input className="form-control form-control-sm" style={{ width: 140, borderRadius: 50 }} placeholder="Search Ref" value={searchRef} onChange={(e) => setSearchRef(e.target.value)} />
          <button className="btn btn-warning btn-sm" style={styles.button} onClick={loadCard}>🔄 Load / Edit</button>
<button
  className="btn fw-bold text-white shadow"
  style={{
    background: "linear-gradient(135deg,#28a745,#20c997)",
    border: "none",
    borderRadius: "12px",
    padding: "8px 18px",
    transition: "0.3s",
  }}
  onClick={exportPDF}
>
  📄 Export PDF
</button>

<button
  className="btn fw-bold text-white shadow"
  style={{
    background: "linear-gradient(135deg,#6c757d,#343a40)",
    border: "none",
    borderRadius: "12px",
    padding: "8px 18px",
    transition: "0.3s",
  }}
  onClick={printPDF}
>
  🖨️ Print
</button>
        </div>
      </div>

      <div ref={pdfRef} style={styles.card}>


        <Header title="💳 VACCINATION CARD QUOTATION" />

        {/* Customer Info */}
<div className="d-flex gap-3 mb-3 flex-wrap">

  <div>
    <label>Ref No</label>
    <input
      className="form-control form-control-sm"
      value={refNo}
      readOnly
    />
  </div>

  <div>
    <label>Customer Name</label>
    <input
      className="form-control form-control-sm"
      value={customerName}
      onChange={(e) =>
        setCustomerName(e.target.value)
      }
    />
  </div>

  <div>
    <label>Booking Date</label>
    <input
      type="date"
      className="form-control form-control-sm"
      value={bookingDate}
      onChange={(e) =>
        setBookingDate(e.target.value)
      }
    />
    <small className="text-muted">
      {showDate(bookingDate)}
    </small>
  </div>
        </div>

        <h5 style={styles.sectionHeader}>💳 VACCINATION CARD Details</h5>
        <button className="btn btn-outline-primary btn-sm mb-2" style={styles.button} onClick={addRow}>➕ Add Card Row</button>

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
                <td style={{...styles.td, fontWeight:"bold"}}>{r.total}</td>
                <td style={{...styles.td, textAlign:"center"}}><button className="btn btn-sm btn-danger" onClick={() => removeRow(i)}>✖</button></td>
              </tr>
            ))}
          </tbody>
        </table>

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
