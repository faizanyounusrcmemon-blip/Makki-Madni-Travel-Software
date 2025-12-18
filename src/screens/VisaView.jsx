import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function VisaView({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/visa/get/${id}`)
      .then((r) => r.json())
      .then((res) => {
        // ✅ jsonb safe parse
        let rows = [];
        if (res.rows) {
          if (Array.isArray(res.rows)) {
            rows = res.rows;
          } else {
            try {
              rows = JSON.parse(res.rows);
            } catch {
              rows = [];
            }
          }
        }
        res.rows = rows;
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

    pdf.save(`${data?.ref_no || "visa"}.pdf`);
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
          VISA — {data.ref_no}
        </h3>

        <p><b>Customer:</b> {data.customer_name}</p>
        <p><b>Booking Date:</b> {data.booking_date}</p>
        <p><b>Persons:</b> {data.persons}</p>
        <p><b>Rate (SAR):</b> {data.rate}</p>

        <hr />

        <h5 className="fw-bold">Visa Details</h5>

        <table className="table table-bordered table-sm">
          <thead>
            <tr>
              <th>Description</th>
              <th className="text-end">Amount (SAR)</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 && (
              <tr>
                <td colSpan="2" className="text-center">
                  No visa rows
                </td>
              </tr>
            )}

            {data.rows.map((r, i) => (
              <tr key={i}>
                <td>{r.text || r.description}</td>
                <td className="text-end">
                  {Number(r.amount || 0).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr />

        <h5 className="fw-bold">Totals</h5>

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
