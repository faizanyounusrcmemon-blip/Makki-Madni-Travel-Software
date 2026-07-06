import React, { useState, useRef, useEffect } from "react";
import usePdf from "../hooks/usePdf";
import Swal from "sweetalert2";
import Header from "../components/Header";

const showDate = (val) => {
  if (!val) return "";
  const d = new Date(val);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();
  return `${day}/${mon}/${year}`;
};

const styles = {
  container: {
    minHeight: "100vh",
    padding: "30px",
    background:
      "linear-gradient(135deg,#ecfdf5 0%,#f0fdfa 45%,#ffffff 100%)",
    fontFamily: "'Cairo', sans-serif",
  },

  group: {
    maxWidth: 1180,
    margin: "0 auto",
    background: "#fff",
    borderRadius: "24px",
    padding: "35px",
    border: "1px solid rgba(16,185,129,.15)",
    boxShadow:
      "0 18px 45px rgba(0,0,0,.08)",
  },

  sectionHeader: {
    background:
      "linear-gradient(90deg,#065f46,#059669,#10b981)",
    color: "#fff",
    padding: "12px 18px",
    borderRadius: "12px",
    marginTop: "28px",
    marginBottom: "16px",
    fontWeight: "700",
    fontSize: "15px",
    letterSpacing: "1px",
    textTransform: "uppercase",
    boxShadow:
      "0 8px 20px rgba(16,185,129,.30)",
  },

  table: {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: "0",
    overflow: "hidden",
    borderRadius: "16px",
    background: "#fff",
    border: "1px solid #d1fae5",
    boxShadow:
      "0 8px 24px rgba(0,0,0,.06)",
  },

  th: {
    background:
      "linear-gradient(90deg,#065f46,#059669)",
    color: "#fff",
    padding: "13px",
    textAlign: "center",
    fontWeight: "700",
    fontSize: "14px",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #ecfdf5",
    background: "#fff",
    transition: ".3s",
  },

  button: {
    borderRadius: "50px",
    padding: "10px 22px",
    fontWeight: "700",
    border: "none",
    color: "#fff",
    cursor: "pointer",
    background:
      "linear-gradient(135deg,#059669,#10b981)",
    boxShadow:
      "0 8px 18px rgba(16,185,129,.35)",
    transition: ".3s",
  },

  input: {
    borderRadius: "12px",
    border: "1px solid #bbf7d0",
    padding: "10px 12px",
    background: "#fff",
  },

  summaryCard: {
    background:
      "linear-gradient(135deg,#065f46,#10b981)",
    color: "#fff",
    borderRadius: "18px",
    padding: "20px",
    boxShadow:
      "0 10px 25px rgba(16,185,129,.30)",
  },
};

export default function Groups({ onNavigate }) {
  const [searchRef, setSearchRef] = useState("");
  const [refNo, setRefNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split("T")[0]);
  
  // 🔹 NEW STATES FOR DATES & DURATION
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [duration, setDuration] = useState(0);

  const [rows, setRows] = useState([]);
  const [pkrRate, setPkrRate] = useState(0);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);
  const pdfRef = useRef(null);

  const { exportPDF, printPDF } = usePdf(pdfRef, {
    filePrefix: "Groups",
    customerName: customerName,
    bookingDate: bookingDate,
    orientation: "p",
  });

  // 🔹 AUTOMATIC DURATION CALCULATION EFFECT
  useEffect(() => {
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffTime = end - start;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDuration(diffDays >= 0 ? diffDays : 0);
    } else {
      setDuration(0);
    }
  }, [startDate, endDate]);

  const addRow = () => setRows([...rows, { type: "", persons: 0, rate: 0, total: 0 }]);
  const removeRow = (i) => setRows(rows.filter((_, x) => x !== i));

  const updateRow = (i, field, value) => {
    const copy = [...rows];
    copy[i][field] = value;
    const persons = Number(copy[i].persons) || 0;
    const rate = Number(copy[i].rate) || 0;
    copy[i].total = persons * rate;
    setRows(copy);
  };

  const loadGroups = async () => {
    if (!searchRef) {
      return Swal.fire({ width: "300px", icon: "error", text: "Ref No likho" });
    }

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/groups/get/${searchRef}`);
    const data = await res.json();

    if (!data.success) {
      return Swal.fire({ width: "300px", icon: "error", text: "Record not found" });
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
    
    // 🔹 LOAD DATES FROM DB
    setStartDate(d.start_date ? d.start_date.split("T")[0] : "");
    setEndDate(d.end_date ? d.end_date.split("T")[0] : "");
    
    setRows(d.rows || []);
    setPkrRate(d.pkr_rate || 0);
    setIsEdit(true);

    Swal.fire({ width: "300px", icon: "success", text: "Groups loaded for edit" });
  };

  const saveData = async () => {
    if (saving) return;

    if (!customerName || !bookingDate) {
      return Swal.fire({ width: "300px", icon: "error", text: "Customer name & booking date required" });
    }

    const confirm = await Swal.fire({
      width: "300px",
      icon: "question",
      text: "Do you want to save this Groups?",
      showCancelButton: true,
      confirmButtonText: "Save",
      cancelButtonText: "Cancel"
    });

    if (!confirm.isConfirmed) return;

    setSaving(true);
    Swal.fire({ width: "260px", title: "Saving...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    // 🔹 ADDED DATES & DURATION IN PAYLOAD
    const payload = {
      ref_no: refNo || null,
      customer_name: customerName,
      booking_date: bookingDate,
      start_date: startDate || null,
      end_date: endDate || null,
      duration: duration,
      rows,
      pkr_rate: pkrRate,
    };

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/groups/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      Swal.close();

      if (data.success) {
        await Swal.fire({
          width: "320px",
          icon: "success",
          title: "Saved Successfully",
          html: `<div style="text-align:left"><b>Ref#:</b> ${data.ref_no}<br/><b>Customer:</b> ${customerName}</div>`
        });
        onNavigate("dashboard");
      } else {
        Swal.fire({ width: "300px", icon: "error", text: data.error });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    }
    setSaving(false);
  };

  const totalSAR = rows.reduce((s, r) => s + Number(r.total || 0), 0);
  const totalPKR = totalSAR * (Number(pkrRate) || 0);

  return (
    <div style={styles.container}>
      <div className="d-flex justify-content-between mb-3">
        <button className="btn btn-dark btn-sm" style={styles.button} onClick={() => onNavigate("dashboard")}>← Back</button>
        <div className="d-flex gap-2">
          <button className={`btn btn-sm ${isEdit ? "btn-warning text-dark" : "btn-primary"}`} style={styles.button} onClick={saveData} disabled={saving}>
            {saving ? "Saving..." : isEdit ? "✏ Update Save" : "💾 Save"}
          </button>
          <input className="form-control form-control-sm" style={{ width: 140, borderRadius: 50 }} placeholder="Search Ref" value={searchRef} onChange={(e) => setSearchRef(e.target.value)} />
          <button className="btn btn-warning btn-sm" style={styles.button} onClick={loadGroups}>🔄 Load / Edit</button>
          <button className="btn fw-bold text-white shadow" style={{ background: "linear-gradient(135deg,#28a745,#20c997)", border: "none", borderRadius: "12px", padding: "8px 18px", transition: "0.3s" }} onClick={exportPDF}>📄 Export PDF</button>
          <button className="btn fw-bold text-white shadow" style={{ background: "linear-gradient(135deg,#6c757d,#343a40)", border: "none", borderRadius: "12px", padding: "8px 18px", transition: "0.3s" }} onClick={printPDF}>🖨️ Print</button>
        </div>
      </div>

      <div ref={pdfRef} style={styles.group}>
        <Header title="👨‍👩‍👧‍👦 GROUPS PACKAGE QUOTATION" />

        {/* Customer & Package Info */}
        <div className="d-flex gap-3 mb-3 flex-wrap align-items-end">
          <div>
            <label className="fw-bold">Ref No</label>
            <input className="form-control form-control-sm" value={refNo} readOnly />
          </div>

          <div>
            <label className="fw-bold">Customer Name</label>
            <input className="form-control form-control-sm" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>

          <div>
            <label className="fw-bold">Booking Date</label>
            <input type="date" className="form-control form-control-sm" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
            <small className="text-muted d-block">{showDate(bookingDate)}</small>
          </div>

          {/* 🔹 NEW INPUT FIELDS FOR DATES & DURATION */}
          <div>
            <label className="fw-bold text-success">Start Date</label>
            <input type="date" className="form-control form-control-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <small className="text-muted d-block">{showDate(startDate)}</small>
          </div>

          <div>
            <label className="fw-bold text-danger">End Date (Last Date)</label>
            <input type="date" className="form-control form-control-sm" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <small className="text-muted d-block">{showDate(endDate)}</small>
          </div>

          <div>
            <label className="fw-bold">Duration (Days)</label>
            <input className="form-control form-control-sm text-center fw-bold bg-light" style={{ width: "90px" }} value={`${duration} Days`} readOnly />
          </div>
        </div>

        <h5 style={styles.sectionHeader}>👨‍👩‍👧‍👦 GROUPS PACKAGE Details</h5>
        <button className="btn btn-outline-primary btn-sm mb-2" style={styles.button} onClick={addRow}>➕ Add Groups Row</button>

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
                <td style={{ ...styles.td, fontWeight: "bold" }}>{r.total}</td>
                <td style={{ ...styles.td, textAlign: "center" }}><button className="btn btn-sm btn-danger" onClick={() => removeRow(i)}>✖</button></td>
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