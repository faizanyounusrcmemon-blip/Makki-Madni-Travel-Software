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
      style={{ fontFamily: "'Comic Neue', cursive", background: "#fef9f0" }}
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
            maxWidth: "900px",
            margin: "0 auto",
            background: "linear-gradient(135deg, #ffecd2, #fcb69f)",
            borderRadius: "20px",
            padding: "30px",
            boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
            border: "5px dashed #ff6b6b",
          }}
        >
          {/* HEADER */}
          <div className="text-center mb-4">
            <h1 style={{ color: "#ff6b6b", fontWeight: "bold" }}>✈️ MAKKI MADNI TRAVEL</h1>
            <div className="small mb-2" style={{ color: "#6c757d" }}>
              Shop #4 Diamond City Building, Near Zeenat-ul-Islam Masjid
              <br />
              Garden West Karachi
              <br />
              ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
            </div>
            <div
              style={{
                height: "6px",
                width: "100%",
                background:
                  "linear-gradient(90deg, #ffd6a5, #74c0fc, #ff8787, #ffd6a5)",
                borderRadius: "10px",
                margin: "10px 0",
              }}
            ></div>
            <div
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                color: "#ff8787",
                letterSpacing: "2px",
                textShadow: "1px 1px 3px #ffe066",
              }}
            >
              🏨 HOTEL VOUCHER
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
              background: "linear-gradient(90deg,#fcb69f,#ff6b6b)",
              color: "white",
              padding: "10px",
              borderRadius: "10px",
              marginBottom: "10px",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            }}
          >
            🏨 Hotel Details
          </h5>

          {data.hotels.map((h, i) => (
            <div
              key={i}
              className="mb-3 p-3"
              style={{
                background: "linear-gradient(135deg,#ffe066,#fab005)",
                borderRadius: "15px",
                boxShadow: "0 6px 15px rgba(0,0,0,0.1)",
                border: "3px solid #ff6b6b",
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
                    background: "#ffb3ba",
                    borderRadius: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Check-in: {showDate(h.checkIn)}
                </div>
                <div
                  className="col text-center p-2"
                  style={{
                    background: "#baffc9",
                    borderRadius: "8px",
                    fontWeight: "bold",
                  }}
                >
                  Check-out: {showDate(h.checkOut)}
                </div>
                <div
                  className="col text-center p-2"
                  style={{
                    background: "#bae1ff",
                    borderRadius: "8px",
                    fontWeight: "bold",
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
              background: "linear-gradient(90deg,#74c0fc,#ff6b6b)",
              borderRadius: "15px",
              color: "#fff",
              fontSize: "16px",
              textShadow: "1px 1px 2px #00000022",
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
