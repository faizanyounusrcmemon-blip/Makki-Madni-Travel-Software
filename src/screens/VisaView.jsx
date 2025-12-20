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

  const exportPDF = async () => {
    const canvas = await html2canvas(ref.current, { scale: 3 });
    const img = canvas.toDataURL("image/jpeg");

    const pdf = new jsPDF("l", "mm", "a4");
    pdf.addImage(img, "JPEG", 0, 0, pdf.internal.pageSize.width, pdf.internal.pageSize.height);
    pdf.save(`${data?.ref_no || "visa"}.pdf`);
  };

  if (!data) return <div className="p-3">Loading...</div>;

  return (
    <div className="container mt-3">
      <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("allreports")}>
        ⬅ Back
      </button>

      <button className="btn btn-success btn-sm ms-2" onClick={exportPDF}>
        📄 Export PDF
      </button>

      <div ref={ref} className="bg-white p-3 border mt-3">
        <h3 className="fw-bold text-center">VISA — {data.ref_no}</h3>

        <p><b>Customer:</b> {data.customer_name}</p>
        <p><b>Booking Date:</b> {data.booking_date}</p>

        <hr />

        <h5 className="fw-bold">Visa Details</h5>

        <table className="table table-bordered table-sm">
          <thead>
            <tr>
              <th>Type</th>
              <th>Persons</th>
              <th>SAR</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.length === 0 && (
              <tr>
                <td colSpan="3" className="text-center">No visa rows</td>
              </tr>
            )}

            {data.rows.map((r, i) => (
              <tr key={i}>
                <td>{r.type}</td>
                <td>{r.persons}</td>
                <td className="text-end">{Number(r.total || 0).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <hr />

        <p><b>Total SAR:</b> {Number(data.total_sar || 0).toLocaleString()}</p>
        <p><b>PKR Rate:</b> {data.pkr_rate}</p>

        <h4 className="fw-bold text-success">
          Total PKR: {Number(data.total_pkr || 0).toLocaleString()}
        </h4>
      </div>
    </div>
  );
}
