import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const fmt = (n) => Number(n || 0).toLocaleString("en-US");
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB");

export default function PurchaseDetail({ refNo, onNavigate }) {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState("");
  const boxRef = useRef(null);

  useEffect(() => {
    if (refNo) load();
  }, [refNo]);

  const load = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/detail/${refNo}`
      );
      const data = await res.json();

      if (data.success) {
        setRows(data.rows);
        setTotals(data.totals);
        setError("");
      } else {
        setError(data.error || "Purchase not found");
      }
    } catch {
      setError("Server error");
    }
  };

  const exportPDF = async () => {
    const canvas = await html2canvas(boxRef.current, { scale: 3 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(
      img,
      "PNG",
      10,
      10,
      190,
      (canvas.height * 190) / canvas.width
    );
    pdf.save(`${displayRef}-purchase-detail.pdf`);
  };

  if (!refNo) {
    return (
      <div className="container p-3">
        <div className="alert alert-danger">
          Ref No missing
        </div>
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate("purchaseList")}
        >
          ⬅ Back
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container p-3">
        <button
          className="btn btn-secondary btn-sm mb-2"
          onClick={() => onNavigate("purchaseList")}
        >
          ⬅ Back
        </button>
        <div className="alert alert-warning">{error}</div>
      </div>
    );
  }

  if (!rows.length) return <div className="p-3">Loading...</div>;

  // ✅ FINAL SOURCE OF TRUTH
  const displayRef = rows[0]?.ref_no || refNo;

  return (
    <div className="container p-3">
      <div className="d-flex justify-content-between mb-2">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate("purchaseList")}
        >
          ⬅ Back
        </button>

        <button className="btn btn-success btn-sm" onClick={exportPDF}>
          📄 Export PDF
        </button>
      </div>

      <div ref={boxRef}>
        {/* 🔥 CLEAR REF DISPLAY */}
        <h4 className="fw-bold mb-1">
          PURCHASE DETAIL
        </h4>
        <h6 className="text-primary fw-bold">
          Ref No: {displayRef}
        </h6>

        <p className="text-muted">
          Date: {fmtDate(rows[0].created_at)}
        </p>

        <table className="table table-bordered table-sm">
          <thead className="table-dark">
            <tr>
              <th>Item</th>
              <th>Sale PKR</th>
              <th>Purchase PKR</th>
              <th>Profit</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td>{r.item}</td>
                <td>{fmt(r.sale_pkr)}</td>
                <td>{fmt(r.purchase_pkr)}</td>
                <td
                  className={
                    Number(r.profit) >= 0
                      ? "text-success fw-bold"
                      : "text-danger fw-bold"
                  }
                >
                  {fmt(r.profit)}
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot className="table-light fw-bold">
            <tr>
              <td>TOTAL</td>
              <td>{fmt(totals.sale_pkr)}</td>
              <td>{fmt(totals.purchase_pkr)}</td>
              <td>{fmt(totals.profit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
