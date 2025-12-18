import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// =========================
// DATE FORMATTER
// =========================
const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function PackagesView({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bookings/get/${id}`)
      .then((r) => r.json())
      .then((d) => setData(d));
  }, [id]);

  // =========================
  // EXPORT PDF
  // =========================
  const exportPDF = async () => {
    const canvas = await html2canvas(ref.current, { scale: 2 });
    const img = canvas.toDataURL("image/jpeg");

    const pdf = new jsPDF("l", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();

    pdf.addImage(img, "JPEG", 0, 0, w, h);
    pdf.save(`${data?.ref_no || "package"}.pdf`);
  };

  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mt-3">
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

      <div ref={ref} className="bg-white p-3 border">
        <h3 className="fw-bold text-center">MAKKI MADNI TRAVEL</h3>
        <h4 className="fw-bold">PACKAGE — {data.ref_no}</h4>

        <p><b>Customer:</b> {data.customer_name}</p>
        <p><b>Booking Date:</b> {fmtDate(data.booking_date)}</p>

        <hr />

        {/* ================= FLIGHT ================= */}
        <h5 className="fw-bold">Flight</h5>
        <p>
          Adults: {data.adult_count} × {data.adult_rate}<br />
          Child: {data.child_count} × {data.child_rate}<br />
          Infant: {data.infant_count} × {data.infant_rate}
        </p>
        <p><b>Flight SAR Total:</b> {data.flight_sar_total}</p>
        <p><b>Flight PKR Total:</b> {Number(data.flight_pkr_total || 0).toLocaleString()}</p>

        <hr />

        {/* ================= HOTELS ================= */}
        <h5 className="fw-bold">Hotels</h5>

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

        <p><b>Hotel SAR Total:</b> {data.hotel_sar_total}</p>
        <p><b>Hotel PKR Total:</b> {Number(data.hotel_pkr_total || 0).toLocaleString()}</p>

        <hr />

        {/* ================= VISA ================= */}
        <h5 className="fw-bold">Visa</h5>
        <p>
          Persons: {data.visa_persons}<br />
          Rate: {data.visa_rate}
        </p>
        <p><b>Visa PKR Total:</b> {Number(data.visa_pkr_total || 0).toLocaleString()}</p>

        <hr />

        {/* ================= TRANSPORT ================= */}
        <h5 className="fw-bold">Transport</h5>

        {Array.isArray(data.transport) && data.transport.length > 0 ? (
          data.transport.map((t, i) => (
            <p key={i}>
              {t.text} — {Number(t.amount).toLocaleString()}
            </p>
          ))
        ) : (
          <p>No transport</p>
        )}

        <p><b>Transport PKR Total:</b> {Number(data.transport_pkr_total || 0).toLocaleString()}</p>

        <hr />

        {/* ================= SUMMARY ================= */}
        <h4 className="fw-bold text-end">
          NET PKR TOTAL: {Number(data.net_pkr_total || 0).toLocaleString()}
        </h4>
      </div>
    </div>
  );
}
