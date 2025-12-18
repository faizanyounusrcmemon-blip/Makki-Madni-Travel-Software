import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function TicketingView({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ticketing/get/${id}`)
      .then((r) => r.json())
      .then((res) => {
        // 👇 jsonb safe parse
        const safeParse = (v) => {
          if (!v) return [];
          if (Array.isArray(v)) return v;
          try {
            return JSON.parse(v);
          } catch {
            return [];
          }
        };

        res.flight_from = safeParse(res.flight_from);
        res.flight_to = safeParse(res.flight_to);
        res.flight_date = safeParse(res.flight_date);

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

    pdf.save(`${data?.ref_no || "ticketing"}.pdf`);
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
          TICKETING — {data.ref_no}
        </h3>

        <p><b>Customer:</b> {data.customer_name}</p>
        <p><b>Booking Date:</b> {data.booking_date}</p>

        <hr />

        <h5 className="fw-bold">Flight Routes</h5>
        {data.flight_from.length === 0 && <p>No routes</p>}

        {data.flight_from.map((from, i) => (
          <p key={i}>
            {from} → {data.flight_to[i]} ({data.flight_date[i]})
          </p>
        ))}

        <hr />

        <h5 className="fw-bold">Passengers</h5>
        <p>Adult: {data.adult_qty} × {data.adult_rate}</p>
        <p>Child: {data.child_qty} × {data.child_rate}</p>
        <p>Infant: {data.infant_qty} × {data.infant_rate}</p>

        <hr />

        <h5 className="fw-bold">Amounts</h5>

        <p>
          <b>Total SAR:</b>{" "}
          {Number(data.total_sar || 0).toLocaleString()}
        </p>

        <p>
          <b>PKR Rate:</b>{" "}
          {Number(data.pkr_rate || 0).toLocaleString()}
        </p>

        <h4 className="fw-bold text-success">
          Total PKR:{" "}
          {Number(data.total_pkr || 0).toLocaleString()}
        </h4>
      </div>
    </div>
  );
}
