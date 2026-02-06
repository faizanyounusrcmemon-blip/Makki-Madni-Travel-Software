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

// 🔥 NORMALIZER (PKG + HOT SAFE)
const normalizeHotel = (h) => ({
  hotel: h.hotel || h.hotel_name || "",
  location: h.location || "",
  checkIn: h.checkIn || h.check_in || "",
  checkOut: h.checkOut || h.check_out || "",
  nights: h.nights || "",
  rooms: h.rooms || h.room || "",
  type: h.type || h.roomType || h.room_type || "",
  rate: h.rate || "",
  total: h.total || "",
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
      } else {
        return alert("Invalid Ref No");
      }

      const res = await fetch(url);
      const d = await res.json();
      if (!d.success) return alert("Voucher not found");

      if (isPkg) {
        setData({
          ref_no: d.ref_no,
          customer_name: d.customer_name,
          agent_name: d.agent_name || "",
          booking_date: d.booking_date,
          hotels: (d.hotels || []).map(normalizeHotel),
        });
      } else {
        setData({
          ref_no: d.row.ref_no,
          customer_name: d.row.customer_name,
          agent_name: d.row.agent_name || "",
          booking_date: d.row.booking_date,
          hotels: (d.row.hotels || []).map(normalizeHotel),
        });
      }
    } catch (e) {
      console.error(e);
      alert("Load failed");
    }
  };

  /* ================= PDF ================= */
  const exportPDF = async () => {
    const canvas = await html2canvas(voucherRef.current, { scale: 2 });
    const pdf = new jsPDF("p", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;
    pdf.addImage(canvas.toDataURL(), "PNG", 0, 0, w, h);
    pdf.save(`Hotel-Voucher-${data.ref_no}.pdf`);
  };

  return (
    <div className="container py-3">
      <div className="d-flex gap-2 mb-3">
        <button className="btn btn-dark btn-sm" onClick={() => onNavigate("dashboard")}>← Back</button>
        <input className="form-control form-control-sm w-25" value={ref} onChange={e=>setRef(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={loadVoucher}>Load</button>
        {data && <button className="btn btn-success btn-sm" onClick={exportPDF}>PDF</button>}
      </div>

      {data && (
        <div ref={voucherRef} style={{ maxWidth: 820, margin: "auto", padding: 20, border: "3px solid #0d6efd" }}>
          <h4 className="text-center">HOTEL VOUCHER</h4>

          <div className="row mb-2">
            <div className="col"><b>Ref:</b> {data.ref_no}</div>
            <div className="col text-end"><b>Date:</b> {showDate(data.booking_date)}</div>
          </div>

          <b>Agent:</b> {data.agent_name}<br />
          <b>Customer:</b> {data.customer_name}

          {data.hotels.map((h,i)=>(
            <div key={i} className="border p-2 mt-3">
              <b>Hotel:</b> {h.hotel}<br/>
              <b>Address:</b> {h.location}<br/>
              <b>Room:</b> {h.rooms || "—"} &nbsp;
              <b>Type:</b> {h.type || "—"}

              <div className="row mt-2">
                <div className="col" style={{background:"#f1c40f"}}>Check-in: {showDate(h.checkIn)}</div>
                <div className="col" style={{background:"#27ae60",color:"#fff"}}>Check-out: {showDate(h.checkOut)}</div>
                <div className="col">Nights: {h.nights}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
