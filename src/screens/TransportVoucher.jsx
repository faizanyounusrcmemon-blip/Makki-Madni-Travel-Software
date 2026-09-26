import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Swal from "sweetalert2";
import Header from "../components/Header";

/* ================= DATE FORMAT (01/dec/2025) ================= */
const showDate = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d
    .toLocaleString("en-US", { month: "short" })
    .toLowerCase(); // lowercase month
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

export default function TransportVoucher({ onNavigate }) {
  const [ref, setRef] = useState("");
  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);

  const [vehicles, setVehicles] = useState({});
  const [pickupDates, setPickupDates] = useState({});
  const [contacts, setContacts] = useState({});
  const [details, setDetails] = useState({});

  const voucherRef = useRef(null);

  /* ================= LOAD ================= */
  const loadVoucher = async () => {
    try {
      const upperRef = ref.trim().toUpperCase();

      if (!upperRef) {
        return Swal.fire({
          width: "300px",
          icon: "warning",
          text: "Please enter Ref No",
        });
      }

      let r;
      let d;

      Swal.fire({
        width: "260px",
        title: "Loading Voucher...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      if (upperRef.startsWith("PKG-")) {
        r = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/bookings/get/${upperRef}`
        );
        d = await r.json();

        if (!d.success) {
          Swal.close();
          return Swal.fire({
            width: "300px",
            icon: "error",
            text: "Voucher not found",
          });
        }

        const transportRows = d.row.transport || [];
        setData(d.row);
        setRows(transportRows);

        const initialPickupDates = {};
        transportRows.forEach((row, idx) => {
          if (row.travel_date || row.date) {
            initialPickupDates[idx] = row.travel_date || row.date;
          }
        });
        setPickupDates(initialPickupDates);

      } else if (upperRef.startsWith("TRN-")) {
        r = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/transport/get/${upperRef}`
        );
        d = await r.json();

        if (!d.success) {
          Swal.close();
          return Swal.fire({
            width: "300px",
            icon: "error",
            text: "Voucher not found",
          });
        }

        const transportRows = d.row.rows || [];
        setData(d.row);
        setRows(transportRows);

        const initialPickupDates = {};
        transportRows.forEach((row, idx) => {
          if (row.travel_date || row.date) {
            initialPickupDates[idx] = row.travel_date || row.date;
          }
        });
        setPickupDates(initialPickupDates);

      } else {
        Swal.close();
        return Swal.fire({
          width: "300px",
          icon: "error",
          text: "Invalid Ref No",
        });
      }

      Swal.close();

      Swal.fire({
        width: "280px",
        icon: "success",
        text: "Voucher Loaded Successfully 😎",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.close();
      Swal.fire({
        width: "300px",
        icon: "error",
        text: "Load Failed",
      });
    }
  };

  /* ================= HELPER FOR PDF / PRINT CANVAS ================= */
  const generateCanvas = async () => {
    return await html2canvas(voucherRef.current, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      ignoreElements: (el) => el.tagName === "CANVAS",
      onclone: (doc) => {
        doc.querySelectorAll("*").forEach((el) => {
          const bg = el.style.backgroundImage;
          if (bg && bg.includes("gradient")) {
            el.style.backgroundImage = "none";
          }
        });

        doc.querySelectorAll("textarea").forEach((textarea) => {
          const parent = textarea.parentElement;
          if (parent) {
            const div = doc.createElement("div");
            div.style.whiteSpace = "pre-wrap";
            div.style.wordBreak = "break-word";
            div.style.minHeight = "38px";
            div.style.padding = "6px 10px";
            div.style.border = "1px solid #ced4da";
            div.style.borderRadius = "6px";
            div.style.fontSize = "12px";
            div.style.color = "#212529";
            div.style.backgroundColor = "#fff";
            div.innerText = textarea.value;
            textarea.style.display = "none";
            parent.appendChild(div);
          }
        });

        doc.querySelectorAll("input.form-control").forEach((input) => {
          const parent = input.parentElement;
          if (parent && input.type !== "hidden") {
            const div = doc.createElement("div");
            div.style.minHeight = "31px";
            div.style.padding = "4px 8px";
            div.style.border = "1px solid #ced4da";
            div.style.borderRadius = "6px";
            div.style.fontSize = "12px";
            div.style.color = "#212529";
            div.style.backgroundColor = "#fff";
            div.innerText = input.value;
            input.style.display = "none";
            parent.appendChild(div);
          }
        });
      },
    });
  };

  /* ================= PDF (SINGLE PAGE AUTO FIT) ================= */
  const exportPDF = async () => {
    try {
      if (!voucherRef.current || !data) {
        return Swal.fire({
          width: "300px",
          icon: "warning",
          text: "No voucher data found",
        });
      }

      Swal.fire({
        width: "260px",
        title: "Generating PDF...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const canvas = await generateCanvas();
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;

      if (imgHeight > pageHeight) {
        const scale = pageHeight / imgHeight;
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth * scale, pageHeight);
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      }

      pdf.save(`Transport-Voucher-${data.ref_no}.pdf`);

      Swal.close();

      Swal.fire({
        width: "280px",
        icon: "success",
        text: "PDF Downloaded Successfully 😎",
      });
    } catch (err) {
      Swal.close();
      Swal.fire({
        width: "300px",
        icon: "error",
        text: "PDF Generation Failed",
      });
    }
  };

  return (
    <div className="container py-3">
      {/* TOP BAR */}
      <div className="d-flex gap-2 mb-3 flex-wrap top-buttons">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>

        <input
          className="form-control form-control-sm w-25"
          placeholder="PKG- / TRN- Ref"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
        />

        <button className="btn btn-primary btn-sm" onClick={loadVoucher}>
          Load Voucher
        </button>

        {data && (
          <>
            <button className="btn btn-success btn-sm" onClick={exportPDF}>
              📄 Download PDF
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                try {
                  if (!voucherRef.current || !data) {
                    return Swal.fire({
                      width: "300px",
                      icon: "warning",
                      text: "No voucher data found",
                    });
                  }

                  Swal.fire({
                    width: "260px",
                    title: "Preparing Print...",
                    allowOutsideClick: false,
                    didOpen: () => Swal.showLoading(),
                  });

                  const canvas = await generateCanvas();
                  const imgData = canvas.toDataURL("image/png");

                  const pdf = new jsPDF("p", "mm", "a4");

                  const pageWidth = pdf.internal.pageSize.getWidth();
                  const pageHeight = pdf.internal.pageSize.getHeight();

                  const imgWidth = pageWidth;
                  let imgHeight = (canvas.height * imgWidth) / canvas.width;

                  if (imgHeight > pageHeight) {
                    const scale = pageHeight / imgHeight;
                    pdf.addImage(
                      imgData,
                      "PNG",
                      0,
                      0,
                      imgWidth * scale,
                      pageHeight
                    );
                  } else {
                    pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
                  }

                  Swal.close();

                  window.open(pdf.output("bloburl"), "_blank");

                  Swal.fire({
                    width: "280px",
                    icon: "success",
                    text: "Print Preview Opened 😎",
                    timer: 1200,
                    showConfirmButton: false,
                  });
                } catch (err) {
                  Swal.close();
                  Swal.fire({
                    width: "300px",
                    icon: "error",
                    text: "Print Failed",
                  });
                }
              }}
            >
              🖨️ Print
            </button>
          </>
        )}
      </div>

      {data && (
        <div
          ref={voucherRef}
          style={{
            maxWidth: 850,
            margin: "auto",
            padding: 20,
            borderRadius: 16,
            background: "#fff",
            border: "2px solid #0d6efd",
            boxShadow: "0 10px 30px rgba(0,0,0,.08)",
            position: "relative",
            overflow: "hidden",
            fontFamily: "Segoe UI, sans-serif",
          }}
        >
          {/* HEADER */}
          <Header title="TRANSPORT VOUCHER" />

          {/* INFO */}
          <div
            className="fw-bold"
            style={{
              background: "#f8fbff",
              border: "1px solid #dbeafe",
              borderRadius: 8,
              padding: "10px 15px",
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
              fontSize: "13px",
            }}
          >
            <div>
              <strong>Ref No:</strong> {data.ref_no}
            </div>

            <div>
              <strong>Date:</strong> {showDate(data.booking_date)}
            </div>
          </div>

          {/* CUSTOMER NAME */}
          <div
            style={{
              background: "#f8fbff",
              border: "1px solid #dbeafe",
              borderLeft: "4px solid #0d6efd",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 15,
            }}
          >
            <label className="fw-bold mb-1 d-block" style={{ fontSize: "12px", color: "#333" }}>
              👤 Customer Name
            </label>
            <input
              type="text"
              className="form-control form-control-sm fw-bold"
              value={data.customer_name || ""}
              onChange={(e) =>
                setData({ ...data, customer_name: e.target.value })
              }
              placeholder="Enter Customer Name"
              style={{ fontSize: "13px", padding: "4px 8px" }}
            />
          </div>

          {/* SERVICES / ROUTE CARDS */}
          {rows.map((r, i) => (
            <div
              key={i}
              style={{
                background: "#fcfdfe",
                border: "1px solid #cce0ff",
                borderRadius: 10,
                padding: "12px 14px",
                marginBottom: 14,
                boxShadow: "0 2px 6px rgba(13,110,253,0.05)",
              }}
            >
              {/* BEAUTIFIED SERVICE HEADER BAR */}
              <div
                className="d-flex align-items-center justify-content-between text-uppercase fw-bold px-3 py-2 rounded"
                style={{
                  backgroundColor: "#1a2530",
                  color: "#ffc107",
                  fontSize: "13px",
                  letterSpacing: "0.5px",
                  marginBottom: "12px",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                }}
              >
                <span>🚐 ROUTE {i + 1}: &nbsp;{r.text || r.description}</span>
                <span className="badge bg-warning text-dark px-2 py-1" style={{ fontSize: "10px" }}>
                  CONFIRMED
                </span>
              </div>

              {/* INPUT FIELDS ROW */}
              <div className="row g-2">
                <div className="col-md-2">
                  <label className="fw-bold text-secondary mb-1" style={{ fontSize: "11px" }}>
                    🚘 Vehicle
                  </label>
                  <input
                    className="form-control form-control-sm fw-bold"
                    style={{ fontSize: "11px", height: "30px", padding: "2px 6px" }}
                    placeholder="e.g. GMC / Coaster"
                    value={vehicles[i] || ""}
                    onChange={(e) =>
                      setVehicles({ ...vehicles, [i]: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-3">
                  <label className="fw-bold text-secondary mb-1" style={{ fontSize: "11px" }}>
                    📅 Pick-up Date
                  </label>
                  <div className="d-flex flex-column gap-1">
                    <input
                      type="date"
                      className="form-control form-control-sm fw-bold"
                      style={{ fontSize: "11px", height: "30px", padding: "2px 4px" }}
                      value={pickupDates[i] || ""}
                      onChange={(e) =>
                        setPickupDates({ ...pickupDates, [i]: e.target.value })
                      }
                    />
                    {pickupDates[i] && (
                      <div
                        className="text-center rounded mt-1"
                        style={{
                          backgroundColor: "#0b5ed7",
                          color: "#ffffff",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 6px",
                          letterSpacing: "0.5px",
                          boxShadow: "0 2px 4px rgba(11,94,215,0.2)"
                        }}
                      >
                        {showDate(pickupDates[i])}
                      </div>
                    )}
                  </div>
                </div>

                <div className="col-md-2">
                  <label className="fw-bold text-secondary mb-1" style={{ fontSize: "11px" }}>
                    📞 Contact 1
                  </label>
                  <input
                    className="form-control form-control-sm fw-bold"
                    style={{ fontSize: "11px", height: "30px", padding: "2px 6px" }}
                    placeholder="Mobile 1"
                    value={contacts[i]?.c1 || ""}
                    onChange={(e) =>
                      setContacts({
                        ...contacts,
                        [i]: { ...contacts[i], c1: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="col-md-2">
                  <label className="fw-bold text-secondary mb-1" style={{ fontSize: "11px" }}>
                    📞 Contact 2
                  </label>
                  <input
                    className="form-control form-control-sm fw-bold"
                    style={{ fontSize: "11px", height: "30px", padding: "2px 6px" }}
                    placeholder="Mobile 2"
                    value={contacts[i]?.c2 || ""}
                    onChange={(e) =>
                      setContacts({
                        ...contacts,
                        [i]: { ...contacts[i], c2: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="col-md-3">
                  <label className="fw-bold text-secondary mb-1" style={{ fontSize: "11px" }}>
                    📝 Extra Details
                  </label>
                  <textarea
                    className="form-control form-control-sm fw-bold"
                    rows={1}
                    style={{
                      fontSize: "11px",
                      resize: "none",
                      minHeight: "30px",
                      overflow: "hidden",
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      padding: "4px 6px",
                    }}
                    placeholder="Driver / Remarks..."
                    value={details[i] || ""}
                    onChange={(e) => {
                      setDetails({ ...details, [i]: e.target.value });
                      e.target.style.height = "auto";
                      e.target.style.height = `${e.target.scrollHeight}px`;
                    }}
                  />
                </div>
              </div>
            </div>
          ))}

          {/* INSTRUCTIONS / NOTE */}
          <div
            style={{
              marginTop: 15,
              background: "#fff1eb",
              border: "1px dashed #fd7e14",
              padding: 12,
              borderRadius: 8,
              fontSize: "12px",
              fontWeight: 600,
              color: "#856404",
            }}
          >
            <b>اہم ہدایات:</b>
            <br />
            براہِ کرم ڈرائیور اور گاڑی کی تفصیلات وقت پر کنفرم کریں۔ کسی بھی
            مسئلے کی صورت میں  فوری رابطہ کریں۔
          </div>
        </div>
      )}
    </div>
  );
}