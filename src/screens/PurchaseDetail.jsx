import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ================= HELPERS ================= */
const fmt = (n) => Number(n || 0).toLocaleString("en-US");

const fmtDate = (row) => {
  const v =
    row?.payment_date ||
    row?.booking_date ||
    row?.created_at;

  if (!v) return "-";

  const d = new Date(v);
  if (isNaN(d)) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d
    .toLocaleString("en-US", { month: "short" })
    .toLowerCase();
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

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

  /* ================= PDF ================= */
  const exportPDF = async () => {
    const canvas = await html2canvas(boxRef.current, { scale: 2 });
    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("l", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save(`${rows[0]?.ref_no || refNo}-purchase-detail.pdf`);
  };

  if (error) {
    return (
      <div className="container p-3">
        <button
          className="btn btn-secondary btn-sm mb-2"
          onClick={() => onNavigate("purchaseList")}
        >
          ⬅ Back
        </button>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!rows.length) return <div className="p-3">Loading...</div>;

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
        {/* ================= HEADER ================= */}
        <h4 className="fw-bold mb-1">PURCHASE DETAIL</h4>

        <div className="fw-bold text-primary">
          Ref No: {rows[0].ref_no}
        </div>

        {/* 🔥 DATE – HIGH VISIBILITY */}
        <div className="fw-bold mb-2" style={{ color: "#ffc107" }}>
          Date: {fmtDate(rows[0])}
        </div>

        {/* ================= TABLE ================= */}
        <table className="table table-bordered table-sm">
          <thead className="table-dark text-center">
            <tr>
              <th rowSpan="2">Item</th>
              <th colSpan="3">Sale</th>
              <th colSpan="3">Purchase</th>
              <th rowSpan="2">Profit (PKR)</th>
            </tr>
            <tr>
              <th>SAR</th>
              <th>Rate</th>
              <th>PKR</th>
              <th>SAR</th>
              <th>Rate</th>
              <th>PKR</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="text-end">
                <td className="text-start">{r.item}</td>

                <td>{fmt(r.sale_sar)}</td>
                <td>{fmt(r.sale_rate)}</td>
                <td>{fmt(r.sale_pkr)}</td>

                <td>{fmt(r.purchase_sar)}</td>
                <td>{fmt(r.purchase_rate)}</td>
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

          <tfoot className="table-light fw-bold text-end">
            <tr>
              <td className="text-start">TOTAL</td>
              <td>{fmt(totals.sale_sar)}</td>
              <td>-</td>
              <td>{fmt(totals.sale_pkr)}</td>
              <td>{fmt(totals.purchase_sar)}</td>
              <td>-</td>
              <td>{fmt(totals.purchase_pkr)}</td>
              <td>{fmt(totals.profit)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
