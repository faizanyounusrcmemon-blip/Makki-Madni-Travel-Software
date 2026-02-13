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
    if (!ref.current) return;

    const canvas = await html2canvas(ref.current, {
      scale: 3,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF("p", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight);
    heightLeft -= pdfHeight;

    while (heightLeft > 0) {
      position = -heightLeft + pdfHeight;
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

  /* ================= TOTALS ================= */
  const flightTotal = Number(data.flight_sar_total || 0);
  const hotelsTotal = Number(data.hotel_sar_total || 0);
  const visaTotal = Number(data.visa_sar_total || 0);
  const transportTotal = Number(data.transport_sar_total || 0);
  const ziyaratTotal = Number(data.ziyarat_sar_total || 0);

  /* ================= SAR RATES ================= */
  const rate = {
    flight: Number(data.flight_sar_rate || 0),
    hotels: Number(data.hotel_sar_rate || 0),
    visa: Number(data.visa_sar_rate || 0),
    transport: Number(data.transport_sar_rate || 0),
    ziyarat: Number(data.ziyarat_sar_rate || 0),
  };

  /* ================= PKR CALC ================= */
  const flightPKR = flightTotal * rate.flight;
  const hotelsPKR = hotelsTotal * rate.hotels;
  const visaPKR = visaTotal * rate.visa;
  const transportPKR = transportTotal * rate.transport;
  const ziyaratPKR = ziyaratTotal * rate.ziyarat;

  const grandPKR =
    flightPKR + hotelsPKR + visaPKR + transportPKR + ziyaratPKR;

  const personQty = Number(data.per_person_qty || 0);
  const perPerson = personQty > 0 ? grandPKR / personQty : 0;

  return (
    <div className="container mt-3 mb-5">

      {/* ACTIONS */}
      <div className="d-flex gap-2 mb-3">
        <button
          className="btn btn-dark btn-sm"
          onClick={() => onNavigate("allreports")}
        >
          ⬅ Back
        </button>

        <button className="btn btn-success btn-sm" onClick={exportPDF}>
          📄 Export PDF
        </button>
      </div>

      {/* PDF CONTENT */}
      <div
        ref={ref}
        className="bg-white p-4 shadow"
        style={{ maxWidth: 800, margin: "auto" }}
      >
        <h4 className="fw-bold">PACKAGE — {data.ref_no}</h4>
        <p><b>Customer:</b> {data.customer_name}</p>
        <p><b>Booking Date:</b> {fmtDate(data.booking_date)}</p>

        <hr />

        <h5>Summary</h5>
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
              <td>{flightPKR.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Hotels</td>
              <td>{hotelsTotal.toLocaleString()}</td>
              <td>{rate.hotels}</td>
              <td>{hotelsPKR.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Visa</td>
              <td>{visaTotal.toLocaleString()}</td>
              <td>{rate.visa}</td>
              <td>{visaPKR.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Transport</td>
              <td>{transportTotal.toLocaleString()}</td>
              <td>{rate.transport}</td>
              <td>{transportPKR.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Ziyarat</td>
              <td>{ziyaratTotal.toLocaleString()}</td>
              <td>{rate.ziyarat}</td>
              <td>{ziyaratPKR.toLocaleString()}</td>
            </tr>

            <tr className="table-info fw-bold">
              <td>Grand Total PKR</td>
              <td></td>
              <td></td>
              <td>{grandPKR.toLocaleString()}</td>
            </tr>

            <tr className="table-secondary fw-bold">
              <td>Per Person</td>
              <td>{personQty}</td>
              <td></td>
              <td>{perPerson.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  );
}
