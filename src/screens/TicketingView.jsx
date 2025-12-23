import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* =========================
   HELPERS
========================= */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "";

export default function TicketingView({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const ref = useRef(null);

  /* =========================
     LOAD TICKETING
  ========================= */
  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ticketing/get/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;

        const row = res.row;

        // 🔒 SAFE JSON PARSER
        const safe = (v) => {
          if (!v) return [];
          if (Array.isArray(v)) return v;
          try {
            return JSON.parse(v);
          } catch {
            return [];
          }
        };

        row.flight_from = safe(row.flight_from);
        row.flight_to = safe(row.flight_to);
        row.flight_date = safe(row.flight_date);
        row.airline = safe(row.airline); // ✅ NEW

        setData(row);
      });
  }, [id]);

  /* =========================
     EXPORT PDF
  ========================= */
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

      {/* PDF CONTENT */}
      <div ref={ref} className="bg-white p-3 border mt-3">
        <h3 className="fw-bold text-center">
          ✈️ TICKETING — {data.ref_no}
        </h3>

        <p><b>Customer:</b> {data.customer_name}</p>
        <p><b>Booking Date:</b> {fmtDate(data.booking_date)}</p>

        <hr />

        {/* ================= FLIGHTS ================= */}
        <h5 className="fw-bold">Flight Routes</h5>

        {data.flight_from.length === 0 && <p>No routes</p>}

        {data.flight_from.map((f, i) => (
          <p key={i}>
            <b>{f}</b> → <b>{data.flight_to[i]}</b>{" "}
            ({fmtDate(data.flight_date[i])})
            {data.airline?.[i] && (
              <>
                {" "}— <span className="text-primary fw-bold">
                  {data.airline[i]}
                </span>
              </>
            )}
          </p>
        ))}

        <hr />

        {/* ================= PASSENGERS ================= */}
        <h5 className="fw-bold">Passengers</h5>
        <p>Adult: {data.adult_qty} × {data.adult_rate}</p>
        <p>Child: {data.child_qty} × {data.child_rate}</p>
        <p>Infant: {data.infant_qty} × {data.infant_rate}</p>

        <hr />

        {/* ================= TOTALS ================= */}
        <h5 className="fw-bold">Totals</h5>
        <p>
          <b>Total SAR:</b>{" "}
          {Number(data.total_sar || 0).toLocaleString()}
        </p>
        <p><b>PKR Rate:</b> {data.pkr_rate}</p>

        <h4 className="fw-bold text-success">
          Total PKR:{" "}
          {Number(data.total_pkr || 0).toLocaleString()}
        </h4>
      </div>
    </div>
  );
}
