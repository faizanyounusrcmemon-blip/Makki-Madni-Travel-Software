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

const cleanName = (name) =>
  name ? name.replace(/[^a-zA-Z0-9]/g, "_") : "Customer";

const formatDateForFile = (date) => {
  if (!date) return "NoDate";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  return `${day}-${mon}-${year}`;
};

export default function HotelsView({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const pdfRef = useRef(null);

  /* ===============================
     LOAD HOTEL
  =============================== */
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

  /* ===============================
     EXPORT PDF (PORTRAIT – NO BLUR)
  =============================== */
  const exportPDF = async () => {
    if (!pdfRef.current) return;

    const canvas = await html2canvas(pdfRef.current, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);

    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    const ratio = Math.min(
      pdfWidth / imgWidth,
      pdfHeight / imgHeight
    );

    const imgW = imgWidth * ratio;
    const imgH = imgHeight * ratio;

    const x = (pdfWidth - imgW) / 2;
    const y = 8;

    pdf.addImage(imgData, "JPEG", x, y, imgW, imgH);

    const fileName = `${cleanName(
      data?.customer_name
    )}_${formatDateForFile(data?.booking_date)}.pdf`;

    pdf.save(fileName);
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
      <div
        ref={pdfRef}
        className="bg-white p-3 border"
        style={{ width: "794px", margin: "auto" }} // A4 preview
      >
        {/* ================= HEADER ================= */}
        <div className="text-center mb-3">
          <h2 className="fw-bold mb-1" style={{ letterSpacing: "1px" }}>
            ✈️ MAKKI MADNI TRAVEL
          </h2>

          <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
            <div>
              Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid
            </div>
            <div>Garden West, Karachi</div>
            <div>
              ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
            </div>
          </div>

          <hr style={{ margin: "8px 0", borderTop: "2px solid #000" }} />
        </div>

        <h4 className="fw-bold text-center mb-3">
          🏨 HOTEL QUOTATION
        </h4>

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

