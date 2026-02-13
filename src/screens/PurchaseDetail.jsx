import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ================= HELPERS ================= */
const fmt = (n) => Number(n || 0).toLocaleString("en-US");

const fmtDate = (row) => {
  const v = row?.payment_date || row?.booking_date || row?.created_at;
  if (!v) return "-";

  const d = new Date(v);
  if (isNaN(d)) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();

  return `${day} ${month} ${year}`;
};

export default function PurchaseDetail({ refNo, onNavigate }) {
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState("");
  const [showSale, setShowSale] = useState(false);
  const [showProfit, setShowProfit] = useState(false);

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
    const canvas = await html2canvas(boxRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("l", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save(`${rows[0]?.ref_no || refNo}-purchase-detail.pdf`);
  };

  if (error) {
    return <div className="container py-4 alert alert-danger">{error}</div>;
  }

  if (!rows.length) {
    return (
      <div className="container py-5 text-center">
        <div className="spinner-border text-primary" />
      </div>
    );
  }

  return (
    <div className="container py-4">

      {/* TOP ACTIONS */}
      <div className="d-flex justify-content-between mb-3 flex-wrap gap-2">
        <button
          className="btn btn-sm text-white shadow"
          style={{
            background: "linear-gradient(135deg,#000,#434343)",
            borderRadius: 10,
            padding: "6px 16px",
          }}
          onClick={() => onNavigate("purchaseList")}
        >
          ← Back
        </button>

        <div className="d-flex gap-3 align-items-center">

          {/* SALE TOGGLE */}
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="saleToggle"
              checked={showSale}
              onChange={(e) => setShowSale(e.target.checked)}
            />
            <label className="form-check-label fw-bold">
              Show Sale
            </label>
          </div>

          {/* PROFIT TOGGLE */}
          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              id="profitToggle"
              checked={showProfit}
              onChange={(e) => setShowProfit(e.target.checked)}
            />
            <label className="form-check-label fw-bold">
              Show Profit
            </label>
          </div>

          <button
            className="btn btn-success btn-sm shadow"
            style={{ borderRadius: 10, padding: "6px 16px" }}
            onClick={exportPDF}
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* PRINT AREA */}
      <div ref={boxRef} className="bg-white rounded-4 shadow-lg p-4">

        {/* HEADER */}
        <div
          className="rounded-4 p-3 mb-4 text-white"
          style={{
            background: "linear-gradient(135deg,#0d6efd,#00c6ff)",
          }}
        >
          <div className="d-flex justify-content-between flex-wrap">
            <div>
              <h4 className="fw-bold mb-1">PURCHASE DETAIL</h4>
              <div>Ref No: {rows[0].ref_no}</div>
            </div>
            <div className="text-end">
              <div className="fw-bold">{rows[0].customer_name}</div>
              <div style={{ fontSize: 13 }}>{fmtDate(rows[0])}</div>
            </div>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-responsive">
          <table className="table align-middle table-bordered">

            {/* HEADER ROW 1 */}
            <thead style={{ background: "#0d6efd", color: "#fff" }}>
              <tr className="text-center">
                <th rowSpan="2">Item</th>
                <th rowSpan="2">Supplier</th>

                {showSale && <th colSpan="3">Sale</th>}

                <th colSpan="3">Purchase</th>

                {showProfit && <th rowSpan="2">Profit</th>}
              </tr>

              {/* HEADER ROW 2 */}
              <tr className="text-center">
                {showSale && (
                  <>
                    <th>SAR</th>
                    <th>Rate</th>
                    <th>PKR</th>
                  </>
                )}

                <th>SAR</th>
                <th>Rate</th>
                <th>PKR</th>
              </tr>
            </thead>

            {/* BODY */}
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="fw-semibold">{r.item}</td>
                  <td>{r.supplier_name || "-"}</td>

                  {showSale && (
                    <>
                      <td className="text-end">{fmt(r.sale_sar)}</td>
                      <td className="text-end">{fmt(r.sale_rate)}</td>
                      <td className="text-end">{fmt(r.sale_pkr)}</td>
                    </>
                  )}

                  <td className="text-end">{fmt(r.purchase_sar)}</td>
                  <td className="text-end">{fmt(r.purchase_rate)}</td>
                  <td className="text-end">{fmt(r.purchase_pkr)}</td>

                  {showProfit && (
                    <td className="text-center">
                      <span
                        className={`badge px-3 py-2 ${
                          Number(r.profit) >= 0 ? "bg-success" : "bg-danger"
                        }`}
                      >
                        {fmt(r.profit)}
                      </span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>

            {/* FOOTER */}
            <tfoot className="fw-bold bg-light">
              <tr>
                <td>TOTAL</td>
                <td></td>

                {showSale && (
                  <>
                    <td className="text-end">{fmt(totals.sale_sar)}</td>
                    <td></td>
                    <td className="text-end">{fmt(totals.sale_pkr)}</td>
                  </>
                )}

                <td className="text-end">{fmt(totals.purchase_sar)}</td>
                <td></td>
                <td className="text-end">{fmt(totals.purchase_pkr)}</td>

                {showProfit && (
                  <td className="text-center">
                    <span
                      className={`badge px-3 py-2 ${
                        Number(totals.profit) >= 0 ? "bg-success" : "bg-danger"
                      }`}
                    >
                      {fmt(totals.profit)}
                    </span>
                  </td>
                )}
              </tr>
            </tfoot>

          </table>
        </div>
      </div>
    </div>
  );
}
