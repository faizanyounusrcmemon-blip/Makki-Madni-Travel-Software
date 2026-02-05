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

  /* ================= LOAD VOUCHER (PKG + HOT) ================= */
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

      if (isPkg) {
        hotelsData = (d.hotels || []).map((h) => ({
          ...h,
          confirmNo: "",
          contact1: "",
          contact2: "",
        }));

        setData({
          ref_no: d.ref_no,
          customer_name: d.customer_name,
          booking_date: d.booking_date,
          agent_name: "",
          hotels: hotelsData,
        });
      } else {
        hotelsData = (d.row.hotels || []).map((h) => ({
          ...h,
          confirmNo: "",
          contact1: "",
          contact2: "",
        }));

        setData({
          ref_no: d.row.ref_no,
          customer_name: d.row.customer_name,
          booking_date: d.row.booking_date,
          agent_name: d.row.agent_name || "",
          hotels: hotelsData,
        });
      }
    } catch (err) {
      console.error("LOAD VOUCHER ERROR:", err);
      alert("Failed to load voucher");
    }
  };

  /* ================= EXPORT PDF ================= */
  const exportPDF = async () => {
    const canvas = await html2canvas(voucherRef.current, {
      scale: 2,
      backgroundColor: "#ffffff",
    });

    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save(`Hotel-Voucher-${data.ref_no}.pdf`);
  };

  const handleHotelChange = (index, field, value) => {
    const updatedHotels = [...data.hotels];
    updatedHotels[index][field] = value;
    setData({ ...data, hotels: updatedHotels });
  };

  return (
    <div className="container py-3" style={{ fontFamily: "'Poppins', sans-serif" }}>
      {/* TOP BAR */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button
          className="btn btn-dark btn-sm shadow-sm"
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

        <button className="btn btn-primary btn-sm shadow-sm" onClick={loadVoucher}>
          Load Voucher
        </button>

        {data && (
          <button className="btn btn-success btn-sm shadow-sm" onClick={exportPDF}>
            📄 Download PDF
          </button>
        )}
      </div>

      {/* ================= VOUCHER ================= */}
      {data && (
        <div
          ref={voucherRef}
          style={{
            maxWidth: "850px",
            margin: "0 auto",
            background: "linear-gradient(to bottom, #fff7e6, #e0f7fa)",
            borderRadius: "15px",
            padding: "25px",
            boxShadow: "0 8px 25px rgba(0,0,0,0.1)",
            border: "3px solid #4dabf7",
          }}
        >
          {/* HEADER */}
          <div className="text-center mb-4">
            <h2 style={{ color: "#1971c2", fontWeight: "bold" }}>
              ✈️ MAKKI MADNI TRAVEL
            </h2>

            <div className="small mb-2" style={{ color: "#495057" }}>
              <strong>Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid</strong>
              <br />
              Garden West Karachi
              <br />
              ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
            </div>

            <div
              style={{
                background: "linear-gradient(to right, #ffd6a5, #ffd6a5 50%, #74c0fc 50%, #74c0fc)",
                height: "5px",
                borderRadius: "5px",
                margin: "10px 0",
              }}
            ></div>

            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                color: "#d6336c",
                letterSpacing: "1px",
              }}
            >
              HOTEL VOUCHER
            </div>
          </div>

          {/* BASIC INFO */}
          <div className="row mb-3">
            <div className="col">
              <b style={{ color: "#0b7285" }}>Ref No:</b> {data.ref_no}
            </div>
            <div className="col text-end">
              <b style={{ color: "#0b7285" }}>Booking Date:</b> {showDate(data.booking_date)}
            </div>
          </div>

          {/* AGENT NAME */}
          <div className="mb-3">
            <b>Agent Name:</b> {data.agent_name || "—"}
          </div>

          {/* HOTEL DETAILS */}
          <h5
            style={{
              background: "linear-gradient(90deg,#74c0fc,#f783ac)",
              color: "white",
              padding: "10px",
              borderRadius: "8px",
              marginBottom: "10px",
            }}
          >
            🏨 Hotel Details
          </h5>

          {data.hotels.length === 0 && (
            <div className="text-muted">No hotel service in this booking</div>
          )}

          {data.hotels.map((h, i) => (
            <div
              key={i}
              className="border rounded p-3 mb-3"
              style={{
                background: "linear-gradient(135deg,#ffe066,#fab005)",
                boxShadow: "0 4px 15px rgba(0,0,0,0.1)",
              }}
            >
              <div className="row mb-2">
                <div className="col">
                  <b>Hotel:</b> {h.hotel}
                </div>
                <div className="col">
                  <b>Address:</b> {h.location}
                </div>
              </div>

              <div className="row mb-2 g-2">
                <div className="col">
                  <label className="fw-bold">Confirmation No</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={h.confirmNo}
                    onChange={(e) => handleHotelChange(i, "confirmNo", e.target.value)}
                    placeholder="Enter Confirmation No"
                  />
                </div>
                <div className="col">
                  <label className="fw-bold">Contact No 1</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={h.contact1}
                    onChange={(e) => handleHotelChange(i, "contact1", e.target.value)}
                    placeholder="Enter Contact No 1"
                  />
                </div>
                <div className="col">
                  <label className="fw-bold">Contact No 2</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={h.contact2}
                    onChange={(e) => handleHotelChange(i, "contact2", e.target.value)}
                    placeholder="Enter Contact No 2"
                  />
                </div>
              </div>

              <div className="row g-2">
                <div
                  className="col"
                  style={{
                    backgroundColor: "#ffd8a8",
                    padding: "5px",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <b>Check-in:</b> {showDate(h.checkIn)}
                </div>
                <div
                  className="col"
                  style={{
                    backgroundColor: "#90ee90",
                    padding: "5px",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <b>Check-out:</b> {showDate(h.checkOut)}
                </div>
                <div
                  className="col"
                  style={{
                    backgroundColor: "#ffb3b3",
                    padding: "5px",
                    borderRadius: "4px",
                    textAlign: "center",
                  }}
                >
                  <b>Nights:</b> {h.nights}
                </div>
              </div>
            </div>
          ))}

          <div
            className="mt-3 p-2 text-center fw-bold"
            style={{
              background: "linear-gradient(to right,#74c0fc,#fab005)",
              borderRadius: "10px",
              color: "#fff",
              fontSize: "16px",
              boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
            }}
          >
            CHECK IN TIME: 04:00 PM &nbsp; | &nbsp; CHECK OUT TIME: 02:00 PM
          </div>

          <div className="text-center small mt-3" style={{ color: "#495057" }}>
            Please check your hotel details carefully.
            <br />
            This voucher is valid only for the mentioned booking.
          </div>
        </div>
      )}
    </div>
  );
}
