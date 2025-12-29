import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

/* ================= DATE FORMAT (01/dec/2025) ================= */
const showDate = (val) => {
  if (!val) return "";
  const d = new Date(val);
  if (isNaN(d)) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d
    .toLocaleString("en-US", { month: "short" })
    .toLowerCase(); // 🔥 lowercase month
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

export default function TransportVoucher({ onNavigate }) {
  const [ref, setRef] = useState("");
  const [data, setData] = useState(null);
  const [rows, setRows] = useState([]);

  const [vehicles, setVehicles] = useState({});
  const [pickupDates, setPickupDates] = useState({});
  const [contacts, setContacts] = useState({});

  const voucherRef = useRef(null);

  /* ================= LOAD ================= */
  const loadVoucher = async () => {
    try {
      if (ref.startsWith("PKG-")) {
        const r = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/bookings/get/${ref}`
        );
        const d = await r.json();
        if (!d.success) return alert("Voucher not found");
        setData(d.row);
        setRows(d.row.transport || []);
      } else if (ref.startsWith("TRN-")) {
        const r = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/transport/get/${ref}`
        );
        const d = await r.json();
        if (!d.success) return alert("Voucher not found");
        setData(d.row);
        setRows(d.row.rows || []);
      } else {
        alert("Invalid Ref No");
      }
    } catch {
      alert("Load failed");
    }
  };

  /* ================= PDF (SINGLE PAGE AUTO FIT) ================= */
  const exportPDF = async () => {
    const element = voucherRef.current;

    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = pageWidth;
    let imgHeight = (canvas.height * imgWidth) / canvas.width;

    if (imgHeight > pageHeight) {
      const scale = pageHeight / imgHeight;
      pdf.addImage(
        imgData,
        "PNG",
        0,
        0,
        imgWidth * scale,
        pageHeight
      );
    } else {
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    }

    pdf.save(`Transport-Voucher-${data.ref_no}.pdf`);
  };

  return (
    <div className="container py-3">
      {/* TOP BAR */}
      <div className="d-flex gap-2 mb-3">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>

        <input
          className="form-control form-control-sm w-25"
          placeholder="PKG- / TRN- Ref"
          value={ref}
          onChange={(e) => setRef(e.target.value)}
        />

        <button className="btn btn-primary btn-sm" onClick={loadVoucher}>
          Load
        </button>

        {data && (
          <button className="btn btn-success btn-sm" onClick={exportPDF}>
            PDF
          </button>
        )}
      </div>

      {data && (
        <div
          ref={voucherRef}
          style={{
            maxWidth: 900,
            margin: "auto",
            padding: 30,
            borderRadius: 25,
            background: "linear-gradient(135deg,#ffecd2,#fcb69f)",
            boxShadow: "0 30px 70px rgba(0,0,0,.3)",
            fontFamily: "Segoe UI",
          }}
        >
          {/* HEADER */}
          <div
            style={{
              background: "linear-gradient(90deg,#667eea,#764ba2)",
              borderRadius: 20,
              padding: 25,
              color: "#fff",
              textAlign: "center",
              marginBottom: 25,
            }}
          >
            <h1 style={{ fontWeight: 800 }}>✈ MAKKI MADNI TRAVEL</h1>
            <div style={{ fontSize: 14 }}>
              Shop #4 Daimon City Building, Near Zeenat-ul-Islam Masjid<br />
              Garden West Karachi<br />
              ✉ makkimadnitravel@gmail.com | ☎ 0335-7476744
            </div>
            <div
              style={{
                marginTop: 12,
                background: "#ffc107",
                color: "#000",
                padding: "6px 24px",
                borderRadius: 30,
                fontWeight: 700,
                display: "inline-block",
              }}
            >
              TRANSPORT VOUCHER
            </div>
          </div>

          {/* INFO */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              background: "linear-gradient(90deg,#43cea2,#185a9d)",
              color: "#fff",
              padding: "14px 20px",
              borderRadius: 14,
              fontWeight: 600,
              marginBottom: 20,
            }}
          >
            <div>Ref: {data.ref_no}</div>
            <div>Date: {showDate(data.booking_date)}</div>
          </div>

          {/* CUSTOMER */}
          <div
            style={{
              background: "#fff",
              padding: 18,
              borderRadius: 16,
              fontSize: 18,
              fontWeight: 600,
              marginBottom: 22,
              borderLeft: "8px solid #ff5722",
            }}
          >
            Customer: {data.customer_name}
          </div>

          {/* SERVICES */}
          {rows.map((r, i) => (
            <div
              key={i}
              style={{
                background: "linear-gradient(135deg,#e0c3fc,#8ec5fc)",
                borderRadius: 20,
                padding: 22,
                marginBottom: 18,
              }}
            >
              <b>🚐 {r.text || r.description}</b>

              <div className="row g-3 mt-2">
                <div className="col-md-3">
                  <label className="small fw-bold">Vehicle</label>
                  <input
                    className="form-control form-control-sm"
                    value={vehicles[i] || ""}
                    onChange={(e) =>
                      setVehicles({ ...vehicles, [i]: e.target.value })
                    }
                  />
                </div>

                <div className="col-md-3">
                  <label className="small fw-bold">Pick-up Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={pickupDates[i] || ""}
                    onChange={(e) =>
                      setPickupDates({ ...pickupDates, [i]: e.target.value })
                    }
                  />
                  {pickupDates[i] && (
                    <div className="small mt-1">
                      {showDate(pickupDates[i])}
                    </div>
                  )}
                </div>

                <div className="col-md-3">
                  <label className="small fw-bold">Contact</label>
                  <input
                    className="form-control form-control-sm"
                    value={contacts[i]?.c1 || ""}
                    onChange={(e) =>
                      setContacts({
                        ...contacts,
                        [i]: { ...contacts[i], c1: e.target.value },
                      })
                    }
                  />
                </div>

                <div className="col-md-3">
                  <label className="small fw-bold">Alternate</label>
                  <input
                    className="form-control form-control-sm"
                    value={contacts[i]?.c2 || ""}
                    onChange={(e) =>
                      setContacts({
                        ...contacts,
                        [i]: { ...contacts[i], c2: e.target.value },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          ))}

          {/* NOTE */}
          <div
            style={{
              marginTop: 20,
              background: "#fff1eb",
              padding: 16,
              borderRadius: 14,
              fontWeight: 600,
            }}
          >
            <b>اہم ہدایات:</b><br />
            براہِ کرم ڈرائیور اور گاڑی کی تفصیلات وقت پر کنفرم کریں۔
            کسی بھی مسئلے کی صورت میں مکّی مدنی ٹریول سے فوری رابطہ کریں۔
          </div>
        </div>
      )}
    </div>
  );
}
