import React, { useEffect, useState, useRef } from "react";
import usePdf from "../hooks/usePdf";
import Header from "../components/Header";

/* ================= HELPERS ================= */
const fmt = (v) => Number(v || 0).toLocaleString("en-US");
const fmtDate = (d) => d ? new Date(d).toLocaleDateString("en-GB") : "-";
const cleanName = (name) => name ? name.replace(/[^a-zA-Z0-9]/g, "_") : "Customer";
const formatDateForFile = (date) => {
  if (!date) return "NoDate";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  return `${day}-${mon}-${year}`;
};

export default function CardViewDeleted({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const ref = useRef(null);

const { exportPDF, printPDF } = usePdf(ref, {
  filePrefix: "CardDelete",
  customerName: data?.customer_name,
  bookingDate: data?.booking_date,
  orientation: "p",
});

  /* ================= LOAD DELETED DATA ================= */
  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/card/get-deleted/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;
        setData(res.row);
      });
  }, [id]);

  /* ================= EXPORT PDF ================= */


  if (!data) return <div className="p-3">Loading...</div>;

  return (
    <div className="container mt-3 mb-5">
      {/* ===== ACTIONS ===== */}
<div className="d-flex gap-2 mb-3 flex-wrap">
  <button
    className="btn btn-sm text-white fw-bold shadow"
    style={{
      background: "linear-gradient(135deg,#000,#434343)",
      borderRadius: 8,
      padding: "6px 16px"
    }}
    onClick={() => onNavigate("deletedReports")}
  >
    ⬅ Back
  </button>

<button
  className="btn btn-success btn-sm fw-bold shadow"
  style={{ borderRadius: 8, padding: "6px 16px" }}
  onClick={exportPDF}
>
  📄 Export PDF
</button>

<button
  className="btn btn-secondary btn-sm fw-bold shadow"
  style={{ borderRadius: 8, padding: "6px 16px" }}
  onClick={printPDF}
>
  🖨️ Print
</button>
      </div>

      {/* ===== PRINT AREA ===== */}
      <div
        ref={ref}
        className="bg-white p-4 rounded-4 shadow-lg"
        style={{ maxWidth: "800px", margin: "auto", fontFamily: "Arial, sans-serif" }}
      >

        {/* 🔴 DELETED ALERT */}
        {data?.is_deleted && (
          <div className="alert alert-danger text-center fw-bold">
            ⚠ This record is DELETED
          </div>
        )}

        {/* ===== HEADER ===== */}


        {/* ===== TITLE ===== */}
        <Header title="💳 VACCINATION CARD DETAILS" />

        {/* ===== BASIC INFO ===== */}
        <div className="row mb-3">
          <div className="col-6"><b>Ref No:</b> {data.ref_no}</div>
          <div className="col-6 text-end"><b>Booking Date:</b> {fmtDate(data.booking_date)}</div>
        </div>

        <p><b>Customer Name:</b> {data.customer_name}</p>

        <hr />

        {/* ===== CARD ROWS ===== */}
        <h5 className="fw-bold text-primary mb-2">Card Entries</h5>
        {data.rows.length === 0 && <p className="text-muted">No card rows</p>}
        {data.rows.map((r, i) => (
          <div key={i} className="border rounded p-2 mb-2 shadow-sm d-flex justify-content-between">
            <div>{r.type}</div>
            <div className="text-center">{r.persons}</div>
            <div className="fw-bold">{fmt(r.total)}</div>
          </div>
        ))}

        <hr />

        {/* ===== TOTALS ===== */}
        <h5 className="fw-bold text-success mb-2">💰 Totals</h5>
        <p><b>Total SAR:</b> {fmt(data.total_sar)}</p>
        <p><b>PKR Rate:</b> {fmt(data.pkr_rate)}</p>
        <h4 className="fw-bold text-success">Total PKR: {fmt(data.total_pkr)}</h4>
      </div>
    </div>
  );
}
