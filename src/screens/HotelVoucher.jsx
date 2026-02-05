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
  const [voucherHotels, setVoucherHotels] = useState([]);
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

      let hotelsData = isPkg
        ? (d.hotels || []).map((h) => ({
            ...h,
            confirmNo: "",
            contact1: "",
            contact2: "",
          }))
        : [
            {
              ...d.row,
              confirmNo: "",
              contact1: "",
              contact2: "",
            },
          ];

      setData({
        ref_no: isPkg ? d.ref_no : d.row.ref_no,
        customer_name: isPkg ? d.customer_name : d.row.customer_name,
        booking_date: isPkg ? d.booking_date : d.row.booking_date,
        agent_name: isPkg ? "" : d.row.agent_name || "",
      });

      setVoucherHotels(hotelsData);
    } catch {
      alert("Failed to load voucher");
    }
  };

  /* ================= HANDLE HOTEL INPUT CHANGE ================= */
  const handleHotelChange = (index, field, value) => {
    const updated = [...voucherHotels];
    updated[index][field] = value;
    setVoucherHotels(updated);
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
          <div className="mb-2">
            <b>Agent Name:</b> {data.agent_name ? data.agent_name : "—"}
          </div>

          {/* PAX */}
          <div className="mb-3">
            <b>PAX Name:</b> {data.customer_name}
          </div>

          {/* HOTEL DETAILS */}
          <h6 className="bg-primary text-white p-2 rounded">🏨 Hotel Details</h6>

          {voucherHotels?.length === 0 && (
            <div className="text-muted">No hotel service in this booking</div>
          )}

          {voucherHotels?.map((h, i) => (
            <div
              key={i}
              className="border rounded p-2 mb-2"
              style={{ background: "#ffffff" }}
            >
              <div>
                <b>Hotel:</b> {h.hotel}
              </div>
              <div>
                <b>Address:</b> {h.location}
              </div>

              {/* CONFIRMATION NO */}
              <div className="d-flex align-items-center gap-2 mt-2">
                <b>Confirmation No:</b>
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

              {/* CONTACT NOS */}
              <div className="row mt-2">
                <div className="col">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={h.contact1}
                    onChange={(e) =>
                      handleHotelChange(i, "contact1", e.target.value)
                    }
                    placeholder="Contact No 1"
                  />
                </div>
                <div className="col">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={h.contact2}
                    onChange={(e) =>
                      handleHotelChange(i, "contact2", e.target.value)
                    }
                    placeholder="Contact No 2"
                  />
                </div>
              </div>

              {/* CHECK-IN / CHECK-OUT */}
              <div className="row mt-2">
                <div
                  className="col text-center fw-bold"
                  style={{ backgroundColor: "yellow" }}
                >
                  Check-in: {showDate(h.checkIn)}
                </div>
                <div
                  className="col text-center fw-bold"
                  style={{ backgroundColor: "lightgreen" }}
                >
                  Check-out: {showDate(h.checkOut)}
                </div>
                <div className="col text-center fw-bold">Nights: {h.nights}</div>
              </div>
            </div>
          ))}

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
