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
      backgroundColor: "#ffffff",
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;
    }

    const fileName = `${cleanName(data?.customer_name)}_${formatDateForFile(
      data?.booking_date
    )}.pdf`;

    pdf.save(fileName);
  };

  /* ================= LOADING ================= */
  if (!data)
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" />
        <div className="mt-2">Loading package...</div>
      </div>
    );

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

      {/* ================= PRINT AREA ================= */}
      <div
        ref={ref}
        className="bg-white rounded-4 shadow-lg p-4"
        style={{ maxWidth: 800, margin: "auto" }}
      >

        {/* HEADER */}
        <div className="text-center mb-4">
          <h2 className="fw-bold mb-1" style={{ letterSpacing: 1 }}>
            ✈️ MAKKI MADNI TRAVEL
          </h2>

          <div style={{ fontSize: 13 }}>
            Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid<br />
            Garden West, Karachi<br />
            ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
          </div>

          <hr style={{ borderTop: "2px solid #000" }} />
        </div>

        {/* PACKAGE INFO */}
        <div className="mb-3">
          <h4 className="fw-bold">PACKAGE — {data.ref_no}</h4>
          <div><b>Customer:</b> {data.customer_name}</div>
          <div><b>Contact:</b> {data.contact_no || "-"}</div>
          <div><b>Booking Date:</b> {fmtDate(data.booking_date)}</div>
        </div>

        <hr />

        {/* FLIGHT */}
        <h5 className="fw-bold">✈️ Flight</h5>
        {data.flights?.length ? data.flights.map((f, i) => (
          <div key={i}>
            {fmtDate(f.date)} — {f.from} → {f.to} {f.airline && <b>({f.airline})</b>}
          </div>
        )) : <p>No flights</p>}

        <p>
          Adults {data.adult_count} × {data.adult_rate}<br />
          Child {data.child_count} × {data.child_rate}<br />
          Infant {data.infant_count} × {data.infant_rate}
        </p>

        <p>
          <b>Flight SAR:</b> {Number(data.flight_sar_total || 0).toLocaleString()}<br />
          <b>Flight PKR:</b> {Number(data.flight_pkr_total || 0).toLocaleString()}
        </p>

        <hr />

        {/* HOTELS */}
        <h5 className="fw-bold">🏨 Hotels</h5>
        {data.hotels?.length ? data.hotels.map((h, i) => (
          <div key={i} className="mb-2">
            <b>{h.hotel}</b><br />
            {h.location}<br />
            {fmtDate(h.checkIn)} → {fmtDate(h.checkOut)}<br />
            Nights {h.nights} | Rooms {h.rooms} | {h.type}<br />
            Rate {h.rate} | Total {h.total}
          </div>
        )) : <p>No hotels</p>}

        <p>
          <b>Hotel SAR:</b> {Number(data.hotel_sar_total || 0).toLocaleString()}<br />
          <b>Hotel PKR:</b> {Number(data.hotel_pkr_total || 0).toLocaleString()}
        </p>

        <hr />

        {/* VISA */}
        <h5 className="fw-bold">🛂 Visa</h5>
        {data.visa?.length ? (
          <>
            {data.visa.map((v, i) => (
              <div key={i}>
                {v.type || "Visa"} — {v.persons} × {v.rate} = {v.total}
              </div>
            ))}
            <p className="mt-2">
              <b>Visa SAR:</b> {Number(data.visa_sar_total || 0).toLocaleString()}<br />
              <b>Visa PKR:</b> {Number(data.visa_pkr_total || 0).toLocaleString()}
            </p>
          </>
        ) : <p>No visa</p>}

        <hr />

        {/* TRANSPORT */}
        <h5 className="fw-bold">🚐 Transport</h5>
        {data.transport?.length
          ? data.transport.map((t, i) => (
              <div key={i}>
                {t.text} — {Number(t.amount || 0).toLocaleString()}
              </div>
            ))
          : <p>No transport</p>}

        <p>
          <b>Transport SAR:</b> {Number(data.transport_sar_total || 0).toLocaleString()}<br />
          <b>Transport PKR:</b> {Number(data.transport_pkr_total || 0).toLocaleString()}
        </p>

        <hr />

        {/* ZIYARAT */}
        <h5 className="fw-bold">🕌 Ziyarat</h5>
        {data.ziyarat?.length
          ? data.ziyarat.map((z, i) => (
              <div key={i}>
                {z.text || z.route || z.description} — {Number(z.amount || 0).toLocaleString()}
              </div>
            ))
          : <p>No ziyarat</p>}

        <p>
          <b>Ziyarat SAR:</b> {Number(data.ziyarat_sar_total || 0).toLocaleString()}<br />
          <b>Ziyarat PKR:</b> {Number(data.ziyarat_pkr_total || 0).toLocaleString()}
        </p>

        <hr />

        {/* TOTAL */}
        <div className="text-end">
          <div
            className="d-inline-block px-4 py-2 rounded-3 shadow-sm"
            style={{
              background: "linear-gradient(135deg,#0d6efd,#00c6ff)",
              color: "#fff",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            NET PKR TOTAL: {Number(data.net_pkr_total || 0).toLocaleString()}
          </div>
        </div>

      </div>
    </div>
  );
}
