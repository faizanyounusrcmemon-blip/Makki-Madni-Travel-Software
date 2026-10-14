import React, { useEffect, useState, useRef } from "react";
import usePdf from "../hooks/usePdf";
import Header from "../components/Header";
import Swal from "sweetalert2";

/* ================= CLICK COPY HANDLER ================= */
const handleCopyRef = (refNo) => {
  if (!refNo || refNo === "-") return;

  navigator.clipboard.writeText(refNo).then(() => {
    Swal.fire({
      icon: "success",
      title: "Copied!",
      text: `Ref No: ${refNo} copied to clipboard`,
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
    });
  }).catch((err) => {
    console.error("Copy failed: ", err);
  });
};

/* ================= HELPERS ================= */
const fmt = (v) => Number(v || 0).toLocaleString("en-US");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");

export default function ZiyaratView({ id, onNavigate, fromPage }) {
  const [data, setData] = useState(null);
  const ref = useRef(null);

  const { exportPDF, printPDF } = usePdf(ref, {
    filePrefix: "Ziyarat",
    customerName: data?.customer_name,
    bookingDate: data?.booking_date,
    orientation: "p",
  });

  /* ================= LOAD ================= */
  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ziyarat/get/${id}`)
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

  if (!data) return <div className="p-3">Loading...</div>;

  return (
    <div className="container mt-3 mb-5">
      {/* ===== ACTIONS ===== */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button
          className="btn btn-sm text-white fw-bold shadow"
          style={{
            background: "linear-gradient(135deg,#000,#434343)",
            borderRadius: 8,
            padding: "6px 16px",
          }}
          onClick={() => onNavigate(fromPage || "allreports")}
        >
          ⬅ Back
        </button>

        <button
          className="btn btn-success btn-sm fw-bold shadow"
          style={{ borderRadius: 8, padding: "6px 16px" }}
          onClick={exportPDF}
        >
          📄 Export PDF
        </button>

        <button
          className="btn btn-secondary btn-sm fw-bold shadow"
          style={{ borderRadius: 8, padding: "6px 16px" }}
          onClick={printPDF}
        >
          🖨️ Print
        </button>
      </div>

      {/* ===== PRINT AREA ===== */}
      <div
        ref={ref}
        className="bg-white p-4 rounded-4 shadow-lg"
        style={{
          maxWidth: "800px",
          margin: "auto",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <Header title="🕌 ZIYARAT DETAILS" />

        <div className="row mb-3">
          <div className="col-6">
            <b>Ref No:</b>{" "}
            <span
              className="fw-bold text-primary"
              style={{ cursor: "pointer" }}
              title="Click to copy Ref No"
              onClick={() => handleCopyRef(data.ref_no)}
            >
              {data.ref_no}
            </span>
          </div>
          <div className="col-6 text-end">
            <b>Booking Date:</b> {fmtDate(data.booking_date)}
          </div>
        </div>

        <div className="d-flex justify-content-between mb-3">
          <div><b>Customer Name:</b> {data.customer_name}</div>
          <div className="text-end">
            <b>Sub Customer:</b> {data.sub_customer_name || "-"}
          </div>
        </div>

        <hr />

        <h5 className="fw-bold text-primary mb-2">
          Ziyarat Entries
        </h5>

        {data.rows.length === 0 && (
          <p className="text-muted">No ziyarat rows</p>
        )}

        {/* Ziyarat Entries Table */}
        <table className="table table-bordered align-middle mt-2">
          <thead className="table-light">
            <tr>
              <th style={{ width: "120px" }}>Travel Date</th>
              <th>Description / Vehicle</th>
              <th className="text-center" style={{ width: "90px" }}>Persons</th>
              <th className="text-end" style={{ width: "100px" }}>Rate</th>
              <th className="text-end" style={{ width: "110px" }}>SAR</th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((r, i) => {
              const persons = Number(r.persons) || 1;
              const rate = Number(r.rate) || 0;
              const totalSar = Number(r.total || r.sar) || (persons * rate);
              return (
                <tr key={i} className="align-middle">
                  <td className="py-2">
                    <span 
                      className="badge px-2 py-1 fw-semibold" 
                      style={{ backgroundColor: "#EEF2FF", color: "#4F46E5", border: "1px solid #C7D2FE", borderRadius: "6px" }}
                    >
                      📅 {fmtDate(r.travel_date || r.date)}
                    </span>
                  </td>
                  <td>
                    <div>{r.description || r.text || r.route}</div>
                    {r.vehicle && <small className="text-muted">🚘 {r.vehicle}</small>}
                  </td>
                  <td className="text-center">{persons}</td>
                  <td className="text-end">{fmt(rate)}</td>
                  <td className="fw-bold text-end">{fmt(totalSar)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <hr />

        <h5 className="fw-bold text-success mb-2">💰 Totals</h5>

        <p><b>Total SAR:</b> {fmt(data.total_sar)}</p>
        <p><b>PKR Rate:</b> {fmt(data.pkr_rate)}</p>

        <h4 className="fw-bold text-success">
          Total PKR: {fmt(data.total_pkr)}
        </h4>
      </div>
    </div>
  );
}