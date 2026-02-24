import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ================= DATE FORMAT ================= */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

/* ================= FILE NAME HELPERS ================= */
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

export default function PackagesView({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const [hideAmounts, setHideAmounts] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bookings/get/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;
        setData(res.row);
      });
  }, [id]);

  const exportPDF = async () => {
    const canvas = await html2canvas(ref.current, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const fileName = `${cleanName(data?.customer_name)}_${formatDateForFile(
      data?.booking_date
    )}.pdf`;

    pdf.save(fileName);
  };

  if (!data) return <div className="p-4">Loading...</div>;

  return (
    <div className="container mt-3 mb-5">
      <div className="d-flex justify-content-start mb-3 gap-2 flex-wrap">
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

        <div
          className="d-flex align-items-center gap-3 px-3 py-2 rounded shadow-sm"
          style={{ background: "#ffffff" }}
        >
          <input
            className="form-check-input"
            type="checkbox"
            id="toggleAmounts"
            checked={hideAmounts}
            onChange={() => setHideAmounts(!hideAmounts)}
          />
          <label className="form-check-label fw-bold text-dark" htmlFor="toggleAmounts">
            Hide All Amounts
          </label>
        </div>
      </div>

      <div
        ref={ref}
        className="bg-white p-4 rounded-4 shadow-lg"
        style={{ maxWidth: "800px", margin: "auto", fontFamily: "Arial, sans-serif" }}
      >
        {/* ===== HEADER ===== */}
        <div
          className="rounded-4 p-3 mb-4 text-white shadow"
          style={{ background: "linear-gradient(135deg,#0d6efd,#00c6ff)" }}
        >
          <h2 className="text-center fw-bold mb-1" style={{ letterSpacing: "1px" }}>
            ✈️ MAKKI MADNI TRAVEL
          </h2>
          <div className="text-center" style={{ fontSize: 13, lineHeight: 1.4 }}>
            Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid<br />
            Garden West, Karachi<br />
            ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
          </div>
          <hr style={{ margin: "8px 0", borderTop: "2px solid #fff" }} />
        </div>

        {/* ===== PACKAGE INFO ===== */}
        <div className="mb-3">
          <h4 className="fw-bold">PACKAGE — {data.ref_no}</h4>
          <p><b>Customer:</b> {data.customer_name}</p>
          <p><b>Contact No:</b> {data.contact_no || "-"}</p>
          <p><b>Booking Date:</b> {fmtDate(data.booking_date)}</p>
        </div>

        <hr />

        {/* ===== FLIGHTS ===== */}
        <h5 className="fw-bold text-primary mb-2">✈️ Flight</h5>
        <div className="border p-2 rounded mb-2">
          {Array.isArray(data.flights) && data.flights.length > 0 ? (
            data.flights.map((f, i) => (
              <div key={i} className="mb-1">
                {fmtDate(f.date)} — {f.from} → {f.to}{" "}
                {f.airline && <b>({f.airline})</b>}
              </div>
            ))
          ) : (
            <p>No flights</p>
          )}
        </div>
        {!hideAmounts && (
          <p>
            Adults: {data.adult_count} × {data.adult_rate} <br />
            Child: {data.child_count} × {data.child_rate} <br />
            Infant: {data.infant_count} × {data.infant_rate} <br />
            <b>Flight SAR:</b> {Number(data.flight_sar_total || 0).toLocaleString()} <br />
            <b>Flight PKR:</b> {Number(data.flight_pkr_total || 0).toLocaleString()}
          </p>
        )}

        <hr />

        {/* ===== HOTELS ===== */}
        <h5 className="fw-bold text-success mb-2">🏨 Hotels</h5>
        {Array.isArray(data.hotels) && data.hotels.length > 0
          ? data.hotels.map((h, i) => (
              <div key={i} className="border p-2 rounded mb-2 shadow-sm">
                <b>🛏️ {h.hotel}</b> — 📍 {h.location}<br />
                Check In: <span style={{ color: "#0d6efd", fontWeight: "bold" }}>{fmtDate(h.checkIn)}</span> → 
                Check Out: <span style={{ color: "#dc3545", fontWeight: "bold" }}>{fmtDate(h.checkOut)}</span><br />
                Nights: {h.nights}, Rooms: {h.rooms}, Type: {h.type}<br />
                {!hideAmounts && <>Rate: {h.rate} — Total: {h.total}</>}
              </div>
            ))
          : <p>No hotels</p>}
        {!hideAmounts && (
          <p>
            <b>Hotel SAR:</b> {Number(data.hotel_sar_total || 0).toLocaleString()} <br />
            <b>Hotel PKR:</b> {Number(data.hotel_pkr_total || 0).toLocaleString()}
          </p>
        )}

        <hr />

        {/* ===== VISA ===== */}
        <h5 className="fw-bold text-warning mb-2">🛂 Visa</h5>
        {Array.isArray(data.visa) && data.visa.length > 0
          ? data.visa.map((v, i) => (
              <div key={i} className="border p-2 rounded mb-1 shadow-sm">
                {v.type || "Visa"} — {v.persons}
                {!hideAmounts && <> × {v.rate} = {v.total}</>}
              </div>
            ))
          : <p>No visa</p>}
        {!hideAmounts && (
          <p>
            <b>Visa SAR:</b> {Number(data.visa_sar_total || 0).toLocaleString()} <br />
            <b>Visa PKR:</b> {Number(data.visa_pkr_total || 0).toLocaleString()}
          </p>
        )}

        <hr />

        {/* ===== TRANSPORT ===== */}
        <h5 className="fw-bold text-danger mb-2">🚐 Transport</h5>
        {Array.isArray(data.transport) && data.transport.length > 0
          ? data.transport.map((t, i) => (
              <div key={i} className="border p-2 rounded mb-1 shadow-sm">
                {t.text} {!hideAmounts && <>— {Number(t.amount || 0).toLocaleString()}</>}
              </div>
            ))
          : <p>No transport</p>}
        {!hideAmounts && (
          <p>
            <b>Transport SAR:</b> {Number(data.transport_sar_total || 0).toLocaleString()} <br />
            <b>Transport PKR:</b> {Number(data.transport_pkr_total || 0).toLocaleString()}
          </p>
        )}

        <hr />

        {/* ===== ZIYARAT ===== */}
        <h5 className="fw-bold text-purple mb-2">🕌 Ziyarat</h5>
        {Array.isArray(data.ziyarat) && data.ziyarat.length > 0
          ? data.ziyarat.map((z, i) => (
              <div key={i} className="border p-2 rounded mb-1 shadow-sm">
                {z.text || z.route || z.description}
                {!hideAmounts && <> — {Number(z.amount || 0).toLocaleString()}</>}
              </div>
            ))
          : <p>No ziyarat</p>}
        {!hideAmounts && (
          <p>
            <b>Ziyarat SAR:</b> {Number(data.ziyarat_sar_total || 0).toLocaleString()} <br />
            <b>Ziyarat PKR:</b> {Number(data.ziyarat_pkr_total || 0).toLocaleString()}
          </p>
        )}

        <hr />

        {/* ===== NET TOTAL ===== */}
        <h4 className="fw-bold text-end text-success">
          NET PKR TOTAL: {Number(data.net_pkr_total || 0).toLocaleString()}
        </h4>
      </div>
    </div>
  );
}