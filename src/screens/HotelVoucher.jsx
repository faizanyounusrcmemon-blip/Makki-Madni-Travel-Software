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
  const [confirmNo, setConfirmNo] = useState("");
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

      // normalize data
      if (isPkg) {
        setData({
          ref_no: d.ref_no,
          customer_name: d.customer_name,
          booking_date: d.booking_date,
          hotels: d.hotels || [],
        });
      } else {
        setData(d.row);
      }
    } catch {
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

  return (
    <div className="container py-3">

      {/* TOP BAR */}
      <div className="d-flex gap-2 mb-3">
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
            <div className="fw-bold">HOTEL VOUCHER</div>
          </div>

          {/* ADDRESS */}
          <div className="text-center small mb-3" style={{ color: "#444" }}>
            Shop #4 Daimon City Building, Near Zeenat-ul-Islam Masjid<br />
            Garden West Karachi<br />
            ✉️ makkimadnitravel@gmail.com | ☎️ 0335-7476744
          </div>

          <hr />

          {/* BASIC INFO */}
          <div className="row mb-2">
            <div className="col">
              <b>Ref No:</b> {data.ref_no}
            </div>
            <div className="col text-end">
              <b>Booking Date:</b> {showDate(data.booking_date)}
            </div>
          </div>

          {/* CONFIRMATION NO */}
          <div
            className="d-flex align-items-center gap-2 mb-3"
            style={{ maxWidth: 350 }}
          >
            <b>Confirmation No:</b>
            <input
              type="text"
              className="form-control form-control-sm"
              value={confirmNo}
              onChange={(e) => setConfirmNo(e.target.value)}
              placeholder="Enter number"
            />
          </div>

          {/* PAX */}
          <div className="mb-3">
            <b>PAX Name:</b> {data.customer_name}
          </div>

          {/* HOTEL DETAILS */}
          <h6 className="bg-primary text-white p-2 rounded">
            🏨 Hotel Details
          </h6>

          {data?.hotels?.length === 0 && (
            <div className="text-muted">No hotel service in this booking</div>
          )}

          {data?.hotels?.map((h, i) => (
            <div
              key={i}
              className="border rounded p-2 mb-2"
              style={{ background: "#ffffff" }}
            >
              <div><b>Hotel:</b> {h.hotel}</div>
              <div><b>Address:</b> {h.location}</div>

              <div className="row mt-2">
                <div className="col">
                  Check-in: <b>{showDate(h.checkIn)}</b>
                </div>
                <div className="col">
                  Check-out: <b>{showDate(h.checkOut)}</b>
                </div>
                <div className="col">
                  Nights: <b>{h.nights}</b>
                </div>
              </div>
            </div>
          ))}

          {/* ✅ CHECK-IN / CHECK-OUT TIMING (RESTORED) */}
          <div
            className="mt-3 p-2 text-center fw-bold"
            style={{
              background: "#e7f1ff",
              border: "1px dashed #0d6efd",
              borderRadius: "8px",
              color: "#0d6efd",
            }}
          >
            CHECK IN TIME: 04:00 PM &nbsp; | &nbsp;
            CHECK OUT TIME: 02:00 PM
          </div>

          {/* ✅ FOOTER (RESTORED) */}
          <div className="text-center small mt-3" style={{ color: "#555" }}>
            Please check your hotel details carefully.<br />
            This voucher is valid only for the mentioned booking.
          </div>
        </div>
      )}
    </div>
  );
}

