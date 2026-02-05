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

  /* ================= HANDLE HOTEL FIELD CHANGE ================= */
  const handleHotelChange = (index, field, value) => {
    const updatedHotels = [...data.hotels];
    updatedHotels[index][field] = value;
    setData({ ...data, hotels: updatedHotels });
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

          {/* BASIC INFO */}
          <div className="row mb-2">
            <div className="col">
              <b>Ref No:</b> {data.ref_no}
            </div>
            <div className="col text-end">
              <b>Booking Date:</b> {showDate(data.booking_date)}
            </div>
          </div>

          {/* AGENT NAME */}
          <div className="mb-3">
            <b>Agent Name:</b> {data.agent_name || "—"}
          </div>

          {/* ================= HOTEL BLOCKS ================= */}
          {data.hotels.map((h, i) => (
            <div
              key={i}
              className="border rounded p-2 mb-2"
              style={{ background: "#ffffff" }}
            >
              {/* Confirmation No */}
              <div className="mb-2">
                <label className="fw-bold">Confirmation No</label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={h.confirmNo}
                  onChange={(e) =>
                    handleHotelChange(i, "confirmNo", e.target.value)
                  }
                  placeholder="Enter Confirmation No"
                />
              </div>

              {/* Hotel Details */}
              <div className="row mb-2">
                <div className="col">
                  <b>Hotel:</b> {h.hotel}
                </div>
                <div className="col">
                  <b>Address:</b> {h.location}
                </div>
              </div>

              {/* Check-in / Check-out / Nights */}
              <div className="row g-2 mb-2">
                <div
                  className="col"
                  style={{
                    backgroundColor: "#f1c40f", // DARK YELLOW
                    padding: "5px",
                    borderRadius: "4px",
                  }}
                >
                  <b>Check-in:</b> {showDate(h.checkIn)}
                </div>
                <div
                  className="col"
                  style={{
                    backgroundColor: "#27ae60", // DARK GREEN
                    color: "#fff",
                    padding: "5px",
                    borderRadius: "4px",
                  }}
                >
                  <b>Check-out:</b> {showDate(h.checkOut)}
                </div>
                <div className="col">
                  <b>Nights:</b> {h.nights}
                </div>
              </div>

              {/* Contacts */}
              <div className="row mb-2 g-2">
                <div className="col">
                  <label className="fw-bold">Contact No 1</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={h.contact1}
                    onChange={(e) =>
                      handleHotelChange(i, "contact1", e.target.value)
                    }
                    placeholder="Enter Contact No 1"
                  />
                </div>
                <div className="col">
                  <label className="fw-bold">Contact No 2</label>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={h.contact2}
                    onChange={(e) =>
                      handleHotelChange(i, "contact2", e.target.value)
                    }
                    placeholder="Enter Contact No 2"
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
            CHECK IN TIME: 04:00 PM &nbsp; | &nbsp; CHECK OUT TIME: 02:00 PM
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
