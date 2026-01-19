import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ================= DATE FORMAT (PAK STYLE) ================= */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-PK", {
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

/* ================= AUTO COLUMN HOOK ================= */
const useAutoColumns = (ref, dep) => {
  useEffect(() => {
    if (!ref.current) return;

    const el = ref.current;
    const A4_HEIGHT = 1120; // px approx

    // reset
    el.style.columnCount = "1";

    setTimeout(() => {
      if (el.scrollHeight > A4_HEIGHT) {
        el.style.columnCount = "2";
      }
    }, 50);
  }, [ref, dep]);
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

  /* ================= AUTO COLUMN APPLY ================= */
  useAutoColumns(ref, data);

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

    const fileName = `${cleanName(
      data?.customer_name
    )}_${formatDateForFile(data?.booking_date)}.pdf`;

    pdf.save(fileName);
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

      {/* ================= PDF CONTENT ================= */}
      <div
        ref={ref}
        className="bg-white p-3 border pdf-content"
        style={{
          width: "794px",
          margin: "auto",
          columnGap: "28px",
          columnRule: "1px solid #ddd",
          fontSize: "14px",
        }}
      >
        {/* ================= HEADER ================= */}
        <div className="text-center mb-3">
          <h2 className="fw-bold mb-1">✈️ MAKKI MADNI TRAVEL</h2>

          <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
            <div>Shop #4 Daimon City Building, Near Zeenat-ul-Islam Masjid</div>
            <div>Garden West, Karachi</div>
            <div>✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744</div>
          </div>

          <hr style={{ margin: "8px 0", borderTop: "2px solid #000" }} />
        </div>

        <h4 className="fw-bold mb-2">PACKAGE — {data.ref_no}</h4>

        <p><b>Customer:</b> {data.customer_name}</p>
        <p><b>Contact No:</b> {data.contact_no || "-"}</p>
        <p><b>Booking Date:</b> {fmtDate(data.booking_date)}</p>

        <hr />

        {/* ================= FLIGHT ================= */}
        <h5 className="fw-bold">✈️ Flight</h5>
        {data.flights?.length ? (
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
          <b>Flight PKR:</b>{" "}
          {Number(data.flight_pkr_total || 0).toLocaleString()}
        </p>

        <hr />

        {/* ================= HOTELS ================= */}
        <h5 className="fw-bold">🏨 Hotels</h5>
        {data.hotels?.length ? (
          data.hotels.map((h, i) => (
            <div key={i} className="mb-2">
              <b>{h.hotel}</b><br />
              {fmtDate(h.checkIn)} → {fmtDate(h.checkOut)}<br />
              Nights: {h.nights}, Rooms: {h.rooms}
            </div>
          ))
        ) : (
          <p>No hotels</p>
        )}

        <p>
          <b>Hotel PKR:</b>{" "}
          {Number(data.hotel_pkr_total || 0).toLocaleString()}
        </p>

        <hr />

        {/* ================= VISA ================= */}
        <h5 className="fw-bold">🛂 Visa</h5>
        {data.visa_persons > 0 ? (
          <p>
            Persons: {data.visa_persons} × {data.visa_rate}<br />
            <b>Visa PKR:</b>{" "}
            {Number(data.visa_pkr_total || 0).toLocaleString()}
          </p>
        ) : (
          <p>No visa</p>
        )}

        <hr />

        {/* ================= TRANSPORT ================= */}
        <h5 className="fw-bold">🚐 Transport</h5>
        {data.transport?.length ? (
          data.transport.map((t, i) => (
            <p key={i}>
              {t.text} — {Number(t.amount || 0).toLocaleString()}
            </p>
          ))
        ) : (
          <p>No transport</p>
        )}

        <hr />

        {/* ================= ZIYARAT ================= */}
        <h5 className="fw-bold">🕌 Ziyarat</h5>
        {data.ziyarat?.length ? (
          data.ziyarat.map((z, i) => (
            <p key={i}>
              {z.text || z.route} —{" "}
              {Number(z.amount || 0).toLocaleString()}
            </p>
          ))
        ) : (
          <p>No ziyarat</p>
        )}

        <hr />

        {/* ================= TOTAL ================= */}
        <h4 className="fw-bold text-end">
          NET PKR TOTAL:{" "}
          {Number(data.net_pkr_total || 0).toLocaleString()}
        </h4>
      </div>
    </div>
  );
}
