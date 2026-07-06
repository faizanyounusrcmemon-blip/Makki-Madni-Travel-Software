import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Swal from "sweetalert2";
import Header from "../components/Header";

/* ================= HELPERS ================= */
const showDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  return `${day}/${mon}/${year}`;
};

const calcNights = (inD, outD) => {
  if (!inD || !outD) return "—";
  const diff =
    (new Date(outD).getTime() - new Date(inD).getTime()) /
    (1000 * 60 * 60 * 24);
  return diff > 0 ? diff : "—";
};

/* ================= NORMALIZE HOTEL ================= */
const normalizeHotel = (h = {}) => ({
  hotel: h.hotel || h.hotel_name || "—",
  location: h.location || h.address || h.hotel_location || "—",
  room: h.room || h.rooms || h.room_qty || "—",
  room_type: h.room_type || h.type || h.type_name || "—",
  checkIn: h.checkIn || h.check_in || null,
  checkOut: h.checkOut || h.check_out || null,
  nights: calcNights(
    h.checkIn || h.check_in,
    h.checkOut || h.check_out
  ),
  confirmNo: "",
  contact1: "",
  contact2: "",
});

export default function HotelVoucher({ onNavigate }) {
  const [ref, setRef] = useState("");
  const [data, setData] = useState(null);
  const voucherRef = useRef(null);

/* ================= LOAD VOUCHER ================= */
const loadVoucher = async () => {

  try {

    let url = "";
    let isPkg = false;

    const upperRef = ref.trim().toUpperCase();

    // EMPTY REF
    if (!upperRef) {

      return Swal.fire({
        width: "300px",
        icon: "warning",
        text: "Please enter Ref No"
      });
    }

    if (upperRef.startsWith("PKG-")) {

      url =
        `${import.meta.env.VITE_BACKEND_URL}/api/bookings/voucher/${upperRef}`;

      isPkg = true;

    } else if (upperRef.startsWith("HOT-")) {

      url =
        `${import.meta.env.VITE_BACKEND_URL}/api/hotels/get/${upperRef}`;

    } else {

      return Swal.fire({
        width: "300px",
        icon: "error",
        text: "Invalid Ref No"
      });
    }

    // LOADING
    Swal.fire({
      width: "260px",
      title: "Loading Voucher...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const res = await fetch(url);

    const d = await res.json();

    Swal.close();

    if (!d.success) {

      return Swal.fire({
        width: "300px",
        icon: "error",
        text: "Voucher not found"
      });
    }

    const row = isPkg ? d : d.row;

    const rawHotels = row.hotels;

    setData({
      ref_no: row.ref_no,
      customer_name: row.customer_name,
      agent_name: row.agent_name || "",
      booking_date: row.booking_date,
      hotels: (rawHotels || []).map(normalizeHotel),
    });

    // SUCCESS
    Swal.fire({
      width: "280px",
      icon: "success",
      text: "Voucher Loaded Successfully 😎",
      timer: 1200,
      showConfirmButton: false
    });

  } catch (e) {

    Swal.close();

    Swal.fire({
      width: "300px",
      icon: "error",
      text: "Failed to load voucher"
    });
  }
};

/* ================= PDF ================= */
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

    const pdf = new jsPDF("p", "mm", "a4");

const canvas = await html2canvas(voucherRef.current, {
  scale: 3,
  useCORS: true,

  backgroundColor: "#ffffff",

  ignoreElements: (el) =>
    el.tagName === "CANVAS",

  onclone: (doc) => {
    doc.querySelectorAll("*").forEach((el) => {
      const bg = el.style.backgroundImage;

      if (
        bg &&
        bg.includes("gradient")
      ) {
        el.style.backgroundImage = "none";
      }
    });
  },
});

    const imgData =
      canvas.toDataURL("image/jpeg", 0.9);

    const pdfWidth = 210;
    const pdfHeight = 297;

    const imgWidth = pdfWidth;

    const imgHeight =
      (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;

    let position = 0;

    pdf.addImage(
      imgData,
      "JPEG",
      0,
      position,
      imgWidth,
      imgHeight
    );

    heightLeft -= pdfHeight;

    while (heightLeft > 0) {

      position = heightLeft - imgHeight;

      pdf.addPage();

      pdf.addImage(
        imgData,
        "JPEG",
        0,
        position,
        imgWidth,
        imgHeight
      );

      heightLeft -= pdfHeight;
    }

    pdf.save(`Hotel-Voucher-${data.ref_no}.pdf`);

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
          className="btn btn-dark btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          ← Back
        </button>

        <input
          className="form-control form-control-sm w-25"
          placeholder="PKG-00001 / HOT-00001"
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

      const pdf = new jsPDF("p", "mm", "a4");

const canvas = await html2canvas(voucherRef.current, {
  scale: 3,
  useCORS: true,
  backgroundColor: "#ffffff",

  ignoreElements: (el) =>
    el.tagName === "CANVAS",

  onclone: (doc) => {
    doc.querySelectorAll("*").forEach((el) => {
      const bg = el.style.backgroundImage;

      if (
        bg &&
        bg.includes("gradient")
      ) {
        el.style.backgroundImage = "none";
      }
    });
  },
});

      const imgData =
        canvas.toDataURL("image/jpeg", 0.9);

      const pdfWidth = 210;
      const pdfHeight = 297;

      const imgWidth = pdfWidth;

      const imgHeight =
        (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(
        imgData,
        "JPEG",
        0,
        position,
        imgWidth,
        imgHeight
      );

      heightLeft -= pdfHeight;

      while (heightLeft > 0) {

        position = heightLeft - imgHeight;

        pdf.addPage();

        pdf.addImage(
          imgData,
          "JPEG",
          0,
          position,
          imgWidth,
          imgHeight
        );

        heightLeft -= pdfHeight;
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


      {/* ================= VOUCHER ================= */}
      {data && (
        <div
          id="print-area"
          ref={voucherRef}
          style={{
            maxWidth: "820px",
            margin: "0 auto",
            background: "#fff",
            border: "3px solid #0d6efd",
            borderRadius: "12px",
            padding: "12px",
            fontSize: "12px",
          }}
        >
          {/* HEADER */}

            <Header title="HOTEL VOUCHER" />


          {/* INFO */}
          <div className="row mb-2 pdf-ref-row">
            <div className="col">
              <b>Ref No:</b> {data.ref_no}
            </div>
            <div className="col mb-2 pdf-date-row">
              <b>Date:</b> {showDate(data.booking_date)}
            </div>
          </div>

          {/* AGENT NAME */}
          <div className="mb-2 pdf-agent">
            <label className="fw-bold">Agent Name</label>
            <input
              type="text"
              className="form-control form-control-sm fw-bold"
              value={data.agent_name}
              onChange={(e) =>
                setData({ ...data, agent_name: e.target.value })
              }
              placeholder="Enter Agent Name"
            />
          </div>

          <div className="mb-2 pdf-customer">
            <b>Customer Name:</b> {data.customer_name}
          </div>

{data.hotels.map((h, i) => (
<div
  key={i}
  className="pdf-hotel-block mb-2 p-2 bg-light rounded"
  style={{
    fontSize: "12px",
    lineHeight: "1.2",
  }}
>
    {/* Heading inside the hotel block */}
<h6
  className="bg-primary text-white rounded mb-2"
  style={{
    padding: "4px 8px",
    fontSize: "13px",
  }}
>
      {i + 1 } 🏨 Hotel Details
    </h6>

    {/* Hotel details */}
    <label className="fw-bold">Confirm No</label>
    <input
      className="form-control form-control-sm mb-2 fw-bold"
style={{
  padding: "2px 6px",
  fontSize: "12px",
  minHeight: "28px",
}}
      placeholder=""
      value={h.confirmNo}
      onChange={(e) => handleHotelChange(i, "confirmNo", e.target.value)}
    />
    <b>🏨 Hotel:</b> {h.hotel}
    <br />
    <b>📍 Address:</b> {h.location}

    <div className="row mt-1">
      <div className="col">
        <b>🚪 Room:</b> {h.room}
      </div>
      <div className="col">
        <b>🛏️ Room Type:</b> {h.room_type}
      </div>
    </div>

    <div className="row mt-1">
<div
  className="col bg-warning"
  style={{ padding: "4px" }}
>
        <b>Check-In:</b> {showDate(h.checkIn)}
      </div>
<div
  className="col bg-success text-white"
  style={{ padding: "4px" }}
>
        <b>Check-Out:</b> {showDate(h.checkOut)}
      </div>
      <div className="col">
        <b>Nights:</b> {h.nights}
      </div>
    </div>

    <div className="row mt-1">
      <div className="col">
        <label className="fw-bold">CONTACT 1</label>
        <input
          className="form-control form-control-sm fw-bold"
style={{
  padding: "2px 6px",
  fontSize: "12px",
  minHeight: "28px",
}}
          placeholder=""
          value={h.contact1}
          onChange={(e) => handleHotelChange(i, "contact1", e.target.value)}
        />
      </div>
      <div className="col">
        <label className="fw-bold">CONTACT 2</label>
        <input
          className="form-control form-control-sm fw-bold"
style={{
  padding: "2px 6px",
  fontSize: "12px",
  minHeight: "28px",
}}
          placeholder=""
          value={h.contact2}
          onChange={(e) => handleHotelChange(i, "contact2", e.target.value)}
        />
      </div>
    </div>
  </div>
))}





          {/* CHECK IN / OUT TIME */}
          <div
            className="mt-3 p-2 text-center fw-bold pdf-timing"
            style={{
              background: "#e7f1ff",
              border: "1px dashed #0d6efd",
              borderRadius: "8px",
              color: "#0d6efd",
            }}
          >
            ⏰ CHECK IN TIME: 04:00 PM &nbsp; | &nbsp; CHECK OUT TIME: 02:00 PM
          </div>

          {/* FOOTER */}
<div className="text-center small mt-3 pdf-footer" style={{ color: "#555" }}>
  Please check your hotel details carefully.
  <br />
  This voucher is valid only for the mentioned booking.
</div>

<style>{`
@media print {

  body * {
    visibility: hidden;
  }

  #print-area,
  #print-area * {
    visibility: visible;
  }

  #print-area {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    background: white;
    padding: 10px;
  }

  .top-buttons {
    display: none !important;
  }

  .pdf-hotel-block {
    page-break-inside: avoid;
  }

  @page {
    size: A4;
    margin: 10mm;
  }
}
`}</style>


        </div>
      )}
    </div>
  );
}
