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

  // ================= CALCULATE TOTALS =================
  const flightTotal = Number(data.flight_sar_total || 0);
  const hotelsTotal = Number(data.hotel_sar_total || 0);
  const visaTotal = Number(data.visa_sar_total || 0);
  const transportTotal = Number(data.transport_sar_total || 0);
  const ziyaratTotal = Number(data.ziyarat_sar_total || 0);

  const rate = {
    flight: Number(data.flight_rate || 1),
    hotels: Number(data.hotel_rate || 1),
    visa: Number(data.visa_rate || 1),
    transport: Number(data.transport_rate || 1),
    ziyarat: Number(data.ziyarat_rate || 1),
  };

  const flightPKR = flightTotal * rate.flight;
  const hotelsPKR = hotelsTotal * rate.hotels;
  const visaPKR = visaTotal * rate.visa;
  const transportPKR = transportTotal * rate.transport;
  const ziyaratPKR = ziyaratTotal * rate.ziyarat;

  const grandPKR = flightPKR + hotelsPKR + visaPKR + transportPKR + ziyaratPKR;

  const personQty = Number(data.total_persons || 1);
  const perPerson = grandPKR / personQty;

  return (
    <div className="container mt-3 mb-5">

      {/* ============ TOP ACTIONS ============ */}
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

      {/* ============ PDF CONTENT ============ */}
      <div
        ref={ref}
        className="bg-white p-4 rounded-4 shadow-lg"
        style={{ maxWidth: "800px", margin: "auto", fontFamily: "Arial, sans-serif" }}
      >
        {/* ===== HEADER ===== */}
        <div
          className="rounded-4 p-3 mb-4 text-white shadow"
          style={{
            background: "linear-gradient(135deg,#0d6efd,#00c6ff)",
          }}
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

        {/* ===== SUMMARY TABLE ===== */}
        <h6 className="section-title">📊 Summary</h6>
        <table className="table table-sm">
          <thead>
            <tr>
              <th>Item</th>
              <th>SAR</th>
              <th>Rate</th>
              <th>PKR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Flight</td>
              <td>{flightTotal.toLocaleString()}</td>
              <td>{rate.flight}</td>
              <td className="fw-bold">{flightPKR.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Hotels</td>
              <td>{hotelsTotal.toLocaleString()}</td>
              <td>{rate.hotels}</td>
              <td className="fw-bold">{hotelsPKR.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Visa</td>
              <td>{visaTotal.toLocaleString()}</td>
              <td>{rate.visa}</td>
              <td className="fw-bold">{visaPKR.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Transport</td>
              <td>{transportTotal.toLocaleString()}</td>
              <td>{rate.transport}</td>
              <td className="fw-bold">{transportPKR.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Ziyarat</td>
              <td>{ziyaratTotal.toLocaleString()}</td>
              <td>{rate.ziyarat}</td>
              <td className="fw-bold">{ziyaratPKR.toLocaleString()}</td>
            </tr>
            <tr className="table-info">
              <td className="fw-bold">Grand Total PKR</td>
              <td></td>
              <td></td>
              <td className="fw-bold">{grandPKR.toLocaleString()}</td>
            </tr>
            <tr style={{ background: "#f1f1f1" }}>
              <td className="fw-bold">Per Person</td>
              <td>{personQty}</td>
              <td></td>
              <td className="fw-bold">{perPerson.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        {/* FOOTER NOTE */}
        <div
          className="mt-2 p-2 text-center small"
          style={{ background: "#12c1d8", color: "white" }}
        >
          THESE ARE TENTATIVE RATES AND CAN CHANGE WITHOUT NOTICE.
          PACKAGE CAN BE FINALIZED AFTER BOOKING PAYMENTS AND MAY VARY WITH ROE.
        </div>
      </div>
    </div>
  );
}
