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



export default function TicketingView({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const ref = useRef(null);

  const { exportPDF, printPDF } = usePdf(ref, {
    filePrefix: "Ticket",
    customerName: data?.customer_name,
    bookingDate: data?.booking_date,
    orientation: "p",
  });


  /* ================= LOAD TICKETING ================= */
  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ticketing/get/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;

        const row = res.row;

        const safe = (v) => {
          if (!v) return [];
          if (Array.isArray(v)) return v;
          try { return JSON.parse(v); } catch { return []; }
        };

        row.flight_from = safe(row.flight_from);
        row.flight_to = safe(row.flight_to);
        row.flight_date = safe(row.flight_date);
        row.airline = safe(row.airline);

        setData(row);
      });
  }, [id]);

  /* ================= EXPORT PDF ================= */


  if (!data) return <div className="p-3">Loading...</div>;


  return (
    <div className="container mt-3 mb-5">
      {/* ===== TOP ACTIONS ===== */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button
          className="btn btn-sm text-white fw-bold shadow"
          style={{ background: "linear-gradient(135deg,#000,#434343)", borderRadius: 8, padding: "6px 16px" }}
          onClick={() => onNavigate("allreports")}
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
        {/* ===== HEADER ===== */}


        {/* ===== TICKETING DETAILS ===== */}
                <Header title="🎫 TICKETING DETAILS" />

        {/* BASIC INFO */}
        <div className="row mb-3">
          <div className="col-6"><b>Ref No:</b> {data.ref_no}</div>
          <div className="col-6 text-end"><b>Booking Date:</b> {fmtDate(data.booking_date)}</div>
        </div>

        <p><b>Customer Name:</b> {data.customer_name}</p>
        <hr />

        {/* ===== FLIGHT ROUTES ===== */}
        <h5 className="fw-bold text-primary mb-2">✈️ Flight Routes</h5>
        {data.flight_from.length === 0 && <p className="text-muted">No routes</p>}
        {data.flight_from.map((f, i) => (
          <div key={i} className="border rounded p-2 mb-2 shadow-sm">
            <b>{f}</b> → <b>{data.flight_to[i]}</b> ({fmtDate(data.flight_date[i])}){" "}
            {data.airline?.[i] && <span className="fw-bold text-success">— {data.airline[i]}</span>}
          </div>
        ))}

        <hr />

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
