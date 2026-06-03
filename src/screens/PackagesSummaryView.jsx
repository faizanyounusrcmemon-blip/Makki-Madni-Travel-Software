import React, { useEffect, useState, useRef } from "react";
import Header from "../components/Header";
import usePdf from "../hooks/usePdf";

/* ================= DATE FORMAT ================= */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

/* ================= FILE NAME HELPERS ================= */


export default function PackagesView({ id, onNavigate }) {
  const [data, setData] = useState(null);


const ref = useRef(null);

const { exportPDF, printPDF } = usePdf(ref, {
  filePrefix: "PackageSummary",
  customerName: data?.customer_name,
  bookingDate: data?.booking_date,
  orientation: "p",
});

  /* ================= LOAD DATA ================= */
  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bookings/get/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;
        setData(res.row);
      });
  }, [id]);

/* ================= EXPORT PDF ================= */


  if (!data) return <div className="p-4">Loading...</div>;

/* ================= PACKAGE DURATION ================= */
const flightDates =
  Array.isArray(data.flights)
    ? data.flights
        .map((f) => f.date)
        .filter(Boolean)
        .sort()
    : [];

let packageDays = 0;
let packageNights = 0;

if (flightDates.length >= 2) {
  const startDate = new Date(flightDates[0]);
  const endDate = new Date(flightDates[flightDates.length - 1]);

  const diff =
    (endDate - startDate) / (1000 * 60 * 60 * 24);

  packageDays = diff + 1;
  packageNights = diff;
}

  // ================= CALCULATE TOTALS =================
  const flightTotal = Number(data.flight_sar_total || 0);
  const hotelsTotal = Number(data.hotel_sar_total || 0);
  const visaTotal = Number(data.visa_sar_total || 0);
  const transportTotal = Number(data.transport_sar_total || 0);
  const ziyaratTotal = Number(data.ziyarat_sar_total || 0);

  const rate = {
    flight: Number(data.flight_sar_rate || 0),
    hotels: Number(data.hotel_sar_rate || 0),
    visa: Number(data.visa_sar_rate || 0),
    transport: Number(data.transport_sar_rate || 0),
    ziyarat: Number(data.ziyarat_sar_rate || 0),
  };

  const flightPKR = flightTotal * rate.flight;
  const hotelsPKR = hotelsTotal * rate.hotels;
  const visaPKR = visaTotal * rate.visa;
  const transportPKR = transportTotal * rate.transport;
  const ziyaratPKR = ziyaratTotal * rate.ziyarat;

  const grandPKR = flightPKR + hotelsPKR + visaPKR + transportPKR + ziyaratPKR;

  const personQty = Number(data.per_person_qty || 0);
  const perPerson = grandPKR / personQty;

let adultCount = 0, childCount = 0, infantCount = 0;
let adultPerPerson = 0, childPerPerson = 0, infantPerPerson = 0;

if (data) {
  const rate = {
    flight: Number(data.flight_sar_rate || 0),
    hotels: Number(data.hotel_sar_rate || 0),
    visa: Number(data.visa_sar_rate || 0),
    transport: Number(data.transport_sar_rate || 0),
    ziyarat: Number(data.ziyarat_sar_rate || 0),
  };

  adultCount = Number(data.adult_count || 0);
  childCount = Number(data.child_count || 0);
  infantCount = Number(data.infant_count || 0);

  const adultFlightPKR = adultCount * Number(data.adult_rate || 0) * rate.flight;
  const childFlightPKR = childCount * Number(data.child_rate || 0) * rate.flight;
  const infantFlightPKR = infantCount * Number(data.infant_rate || 0) * rate.flight;

  const visaPersons = data.visa?.reduce((sum, v) => sum + Number(v.persons || 0), 0) || 0;
  const visaPKR = Number(data.visa_sar_total || 0) * rate.visa;
  const visaPerPerson = visaPersons > 0 ? visaPKR / visaPersons : 0;

  const hotelsPKR = Number(data.hotel_sar_total || 0) * rate.hotels;
  const transportPKR = Number(data.transport_sar_total || 0) * rate.transport;
  const ziyaratPKR = Number(data.ziyarat_sar_total || 0) * rate.ziyarat;

  const sharedPKR = hotelsPKR + transportPKR + ziyaratPKR;
  const sharedPerAdult = adultCount > 0 ? sharedPKR / adultCount : 0;

  adultPerPerson = Math.round(adultCount > 0 ? adultFlightPKR / adultCount + visaPerPerson + sharedPerAdult : 0);
  childPerPerson = Math.round(childCount > 0 ? childFlightPKR / childCount + visaPerPerson : 0);
  infantPerPerson = Math.round(infantCount > 0 ? infantFlightPKR / infantCount + visaPerPerson : 0);
}

  return (
    <div className="container mt-3 mb-5">

      {/* ============ TOP ACTIONS ============ */}
      <div className="d-flex justify-content-start mb-3 gap-2 flex-wrap">
        <button
          className="btn btn-sm text-white fw-bold shadow"
          style={{
            background: "linear-gradient(135deg,#000,#434343)",
            borderRadius: 8,
            padding: "6px 16px",
          }}
          onClick={() => onNavigate("allreports")}
        >
          ⬅ Back
        </button>

<button
  className="btn btn-success btn-sm fw-bold shadow"
  style={{ borderRadius: 8, padding: "6px 16px" }}
  onClick={exportPDF}
>
  📄 Export PDF
</button>

<button
  className="btn btn-secondary btn-sm fw-bold shadow"
  style={{ borderRadius: 8, padding: "6px 16px" }}
  onClick={printPDF}
>
  🖨️ Print
</button>

      </div>

      {/* ============ PDF CONTENT ============ */}
      <div
        ref={ref}
        className="bg-white p-4 rounded-4 shadow-lg"
        style={{ maxWidth: "800px", margin: "auto", fontFamily: "Arial, sans-serif" }}
      >
        {/* ===== HEADER ===== */}

      <Header title="PACKAGE QUOTATION" />


        {/* ===== PACKAGE INFO ===== */}
        <div className="mb-3">
          <h4 className="fw-bold">PACKAGE — {data.ref_no}</h4>
          <p><b>Customer:</b> {data.customer_name}</p>
          <p><b>Contact No:</b> {data.contact_no || "-"}</p>
          <p><b>Booking Date:</b> {fmtDate(data.booking_date)}</p>
<div
  className="border rounded-3 p-3 mt-2 shadow-sm"
  style={{
    background: "linear-gradient(135deg,#f8f9fa,#e9f7ef)",
    borderLeft: "5px solid #198754",
  }}
>
  <div
    style={{
      fontSize: "12px",
      color: "#6c757d",
      textTransform: "uppercase",
      fontWeight: "600",
    }}
  >
    Package Duration
  </div>

  <div
    style={{
      fontSize: "22px",
      fontWeight: "800",
      color: "#198754",
    }}
  >
    📅 {packageDays} Days / 🌙 {packageNights} Nights
  </div>
</div>

        </div>

        <hr />


        {/* ===== FLIGHTS ===== */}
        <h5 className="fw-bold text-primary mb-2">✈️ Flight</h5>
        <div className="border p-2 rounded mb-2">
          {Array.isArray(data.flights) && data.flights.length > 0 ? (
            data.flights.map((f, i) => (
              <div key={i} className="mb-1">
                {fmtDate(f.date)} — {f.from} → {f.to}{" "}
                {f.airline && <b>({f.airline})</b>}
              </div>
            ))
          ) : (
            <p>No flights</p>
          )}
        </div>
        <p>
          Adults: {data.adult_count} × {data.adult_rate} <br />
          Child: {data.child_count} × {data.child_rate} <br />
          Infant: {data.infant_count} × {data.infant_rate} <br />
          <b>Flight SAR:</b> {flightTotal.toLocaleString()} <br />
          <b>Flight PKR:</b> {flightPKR.toLocaleString()}
        </p>

        <hr />

{/* ===== HOTELS ===== */}
<h5 className="fw-bold text-success mb-2">🏨 Hotels</h5>
{Array.isArray(data.hotels) && data.hotels.length > 0 ? (
  data.hotels.map((h, i) => (
    <div key={i} className="border p-2 rounded mb-2 shadow-sm">
      <b>🛏️ {h.hotel}</b> — 📍 {h.location}<br />
      Check In Date: <span style={{ color: "#0d6efd", fontWeight: "bold" }}>{fmtDate(h.checkIn)}</span> → 
      Check Out Date: <span style={{ color: "#dc3545", fontWeight: "bold" }}>{fmtDate(h.checkOut)}</span><br />
      Nights: <b>{h.nights}</b>, Rooms: <b>{h.rooms}</b>, Type: <b>{h.type}</b><br />
      Rate: {h.rate}   — Total: {h.total}
    </div>
  ))
) : (
  <p>No hotels</p>
)}

<p>
  <b>Hotel SAR:</b> {hotelsTotal.toLocaleString()} <br />
  <b>Hotel PKR:</b> {hotelsPKR.toLocaleString()}
</p>

<hr />


        {/* ===== VISA ===== */}
        <h5 className="fw-bold text-warning mb-2">🛂 Visa</h5>
        {Array.isArray(data.visa) && data.visa.length > 0 ? (
          data.visa.map((v, i) => (
            <div key={i} className="border p-2 rounded mb-1 shadow-sm">
              {v.type || "Visa"} — {v.persons} × {v.rate} = {v.total}
            </div>
          ))
        ) : (
          <p>No visa</p>
        )}
        <p>
          <b>Visa SAR:</b> {visaTotal.toLocaleString()} <br />
          <b>Visa PKR:</b> {visaPKR.toLocaleString()}
        </p>

        <hr />

        {/* ===== TRANSPORT ===== */}
        <h5 className="fw-bold text-danger mb-2">🚐 Transport</h5>
        {Array.isArray(data.transport) && data.transport.length > 0 ? (
          data.transport.map((t, i) => (
            <div key={i} className="border p-2 rounded mb-1 shadow-sm">
              {t.text} — {Number(t.amount || 0).toLocaleString()}
            </div>
          ))
        ) : (
          <p>No transport</p>
        )}
        <p>
          <b>Transport SAR:</b> {transportTotal.toLocaleString()} <br />
          <b>Transport PKR:</b> {transportPKR.toLocaleString()}
        </p>

        <hr />

        {/* ===== ZIYARAT ===== */}
        <h5 className="fw-bold text-purple mb-2">🕌 Ziyarat</h5>
        {Array.isArray(data.ziyarat) && data.ziyarat.length > 0 ? (
          data.ziyarat.map((z, i) => (
            <div key={i} className="border p-2 rounded mb-1 shadow-sm">
              {z.text || z.route || z.description} — {Number(z.amount || 0).toLocaleString()}
            </div>
          ))
        ) : (
          <p>No ziyarat</p>
        )}
        <p>
          <b>Ziyarat SAR:</b> {ziyaratTotal.toLocaleString()} <br />
          <b>Ziyarat PKR:</b> {ziyaratPKR.toLocaleString()}
        </p>

        <hr />
                {/* ===== SUMMARY TABLE ===== */}
        <h6 className="section-title">📊 Summary</h6>
        <table className="table table-sm mb-4">
          <thead>
            <tr>
              <th>Item</th>
              <th>SAR</th>
              <th>Rate</th>
              <th>PKR</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Flight</td>
              <td>{flightTotal.toLocaleString()}</td>
              <td>{rate.flight}</td>
              <td className="fw-bold">{flightPKR.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Hotels</td>
              <td>{hotelsTotal.toLocaleString()}</td>
              <td>{rate.hotels}</td>
              <td className="fw-bold">{hotelsPKR.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Visa</td>
              <td>{visaTotal.toLocaleString()}</td>
              <td>{rate.visa}</td>
              <td className="fw-bold">{visaPKR.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Transport</td>
              <td>{transportTotal.toLocaleString()}</td>
              <td>{rate.transport}</td>
              <td className="fw-bold">{transportPKR.toLocaleString()}</td>
            </tr>
            <tr>
              <td>Ziyarat</td>
              <td>{ziyaratTotal.toLocaleString()}</td>
              <td>{rate.ziyarat}</td>
              <td className="fw-bold">{ziyaratPKR.toLocaleString()}</td>
            </tr>
            <tr className="table-info">
              <td className="fw-bold">Grand Total PKR</td>
              <td></td>
              <td></td>
              <td className="fw-bold">{grandPKR.toLocaleString()}</td>
            </tr>
<tr style={{ background: "#f1f1f1" }}>
  <td className="fw-bold">Per Person (Adults)</td>
  <td>{adultCount}</td>
  <td></td>
  <td className="fw-bold">{adultPerPerson.toLocaleString()}</td>
</tr>
<tr style={{ background: "#f1f1f1" }}>
  <td className="fw-bold">Per Person (Children)</td>
  <td>{childCount}</td>
  <td></td>
  <td className="fw-bold">{childPerPerson.toLocaleString()}</td>
</tr>
<tr style={{ background: "#f1f1f1" }}>
  <td className="fw-bold">Per Person (Infants)</td>
  <td>{infantCount}</td>
  <td></td>
  <td className="fw-bold">{infantPerPerson.toLocaleString()}</td>
</tr>
          </tbody>
        </table>

        <hr />

        {/* FOOTER NOTE */}
        <div
          className="mt-2 p-2 text-center small"
          style={{ background: "#12c1d8", color: "white" }}
        >
          THESE ARE TENTATIVE RATES AND CAN CHANGE WITHOUT NOTICE.
          PACKAGE CAN BE FINALIZED AFTER BOOKING PAYMENTS AND MAY VARY WITH ROE.
        </div>
      </div>
    </div>
  );
}


