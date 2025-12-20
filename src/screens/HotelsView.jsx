import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function HotelsView({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/hotels/get/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;
        setData(res.row); // ✅ FIX
      });
  }, [id]);

  const exportPDF = async () => {
    const canvas = await html2canvas(ref.current, { scale: 3 });
    const img = canvas.toDataURL("image/jpeg");

    const pdf = new jsPDF("l", "mm", "a4");
    pdf.addImage(
      img,
      "JPEG",
      0,
      0,
      pdf.internal.pageSize.width,
      pdf.internal.pageSize.height
    );

    pdf.save(`${data?.ref_no || "hotels"}.pdf`);
  };

  if (!data) return <div className="p-3">Loading...</div>;

  return (
    <div className="container mt-3">
      <button
        className="btn btn-secondary btn-sm"
        onClick={() => onNavigate("allreports")}
      >
        ⬅ Back
      </button>

      <button
        className="btn btn-success btn-sm ms-2"
        onClick={exportPDF}
      >
        📄 Export PDF
      </button>

      <div ref={ref} className="bg-white p-3 border mt-3">
        <h3 className="fw-bold text-center">
          HOTELS — {data.ref_no}
        </h3>

        <p><b>Customer:</b> {data.customer_name}</p>
        <p><b>Booking Date:</b> {data.booking_date}</p>

        <hr />

        <h5 className="fw-bold">Hotel Details</h5>

        {Array.isArray(data.hotels) && data.hotels.length === 0 && (
          <p className="text-center">No hotels added</p>
        )}

        {Array.isArray(data.hotels) &&
          data.hotels.map((h, i) => (
            <div key={i} className="border p-2 mb-2">
              <b>{h.hotel}</b><br />
              <b>Location:</b> {h.location}<br />
              <b>Type:</b> {h.type}<br />
              <b>Check-in:</b> {h.checkIn} |
              <b> Check-out:</b> {h.checkOut}<br />
              <b>Nights:</b> {h.nights} |
              <b> Rooms:</b> {h.rooms}<br />
              <b>Rate (SAR):</b> {h.rate}<br />
              <b>Total (SAR):</b>{" "}
              {Number(h.total || 0).toLocaleString()}
            </div>
          ))}

        <hr />

        <h5 className="fw-bold">Totals</h5>

        <p>
          <b>Total Hotels SAR:</b>{" "}
          {Number(data.hotels_total || 0).toLocaleString()}
        </p>

        <h4 className="fw-bold text-success">
          Total PKR:{" "}
          {Number(data.total_pkr || 0).toLocaleString()}
        </h4>
      </div>
    </div>
  );
}
