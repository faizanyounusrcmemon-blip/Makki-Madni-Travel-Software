import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ================= HELPERS ================= */
const fmt = (v) => Number(v || 0).toLocaleString("en-US");

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

    const ratio = Math.min(
      pdfWidth / canvas.width,
      pdfHeight / canvas.height
    );

    const imgW = canvas.width * ratio;
    const imgH = canvas.height * ratio;

    const x = (pdfWidth - imgW) / 2;
    const y = 8;

    pdf.addImage(imgData, "JPEG", x, y, imgW, imgH);

    const fileName = `${cleanName(
      data?.customer_name
    )}_${formatDateForFile(data?.booking_date)}.pdf`;

    pdf.save(fileName);
  };

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
      </div>

      {/* ===== PRINT AREA ===== */}
      <div
        ref={pdfRef}
        className="bg-white p-4 rounded-4 shadow-lg"
        style={{ maxWidth: "800px", margin: "auto", fontFamily: "Arial, sans-serif" }}
      >
        {/* ===== HEADER ===== */}
        <div
          className="rounded-4 p-3 mb-4 text-white shadow"
          style={{ background: "linear-gradient(135deg,#0d6efd,#00c6ff)" }}
        >
          <h2 className="text-center fw-bold mb-1">✈️ MAKKI MADNI TRAVEL</h2>
          <div className="text-center" style={{ fontSize: 13, lineHeight: 1.4 }}>
            Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid<br />
            Garden West, Karachi<br />
            ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
          </div>
          <hr style={{ margin: "8px 0", borderTop: "2px solid #fff" }} />
        </div>

        {/* ===== HOTEL QUOTATION ===== */}
        <h4 className="fw-bold text-center mb-3">🏨 HOTEL QUOTATION</h4>

        {/* BASIC INFO */}
        <div className="row mb-3">
          <div className="col-6"><b>Ref No:</b> {data.ref_no}</div>
          <div className="col-6 text-end"><b>Booking Date:</b> {fmtDate(data.booking_date)}</div>
        </div>
        <p><b>Customer Name:</b> {data.customer_name || "-"}</p>
        <p><b>Agent Name:</b> {data.agent_name || "-"}</p>
        <hr />

        {/* HOTEL DETAILS */}
        <h5 className="fw-bold text-primary mb-2">🏨 Hotel Details</h5>
        {(!Array.isArray(data.hotels) || data.hotels.length === 0) && (
          <p className="text-muted">No hotel details available</p>
        )}
        {Array.isArray(data.hotels) &&
          data.hotels.map((h, i) => (
            <div key={i} className="border p-2 rounded mb-2 shadow-sm">
              <div className="fw-bold mb-1">{i + 1}. {h.hotel}</div>
              <div className="row small">
                <div className="col-6"><b>Location:</b> {h.location}</div>
                <div className="col-6"><b>Type:</b> {h.type}</div>
                <div className="col-6"><b>Check-in:</b> {fmtDate(h.checkIn)}</div>
                <div className="col-6"><b>Check-out:</b> {fmtDate(h.checkOut)}</div>
                <div className="col-6"><b>Nights:</b> {h.nights}</div>
                <div className="col-6"><b>Rooms:</b> {h.rooms}</div>
                <div className="col-6"><b>Rate (SAR):</b> {fmt(h.rate)}</div>
                <div className="col-6"><b>Total (SAR):</b> {fmt(h.total)}</div>
              </div>
            </div>
          ))}

        <hr />

        {/* SUMMARY */}
        <h5 className="fw-bold text-success mb-2">Summary</h5>
        <p><b>Total Hotels (SAR):</b> {fmt(data.hotels_total)}</p>
        <p><b>SAR Rate:</b> {fmt(data.sar_rate)}</p>
        <h4 className="fw-bold text-success">Total PKR: {fmt(data.total_pkr)}</h4>
      </div>
    </div>
  );
}
