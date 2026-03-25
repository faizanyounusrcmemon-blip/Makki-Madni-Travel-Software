import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const fmt = (n) => Number(n || 0).toLocaleString("en-US");

export default function PurchaseDetailDeleted({ id, onNavigate }) {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState("");

  const boxRef = useRef(null);

  useEffect(() => {
    if (id) load();
  }, [id]);

  const load = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/detail-deleted/${id}`
      );
      const data = await res.json();

      if (data.success) {
        setRows(data.rows);
        setTotals(data.totals);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Server error");
    }
  };

  const exportPDF = async () => {
    const canvas = await html2canvas(boxRef.current, { scale: 2 });
    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("l", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save(`${id}-deleted-purchase.pdf`);
  };

  if (error) return <div className="alert alert-danger">{error}</div>;

  if (!rows.length)
    return <div className="text-center py-5">Loading...</div>;

  return (
    <div className="container py-4">

      {/* TOP */}
      <div className="d-flex justify-content-between mb-3">
        <button
          className="btn btn-dark btn-sm"
          onClick={() => onNavigate("deletedReports")}
        >
          ⬅ Back
        </button>

        <button
          className="btn btn-success btn-sm"
          onClick={exportPDF}
        >
          📄 Export
        </button>
      </div>

      {/* BOX */}
      <div ref={boxRef} className="bg-white p-4 rounded shadow">

        {/* ALERT */}
        <div className="alert alert-danger text-center fw-bold">
          ⚠ This Purchase is DELETED
        </div>

        {/* HEADER */}
        <h4 className="fw-bold mb-3">
          Purchase Detail (Deleted)
        </h4>

        <div className="table-responsive">
          <table className="table table-bordered">

            <thead className="table-dark text-center">
              <tr>
                <th>Item</th>
                <th>Supplier</th>
                <th>Sale</th>
                <th>Purchase</th>
                <th>Profit</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>{r.item}</td>
                  <td>{r.supplier_name || "-"}</td>
                  <td className="text-end">{fmt(r.sale_pkr)}</td>
                  <td className="text-end">{fmt(r.purchase_pkr)}</td>
                  <td className="text-end">{fmt(r.profit)}</td>
                </tr>
              ))}
            </tbody>

            <tfoot className="fw-bold">
              <tr>
                <td colSpan="2">TOTAL</td>
                <td className="text-end">{fmt(totals.sale_pkr)}</td>
                <td className="text-end">{fmt(totals.purchase_pkr)}</td>
                <td className="text-end">{fmt(totals.profit)}</td>
              </tr>
            </tfoot>

          </table>
        </div>
      </div>
    </div>
  );
}