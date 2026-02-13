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
  const ref = useRef(null);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bookings/get/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;
        setData(res.row);
      });
  }, [id]);

  /* ================= EXPORT PDF ================= */
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

  /* ================= UI ================= */
  return (
    <div className="container py-4">

      {/* ACTION BAR */}
      <div className="d-flex justify-content-between mb-3">
        <button
          className="btn btn-sm text-white shadow"
          style={{
            background: "linear-gradient(135deg,#000,#434343)",
            borderRadius: 10,
            padding: "6px 16px",
          }}
          onClick={() => onNavigate("packagesList")}
        >
          ← Back
        </button>

        <button
          className="btn btn-success btn-sm shadow"
          style={{ borderRadius: 10, padding: "6px 16px" }}
          onClick={exportPDF}
        >
          📄 Export PDF
        </button>
      </div>
      
      {/* ================= PDF CONTENT ================= */}
      <div
        ref={ref}
        className="bg-white p-3 border"
        style={{ width: "794px", margin: "auto" }}
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

        <h4 className="fw-bold mb-2">PACKAGE — {data.ref_no}</h4>

        {/* ================= CUSTOMER ================= */}
        <p><b>Customer:</b> {data.customer_name}</p>
        <p><b>Contact No:</b> {data.contact_no || "-"}</p>
        <p><b>Booking Date:</b> {fmtDate(data.booking_date)}</p>

        <hr />

        {/* ================= FLIGHT ================= */}
        <h5 className="fw-bold">✈️ Flight</h5>
        {Array.isArray(data.flights) && data.flights.length > 0 ? (
          data.flights.map((f, i) => (
            <div key={i}>
              {fmtDate(f.date)} — {f.from} → {f.to}{" "}
              {f.airline && <b>({f.airline})</b>}
            </div>
          ))
        ) : (
          <p>No flights</p>
        )}

        <p>
          Adults: {data.adult_count} × {data.adult_rate}<br />
          Child: {data.child_count} × {data.child_rate}<br />
          Infant: {data.infant_count} × {data.infant_rate}
        </p>

        <p>
          <b>Flight SAR:</b>{" "}
          {Number(data.flight_sar_total || 0).toLocaleString()}<br />
          <b>Flight PKR:</b>{" "}
          {Number(data.flight_pkr_total || 0).toLocaleString()}
        </p>

        <hr />

        {/* ================= HOTELS ================= */}
        <h5 className="fw-bold">🏨 Hotels</h5>
        {Array.isArray(data.hotels) && data.hotels.length > 0 ? (
          data.hotels.map((h, i) => (
            <div key={i} className="mb-2">
              <b>{h.hotel}</b><br />
              {h.location}<br />
              {fmtDate(h.checkIn)} → {fmtDate(h.checkOut)}<br />
              Nights: {h.nights}, Rooms: {h.rooms}, Type: {h.type}<br />
              Rate: {h.rate} — Total: {h.total}
            </div>
          ))
        ) : (
          <p>No hotels</p>
        )}

        <p>
          <b>Hotel SAR:</b>{" "}
          {Number(data.hotel_sar_total || 0).toLocaleString()}<br />
          <b>Hotel PKR:</b>{" "}
          {Number(data.hotel_pkr_total || 0).toLocaleString()}
        </p>

        <hr />

        {/* ================= VISA (JSONB) ================= */}
        <h5 className="fw-bold">🛂 Visa</h5>
        {Array.isArray(data.visa) && data.visa.length > 0 ? (
          <>
            {data.visa.map((v, i) => (
              <div key={i}>
                {v.type || "Visa"} — {v.persons} × {v.rate} = {v.total}
              </div>
            ))}
            <p className="mt-1">
              <b>Visa SAR:</b>{" "}
              {Number(data.visa_sar_total || 0).toLocaleString()}<br />
              <b>Visa PKR:</b>{" "}
              {Number(data.visa_pkr_total || 0).toLocaleString()}
            </p>
          </>
        ) : (
          <p>No visa</p>
        )}

        <hr />

        {/* ================= TRANSPORT ================= */}
        <h5 className="fw-bold">🚐 Transport</h5>
        {Array.isArray(data.transport) && data.transport.length > 0 ? (
          data.transport.map((t, i) => (
            <p key={i}>
              {t.text} — {Number(t.amount || 0).toLocaleString()}
            </p>
          ))
        ) : (
          <p>No transport</p>
        )}

        <p>
          <b>Transport SAR:</b>{" "}
          {Number(data.transport_sar_total || 0).toLocaleString()}<br />
          <b>Transport PKR:</b>{" "}
          {Number(data.transport_pkr_total || 0).toLocaleString()}
        </p>

        <hr />

        {/* ================= ZIYARAT ================= */}
        <h5 className="fw-bold">🕌 Ziyarat</h5>
        {Array.isArray(data.ziyarat) && data.ziyarat.length > 0 ? (
          data.ziyarat.map((z, i) => (
            <p key={i}>
              {z.text || z.route || z.description} —{" "}
              {Number(z.amount || 0).toLocaleString()}
            </p>
          ))
        ) : (
          <p>No ziyarat</p>
        )}

        <p>
          <b>Ziyarat SAR:</b>{" "}
          {Number(data.ziyarat_sar_total || 0).toLocaleString()}<br />
          <b>Ziyarat PKR:</b>{" "}
          {Number(data.ziyarat_pkr_total || 0).toLocaleString()}
        </p>

        <hr />

        {/* ================= SUMMARY ================= */}
        <h4 className="fw-bold text-end">
          NET PKR TOTAL:{" "}
          {Number(data.net_pkr_total || 0).toLocaleString()}
        </h4>
      </div>
    </div>
  );
}


