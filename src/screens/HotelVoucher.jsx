import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import Header from "../components/Header";
import Swal from "sweetalert2"; // ✅ SweetAlert Import Kiya

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
    const upperRef = ref.toUpperCase();

    if (!upperRef.startsWith("PKG-") && !upperRef.startsWith("HOT-")) {
      Swal.fire({
        icon: "warning",
        title: "Invalid Ref No",
        text: "Please enter a valid reference number starting with PKG- or HOT-.",
        confirmButtonColor: "#0d6efd",
      });
      return;
    }

    // Loader starting
    Swal.fire({
      title: "Fetching Voucher...",
      text: "Please wait while we load the data.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      let url = "";
      let isPkg = false;

      if (upperRef.startsWith("PKG-")) {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/bookings/voucher/${upperRef}`;
        isPkg = true;
      } else if (upperRef.startsWith("HOT-")) {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/hotels/get/${upperRef}`;
      }

      const res = await fetch(url);
      const d = await res.json();
      
      if (!d.success) {
        Swal.fire({
          icon: "error",
          title: "Not Found",
          text: "Voucher not found!",
          confirmButtonColor: "#0d6efd",
        });
        return;
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

      // Close loading alert on success
      Swal.close();
    } catch (e) {
      Swal.fire({
        icon: "error",
        title: "Failed",
        text: "Failed to load voucher from server.",
        confirmButtonColor: "#dc3545",
      });
    }
  };

  /* ================= PDF ================= */
  const exportPDF = async () => {
    if (!voucherRef.current || !data) return;

    // Show Loader for PDF Generation
    Swal.fire({
      title: "Generating PDF...",
      text: "Please wait while your PDF is being compiled.",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 10;
      const usableWidth = pageWidth - margin * 2;
      let y = margin;

      const addCanvas = async (el) => {
        if (!el) return;
        const canvas = await html2canvas(el, {
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
          },
        });

        const img = canvas.toDataURL("image/png");
        const height = (canvas.height * usableWidth) / canvas.width * 0.95;

        if (y + height > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }

        pdf.addImage(img, "PNG", margin, y, usableWidth, height);
        y += height + 4;
      };

      // HEADER, REF, AGENT, CUSTOMER
      await addCanvas(voucherRef.current.querySelector(".pdf-header"));
      await addCanvas(voucherRef.current.querySelector(".pdf-ref-row"));
      await addCanvas(voucherRef.current.querySelector(".pdf-agent"));
      await addCanvas(voucherRef.current.querySelector(".pdf-customer"));

      const hotels = voucherRef.current.querySelectorAll(".pdf-hotel-block");
      for (let h of hotels) {
        const canvasBlock = await html2canvas(h, { scale: 3 });
        const imgBlock = canvasBlock.toDataURL("image/png");
        const heightBlock = (canvasBlock.height * usableWidth) / canvasBlock.width * 0.95;

        if (y + heightBlock > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }

        pdf.addImage(imgBlock, "PNG", margin, y, usableWidth, heightBlock);
        y += heightBlock + 4;
      }

      // TIMING AND FOOTER
      await addCanvas(voucherRef.current.querySelector(".pdf-timing"));
      await addCanvas(voucherRef.current.querySelector(".pdf-footer"));

      pdf.save(`Hotel-Voucher-${data.ref_no}.pdf`);

      // Success Alert
      Swal.fire({
        icon: "success",
        title: "Downloaded!",
        text: "Your PDF has been downloaded successfully.",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "Something went wrong while generating the PDF.",
        confirmButtonColor: "#dc3545",
      });
    }
  };

  const handleHotelChange = (i, field, val) => {
    const hotels = [...data.hotels];
    hotels[i][field] = val;
    setData({ ...data, hotels });
  };

  return (
    <div className="container py-3">
      {/* TOP BAR */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
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
            <button className="btn btn-success btn-sm" onClick={exportPDF}>
              📄 Download PDF
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={async () => {
                if (!voucherRef.current || !data) return;

                // Show Print Processing Alert
                Swal.fire({
                  title: "Preparing Print Layout...",
                  text: "Please wait a moment.",
                  allowOutsideClick: false,
                  didOpen: () => {
                    Swal.showLoading();
                  },
                });

                try {
                  const pdf = new jsPDF("p", "mm", "a4");
                  const pageWidth = 210;
                  const pageHeight = 297;
                  const margin = 10;
                  const usableWidth = pageWidth - margin * 2;
                  let y = margin;

                  const addCanvas = async (el) => {
                    if (!el) return;

                    const canvas = await html2canvas(el, {
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
                      },
                    });

                    const img = canvas.toDataURL("image/png");
                    const height = (canvas.height * usableWidth) / canvas.width * 0.95;

                    if (y + height > pageHeight - margin) {
                      pdf.addPage();
                      y = margin;
                    }

                    pdf.addImage(img, "PNG", margin, y, usableWidth, height);
                    y += height + 4;
                  };

                  await addCanvas(voucherRef.current.querySelector(".pdf-header"));
                  await addCanvas(voucherRef.current.querySelector(".pdf-ref-row"));
                  await addCanvas(voucherRef.current.querySelector(".pdf-agent"));
                  await addCanvas(voucherRef.current.querySelector(".pdf-customer"));

                  const hotels = voucherRef.current.querySelectorAll(".pdf-hotel-block");
                  for (let h of hotels) {
                    const canvasBlock = await html2canvas(h, { scale: 3, useCORS: true });
                    const imgBlock = canvasBlock.toDataURL("image/png");
                    const heightBlock = (canvasBlock.height * usableWidth) / canvasBlock.width * 0.95;

                    if (y + heightBlock > pageHeight - margin) {
                      pdf.addPage();
                      y = margin;
                    }

                    pdf.addImage(imgBlock, "PNG", margin, y, usableWidth, heightBlock);
                    y += heightBlock + 4;
                  }

                  await addCanvas(voucherRef.current.querySelector(".pdf-timing"));
                  await addCanvas(voucherRef.current.querySelector(".pdf-footer"));

                  window.open(pdf.output("bloburl"), "_blank");
                  
                  // Close printing alert
                  Swal.close();
                } catch (err) {
                  Swal.fire({
                    icon: "error",
                    title: "Print Failed",
                    text: "Could not generate print view.",
                    confirmButtonColor: "#dc3545",
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
          ref={voucherRef}
          style={{
            maxWidth: "820px",
            margin: "0 auto",
            background: "#fff",
            border: "3px solid #0d6efd",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
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
            <div key={i} className="pdf-hotel-block mb-3 p-2 bg-light rounded">
              <h6 className="bg-primary text-white p-2 rounded mb-2">
                {i + 1} 🏨 Hotel Details
              </h6>

              <label className="fw-bold">Confirm No</label>
              <input
                className="form-control form-control-sm mb-2 fw-bold"
                placeholder=""
                value={h.confirmNo}
                onChange={(e) => handleHotelChange(i, "confirmNo", e.target.value)}
              />
              <b>🏨 Hotel:</b> {h.hotel}
              <br />
              <b>📍 Address:</b> {h.location}

              <div className="row mt-2">
                <div className="col">
                  <b>🚪 Room:</b> {h.room}
                </div>
                <div className="col">
                  <b>🛏️ Room Type:</b> {h.room_type}
                </div>
              </div>

              <div className="row mt-2">
                <div className="col bg-warning p-2">
                  <b>Check-In:</b> {showDate(h.checkIn)}
                </div>
                <div className="col bg-success text-white p-2">
                  <b>Check-Out:</b> {showDate(h.checkOut)}
                </div>
                <div className="col">
                  <b>Nights:</b> {h.nights}
                </div>
              </div>

              <div className="row mt-2">
                <div className="col">
                  <label className="fw-bold">CONTACT 1</label>
                  <input
                    className="form-control form-control-sm fw-bold"
                    placeholder=""
                    value={h.contact1}
                    onChange={(e) => handleHotelChange(i, "contact1", e.target.value)}
                  />
                </div>
                <div className="col">
                  <label className="fw-bold">CONTACT 2</label>
                  <input
                    className="form-control form-control-sm fw-bold"
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
        </div>
      )}
    </div>
  );
}