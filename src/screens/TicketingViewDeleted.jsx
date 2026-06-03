import React, { useEffect, useState, useRef } from "react";
import usePdf from "../hooks/usePdf";
import Header from "../components/Header";


/* ================= HELPERS ================= */
const fmt = (v) => Number(v || 0).toLocaleString("en-US");

// ✅ Updated date format: 01/FEB/2026
const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2, "0");
  const mon = dt.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = dt.getFullYear();
  return `${day}/${mon}/${year}`;
};



export default function TicketingViewDeleted({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const ref = useRef(null);

const { exportPDF, printPDF } = usePdf(ref, {
  filePrefix: "TicketDelete",
  customerName: data?.customer_name,
  bookingDate: data?.booking_date,
  orientation: "p",
});

  /* ================= LOAD DELETED DATA ================= */
  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ticketing/get-deleted/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;
        setData(res.row);
      });
  }, [id]);

  /* ================= EXPORT PDF ================= */


  if (!data) return <div className="p-3">Loading...</div>;

/* ================= TRIP DURATION ================= */
const flightDates = (data.flight_date || [])
  .filter(Boolean)
  .sort();

let tripDays = 0;
let tripNights = 0;

if (flightDates.length >= 2) {
  const startDate = new Date(flightDates[0]);
  const endDate = new Date(
    flightDates[flightDates.length - 1]
  );

  const diff =
    (endDate - startDate) /
    (1000 * 60 * 60 * 24);

  tripDays = diff + 1;
  tripNights = diff;
}


  return (
    <div className="container mt-3 mb-5">
      {/* ===== TOP ACTIONS ===== */}
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


        {/* ===== TICKETING DETAILS ===== */}
                <Header title="🎫 TICKETING DETAILS" />

        {/* BASIC INFO */}
<div className="row mb-3">

  <div className="col-md-4">
    <b>Ref No:</b> {data.ref_no}
  </div>

  <div className="col-md-4">
    <b>Booking Date:</b> {fmtDate(data.booking_date)}
  </div>

  <div className="col-md-4">
    <div
      style={{
        background:
          "linear-gradient(135deg,#ff6f61,#ffa07a)",
        color: "#fff",
        padding: "8px 12px",
        borderRadius: "12px",
        textAlign: "center",
        fontWeight: "700",
        boxShadow:
          "0 3px 8px rgba(0,0,0,0.15)",
      }}
    >
      📅 {tripDays > 0
        ? `${tripDays} Days / ${tripNights} Nights`
        : "Duration N/A"}
    </div>
  </div>

</div>

{/* ===== FLIGHT ROUTES ===== */}
<h5 className="fw-bold text-primary mb-2">✈️ Flight Routes</h5>

{data.flight_from.length === 0 && (
  <p className="text-muted">No routes</p>
)}

{data.flight_from.map((f, i) => (
  <div
    key={i}
    className="border rounded p-3 mb-2 shadow-sm"
  >
    <div className="fw-bold fs-6">
      {f} → {data.flight_to[i]}
    </div>

    <div className="mt-2">
      <span
        className="badge bg-primary"
        style={{
          fontSize: "12px",
          padding: "6px 10px",
        }}
      >
        📅 {fmtDate(data.flight_date[i])}
      </span>

      {data.airline?.[i] && (
        <span className="fw-bold text-success ms-2">
          ✈ {data.airline[i]}
        </span>
      )}
    </div>
  </div>
))}

        {/* ===== PASSENGERS ===== */}
        <h5 className="fw-bold text-primary mb-2">👥 Passengers</h5>
        <p>Adult: {data.adult_qty} × {data.adult_rate}</p>
        <p>Child: {data.child_qty} × {data.child_rate}</p>
        <p>Infant: {data.infant_qty} × {data.infant_rate}</p>

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
