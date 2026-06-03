import React, { useEffect, useState, useRef } from "react";
import usePdf from "../hooks/usePdf";
import Header from "../components/Header";

/* ================= DATE FORMAT ================= */
const fmtDate = (d) =>
  d
    ? new Date(d).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";



export default function PackagesViewDeleted({ id, onNavigate }) {
  const [data, setData] = useState(null);
  const ref = useRef(null);

const { exportPDF, printPDF } = usePdf(ref, {
  filePrefix: "PackageDelete",
  customerName: data?.customer_name,
  bookingDate: data?.booking_date,
  orientation: "p",
});

  /* ================= LOAD DELETED DATA ================= */
  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bookings/get-deleted/${id}`)
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

/* ================= PER PERSON CALCULATION ================= */
let adultCount = Number(data.adult_count || 0);
let childCount = Number(data.child_count || 0);
let infantCount = Number(data.infant_count || 0);

let adultPerPerson = 0;
let childPerPerson = 0;
let infantPerPerson = 0;

const rate = {
  flight: Number(data.flight_sar_rate || 0),
  hotels: Number(data.hotel_sar_rate || 0),
  visa: Number(data.visa_sar_rate || 0),
  transport: Number(data.transport_sar_rate || 0),
  ziyarat: Number(data.ziyarat_sar_rate || 0),
};

const adultFlightPKR =
  adultCount * Number(data.adult_rate || 0) * rate.flight;

const childFlightPKR =
  childCount * Number(data.child_rate || 0) * rate.flight;

const infantFlightPKR =
  infantCount * Number(data.infant_rate || 0) * rate.flight;

const visaPersons =
  data.visa?.reduce(
    (sum, v) => sum + Number(v.persons || 0),
    0
  ) || 0;

const visaPKR =
  Number(data.visa_sar_total || 0) * rate.visa;

const visaPerPerson =
  visaPersons > 0 ? visaPKR / visaPersons : 0;

const hotelsPKR =
  Number(data.hotel_sar_total || 0) * rate.hotels;

const transportPKR =
  Number(data.transport_sar_total || 0) * rate.transport;

const ziyaratPKR =
  Number(data.ziyarat_sar_total || 0) * rate.ziyarat;

const sharedPKR =
  hotelsPKR + transportPKR + ziyaratPKR;

const sharedPerAdult =
  adultCount > 0 ? sharedPKR / adultCount : 0;

adultPerPerson = Math.round(
  adultCount > 0
    ? adultFlightPKR / adultCount +
        visaPerPerson +
        sharedPerAdult
    : 0
);

childPerPerson = Math.round(
  childCount > 0
    ? childFlightPKR / childCount +
        visaPerPerson
    : 0
);

infantPerPerson = Math.round(
  infantCount > 0
    ? infantFlightPKR / infantCount +
        visaPerPerson
    : 0
);

  return (
    <div className="container mt-3 mb-5">
      {/* ===== ACTION BUTTONS ===== */}
<div className="d-flex gap-2 mb-3 flex-wrap">
  <button
    className="btn btn-sm text-white fw-bold shadow"
    style={{
      background: "linear-gradient(135deg,#000,#434343)",
      borderRadius: 8,
      padding: "6px 16px"
    }}
    onClick={() => onNavigate("deletedReports")}
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

      {/* ===== MAIN CONTENT ===== */}
      <div ref={ref} className="bg-white p-4 rounded-4 shadow-lg" style={{ maxWidth: "800px", margin: "auto", fontFamily: "Arial, sans-serif" }}>

        {/* 🔴 DELETED ALERT */}
        {data?.is_deleted && (
          <div className="alert alert-danger text-center fw-bold">
            ⚠ This record is DELETED
          </div>
        )}
        
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
          {Array.isArray(data.flights) && data.flights.length > 0 ? data.flights.map((f, i) => (
            <div key={i} className="mb-1">
              {fmtDate(f.date)} — {f.from} → {f.to} {f.airline && <b>({f.airline})</b>}
            </div>
          )) : <p>No flights</p>}
          <p>
            Adults: {data.adult_count} × {data.adult_rate}<br />
            Child: {data.child_count} × {data.child_rate}<br />
            Infant: {data.infant_count} × {data.infant_rate}<br />
            <b>Flight SAR:</b> {Number(data.flight_sar_total || 0).toLocaleString()} <br />
            <b>Flight PKR:</b> {Number(data.flight_pkr_total || 0).toLocaleString()}
          </p>
        </div>

        <hr />

        {/* ===== HOTELS ===== */}
        <h5 className="fw-bold text-success mb-2">🏨 Hotels</h5>
        {Array.isArray(data.hotels) && data.hotels.length > 0 ? data.hotels.map((h, i) => (
          <div key={i} className="border p-2 rounded mb-2 shadow-sm">
            <b>🛏️ {h.hotel}</b> — 📍 {h.location}<br />
            Check In: <b>{fmtDate(h.checkIn)}</b> → Check Out: <b>{fmtDate(h.checkOut)}</b><br />
            Nights: {h.nights}, Rooms: {h.rooms}, Type: {h.type}<br />
            Rate: {h.rate} — Total: {h.total}
          </div>
        )) : <p>No hotels</p>}
        <p>
          <b>Hotel SAR:</b> {Number(data.hotel_sar_total || 0).toLocaleString()} <br />
          <b>Hotel PKR:</b> {Number(data.hotel_pkr_total || 0).toLocaleString()}
        </p>

        <hr />

        {/* ===== VISA ===== */}
        <h5 className="fw-bold text-warning mb-2">🛂 Visa</h5>
        {Array.isArray(data.visa) && data.visa.length > 0 ? data.visa.map((v, i) => (
          <div key={i} className="border p-2 rounded mb-1 shadow-sm">
            {v.type || "Visa"} — {v.persons} × {v.rate} = {v.total}
          </div>
        )) : <p>No visa</p>}
        <p>
          <b>Visa SAR:</b> {Number(data.visa_sar_total || 0).toLocaleString()} <br />
          <b>Visa PKR:</b> {Number(data.visa_pkr_total || 0).toLocaleString()}
        </p>

        <hr />

        {/* ===== TRANSPORT ===== */}
        <h5 className="fw-bold text-danger mb-2">🚐 Transport</h5>
        {Array.isArray(data.transport) && data.transport.length > 0 ? data.transport.map((t, i) => (
          <div key={i} className="border p-2 rounded mb-1 shadow-sm">
            {t.text} — {Number(t.amount || 0).toLocaleString()}
          </div>
        )) : <p>No transport</p>}
        <p>
          <b>Transport SAR:</b> {Number(data.transport_sar_total || 0).toLocaleString()} <br />
          <b>Transport PKR:</b> {Number(data.transport_pkr_total || 0).toLocaleString()}
        </p>

        <hr />

        {/* ===== ZIYARAT ===== */}
        <h5 className="fw-bold text-purple mb-2">🕌 Ziyarat</h5>
        {Array.isArray(data.ziyarat) && data.ziyarat.length > 0 ? data.ziyarat.map((z, i) => (
          <div key={i} className="border p-2 rounded mb-1 shadow-sm">
            {z.text || z.route || z.description} — {Number(z.amount || 0).toLocaleString()}
          </div>
        )) : <p>No ziyarat</p>}
        <p>
          <b>Ziyarat SAR:</b> {Number(data.ziyarat_sar_total || 0).toLocaleString()} <br />
          <b>Ziyarat PKR:</b> {Number(data.ziyarat_pkr_total || 0).toLocaleString()}
        </p>

        <hr />

        {/* ===== NET TOTAL ===== */}
        <h4 className="fw-bold text-end text-success">
          NET PKR TOTAL: {Number(data.net_pkr_total || 0).toLocaleString()}
        </h4>
  <>
    <hr />

    <div className="border rounded p-3 bg-light">
      <h5 className="fw-bold mb-3">👥 Per Person Cost</h5>

      <div className="d-flex justify-content-between border-bottom py-2">
        <span>
          <b>Adults ({adultCount})</b>
        </span>
        <span className="fw-bold">
          {adultPerPerson.toLocaleString()} PKR
        </span>
      </div>

      <div className="d-flex justify-content-between border-bottom py-2">
        <span>
          <b>Children ({childCount})</b>
        </span>
        <span className="fw-bold">
          {childPerPerson.toLocaleString()} PKR
        </span>
      </div>

      <div className="d-flex justify-content-between py-2">
        <span>
          <b>Infants ({infantCount})</b>
        </span>
        <span className="fw-bold">
          {infantPerPerson.toLocaleString()} PKR
        </span>
      </div>
    </div>
  </>


      </div>
    </div>
  );
}