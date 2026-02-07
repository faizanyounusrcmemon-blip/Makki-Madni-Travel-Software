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

      if (ref.startsWith("PKG-")) {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/bookings/voucher/${ref}`;
        isPkg = true;
      } else if (ref.startsWith("HOT-")) {
        url = `${import.meta.env.VITE_BACKEND_URL}/api/hotels/get/${ref}`;
      } else {
        return alert("Invalid Ref No");
      }

      const res = await fetch(url);
      const d = await res.json();
      if (!d.success) return alert("Voucher not found");

      const rawHotels = isPkg ? d.hotels : d.row.hotels;

      setData({
        ref_no: isPkg ? d.ref_no : d.row.ref_no,
        customer_name: isPkg ? d.customer_name : d.row.customer_name,

        // ✅ FIXED HERE (PKG + HOTEL dono safe)
        agent_name: isPkg
          ? d.agent_name || ""
          : d.row.agent_name || "",

        booking_date: isPkg ? d.booking_date : d.row.booking_date,
        hotels: (rawHotels || []).map(normalizeHotel),
      });
    } catch (e) {
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
            background: "#fff",
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

            <div className="text-center small mb-3" style={{ color: "#444" }}>
              Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid
              <br />
              Garden West Karachi
              <br />
              ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
            </div>

            <hr />
            <div className="fw-bold">HOTEL VOUCHER</div>
          </div>
          {/* INFO */}
          <div className="row mb-2">
            <div className="col">
              <b>Ref No:</b> {data.ref_no}
            </div>
            <div className="col text-end">
              <b>Date:</b> {showDate(data.booking_date)}
            </div>
          </div>

          {/* AGENT NAME (Editable) */}
          <div className="mb-2">
            <label className="fw-bold">Agent Name</label>
            <input
              type="text"
              className="form-control form-control-sm"
              value={data.agent_name}
              onChange={(e) =>
                setData({ ...data, agent_name: e.target.value })
              }
              placeholder="Enter Agent Name"
            />
          </div>
          
          <div className="mb-2">
            <b>Customer Name:</b> {data.customer_name}
          </div>

          {/* HOTEL DETAILS */}
          <h6 className="bg-primary text-white p-2 rounded">
            🏨 Hotel Details
          </h6>

          {/* HOTELS */}
          {data.hotels.map((h, i) => (
            <div key={i} className="border p-2 mb-2 rounded">
              <label className="fw-bold">Confirm No</label>
              <input
                className="form-control form-control-sm mb-2"
                placeholder="Confirmation No"
                value={h.confirmNo}
                onChange={(e) =>
                  handleHotelChange(i, "confirmNo", e.target.value)
                }
              />

              <b>🏨 Hotel:</b> {h.hotel}
              <br />
              <b>📍 Address:</b> {h.location}

              <div className="row mt-2">
                <div className="col">
                  <b>Room:</b> {h.room}
                </div>
                <div className="col">
                  <b>Room Type:</b> {h.room_type}
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
                    className="form-control form-control-sm"
                    placeholder="Contact No 1"
                    value={h.contact1}
                    onChange={(e) =>
                      handleHotelChange(i, "contact1", e.target.value)
                    }
                  />
                </div>
                <div className="col">
                  <label className="fw-bold">CONTACT 2</label>
                  <input
                    className="form-control form-control-sm"
                    placeholder="Contact No 2"
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
            className="mt-3 p-2 text-center fw-bold"
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
          <div className="text-center small mt-3" style={{ color: "#555" }}>
            Please check your hotel details carefully.
            <br />
            This voucher is valid only for the mentioned booking.
          </div>
        </div>
      )}
    </div>
  );
}





