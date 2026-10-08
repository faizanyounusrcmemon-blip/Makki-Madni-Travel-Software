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

export default function HotelVoucher3in1({ onNavigate }) {
  const [ref, setRef] = useState("");
  const [data, setData] = useState(null);
  const voucherRef = useRef(null);

  // Handle Hotel Inputs
  const handleHotelChange = (index, field, value) => {
    setData((prevData) => {
      const updatedHotels = [...prevData.hotels];
      updatedHotels[index] = {
        ...updatedHotels[index],
        [field]: value,
      };
      return { ...prevData, hotels: updatedHotels };
    });
  };

  /* ================= LOAD VOUCHER ================= */
  const loadVoucher = async () => {
    try {
      let url = "";
      let isPkg = false;

      const upperRef = ref.trim().toUpperCase();

      if (!upperRef) {
        return Swal.fire({
          width: "300px",
          icon: "warning",
          text: "Please enter Ref No",
        });
      }

      if (upperRef.startsWith("PKG-")) {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/bookings/voucher/${upperRef}`;
        isPkg = true;
      } else if (upperRef.startsWith("HOT-")) {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/hotels/get/${upperRef}`;
      } else {
        return Swal.fire({
          width: "300px",
          icon: "error",
          text: "Invalid Ref No",
        });
      }

      Swal.fire({
        width: "260px",
        title: "Loading Voucher...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await fetch(url);
      const d = await res.json();
      Swal.close();

      if (!d.success) {
        return Swal.fire({
          width: "300px",
          icon: "error",
          text: "Voucher not found",
        });
      }

      const row = isPkg ? d : d.row;
      const rawHotels = row.hotels;

      setData({
        ref_no: row.ref_no,
        customer_name: row.customer_name,
        sub_customer_name: row.sub_customer_name || "",
        agent_name: row.agent_name || "",
        booking_date: row.booking_date,
        hotels: (rawHotels || []).map(normalizeHotel),
      });

      Swal.fire({
        width: "280px",
        icon: "success",
        text: "Voucher Loaded Successfully 😎",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (e) {
      Swal.close();
      Swal.fire({
        width: "300px",
        icon: "error",
        text: "Failed to load voucher",
      });
    }
  };

  /* ================= PDF GENERATOR (3 HOTELS PER PAGE) ================= */
  const generatePdfInstance = async () => {
    if (!voucherRef.current || !data) return null;

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = 210;
    const margin = 8;
    const usableWidth = pageWidth - margin * 2;

    const renderElementToImage = async (el) => {
      if (!el) return null;
      const canvas = await html2canvas(el, {
        scale: 2.5,
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          // Convert input elements to span text for accurate canvas rendering
          const inputs = clonedDoc.querySelectorAll("input");
          inputs.forEach((input) => {
            const span = clonedDoc.createElement("span");
            span.innerText = input.value || "";
            span.className = input.className;
            span.style.cssText = window.getComputedStyle(input).cssText;
            span.style.display = "inline-block";
            if (input.parentNode) {
              input.parentNode.replaceChild(span, input);
            }
          });
        },
      });
      return {
        img: canvas.toDataURL("image/png"),
        height: (canvas.height * usableWidth) / canvas.width,
      };
    };

    const header = await renderElementToImage(voucherRef.current.querySelector(".pdf-header"));
    const refRow = await renderElementToImage(voucherRef.current.querySelector(".pdf-ref-row"));
    const namesRow = await renderElementToImage(voucherRef.current.querySelector(".pdf-names-row"));
    const timing = await renderElementToImage(voucherRef.current.querySelector(".pdf-timing"));
    const footer = await renderElementToImage(voucherRef.current.querySelector(".pdf-footer"));

    const hotelElements = Array.from(voucherRef.current.querySelectorAll(".pdf-hotel-block"));
    const hotelBlocks = [];
    for (let h of hotelElements) {
      hotelBlocks.push(await renderElementToImage(h));
    }

    // Process exactly 3 hotels per page
    for (let i = 0; i < hotelBlocks.length; i += 3) {
      if (i > 0) pdf.addPage();
      let y = margin;

      // Add Header & Details on each page
      if (header) { pdf.addImage(header.img, "PNG", margin, y, usableWidth, header.height); y += header.height + 2; }
      if (refRow) { pdf.addImage(refRow.img, "PNG", margin, y, usableWidth, refRow.height); y += refRow.height + 2; }
      if (namesRow) { pdf.addImage(namesRow.img, "PNG", margin, y, usableWidth, namesRow.height); y += namesRow.height + 2; }

      // Add Hotel 1, 2, and 3 for the current page
      for (let k = 0; k < 3; k++) {
        if (hotelBlocks[i + k]) {
          pdf.addImage(hotelBlocks[i + k].img, "PNG", margin, y, usableWidth, hotelBlocks[i + k].height);
          y += hotelBlocks[i + k].height + 2;
        }
      }

      // Add Timing & Footer at the bottom of the page
      if (timing) { pdf.addImage(timing.img, "PNG", margin, y, usableWidth, timing.height); y += timing.height + 2; }
      if (footer) { pdf.addImage(footer.img, "PNG", margin, y, usableWidth, footer.height); }
    }

    return pdf;
  };

  /* ================= EXPORT PDF ================= */
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

      const pdf = await generatePdfInstance();
      if (pdf) {
        pdf.save(`Hotel-Voucher-${data.ref_no}.pdf`);
        Swal.close();
        Swal.fire({
          width: "280px",
          icon: "success",
          text: "PDF Downloaded Successfully 😎",
        });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({
        width: "300px",
        icon: "error",
        text: "PDF Generation Failed",
      });
    }
  };

  /* ================= DIRECT PRINT (NO POPUP BLOCK) ================= */
  const handlePrint = async () => {
    if (!voucherRef.current || !data) return;

    Swal.fire({
      title: "Preparing Print Layout...",
      text: "Please wait a moment.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const pdf = await generatePdfInstance();
      if (pdf) {
        const blobUrl = pdf.output("bloburl");
        
        // Create hidden iframe for direct printing
        const printIframe = document.createElement("iframe");
        printIframe.style.position = "fixed";
        printIframe.style.right = "0";
        printIframe.style.bottom = "0";
        printIframe.style.width = "0";
        printIframe.style.height = "0";
        printIframe.style.border = "0";
        printIframe.src = blobUrl;

        document.body.appendChild(printIframe);

        printIframe.onload = () => {
          Swal.close();
          setTimeout(() => {
            printIframe.contentWindow.focus();
            printIframe.contentWindow.print();
          }, 300);
        };
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Print Failed",
        text: "Could not generate print view.",
        confirmButtonColor: "#dc3545",
      });
    }
  };

  return (
    <div className="container py-2">
      {/* TOP BAR */}
      <div className="d-flex gap-2 mb-2 flex-wrap align-items-center">
        <button
          className="btn btn-dark btn-sm fw-bold"
          onClick={() => onNavigate("dashboard")}
        >
          ← Back
        </button>

        <input
          className="form-control form-control-sm w-25 fw-bold"
          placeholder="PKG-00001 / HOT-00001"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
        />

        <button className="btn btn-primary btn-sm fw-bold" onClick={loadVoucher}>
          Load Voucher
        </button>

        {data && (
          <>
            <button
              className="btn btn-success btn-sm fw-bold"
              onClick={exportPDF}
            >
              📄 Download PDF
            </button>

            <button
              className="btn btn-secondary btn-sm fw-bold"
              onClick={handlePrint}
            >
              🖨️ Print
            </button>

            {/* SUB CUSTOMER NAME */}
            <div
              className="ms-auto fw-bold"
              style={{
                color: "#0b3d91",
                fontSize: "13px",
                whiteSpace: "nowrap",
                padding: "4px 10px",
                border: "1px solid #d4af37",
                borderRadius: "6px",
                background: "#fffdf5",
              }}
            >
              SUB CUSTOMER:{" "}
              <span style={{ color: "#b8860b" }}>
                {data.sub_customer_name || "N/A"}
              </span>
            </div>
          </>
        )}
      </div>

      {/* ================= VOUCHER CONTAINER ================= */}
      {data && (
        <div
          ref={voucherRef}
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            background: "#fff",
            border: "2px solid #0d6efd",
            borderRadius: "6px",
            padding: "12px 16px",
            fontSize: "11px",
            boxSizing: "border-box",
          }}
        >
          {/* HEADER */}
          <div className="pdf-header mb-1">
            <Header title="HOTEL VOUCHER" />
          </div>

          {/* INFO */}
          <div className="row mb-1 pdf-ref-row fs-6">
            <div className="col fw-bold" style={{ fontSize: "12px" }}>
              <b>Ref No:</b> {data.ref_no}
            </div>
            <div className="col text-end pdf-date-row fw-bold" style={{ fontSize: "12px" }}>
              <b>Date:</b> {showDate(data.booking_date)}
            </div>
          </div>

          {/* CUSTOMER & AGENT ROW */}
          <div className="row mb-2 pdf-names-row">
            <div className="col">
              <label className="fw-bold mb-0" style={{ fontSize: "11px" }}>Customer Name</label>
              <input
                type="text"
                className="form-control form-control-sm fw-bold"
                style={{ padding: "2px 6px", fontSize: "11px", height: "26px" }}
                value={data.customer_name || ""}
                onChange={(e) =>
                  setData({ ...data, customer_name: e.target.value })
                }
                placeholder="Enter Customer Name"
              />
            </div>
            <div className="col">
              <label className="fw-bold mb-0" style={{ fontSize: "11px" }}>Agent Name</label>
              <input
                type="text"
                className="form-control form-control-sm fw-bold"
                style={{ padding: "2px 6px", fontSize: "11px", height: "26px" }}
                value={data.agent_name}
                onChange={(e) =>
                  setData({ ...data, agent_name: e.target.value })
                }
                placeholder="Enter Agent Name"
              />
            </div>
          </div>

          {/* HOTELS LIST */}
          {data.hotels.map((h, i) => (
            <div
              key={i}
              className="pdf-hotel-block mb-2 p-2 bg-light rounded border fw-bold"
              style={{
                fontSize: "11px",
                lineHeight: "1.25",
              }}
            >
              {/* BLUE HEADER */}
              <h6
                className="bg-primary text-white rounded mb-1 d-flex align-items-center fw-bold"
                style={{
                  padding: "3px 8px",
                  fontSize: "12px",
                  margin: 0,
                }}
              >
                {i + 1} 🏨 Hotel Details
              </h6>

              {/* HOTEL NAME & CONFIRM NO */}
              <div
                className="mb-1 px-2 py-1 rounded fw-bold d-flex align-items-center justify-content-between"
                style={{
                  backgroundColor: "#1a2530",
                  color: "#ffc107",
                  fontSize: "12px",
                }}
              >
                <div className="d-flex align-items-center me-2">
                  🏨 Hotel: &nbsp;<span className="text-uppercase fw-bold">{h.hotel}</span>
                </div>

                <div className="d-flex align-items-center" style={{ minWidth: "200px" }}>
                  <span className="text-white me-1 text-nowrap" style={{ fontSize: "10px" }}>
                    CONFIRM NO:
                  </span>
                  <input
                    className="form-control form-control-sm fw-bold text-uppercase"
                    style={{
                      padding: "1px 4px",
                      fontSize: "10px",
                      height: "22px",
                      color: "#000",
                      backgroundColor: "#fff",
                      border: "1px solid #ffc107"
                    }}
                    placeholder="Enter Confirm No"
                    value={h.confirmNo}
                    onChange={(e) =>
                      handleHotelChange(i, "confirmNo", e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="mb-1 fw-bold">
                <b>📍 Address:</b> {h.location}
              </div>

              <div className="row my-1 fw-bold">
                <div className="col">
                  <b>🚪 Room:</b> {h.room}
                </div>
                <div className="col">
                  <b>🛏️ Room Type:</b> {h.room_type}
                </div>
              </div>

              <div className="row my-1 align-items-center fw-bold">
                <div
                  className="col bg-warning text-dark fw-bold rounded me-1 p-1 text-center"
                  style={{ fontSize: "10px" }}
                >
                  Check-In: {showDate(h.checkIn)}
                </div>
                <div
                  className="col bg-success text-white fw-bold rounded me-1 p-1 text-center"
                  style={{ fontSize: "10px" }}
                >
                  Check-Out: {showDate(h.checkOut)}
                </div>
                <div className="col fw-bold ps-2" style={{ fontSize: "11px" }}>
                  Nights: {h.nights}
                </div>
              </div>

              <div className="row mt-1">
                <div className="col">
                  <label className="fw-bold mb-0" style={{ fontSize: "10px" }}>CONTACT 1</label>
                  <input
                    className="form-control form-control-sm fw-bold"
                    style={{
                      padding: "1px 4px",
                      fontSize: "10px",
                      height: "24px",
                    }}
                    placeholder="Enter Contact 1"
                    value={h.contact1}
                    onChange={(e) =>
                      handleHotelChange(i, "contact1", e.target.value)
                    }
                  />
                </div>
                <div className="col">
                  <label className="fw-bold mb-0" style={{ fontSize: "10px" }}>CONTACT 2</label>
                  <input
                    className="form-control form-control-sm fw-bold"
                    style={{
                      padding: "1px 4px",
                      fontSize: "10px",
                      height: "24px",
                    }}
                    placeholder="Enter Contact 2"
                    value={h.contact2}
                    onChange={(e) =>
                      handleHotelChange(i, "contact2", e.target.value)
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          {/* CHECK IN / OUT TIME */}
          <div
            className="mt-1 p-1 text-center fw-bold pdf-timing"
            style={{
              background: "#e7f1ff",
              border: "1px dashed #0d6efd",
              borderRadius: "6px",
              color: "#0d6efd",
              fontSize: "10px",
            }}
          >
            ⏰ CHECK IN TIME: 04:00 PM &nbsp; | &nbsp; CHECK OUT TIME: 02:00 PM
          </div>

          {/* FOOTER */}
          <div
            className="text-center mt-1 pdf-footer fw-bold"
            style={{ color: "#555", fontSize: "9px" }}
          >
            Please check your hotel details carefully. <br />
            This voucher is valid only for the mentioned booking.
          </div>
        </div>
      )}
    </div>
  );
}
