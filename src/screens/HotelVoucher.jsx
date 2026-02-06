import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ================= HELPERS ================= */
const showDate = (val) => {
  if (!val) return "";
  const d = new Date(val);
  const day = String(d.getDate()).padStart(2, "0");
  const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  return `${day}/${mon}/${year}`;
};

export default function HotelVoucher({ onNavigate }) {
  const [ref, setRef] = useState("");
  const [data, setData] = useState(null);
  const voucherRef = useRef(null);

  /* ================= LOAD VOUCHER ================= */
  const loadVoucher = async () => {
    try {
      let url = "";
      let isPkg = false;

      if (ref.startsWith("PKG-")) {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/bookings/voucher/${ref}`;
        isPkg = true;
      } else if (ref.startsWith("HOT-")) {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/hotels/get/${ref}`;
      } else {
        return alert("Invalid Ref No (PKG- / HOT-)");
      }

      const res = await fetch(url);
      const d = await res.json();
      if (!d.success) return alert("Voucher not found");

      let hotelsData = [];

      const srcHotels = isPkg ? d.hotels : d.row.hotels;

      hotelsData = (srcHotels || []).map((h) => ({
        ...h,
        confirmNo: "",
        contact1: "",
        contact2: "",
        room: h.room || h.room_name || "",
        roomType: h.roomType || h.room_type || "",
      }));

      setData({
        ref_no: isPkg ? d.ref_no : d.row.ref_no,
        customer_name: isPkg ? d.customer_name : d.row.customer_name,
        agent_name: isPkg ? "" : d.row.agent_name || "",
        booking_date: isPkg ? d.booking_date : d.row.booking_date,
        hotels: hotelsData,
      });
    } catch (err) {
      console.error(err);
      alert("Failed to load voucher");
    }
  };

  /* ================= PDF ================= */
  const exportPDF = async () => {
    const canvas = await html2canvas(voucherRef.current, {
      scale: 2,
      backgroundColor: "#fff",
    });

    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save(`Hotel-Voucher-${data.ref_no}.pdf`);
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
        <button className="btn btn-dark btn-sm" onClick={() => onNavigate("dashboard")}>
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
          <button className="btn btn-success btn-sm" onClick={exportPDF}>
            📄 Download PDF
          </button>
        )}
      </div>

      {/* ================= VOUCHER ================= */}
      {data && (
        <div
          ref={voucherRef}
          style={{
            maxWidth: "820px",
            margin: "0 auto",
            background: "linear-gradient(180deg,#ffffff,#eef6ff)",
            border: "3px solid #0d6efd",
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          {/* HEADER */}
          <div className="text-center mb-3">
            <h3 style={{ color: "#0d6efd", fontWeight: "bold" }}>
              ✈️ MAKKI MADNI TRAVEL
            </h3>
            <div className="small">
              Garden West Karachi<br />
              ☎️ 0335-7476744
            </div>
            <hr />
            <b>HOTEL VOUCHER</b>
          </div>

          {/* BASIC */}
          <div className="row mb-2">
            <div className="col"><b>Ref No:</b> {data.ref_no}</div>
            <div className="col text-end"><b>Booking Date:</b> {showDate(data.booking_date)}</div>
          </div>

          {/* AGENT */}
          <label className="fw-bold">Agent Name</label>
          <input
            className="form-control form-control-sm mb-2"
            value={data.agent_name}
            onChange={(e) => setData({ ...data, agent_name: e.target.value })}
          />

          <b>Customer Name:</b> {data.customer_name}

          {/* HOTELS */}
          {data.hotels.map((h, i) => (
            <div key={i} className="border rounded p-2 mt-3">
              <label className="fw-bold">Confirmation No</label>
              <input
                className="form-control form-control-sm mb-2"
                value={h.confirmNo}
                onChange={(e) => handleHotelChange(i, "confirmNo", e.target.value)}
              />

              <div className="row mb-2">
                <div className="col"><b>Hotel:</b> {h.hotel}</div>
                <div className="col"><b>Address:</b> {h.location}</div>
              </div>

              {/* ROOM INFO */}
              <div className="row mb-2">
                <div className="col">
                  <b>Room:</b> {h.room || "—"}
                </div>
                <div className="col">
                  <b>Room Type:</b> {h.roomType || "—"}
                </div>
              </div>

              {/* DATES */}
              <div className="row g-2 mb-2">
                <div className="col" style={{ background: "#f1c40f", padding: 6 }}>
                  <b>Check-in:</b> {showDate(h.checkIn)}
                </div>
                <div className="col" style={{ background: "#27ae60", color: "#fff", padding: 6 }}>
                  <b>Check-out:</b> {showDate(h.checkOut)}
                </div>
                <div className="col"><b>Nights:</b> {h.nights}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
