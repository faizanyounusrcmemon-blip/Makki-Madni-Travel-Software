import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Swal from "sweetalert2";

/* ================= DATE FORMAT (01/dec/2025) ================= */
const showDate = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d
    .toLocaleString("en-US", { month: "short" })
    .toLowerCase(); // 🔥 lowercase month
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

  const voucherRef = useRef(null);

/* ================= LOAD ================= */
const loadVoucher = async () => {

  try {

    const upperRef = ref.trim().toUpperCase();

    // EMPTY
    if (!upperRef) {
      return Swal.fire({
        width: "300px",
        icon: "warning",
        text: "Please enter Ref No"
      });
    }

    let r;
    let d;

    // LOADING
    Swal.fire({
      width: "260px",
      title: "Loading Voucher...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
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
          text: "Voucher not found"
        });
      }

      setData(d.row);
      setRows(d.row.transport || []);

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
          text: "Voucher not found"
        });
      }

      setData(d.row);
      setRows(d.row.rows || []);

    } else {

      Swal.close();

      return Swal.fire({
        width: "300px",
        icon: "error",
        text: "Invalid Ref No"
      });
    }

    Swal.close();

    Swal.fire({
      width: "280px",
      icon: "success",
      text: "Voucher Loaded Successfully 😎",
      timer: 1200,
      showConfirmButton: false
    });

  } catch (err) {

    Swal.close();

    Swal.fire({
      width: "300px",
      icon: "error",
      text: "Load Failed"
    });
  }
};

/* ================= PDF (SINGLE PAGE AUTO FIT) ================= */
const exportPDF = async () => {

  try {

    if (!voucherRef.current || !data) {

      return Swal.fire({
        width: "300px",
        icon: "warning",
        text: "No voucher data found"
      });
    }

    Swal.fire({
      width: "260px",
      title: "Generating PDF...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const element = voucherRef.current;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;

    let imgHeight =
      (canvas.height * imgWidth) / canvas.width;

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

      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        imgWidth,
        imgHeight
      );
    }

    pdf.save(`Transport-Voucher-${data.ref_no}.pdf`);

    Swal.close();

    Swal.fire({
      width: "280px",
      icon: "success",
      text: "PDF Downloaded Successfully 😎"
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
    <button
      className="btn btn-success btn-sm"
      onClick={exportPDF}
    >
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
          text: "No voucher data found"
        });
      }

      Swal.fire({
        width: "260px",
        title: "Preparing Print...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const canvas = await html2canvas(voucherRef.current, {
        scale: 2,
        useCORS: true,
      });

      const imgData = canvas.toDataURL("image/png");

      const pdf = new jsPDF("p", "mm", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;

      let imgHeight =
        (canvas.height * imgWidth) / canvas.width;

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

        pdf.addImage(
          imgData,
          "PNG",
          0,
          0,
          imgWidth,
          imgHeight
        );
      }

      Swal.close();

      window.open(pdf.output("bloburl"), "_blank");

      Swal.fire({
        width: "280px",
        icon: "success",
        text: "Print Preview Opened 😎",
        timer: 1200,
        showConfirmButton: false
      });

    } catch (err) {

      Swal.close();

      Swal.fire({
        width: "300px",
        icon: "error",
        text: "Print Failed"
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
            maxWidth: 900,
            margin: "auto",
            padding: 30,
            borderRadius: 25,
            background: "linear-gradient(135deg,#ffecd2,#fcb69f)",
            boxShadow: "0 30px 70px rgba(0,0,0,.3)",
            fontFamily: "Segoe UI",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              background: "linear-gradient(90deg,#667eea,#764ba2)",
              borderRadius: 20,
              padding: 25,
              color: "#fff",
              textAlign: "center",
              marginBottom: 25,
            }}
          >
            <h1 style={{ fontWeight: 800 }}>✈ MAKKI MADNI TRAVEL</h1>
            <div style={{ fontSize: 14 }}>
              Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid<br />
              Garden West Karachi<br />
              ✉ makkimadnitravel@gmail.com | ☎ 0335-7476744
            </div>
            <div
              style={{
                marginTop: 12,
                background: "#ffc107",
                color: "#000",
                padding: "6px 24px",
                borderRadius: 30,
                fontWeight: 700,
                display: "inline-block",
              }}
            >
              TRANSPORT VOUCHER
            </div>
          </div>

          {/* INFO */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              background: "linear-gradient(90deg,#43cea2,#185a9d)",
              color: "#fff",
              padding: "14px 20px",
              borderRadius: 14,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            <div>Ref: {data.ref_no}</div>
            <div>Date: {showDate(data.booking_date)}</div>
          </div>

          {/* CUSTOMER */}
          <div
            style={{
              background: "#fff",
              padding: 18,
              borderRadius: 16,
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 22,
              borderLeft: "8px solid #ff5722",
            }}
          >
            Customer: {data.customer_name}
          </div>

          {/* SERVICES */}
          {rows.map((r, i) => (
            <div
              key={i}
              style={{
                background: "linear-gradient(135deg,#e0c3fc,#8ec5fc)",
                borderRadius: 20,
                padding: 22,
                marginBottom: 18,
              }}
            >
              <b>🚐 {r.text || r.description}</b>

              <div className="row g-3 mt-2">
                <div className="col-md-3">
                  <label className="small fw-bold">Vehicle</label>
                  <input
                    className="form-control form-control-sm"
                    value={vehicles[i] || ""}
                    onChange={(e) =>
                      setVehicles({ ...vehicles, [i]: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-3">
                  <label className="small fw-bold">Pick-up Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={pickupDates[i] || ""}
                    onChange={(e) =>
                      setPickupDates({ ...pickupDates, [i]: e.target.value })
                    }
                  />
                  {pickupDates[i] && (
                    <div className="small mt-1">
                      {showDate(pickupDates[i])}
                    </div>
                  )}
                </div>

                <div className="col-md-3">
                  <label className="small fw-bold">Contact</label>
                  <input
                    className="form-control form-control-sm"
                    value={contacts[i]?.c1 || ""}
                    onChange={(e) =>
                      setContacts({
                        ...contacts,
                        [i]: { ...contacts[i], c1: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="col-md-3">
                  <label className="small fw-bold">Alternate</label>
                  <input
                    className="form-control form-control-sm"
                    value={contacts[i]?.c2 || ""}
                    onChange={(e) =>
                      setContacts({
                        ...contacts,
                        [i]: { ...contacts[i], c2: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          {/* NOTE */}
          <div
            style={{
              marginTop: 20,
              background: "#fff1eb",
              padding: 16,
              borderRadius: 14,
              fontWeight: 600,
            }}
          >
            <b>اہم ہدایات:</b><br />
            براہِ کرم ڈرائیور اور گاڑی کی تفصیلات وقت پر کنفرم کریں۔
            کسی بھی مسئلے کی صورت میں مکّی مدنی ٹریول سے فوری رابطہ کریں۔
          </div>
        </div>
      )}
    </div>
  );
}

