import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// =========================
// DATE FORMATTER (01/DEC/2025)
// =========================
const fmtDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  const day = String(dt.getDate()).padStart(2, "0");
  const mon = dt.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = dt.getFullYear();
  return `${day}/${mon}/${year}`;
};

export default function PackagesView({ refNo, onNavigate }) {
  const [data, setData] = useState(null);
  const viewRef = useRef(null);

  // =========================
  // LOAD PACKAGE BY REF NO
  // =========================
  useEffect(() => {
    if (!refNo) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bookings/get/${refNo}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.row);
        else alert("Record not found");
      });
  }, [refNo]);

  // =========================
  // EXPORT PDF (CLEAR)
  // =========================
  const exportPDF = async () => {
    const el = viewRef.current;

    el.classList.add("pdf-mode");

    const canvas = await html2canvas(el, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
      windowWidth: el.scrollWidth,
    });

    const img = canvas.toDataURL("image/jpeg", 1.0);

    const pdf = new jsPDF("l", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();

    pdf.addImage(img, "JPEG", 0, 0, w, h);
    pdf.save(`${data?.ref_no || "package"}.pdf`);

    el.classList.remove("pdf-mode");
  };

  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mt-3">
      {/* TOP BAR */}
      <button
        className="btn btn-secondary btn-sm mb-2"
        onClick={() => onNavigate("allreports")}
      >
        ⬅ Back
      </button>

      <button
        className="btn btn-success btn-sm mb-2 ms-2"
        onClick={exportPDF}
      >
        📄 Export PDF
      </button>

      {/* VIEW */}
      <div ref={viewRef} className="bg-white p-3 border">
        <h3 className="fw-bold text-center">✈️ MAKKI MADNI TRAVEL</h3>
        <h4 className="fw-bold mb-3">PACKAGE — {data.ref_no}</h4>

        <p><b>Customer:</b> {data.customer_name}</p>
        <p><b>Booking Date:</b> {fmtDate(data.booking_date)}</p>

        <hr />

        {/* ================= FLIGHT ================= */}
        <h5 className="fw-bold">✈️ Flight</h5>
        <p>
          Adults: {data.adult_count} × {data.adult_rate}<br />
          Child: {data.child_count} × {data.child_rate}<br />
          Infant: {data.infant_count} × {data.infant_rate}
        </p>
        <p><b>Flight SAR:</b> {data.flight_sar_total}</p>
        <p><b>Flight PKR:</b> {Number(data.flight_pkr_total || 0).toLocaleString()}</p>

        <hr />

        {/* ================= HOTELS ================= */}
        <h5 className="fw-bold">🏨 Hotels</h5>

        {Array.isArray(data.hotels) && data.hotels.length > 0 ? (
          data.hotels.map((h, i) => (
            <div key={i} className="mb-2">
              <b>{h.hotel}</b><br />
              {fmtDate(h.checkIn)} → {fmtDate(h.checkOut)}<br />
              Nights: {h.nights}, Rooms: {h.rooms}, Type: {h.type}<br />
              Rate: {h.rate} — Total: {h.total}
            </div>
          ))
        ) : (
          <p>No hotel records</p>
        )}

        <p><b>Hotel SAR:</b> {data.hotel_sar_total}</p>
        <p><b>Hotel PKR:</b> {Number(data.hotel_pkr_total || 0).toLocaleString()}</p>

        <hr />

        {/* ================= VISA ================= */}
        <h5 className="fw-bold">🛂 Visa</h5>
        <p>
          Persons: {data.visa_persons}<br />
          Rate: {data.visa_rate}
        </p>
        <p><b>Visa PKR:</b> {Number(data.visa_pkr_total || 0).toLocaleString()}</p>

        <hr />

        {/* ================= TRANSPORT ================= */}
        <h5 className="fw-bold">🚐 Transport</h5>

        {Array.isArray(data.transport) && data.transport.length > 0 ? (
          data.transport.map((t, i) => (
            <p key={i}>
              {t.text} — {Number(t.amount).toLocaleString()}
            </p>
          ))
        ) : (
          <p>No transport</p>
        )}

        <p><b>Transport PKR:</b> {Number(data.transport_pkr_total || 0).toLocaleString()}</p>

        <hr />

        {/* ================= SUMMARY ================= */}
        <h4 className="fw-bold text-end">
          NET PKR TOTAL: {Number(data.net_pkr_total || 0).toLocaleString()}
        </h4>
      </div>
    </div>
  );
}
