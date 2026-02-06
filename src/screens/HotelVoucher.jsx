import React, { useEffect, useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/* =========================
   HOTEL NORMALIZER (PKG + HOT)
========================= */
const normalizeHotel = (h = {}) => ({
  hotel: h.hotel || h.hotel_name || "",
  location: h.location || h.address || h.hotel_location || "—",
  rooms: h.rooms || h.room_qty || h.room || "—",
  type: h.type || h.room_type || h.type_name || "—",
  checkIn: h.checkIn || h.check_in || "04:00 PM",
  checkOut: h.checkOut || h.check_out || "02:00 PM",
});

/* =========================
   SAFE ARRAY
========================= */
const safeHotels = (arr) =>
  Array.isArray(arr) && arr.length ? arr.map(normalizeHotel) : [];

export default function HotelVoucher({ booking, isPkg }) {
  const [data, setData] = useState(null);
  const pdfRef = useRef();

  /* =========================
     LOAD DATA
  ========================= */
  useEffect(() => {
    if (!booking) return;

    if (isPkg) {
      setData({
        ref_no: booking.ref_no,
        customer_name: booking.customer_name,
        agent_name: booking.agent_name || "",
        booking_date: booking.booking_date,
        hotels: safeHotels(booking.hotels),
      });
    } else {
      setData({
        ref_no: booking.row.ref_no,
        customer_name: booking.row.customer_name,
        agent_name: booking.row.agent_name || "",
        booking_date: booking.row.booking_date,
        hotels: safeHotels(booking.row.hotels),
      });
    }
  }, [booking, isPkg]);

  /* =========================
     PDF
  ========================= */
  const downloadPDF = async () => {
    const canvas = await html2canvas(pdfRef.current, { scale: 2 });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    pdf.addImage(img, "PNG", 10, 10, 190, 0);
    pdf.save("hotel-voucher.pdf");
  };

  if (!data) return null;

  return (
    <div>
      <button className="btn btn-primary mb-3" onClick={downloadPDF}>
        Download PDF
      </button>

      <div
        ref={pdfRef}
        className="p-4"
        style={{ background: "#fff", fontFamily: "Arial" }}
      >
        {/* ================= HEADER ================= */}
        <div className="text-center mb-3">
          <h3 style={{ color: "#0d6efd", fontWeight: "bold" }}>
            ✈️ MAKKI MADNI TRAVEL
          </h3>

          <div className="small" style={{ color: "#444" }}>
            Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid
            <br />
            Garden West Karachi
            <br />
            ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
          </div>

          <hr />
          <div className="fw-bold">HOTEL VOUCHER</div>
        </div>

        {/* ================= BASIC INFO ================= */}
        <div className="mb-3">
          <b>Customer:</b> {data.customer_name}
          <br />
          <b>Agent:</b> {data.agent_name || "—"}
          <br />
          <b>Ref No:</b> {data.ref_no}
        </div>

        {/* ================= HOTELS ================= */}
        {data.hotels.map((h, i) => (
          <div
            key={i}
            className="border p-3 mb-3"
            style={{ borderRadius: "8px" }}
          >
            <div className="mb-2">
              <b>Hotel:</b> {h.hotel}
            </div>

            <div className="mb-2">
              <b>Address:</b> {h.location}
            </div>

            <div className="row mb-2">
              <div className="col">
                <b>Rooms:</b> {h.rooms}
              </div>
              <div className="col">
                <b>Room Type:</b> {h.type}
              </div>
            </div>

            {/* CHECK IN / OUT */}
            <div
              className="mt-3 p-2 text-center fw-bold"
              style={{
                background: "#e7f1ff",
                border: "1px dashed #0d6efd",
                borderRadius: "8px",
                color: "#0d6efd",
              }}
            >
              CHECK IN TIME: {h.checkIn} &nbsp; | &nbsp; CHECK OUT TIME:{" "}
              {h.checkOut}
            </div>
          </div>
        ))}

        {/* ================= FOOTER ================= */}
        <div className="text-center small mt-3" style={{ color: "#555" }}>
          Please check your hotel details carefully.
          <br />
          This voucher is valid only for the mentioned booking.
        </div>
      </div>
    </div>
  );
}
