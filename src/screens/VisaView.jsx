import React, { useEffect, useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Swal from "sweetalert2";
import Header from "../components/Header";

/* ================= HELPERS ================= */
const fmt = (v) => Number(v || 0).toLocaleString("en-US");
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");

const cleanName = (name) =>
  name ? name.replace(/[^a-zA-Z0-9]/g, "_") : "Customer";

const formatDateForFile = (date) => {
  if (!date) return "NoDate";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  return `${day}-${mon}-${year}`;
};

export default function VisaView({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const ref = useRef(null);

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

  /* ================= EXPORT PDF ================= */
  const exportPDF = async () => {
    try {
      if (!ref.current || !data) {
        return Swal.fire({
          icon: "warning",
          text: "No data found",
        });
      }

      Swal.fire({
        title: "Generating PDF...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const canvas = await html2canvas(ref.current, {
        scale: 3,
        useCORS: true,
      });

      const img = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = (canvas.height * pageWidth) / canvas.width;

      pdf.addImage(img, "JPEG", 0, 0, pageWidth, pageHeight);

      const fileName = `${cleanName(
        data?.customer_name
      )}_${formatDateForFile(data?.booking_date)}.pdf`;

      pdf.save(fileName);

      Swal.close();

      Swal.fire({
        icon: "success",
        text: "PDF Downloaded 😎",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.close();
      Swal.fire("Error", "PDF Export Failed", "error");
    }
  };

  /* ================= PRINT ================= */
  const printPDF = async () => {
    try {
      if (!ref.current || !data) {
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

      const canvas = await html2canvas(ref.current, {
        scale: 3,
        useCORS: true,
      });

      const img = canvas.toDataURL("image/jpeg", 1.0);
      const pdf = new jsPDF("p", "mm", "a4");

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
          onClick={() => onNavigate("allreports")}
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
        <Header title="🛂 VISA DETAILS" />

        <div className="row mb-3">
          <div className="col-6"><b>Ref No:</b> {data.ref_no}</div>
          <div className="col-6 text-end">
            <b>Booking Date:</b> {fmtDate(data.booking_date)}
          </div>
        </div>

        <p><b>Customer Name:</b> {data.customer_name}</p>

        <hr />

        <h5 className="fw-bold text-primary mb-2">
          Visa Entries
        </h5>

        {data.rows.length === 0 && (
          <p className="text-muted">No visa rows</p>
        )}

        {data.rows.map((r, i) => (
          <div
            key={i}
            className="border rounded p-2 mb-2 shadow-sm d-flex justify-content-between"
          >
            <div>{r.type}</div>
            <div className="text-center">{r.persons}</div>
            <div className="fw-bold">{fmt(r.total)}</div>
          </div>
        ))}

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