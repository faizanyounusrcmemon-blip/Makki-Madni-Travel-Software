import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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
  location: h.location || h.address || "—",
  room: h.room || "—",
  room_type: h.room_type || "—",
  checkIn: h.checkIn || h.check_in || null,
  checkOut: h.checkOut || h.check_out || null,
  nights: calcNights(h.checkIn || h.check_in, h.checkOut || h.check_out),
  confirmNo: "",
  contact1: "",
  contact2: "",
});

export default function HotelVoucher({ onNavigate }) {
  const [ref, setRef] = useState("");
  const [data, setData] = useState(null);
  const voucherRef = useRef(null);

  /* ================= LOAD ================= */
  const loadVoucher = async () => {
    try {
      let url = "";
      let isPkg = false;

      if (ref.startsWith("PKG-")) {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/bookings/voucher/${ref}`;
        isPkg = true;
      } else if (ref.startsWith("HOT-")) {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/hotels/get/${ref}`;
      } else return alert("Invalid Ref No");

      const res = await fetch(url);
      const d = await res.json();
      if (!d.success) return alert("Voucher not found");

      const rawHotels = isPkg ? d.hotels : d.row.hotels;

      setData({
        ref_no: isPkg ? d.ref_no : d.row.ref_no,
        customer_name: isPkg ? d.customer_name : d.row.customer_name,
        agent_name: d.row?.agent_name || "",
        booking_date: isPkg ? d.booking_date : d.row.booking_date,
        hotels: (rawHotels || []).map(normalizeHotel),
      });
    } catch {
      alert("Failed to load voucher");
    }
  };

  /* ================= PDF ================= */
  const exportPDF = async () => {
    const canvas = await html2canvas(voucherRef.current, { scale: 2 });
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
    <div className="container py-4">
      {/* TOP BAR */}
      <div className="card shadow-sm p-3 mb-4">
        <div className="d-flex gap-2 flex-wrap">
          <button className="btn btn-outline-dark btn-sm" onClick={() => onNavigate("dashboard")}>
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
            <button className="btn btn-success btn-sm ms-auto" onClick={exportPDF}>
              📄 Download PDF
            </button>
          )}
        </div>
      </div>

      {/* ================= VOUCHER ================= */}
      {data && (
        <div
          ref={voucherRef}
          style={{
            maxWidth: 820,
            margin: "auto",
            background: "linear-gradient(180deg,#ffffff,#f7f9fc)",
            borderRadius: 16,
            padding: 24,
            border: "3px solid #0d6efd",
            boxShadow: "0 10px 25px rgba(0,0,0,.1)",
          }}
        >
          {/* HEADER */}
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary">✈️ MAKKI MADNI TRAVEL</h2>
            <div className="small text-muted">
              Garden West Karachi<br />
              ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
            </div>
            <hr />
            <span className="badge bg-primary px-3 py-2">HOTEL VOUCHER</span>
          </div>

          {/* INFO */}
          <div className="row mb-3">
            <div className="col"><b>Ref No:</b> {data.ref_no}</div>
            <div className="col text-end"><b>Date:</b> {showDate(data.booking_date)}</div>
          </div>

          <input
            className="form-control form-control-sm mb-3"
            value={data.agent_name}
            placeholder="Agent Name"
            onChange={(e) => setData({ ...data, agent_name: e.target.value })}
          />

          <div className="alert alert-light border fw-bold">
            👤 Customer: {data.customer_name}
          </div>

          {/* HOTELS */}
          {data.hotels.map((h, i) => (
            <div key={i} className="card shadow-sm mb-3">
              <div className="card-body">
                <input
                  className="form-control form-control-sm mb-2"
                  placeholder="Confirmation No"
                  value={h.confirmNo}
                  onChange={(e) => handleHotelChange(i, "confirmNo", e.target.value)}
                />

                <h6 className="fw-bold text-primary">{h.hotel}</h6>
                <div className="small text-muted mb-2">{h.location}</div>

                <div className="row text-center mb-2">
                  <div className="col"><b>Room</b><br />{h.room}</div>
                  <div className="col"><b>Type</b><br />{h.room_type}</div>
                  <div className="col"><b>Nights</b><br />{h.nights}</div>
                </div>

                <div className="row text-center">
                  <div className="col p-2 rounded bg-warning">
                    <b>Check-In</b><br />{showDate(h.checkIn)}
                  </div>
                  <div className="col p-2 rounded bg-success text-white">
                    <b>Check-Out</b><br />{showDate(h.checkOut)}
                  </div>
                </div>

                <div className="row mt-3">
                  <div className="col">
                    <input
                      className="form-control form-control-sm"
                      placeholder="Contact No 1"
                      value={h.contact1}
                      onChange={(e) => handleHotelChange(i, "contact1", e.target.value)}
                    />
                  </div>
                  <div className="col">
                    <input
                      className="form-control form-control-sm"
                      placeholder="Contact No 2"
                      value={h.contact2}
                      onChange={(e) => handleHotelChange(i, "contact2", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="text-center fw-bold mt-4">
            ⏰ CHECK IN: 04:00 PM &nbsp; | &nbsp; CHECK OUT: 02:00 PM
          </div>

          <div className="text-center text-muted small mt-2">
            Please verify all details carefully.<br />
            Voucher valid only for mentioned booking.
          </div>
        </div>
      )}
    </div>
  );
}
