import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Swal from "sweetalert2";

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
      } else {
        setError(data.error || "Purchase not found");
        Swal.fire("Error", data.error || "Purchase not found", "error");
      }
    } catch {
      setError("Server error");
      Swal.fire("Error", "Server error", "error");
    }
  };

  /* ================= EXPORT PDF (MULTI PAGE) ================= */
  const exportPDF = async () => {
    try {
      if (!boxRef.current || !rows.length) {
        return Swal.fire({
          icon: "warning",
          text: "No data found",
        });
      }

    Swal.fire({
      width: "260px",
      title: "Generating PDF...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

      const canvas = await html2canvas(boxRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("l", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${rows[0]?.ref_no || refNo}-purchase-detail.pdf`);

    Swal.close();

    Swal.fire({
      width: "280px",
      icon: "success",
      text: "PDF Downloaded Successfully 😎",
      timer: 1500,
      showConfirmButton: true
    });

  } catch (err) {
    Swal.close();

    Swal.fire({
      width: "300px",
      icon: "error",
      text: "PDF Generation Failed"
    });
  }
};

  /* ================= PRINT ================= */
  const printPDF = async () => {
    try {
      if (!boxRef.current || !rows.length) {
        return Swal.fire({
          icon: "warning",
          text: "No data found",
        });
      }

      Swal.fire({
        title: "Preparing Print...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const canvas = await html2canvas(boxRef.current, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
      });

      const img = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("l", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.addImage(img, "JPEG", 0, 0, pageWidth, pageHeight);

      Swal.close();

      const blobUrl = pdf.output("bloburl");
      const w = window.open(blobUrl, "_blank");

      if (w) {
        w.onload = () => {
          w.focus();
          w.print();
        };
      }

      Swal.fire({
        icon: "success",
        text: "Print Ready 😎",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.close();
      Swal.fire("Error", "Print Failed", "error");
    }
  };

  if (error) return <div className="alert alert-danger">{error}</div>;

  if (!rows.length)
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" />
      </div>
    );

  return (
    <div className="container py-4">

      {/* ===== TOP ACTIONS ===== */}
      <div className="d-flex justify-content-between flex-wrap gap-2 mb-3">
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

        <div className="d-flex align-items-center gap-3 px-3 py-2 rounded shadow-sm bg-white">

          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={showSale}
              onChange={(e) => setShowSale(e.target.checked)}
            />
            <label className="form-check-label fw-bold">Show Sale</label>
          </div>

          <div className="form-check">
            <input
              type="checkbox"
              className="form-check-input"
              checked={showProfit}
              onChange={(e) => setShowProfit(e.target.checked)}
            />
            <label className="form-check-label fw-bold">Show Profit</label>
          </div>

          <button
            className="btn btn-success btn-sm shadow"
            style={{ borderRadius: 10, padding: "6px 16px" }}
            onClick={exportPDF}
          >
            📄 Export PDF
          </button>

          <button
            className="btn btn-secondary btn-sm shadow"
            style={{ borderRadius: 10, padding: "6px 16px" }}
            onClick={printPDF}
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* ===== PRINT AREA ===== */}
      <div ref={boxRef} className="bg-white rounded-4 shadow-lg p-4">

        {/* HEADER */}
        <div
          className="rounded-4 p-3 mb-4 text-white"
          style={{
            background: "linear-gradient(135deg,#0d6efd,#00c6ff)",
          }}
        >
          <div className="d-flex justify-content-between">
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
          <table className="table table-bordered align-middle">

            <thead className="text-white bg-primary">
              <tr className="text-center">
                <th rowSpan="2">Item</th>
                <th rowSpan="2">Supplier</th>

                {showSale && <th colSpan="3">Sale</th>}
                <th colSpan="3">Purchase</th>
                {showProfit && <th rowSpan="2">Profit</th>}
              </tr>

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
                        Number(totals.profit) >= 0
                          ? "bg-success"
                          : "bg-danger"
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