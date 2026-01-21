import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* =========================
   HELPERS
========================= */
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "-";

export default function VisaView({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const ref = useRef(null);

  /* =========================
     LOAD VISA
  ========================= */
  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/visa/get/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;

        const row = res.row;

        let rows = [];
        if (row.rows) {
          if (Array.isArray(row.rows)) rows = row.rows;
          else {
            try {
              rows = JSON.parse(row.rows);
            } catch {
              rows = [];
            }
          }
        }

        row.rows = rows;
        setData(row);
      });
  }, [id]);

  /* =========================
     EXPORT PDF (PORTRAIT)
  ========================= */
  const exportPDF = async () => {
    if (!ref.current) return;

    const canvas = await html2canvas(ref.current, {
      scale: 3,
      useCORS: true,
    });

    const img = canvas.toDataURL("image/jpeg", 1.0);

    const pdf = new jsPDF("p", "mm", "a4"); // ✅ PORTRAIT
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = (canvas.height * pageWidth) / canvas.width;

    pdf.addImage(img, "JPEG", 0, 0, pageWidth, pageHeight);
    pdf.save(`${data?.ref_no || "visa"}.pdf`);
  };

  if (!data) return <div className="p-3">Loading...</div>;

  return (
    <div className="container mt-3">
      {/* ACTIONS */}
      <div className="mb-2">
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
      </div>

      {/* ================= PDF CONTENT ================= */}
      <div ref={ref} className="bg-white p-3 border">
        {/* ===== HEADER ===== */}
        <div className="text-center mb-3">
          <h2 className="fw-bold mb-1">✈️ MAKKI MADNI TRAVEL</h2>
          <div style={{ fontSize: "13px", lineHeight: "1.4" }}>
            <div>
              Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid
            </div>
            <div>Garden West, Karachi</div>
            <div>
              ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
            </div>
          </div>
          <hr style={{ borderTop: "2px solid #000", margin: "8px 0" }} />
        </div>

        {/* ===== TITLE ===== */}
        <h4 className="fw-bold text-center mb-3">
          🛂 VISA DETAILS
        </h4>

        {/* ===== BASIC INFO ===== */}
        <div className="row mb-2">
          <div className="col-6">
            <b>Ref No:</b> {data.ref_no}
          </div>
          <div className="col-6 text-end">
            <b>Booking Date:</b> {fmtDate(data.booking_date)}
          </div>
        </div>

        <p>
          <b>Customer Name:</b> {data.customer_name}
        </p>

        <hr />

        {/* ================= VISA TABLE ================= */}
        <h5 className="fw-bold mb-2">Visa Details</h5>

        <table className="table table-bordered table-sm">
          <thead>
            <tr>
              <th>Type</th>
              <th className="text-center">Persons</th>
              <th className="text-end">SAR</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center text-muted">
                  No visa rows
                </td>
              </tr>
            )}

            {data.rows.map((r, i) => (
              <tr key={i}>
                <td>{r.type}</td>
                <td className="text-center">{r.persons}</td>
                <td className="text-end">
                  {Number(r.total || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr />

        {/* ================= TOTALS ================= */}
        <h5 className="fw-bold">Totals</h5>
        <p>
          <b>Total SAR:</b>{" "}
          {Number(data.total_sar || 0).toLocaleString()}
        </p>
        <p>
          <b>PKR Rate:</b> {data.pkr_rate}
        </p>

        <h4 className="fw-bold text-success">
          Total PKR:{" "}
          {Number(data.total_pkr || 0).toLocaleString()}
        </h4>
      </div>
    </div>
  );
}

