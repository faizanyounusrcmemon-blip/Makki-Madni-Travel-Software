import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Swal from "sweetalert2";
import Header from "../components/Header";
import usePdf from "../hooks/usePdf";


/* ================= HELPERS ================= */
const fmt = (v) => Number(v || 0).toLocaleString("en-US");

/* ✅ DATE FORMAT 01/Dec/2026 */
const fmtDate = (val) => {
  if (!val) return "-";

  const d = new Date(val);
  if (isNaN(d.getTime())) return val;

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};


export default function HotelsView({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const pdfRef = useRef(null);

const { exportPDF, printPDF } = usePdf(pdfRef, {
  filePrefix: "Hotel",
  customerName: data?.customer_name,
  bookingDate: data?.booking_date,
  orientation: "p",
});

  /* ================= LOAD HOTEL ================= */
  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/hotels/get/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res?.success) {
          alert("Hotel record not found");
          return;
        }
        setData(res.row);
      })
      .catch(() => alert("Load failed"));
  }, [id]);

  /* ================= EXPORT PDF ================= */


  if (!data) return <div className="p-3">Loading...</div>;

  return (
    <div className="container mt-3 mb-5">

      {/* ===== TOP ACTIONS ===== */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button
          className="btn btn-sm text-white fw-bold shadow"
          style={{
            background: "linear-gradient(135deg,#000,#434343)",
            borderRadius: 8,
            padding: "6px 16px",
          }}
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
        ref={pdfRef}
        className="bg-white p-4 rounded-4 shadow-lg"
        style={{
          maxWidth: "800px",
          margin: "auto",
          fontFamily: "Arial, sans-serif"
        }}
      >

        {/* ===== HEADER ===== */}


        {/* ===== HOTEL QUOTATION ===== */}
        <Header title="🏨 HOTEL QUOTATION" />

        {/* BASIC INFO */}
        <div className="row mb-3">
          <div className="col-6">
            <b>Ref No:</b> {data.ref_no}
          </div>

          <div className="col-6 text-end">
            <b>Booking Date:</b> {fmtDate(data.booking_date)}
          </div>
        </div>

        <p><b>Customer Name:</b> {data.customer_name || "-"}</p>
        <p><b>Agent Name:</b> {data.agent_name || "-"}</p>

        <hr />

        {/* ===== HOTEL DETAILS ===== */}
        <h5 className="fw-bold text-primary mb-2">🏨 Hotel Details</h5>

        {(!Array.isArray(data.hotels) || data.hotels.length === 0) && (
          <p className="text-muted">No hotel details available</p>
        )}

        {Array.isArray(data.hotels) &&
          data.hotels.map((h, i) => (
            <div key={i} className="border p-2 rounded mb-2 shadow-sm">
              <div className="fw-bold mb-1">
                {i + 1}. 🛏️ {h.hotel}
              </div>

              <div className="row small">
                <div className="col-6"><b>📍Location:</b> {h.location}</div>
                <div className="col-6"><b>Type:</b> {h.type}</div>

                {/* COLORED DATES */}
                <div className="col-6">
                  <b>Check-in:</b>{" "}
                  <span style={{ color: "#0d6efd", fontWeight: "bold" }}>
                    {fmtDate(h.checkIn)}
                  </span>
                </div>

                <div className="col-6">
                  <b>Check-out:</b>{" "}
                  <span style={{ color: "#dc3545", fontWeight: "bold" }}>
                    {fmtDate(h.checkOut)}
                  </span>
                </div>

                <div className="col-6"><b>Nights:</b> {h.nights}</div>
                <div className="col-6"><b>Rooms:</b> {h.rooms}</div>
                <div className="col-6"><b>Rate (SAR):</b> {fmt(h.rate)}</div>
                <div className="col-6"><b>Total (SAR):</b> {fmt(h.total)}</div>
              </div>
            </div>
          ))}

        <hr />

        {/* ===== SUMMARY ===== */}
        <h5 className="fw-bold text-success mb-2">Summary</h5>

        <p><b>Total Hotels (SAR):</b> {fmt(data.hotels_total)}</p>
        <p><b>SAR Rate:</b> {fmt(data.sar_rate)}</p>

        <h4 className="fw-bold text-success">
          Total PKR: {fmt(data.total_pkr)}
        </h4>

      </div>
    </div>
  );
}
