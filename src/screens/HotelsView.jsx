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
        // ✅ jsonb safe parse helper
        const safe = (v) => {
          if (!v) return [];
          if (Array.isArray(v)) return v;
          try {
            return JSON.parse(v);
          } catch {
            return [];
          }
        };

        res.hotel_name = safe(res.hotel_name);
        res.hotel_location = safe(res.hotel_location);
        res.hotel_checkin = safe(res.hotel_checkin);
        res.hotel_checkout = safe(res.hotel_checkout);
        res.hotel_nights = safe(res.hotel_nights);
        res.hotel_rooms = safe(res.hotel_rooms);
        res.hotel_type = safe(res.hotel_type);
        res.hotel_rate = safe(res.hotel_rate);
        res.hotel_total = safe(res.hotel_total);

        setData(res);
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

        {data.hotel_name.length === 0 && (
          <p className="text-center">No hotels added</p>
        )}

        {data.hotel_name.map((h, i) => (
          <div key={i} className="border p-2 mb-2">
            <b>{h}</b><br />
            <b>Location:</b> {data.hotel_location[i]}<br />
            <b>Type:</b> {data.hotel_type[i]}<br />
            <b>Check-in:</b> {data.hotel_checkin[i]} |
            <b> Check-out:</b> {data.hotel_checkout[i]}<br />
            <b>Nights:</b> {data.hotel_nights[i]} |
            <b> Rooms:</b> {data.hotel_rooms[i]}<br />
            <b>Rate (SAR):</b> {data.hotel_rate[i]}<br />
            <b>Total (SAR):</b>{" "}
            {Number(data.hotel_total[i] || 0).toLocaleString()}
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
