import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ===============================
   HELPERS
=============================== */
const fmt = (v) =>
  Number(v || 0).toLocaleString("en-US");

const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString("en-GB"); // DD/MM/YYYY
};

export default function HotelsView({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const pdfRef = useRef(null);

  /* ===============================
     LOAD HOTEL
  =============================== */
  useEffect(() => {
    if (!id) return;

    fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/hotels/get/${id}`
    )
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

  /* ===============================
     EXPORT PDF
  =============================== */
  const exportPDF = async () => {
    if (!pdfRef.current) return;

    const canvas = await html2canvas(pdfRef.current, {
      scale: 3,
      useCORS: true,
    });

    const img = canvas.toDataURL("image/jpeg", 1.0);

    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;

    pdf.addImage(img, "JPEG", 0, 0, w, h);
    pdf.save(`${data?.ref_no || "hotel"}.pdf`);
  };

  if (!data) {
    return <div className="p-3">Loading...</div>;
  }

  return (
    <div className="container mt-3">
      {/* ACTIONS */}
      <div className="d-flex gap-2 mb-2">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate("allreports")}
        >
          ⬅ Back
        </button>

        <button
          className="btn btn-success btn-sm"
          onClick={exportPDF}
        >
          📄 Export PDF
        </button>
      </div>

      {/* PRINT AREA */}
      <div ref={pdfRef} className="bg-white p-3 border">
        <h3 className="fw-bold text-center mb-3">
          🏨 HOTEL QUOTATION
        </h3>

        <div className="row mb-2">
          <div className="col-6">
            <b>Ref No:</b> {data.ref_no}
          </div>
          <div className="col-6 text-end">
            <b>Booking Date:</b>{" "}
            {fmtDate(data.booking_date)}
          </div>
        </div>

        <p>
          <b>Customer Name:</b>{" "}
          {data.customer_name || "-"}
        </p>

        <hr />

        <h5 className="fw-bold mb-2">Hotel Details</h5>

        {(!Array.isArray(data.hotels) ||
          data.hotels.length === 0) && (
          <p className="text-muted">
            No hotel details available
          </p>
        )}

        {Array.isArray(data.hotels) &&
          data.hotels.map((h, i) => (
            <div
              key={i}
              className="border rounded p-2 mb-2"
            >
              <div className="fw-bold mb-1">
                {i + 1}. {h.hotel}
              </div>

              <div className="row small">
                <div className="col-6">
                  <b>Location:</b> {h.location}
                </div>
                <div className="col-6">
                  <b>Type:</b> {h.type}
                </div>

                <div className="col-6">
                  <b>Check-in:</b>{" "}
                  {fmtDate(h.checkIn)}
                </div>
                <div className="col-6">
                  <b>Check-out:</b>{" "}
                  {fmtDate(h.checkOut)}
                </div>

                <div className="col-6">
                  <b>Nights:</b> {h.nights}
                </div>
                <div className="col-6">
                  <b>Rooms:</b> {h.rooms}
                </div>

                <div className="col-6">
                  <b>Rate (SAR):</b>{" "}
                  {fmt(h.rate)}
                </div>
                <div className="col-6">
                  <b>Total (SAR):</b>{" "}
                  {fmt(h.total)}
                </div>
              </div>
            </div>
          ))}

        <hr />

        <h5 className="fw-bold">Summary</h5>

        <p>
          <b>Total Hotels (SAR):</b>{" "}
          {fmt(data.hotels_total)}
        </p>

        <p>
          <b>SAR Rate:</b>{" "}
          {fmt(data.sar_rate)}
        </p>

        <h4 className="fw-bold text-success">
          Total PKR: {fmt(data.total_pkr)}
        </h4>
      </div>
    </div>
  );
}
