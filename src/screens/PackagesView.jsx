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

  /* ================= PERFECT MULTI PAGE PDF ================= */
  const exportPDF = async () => {
    const element = ref.current;

    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      scrollY: -window.scrollY,
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
    });

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const totalPages = Math.ceil(imgHeight / pageHeight);

    const pageCanvas = document.createElement("canvas");
    const pageCtx = pageCanvas.getContext("2d");

    const pageHeightPx = (canvas.width * pageHeight) / pageWidth;

    pageCanvas.width = canvas.width;
    pageCanvas.height = pageHeightPx;

    let renderedHeight = 0;

    for (let page = 0; page < totalPages; page++) {
      pageCtx.clearRect(0, 0, pageCanvas.width, pageCanvas.height);

      pageCtx.drawImage(
        canvas,
        0,
        renderedHeight,
        canvas.width,
        pageHeightPx,
        0,
        0,
        canvas.width,
        pageHeightPx
      );

      const imgData = pageCanvas.toDataURL("image/jpeg", 1.0);

      if (page > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, pageHeight);

      renderedHeight += pageHeightPx;
    }

    const fileName = `${cleanName(data?.customer_name)}_${formatDateForFile(
      data?.booking_date
    )}.pdf`;

    pdf.save(fileName);
  };

  if (!data) return <div className="p-4">Loading...</div>;

  /* ================= TOTALS ================= */
  const flightTotal = Number(data.flight_sar_total || 0);
  const hotelsTotal = Number(data.hotel_sar_total || 0);
  const visaTotal = Number(data.visa_sar_total || 0);
  const transportTotal = Number(data.transport_sar_total || 0);
  const ziyaratTotal = Number(data.ziyarat_sar_total || 0);

  const rate = {
    flight: Number(data.flight_sar_rate || 0),
    hotels: Number(data.hotel_sar_rate || 0),
    visa: Number(data.visa_sar_rate || 0),
    transport: Number(data.transport_sar_rate || 0),
    ziyarat: Number(data.ziyarat_sar_rate || 0),
  };

  const flightPKR = flightTotal * rate.flight;
  const hotelsPKR = hotelsTotal * rate.hotels;
  const visaPKR = visaTotal * rate.visa;
  const transportPKR = transportTotal * rate.transport;
  const ziyaratPKR = ziyaratTotal * rate.ziyarat;

  const grandPKR = flightPKR + hotelsPKR + visaPKR + transportPKR + ziyaratPKR;
  const personQty = Number(data.per_person_qty || 0);
  const perPerson = grandPKR / personQty;

  return (
    <div className="container mt-3 mb-5">

      {/* TOP ACTIONS */}
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
      </div>

      {/* PDF CONTENT */}
      <div
        ref={ref}
        className="bg-white p-4 rounded-4 shadow-lg"
        style={{
          maxWidth: "800px",
          margin: "auto",
          fontFamily: "Arial, sans-serif",
          pageBreakInside: "avoid",
        }}
      >

        {/* HEADER */}
        <div
          className="rounded-4 p-3 mb-4 text-white shadow"
          style={{
            background: "linear-gradient(135deg,#0d6efd,#00c6ff)",
            pageBreakInside: "avoid",
          }}
        >
          <h2 className="text-center fw-bold mb-1">
            ✈️ MAKKI MADNI TRAVEL
          </h2>
          <div className="text-center" style={{ fontSize: 13 }}>
            Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid<br />
            Garden West, Karachi<br />
            ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
          </div>
        </div>

        {/* PACKAGE INFO */}
        <div className="mb-3" style={{ pageBreakInside: "avoid" }}>
          <h4 className="fw-bold">PACKAGE — {data.ref_no}</h4>
          <p><b>Customer:</b> {data.customer_name}</p>
          <p><b>Contact No:</b> {data.contact_no || "-"}</p>
          <p><b>Booking Date:</b> {fmtDate(data.booking_date)}</p>
        </div>

        <hr />

        {/* HOTELS */}
        <h5 className="fw-bold text-success mb-2">🏨 Hotels</h5>
        {Array.isArray(data.hotels) && data.hotels.map((h, i) => (
          <div
            key={i}
            className="border p-2 rounded mb-2 shadow-sm"
            style={{ pageBreakInside: "avoid" }}
          >
            <b>{h.hotel}</b> — {h.location}<br />
            Check In: {fmtDate(h.checkIn)} → Check Out: {fmtDate(h.checkOut)}<br />
            Nights: {h.nights}, Rooms: {h.rooms}, Type: {h.type}<br />
            Rate: {h.rate} — Total: {h.total}
          </div>
        ))}

        <p style={{ pageBreakInside: "avoid" }}>
          <b>Hotel SAR:</b> {hotelsTotal.toLocaleString()} <br />
          <b>Hotel PKR:</b> {hotelsPKR.toLocaleString()}
        </p>

        <hr />

        {/* VISA */}
        <h5 className="fw-bold text-warning mb-2">🛂 Visa</h5>
        {Array.isArray(data.visa) && data.visa.map((v, i) => (
          <div
            key={i}
            className="border p-2 rounded mb-1 shadow-sm"
            style={{ pageBreakInside: "avoid" }}
          >
            {v.type || "Visa"} — {v.persons} × {v.rate} = {v.total}
          </div>
        ))}

        <hr />

        {/* SUMMARY */}
        <h6>📊 Summary</h6>
        <table
          className="table table-sm mb-4"
          style={{ pageBreakInside: "avoid" }}
        >
          <tbody>
            <tr>
              <td className="fw-bold">Grand Total PKR</td>
              <td className="fw-bold">{grandPKR.toLocaleString()}</td>
            </tr>
            <tr>
              <td className="fw-bold">Per Person</td>
              <td className="fw-bold">{perPerson.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  );
}
