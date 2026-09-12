import React, { useEffect, useState, useRef } from "react";
import usePdf from "../hooks/usePdf";
import Header from "../components/Header";

/* ================= HELPERS ================= */
const fmt = (v) => Number(v || 0).toLocaleString("en-US");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");

export default function VisaView({ id, onNavigate, fromPage }) {
  const [data, setData] = useState(null);
  const ref = useRef(null);

  const { exportPDF, printPDF } = usePdf(ref, {
    filePrefix: "Visa",
    customerName: data?.customer_name,
    bookingDate: data?.booking_date,
    orientation: "p",
  });

  /* ================= LOAD VISA ================= */
  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/visa/get/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) {
          Swal.fire("Error", "Record not found", "error");
          return;
        }

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
      })
      .catch(() => Swal.fire("Error", "Load failed", "error"));
  }, [id]);

  if (!data) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100 bg-light">
        <div className="spinner-border text-primary me-2" role="status"></div>
        <span className="fw-bold text-secondary">Loading Visa Voucher...</span>
      </div>
    );
  }

  return (
    <div className="container py-4" style={{ maxWidth: "850px" }}>
      {/* ===== ACTIONS ===== */}
      <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white rounded-4 shadow-sm border">
        <button
          className="btn btn-dark btn-sm fw-bold px-3 py-2 rounded-3 shadow-sm"
          style={{ background: "linear-gradient(135deg, #1e293b, #0f172a)" }}
          onClick={() => onNavigate(fromPage || "allreports")}
        >
          ⬅ Back
        </button>

        <div className="d-flex gap-2">
          <button
            className="btn btn-sm text-white fw-bold px-3 py-2 rounded-3 shadow-sm"
            style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}
            onClick={exportPDF}
          >
            📄 Export PDF
          </button>
          <button
            className="btn btn-sm text-white fw-bold px-3 py-2 rounded-3 shadow-sm"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
            onClick={printPDF}
          >
            🖨️ Print
          </button>
        </div>
      </div>

      {/* ===== PRINT AREA / VIP VOUCHER CARD ===== */}
      <div
        ref={ref}
        className="bg-white p-4 p-md-5 rounded-4 shadow-lg position-relative overflow-hidden border"
        style={{
          fontFamily: "'Plus Jakarta Sans', 'Inter', sans-serif",
          borderColor: "#e2e8f0",
        }}
      >
        {/* Top Gradient Ribbon */}
        <div
          style={{
            height: "6px",
            background: "linear-gradient(90deg, #2563eb, #3b82f6, #10b981)",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        />

        <Header title="🛂 VISA DETAILS" />

        {/* Info Grid */}
        <div
          className="p-4 rounded-4 mb-4 mt-3"
          style={{
            background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
            border: "1px solid #e2e8f0",
          }}
        >
          <div className="row g-3">
            <div className="col-6 col-md-4">
              <span className="text-uppercase fw-bold text-muted small d-block mb-1">
                Ref No
              </span>
              <span className="fw-bolder fs-6 text-dark bg-white px-2 py-1 rounded border d-inline-block shadow-sm">
                #{data.ref_no}
              </span>
            </div>
            <div className="col-6 col-md-4">
              <span className="text-uppercase fw-bold text-muted small d-block mb-1">
                Booking Date
              </span>
              <span className="fw-bold text-dark">{fmtDate(data.booking_date)}</span>
            </div>
            <div className="col-12 col-md-4">
              <span className="text-uppercase fw-bold text-muted small d-block mb-1">
                Customer Name
              </span>
              <span className="fw-bolder text-primary fs-6">{data.customer_name}</span>
            </div>
          </div>
        </div>

        {/* Section Heading */}
        <h6 className="fw-bold text-dark text-uppercase mb-3 d-flex align-items-center gap-2">
          <span>📝</span> Visa Breakdown
        </h6>

        {/* Table View */}
        <div className="table-responsive rounded-3 border mb-4">
          <table className="table table-hover align-middle mb-0">
            <thead
              style={{
                background: "linear-gradient(135deg, #0f172a, #1e293b)",
                color: "#ffffff",
              }}
            >
              <tr>
                <th className="py-3 px-3">Visa Type</th>
                <th className="py-3 text-center" style={{ width: "100px" }}>
                  Persons
                </th>
                <th className="py-3 text-end" style={{ width: "140px" }}>
                  Rate (Per Person)
                </th>
                <th className="py-3 text-end px-3" style={{ width: "140px" }}>
                  Total (SAR)
                </th>
              </tr>
            </thead>
            <tbody>
              {data.rows.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-4">
                    No visa entries recorded.
                  </td>
                </tr>
              ) : (
                data.rows.map((r, i) => {
                  const qty = Number(r.persons || 1);
                  const total = Number(r.total || 0);
                  // اگر بیک اینڈ سے rate الگ آ رہا ہے تو r.rate ورنہ total / persons
                  const unitRate = r.rate ? Number(r.rate) : qty > 0 ? total / qty : 0;

                  return (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td className="py-3 px-3 fw-bold text-dark">
                        <span className="badge bg-primary bg-opacity-10 text-primary border border-primary border-opacity-25 px-2 py-1 me-2">
                          🛂
                        </span>
                        {r.type}
                      </td>
                      <td className="py-3 text-center">
                        <span className="badge bg-secondary px-3 py-2 rounded-pill fw-bold">
                          {r.persons}
                        </span>
                      </td>
                      <td className="py-3 text-end fw-semibold text-secondary">
                        {fmt(unitRate)} <small className="text-muted fs-7">SAR</small>
                      </td>
                      <td className="py-3 text-end px-3 fw-bolder text-dark fs-6">
                        {fmt(r.total)} <small className="text-muted fs-7">SAR</small>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Summary Card */}
        <div className="row justify-content-end mt-4">
          <div className="col-md-6 col-lg-5">
            <div
              className="p-4 rounded-4 shadow-sm"
              style={{
                background: "linear-gradient(135deg, #ffffff, #f8fafc)",
                border: "2px solid #2563eb",
              }}
            >
              <h6 className="fw-bold text-primary mb-3 d-flex align-items-center gap-2">
                💰 Payment Details
              </h6>

              <div className="d-flex justify-content-between mb-2">
                <span className="text-muted fw-semibold">Total SAR:</span>
                <span className="fw-bold text-dark">{fmt(data.total_sar)} SAR</span>
              </div>

              <div className="d-flex justify-content-between mb-3">
                <span className="text-muted fw-semibold">PKR Rate:</span>
                <span className="fw-bold text-dark">{fmt(data.pkr_rate)}</span>
              </div>

              <div className="border-top pt-3 d-flex justify-content-between align-items-center">
                <span className="fw-bolder text-dark fs-6">Total PKR:</span>
                <span
                  className="fw-bolder fs-4"
                  style={{
                    background: "linear-gradient(135deg, #059669, #10b981)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {fmt(data.total_pkr)} PKR
                </span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
