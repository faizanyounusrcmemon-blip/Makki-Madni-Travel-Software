import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ================= DATE FORMAT ================= */
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

export default function PackagesView({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const pageRef = useRef(null);
  const bodyRef = useRef(null);

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bookings/get/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.row);
      });
  }, [id]);

  /* ================= AUTO COLUMN LOGIC ================= */
  useEffect(() => {
    if (!bodyRef.current) return;

    const body = bodyRef.current;
    body.style.columnCount = "1";

    setTimeout(() => {
      if (body.scrollHeight > 950) {
        body.style.columnCount = "2";
      }
    }, 50);
  }, [data]);

  /* ================= EXPORT PDF ================= */
  const exportPDF = async () => {
    const canvas = await html2canvas(pageRef.current, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 10;

    pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
    heightLeft -= pdf.internal.pageSize.getHeight();

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + 10;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }

    pdf.save(
      `${cleanName(data.customer_name)}_${formatDateForFile(
        data.booking_date
      )}.pdf`
    );
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

      {/* ================= PDF PAGE ================= */}
      <div
        ref={pageRef}
        className="bg-white p-3 border"
        style={{ width: "794px", margin: "auto", fontSize: "14px" }}
      >
        {/* ================= HEADER (FULL WIDTH) ================= */}
        <div className="text-center mb-3">
          <h2 className="fw-bold mb-1">✈️ MAKKI MADNI TRAVEL</h2>

          <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
            <div>Shop #4 Daimon City Building, Near Zeenat-ul-Islam Masjid</div>
            <div>Garden West, Karachi</div>
            <div>✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744</div>
          </div>

          <hr style={{ margin: "8px 0", borderTop: "2px solid #000" }} />
        </div>

        {/* ================= BODY (AUTO 2 COLUMN) ================= */}
        <div
          ref={bodyRef}
          style={{
            columnGap: "28px",
            columnRule: "1px solid #ddd",
          }}
        >
          <h4 className="fw-bold">PACKAGE — {data.ref_no}</h4>

          <p><b>Customer:</b> {data.customer_name}</p>
          <p><b>Contact No:</b> {data.contact_no || "-"}</p>
          <p><b>Booking Date:</b> {fmtDate(data.booking_date)}</p>

          <hr />

          <h5 className="fw-bold">✈️ Flight</h5>
          {data.flights?.length
            ? data.flights.map((f, i) => (
                <div key={i}>
                  {fmtDate(f.date)} — {f.from} → {f.to}
                </div>
              ))
            : <p>No flights</p>}

          <hr />

          <h5 className="fw-bold">🏨 Hotels</h5>
          {data.hotels?.length
            ? data.hotels.map((h, i) => (
                <div key={i}>
                  <b>{h.hotel}</b><br />
                  {fmtDate(h.checkIn)} → {fmtDate(h.checkOut)}
                </div>
              ))
            : <p>No hotels</p>}

          <hr />

          <h5 className="fw-bold">🛂 Visa</h5>
          {data.visa_persons > 0
            ? <p>{data.visa_persons} × {data.visa_rate}</p>
            : <p>No visa</p>}

          <hr />

          <h5 className="fw-bold">🚐 Transport</h5>
          {data.transport?.length
            ? data.transport.map((t, i) => (
                <p key={i}>{t.text} — {t.amount}</p>
              ))
            : <p>No transport</p>}

          <hr />

          <h5 className="fw-bold">🕌 Ziyarat</h5>
          {data.ziyarat?.length
            ? data.ziyarat.map((z, i) => (
                <p key={i}>{z.text || z.route} — {z.amount}</p>
              ))
            : <p>No ziyarat</p>}

          <hr />

          <h4 className="fw-bold text-end">
            NET PKR TOTAL: {Number(data.net_pkr_total || 0).toLocaleString()}
          </h4>
        </div>
      </div>
    </div>
  );
}
