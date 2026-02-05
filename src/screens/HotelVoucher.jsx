import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

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

  const exportPDF = async () => {
    const canvas = await html2canvas(voucherRef.current, { scale: 2 });
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
    <div
      className="container py-3"
      style={{
        fontFamily: "'Inter', sans-serif",
        background: "#f8f9fa",
      }}
    >
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

      {data && (
        <div
          ref={voucherRef}
          style={{
            maxWidth: "850px",
            margin: "0 auto",
            background: "#ffffff",
            borderRadius: "16px",
            padding: "30px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
            borderTop: "6px solid #0d6efd",
          }}
        >
          {/* HEADER */}
          <div className="text-center mb-4">
            <h2 style={{ color: "#0d6efd", fontWeight: "700", letterSpacing: "1px" }}>
              ✈️ MAKKI MADNI TRAVEL
            </h2>
            <div className="small mb-2" style={{ color: "#6c757d" }}>
              Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid
              <br />
              Garden West Karachi
              <br />
              ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
            </div>
            <hr style={{ borderTop: "3px solid #0d6efd", width: "50px", margin: "10px auto" }} />
            <div
              style={{
                fontSize: "18px",
                fontWeight: "600",
                color: "#198754",
                letterSpacing: "1px",
              }}
            >
              HOTEL VOUCHER
            </div>
          </div>

          {/* BASIC INFO */}
          <div className="row mb-3">
            <div className="col">
              <b>Ref No:</b> {data.ref_no}
            </div>
            <div className="col text-end">
              <b>Booking Date:</b> {showDate(data.booking_date)}
            </div>
          </div>

          <div className="mb-3">
            <b>Agent Name:</b> {data.agent_name || "—"}
          </div>

          {/* HOTEL DETAILS */}
          <h5
            style={{
              backgroundColor: "#0d6efd",
              color: "white",
              padding: "10px 15px",
              borderRadius: "10px",
              marginBottom: "12px",
              fontWeight: "600",
            }}
          >
            🏨 Hotel Details
          </h5>

          {data.hotels.map((h, i) => (
            <div
              key={i}
              className="mb-3 p-3"
              style={{
                background: "#f1f3f5",
                borderRadius: "12px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                borderLeft: "5px solid #0d6efd",
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
                {["confirmNo", "contact1", "contact2"].map((f, idx) => (
                  <div className="col" key={idx}>
                    <label className="fw-bold">
                      {f === "confirmNo"
                        ? "Confirmation No"
                        : f === "contact1"
                        ? "Contact 1"
                        : "Contact 2"}
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={h[f]}
                      onChange={(e) => handleHotelChange(i, f, e.target.value)}
                      placeholder={`Enter ${f}`}
                    />
                  </div>
                ))}
              </div>

              <div className="row g-2 mt-2">
                <div
                  className="col text-center p-2"
                  style={{
                    background: "#cfe2ff",
                    borderRadius: "8px",
                    fontWeight: "500",
                  }}
                >
                  Check-in: {showDate(h.checkIn)}
                </div>
                <div
                  className="col text-center p-2"
                  style={{
                    background: "#d1e7dd",
                    borderRadius: "8px",
                    fontWeight: "500",
                  }}
                >
                  Check-out: {showDate(h.checkOut)}
                </div>
                <div
                  className="col text-center p-2"
                  style={{
                    background: "#fff3cd",
                    borderRadius: "8px",
                    fontWeight: "500",
                  }}
                >
                  Nights: {h.nights}
                </div>
              </div>
            </div>
          ))}

          <div
            className="mt-3 p-3 text-center fw-bold"
            style={{
              backgroundColor: "#0d6efd",
              borderRadius: "10px",
              color: "#fff",
            }}
          >
            CHECK IN TIME: 04:00 PM &nbsp; | &nbsp; CHECK OUT TIME: 02:00 PM
          </div>

          <div
            className="text-center small mt-3"
            style={{ color: "#6c757d", fontStyle: "italic" }}
          >
            Please check your hotel details carefully.
            <br />
            This voucher is valid only for the mentioned booking.
          </div>
        </div>
      )}
    </div>
  );
}
