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

export default function PackagesView({ id, onNavigate, fromPage }) {
  const [data, setData] = useState(null);
  
  // DEFAULT INITIALLY OFF (FALSE) FOR ALL SWITCHES
  const [hideAmounts, setHideAmounts] = useState(false);
  const [showGift, setShowGift] = useState(false);
  const [showAgentComm, setShowAgentComm] = useState(false);
  
  const ref = useRef(null);

  const { exportPDF, printPDF } = usePdf(ref, {
    filePrefix: "Package",
    customerName: data?.customer_name,
    bookingDate: data?.booking_date,
    orientation: "p",
  });

  useEffect(() => {
    if (!id) return;

    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bookings/get/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return;
        setData(res.row);
      });
  }, [id]);

  if (!data) return <div className="p-4">Loading...</div>;

  /* ================= PACKAGE DURATION ================= */
  const flightDates = Array.isArray(data.flights)
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

    const diff = (endDate - startDate) / (1000 * 60 * 60 * 24);

    packageDays = diff + 1;
    packageNights = diff;
  }

  /* ================= AMOUNTS & CALCULATIONS ================= */
  let adultCount = Number(data.adult_count || 0);
  let childCount = Number(data.child_count || 0);
  let infantCount = Number(data.infant_count || 0);

  const rate = {
    flight: Number(data.flight_sar_rate || 1),
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

  const totalPassengers = adultCount + childCount + infantCount;

  const visaPKR = Number(data.visa_pkr_total || Number(data.visa_sar_total || 0) * rate.visa);
  const visaPerPerson = totalPassengers > 0 ? visaPKR / totalPassengers : 0;

  const hotelsPKR = Number(data.hotel_pkr_total || Number(data.hotel_sar_total || 0) * rate.hotels);
  const transportPKR = Number(data.transport_pkr_total || Number(data.transport_sar_total || 0) * rate.transport);
  const ziyaratPKR = Number(data.ziyarat_pkr_total || Number(data.ziyarat_sar_total || 0) * rate.ziyarat);

  let giftPKR = Number(data.gifting_total || data.gifting_pkr_total || 0);
  if (!giftPKR && Array.isArray(data.gifting)) {
    giftPKR = data.gifting.reduce((acc, item) => {
      const itemTotal = Number(item.total || Number(item.qty || 0) * Number(item.rate || 0));
      return acc + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
  }

  let agentCommPKR = Number(data.agent_comm_total || data.agent_commission_pkr || 0);
  if (!agentCommPKR && Array.isArray(data.agent_comm)) {
    agentCommPKR = data.agent_comm.reduce((acc, item) => {
      const itemTotal = Number(item.total || Number(item.persons || 0) * Number(item.rate || 0));
      return acc + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
  }
  if (isNaN(agentCommPKR)) agentCommPKR = 0;

  // Agent Commission Per Person (ALWAYS ADDED REGARDLESS OF SWITCH TOGGLE)
  const agentCommPerPerson = totalPassengers > 0 ? agentCommPKR / totalPassengers : 0;

  const sharedPKR = hotelsPKR + transportPKR + ziyaratPKR + (showGift ? giftPKR : 0);
  const sharedPerAdult = adultCount > 0 ? sharedPKR / adultCount : 0;

  const adultPerPerson = Math.round(
    (adultCount > 0 ? adultFlightPKR / adultCount : 0) + visaPerPerson + sharedPerAdult + agentCommPerPerson
  );

  const childPerPerson = childCount > 0
    ? Math.round((childFlightPKR / childCount) + visaPerPerson + agentCommPerPerson)
    : 0;

  const infantPerPerson = infantCount > 0
    ? Math.round((infantFlightPKR / infantCount) + visaPerPerson + agentCommPerPerson)
    : 0;

  return (
    <div className="container mt-3 mb-5">
      {/* ===== TOP BAR CONTROL SWITCHES ===== */}
      <div className="d-flex justify-content-between mb-3 align-items-center flex-wrap gap-2">
        <div className="d-flex gap-2">
          <button 
            className="btn btn-secondary btn-sm" 
            onClick={() => onNavigate(fromPage || "allreports")}
          >
            ⬅ Back
          </button>
        </div>

        <div className="d-flex gap-3 bg-white p-2 rounded shadow-sm border align-items-center">
          <div className="form-check form-switch m-0">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="hideAmountCheck" 
              checked={hideAmounts} 
              onChange={(e) => setHideAmounts(e.target.checked)} 
            />
            <label className="form-check-label fw-bold text-dark" htmlFor="hideAmountCheck">
              👁️ Hide Amounts
            </label>
          </div>

          <div className="form-check form-switch m-0">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="commCheck" 
              checked={showAgentComm} 
              onChange={(e) => setShowAgentComm(e.target.checked)} 
            />
            <label className="form-check-label fw-bold text-primary" htmlFor="commCheck">
              🤝 Agent Commission
            </label>
          </div>

          <div className="form-check form-switch m-0">
            <input 
              className="form-check-input" 
              type="checkbox" 
              id="giftCheck" 
              checked={showGift} 
              onChange={(e) => setShowGift(e.target.checked)} 
            />
            <label className="form-check-label fw-bold text-success" htmlFor="giftCheck">
              🎁 Gifting
            </label>
          </div>
        </div>

        <div className="d-flex gap-2">
          <button 
            className="btn btn-sm text-white fw-bold shadow" 
            style={{ background: "linear-gradient(135deg,#28a745,#20c997)" }} 
            onClick={exportPDF}
          >
            📄 Export PDF
          </button>
          <button 
            className="btn btn-sm text-white fw-bold shadow" 
            style={{ background: "linear-gradient(135deg,#6c757d,#343a40)" }} 
            onClick={printPDF}
          >
            🖨️ Print
          </button>
        </div>
      </div>

      <div
        ref={ref}
        className="bg-white p-4 rounded-4 shadow-lg"
        style={{ maxWidth: "800px", margin: "auto", fontFamily: "Arial, sans-serif" }}
      >
        <Header title="PACKAGE QUOTATION" />

        <div className="mb-3">
          <h4 className="fw-bold">PACKAGE — {data.ref_no}</h4>
          <p className="mb-1"><b>Customer:</b> {data.customer_name}</p>
          <p className="mb-1"><b>Contact No:</b> {data.contact_no || "-"}</p>
          <p className="mb-1"><b>Booking Date:</b> {fmtDate(data.booking_date)}</p>
          <div
            className="border rounded-3 p-3 mt-2 shadow-sm"
            style={{
              background: "linear-gradient(135deg,#f8f9fa,#e9f7ef)",
              borderLeft: "5px solid #198754",
            }}
          >
            <div style={{ fontSize: "12px", color: "#6c757d", textTransform: "uppercase", fontWeight: "600" }}>
              Package Duration
            </div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: "#198754" }}>
              📅 {packageDays} Days / 🌙 {packageNights} Nights
            </div>
          </div>
        </div>

        <hr />

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
            <p className="m-0">No flights</p>
          )}
        </div>
        {!hideAmounts && (
          <p>
            Adults: {data.adult_count} × {data.adult_rate} <br />
            Child: {data.child_count} × {data.child_rate} <br />
            Infant: {data.infant_count} × {data.infant_rate} <br />
            <b>Flight SAR:</b> {Number(data.flight_sar_total || 0).toLocaleString()} <br />
            <b>SAR Rate:</b> {rate.flight} <br />
            <b>Flight PKR:</b> {Number(data.flight_pkr_total || 0).toLocaleString()}
          </p>
        )}

        <hr />

        <h5 className="fw-bold text-success mb-2">🏨 Hotels</h5>
        {Array.isArray(data.hotels) && data.hotels.length > 0
          ? data.hotels.map((h, i) => (
              <div key={i} className="border p-2 rounded mb-2 shadow-sm">
                <b>🛏️ {h.hotel}</b> — 📍 {h.location}<br />
                Check In: <span style={{ color: "#0d6efd", fontWeight: "bold" }}>{fmtDate(h.checkIn)}</span> → 
                Check Out: <span style={{ color: "#dc3545", fontWeight: "bold" }}>{fmtDate(h.checkOut)}</span><br />
                Nights: {h.nights}, Rooms: {h.rooms}, Type: {h.type}<br />
                {!hideAmounts && <>Rate: {h.rate} — Total: {h.total}</>}
              </div>
            ))
          : <p>No hotels</p>}
        {!hideAmounts && (
          <p>
            <b>Hotel SAR:</b> {Number(data.hotel_sar_total || 0).toLocaleString()} <br />
            <b>SAR Rate:</b> {rate.hotels} <br />
            <b>Hotel PKR:</b> {Number(data.hotel_pkr_total || 0).toLocaleString()}
          </p>
        )}

        <hr />

        <h5 className="fw-bold text-warning mb-2">🛂 Visa</h5>
        {Array.isArray(data.visa) && data.visa.length > 0
          ? data.visa.map((v, i) => (
              <div key={i} className="border p-2 rounded mb-1 shadow-sm">
                {v.type || "Visa"} — {v.persons}
                {!hideAmounts && <> × {v.rate} = {v.total}</>}
              </div>
            ))
          : <p>No visa</p>}
        {!hideAmounts && (
          <p>
            <b>Visa SAR:</b> {Number(data.visa_sar_total || 0).toLocaleString()} <br />
            <b>SAR Rate:</b> {rate.visa} <br />
            <b>Visa PKR:</b> {visaPKR.toLocaleString()}
          </p>
        )}

        <hr />

        <h5 className="fw-bold text-danger mb-2">🚐 Transport</h5>
        {Array.isArray(data.transport) && data.transport.length > 0
          ? data.transport.map((t, i) => (
              <div key={i} className="border p-2 rounded mb-1 shadow-sm">
                {t.text} {!hideAmounts && <>— {Number(t.amount || 0).toLocaleString()}</>}
              </div>
            ))
          : <p>No transport</p>}
        {!hideAmounts && (
          <p>
            <b>Transport SAR:</b> {Number(data.transport_sar_total || 0).toLocaleString()} <br />
            <b>SAR Rate:</b> {rate.transport} <br />
            <b>Transport PKR:</b> {Number(data.transport_pkr_total || 0).toLocaleString()}
          </p>
        )}

        <hr />

        <h5 className="fw-bold text-purple mb-2">🕌 Ziyarat</h5>
        {Array.isArray(data.ziyarat) && data.ziyarat.length > 0
          ? data.ziyarat.map((z, i) => (
              <div key={i} className="border p-2 rounded mb-1 shadow-sm">
                {z.text || z.route || z.description}
                {!hideAmounts && <> — {Number(z.amount || 0).toLocaleString()}</>}
              </div>
            ))
          : <p>No ziyarat</p>}
        {!hideAmounts && (
          <p>
            <b>Ziyarat SAR:</b> {Number(data.ziyarat_sar_total || 0).toLocaleString()} <br />
            <b>SAR Rate:</b> {rate.ziyarat} <br />
            <b>Ziyarat PKR:</b> {Number(data.ziyarat_pkr_total || 0).toLocaleString()}
          </p>
        )}

        {/* ===== GIFTING SECTION ===== */}
        {showGift && (
          <div className="my-3">
            <div 
              className="p-3 rounded-3 shadow-sm border-0 position-relative overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%)",
                borderLeft: "5px solid #f59e0b",
              }}
            >
              <div className="d-flex align-items-center justify-content-between mb-2">
                <span className="fw-bold d-inline-flex align-items-center gap-1" style={{ color: "#b45309", fontSize: "15px" }}>
                  🎁 <span className="text-uppercase tracking-wide">Complimentary Gift Inclusion</span>
                </span>
                <span className="badge bg-warning text-dark px-2 py-1 rounded-pill fw-semibold" style={{ fontSize: "11px" }}>
                  Special Perk
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-2 border border-warning-subtle shadow-sm mb-2">
                {Array.isArray(data.gifting) && data.gifting.length > 0 ? (
                  data.gifting.map((g, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center py-1 border-bottom border-light">
                      <div className="d-flex align-items-center gap-2">
                        <span className="text-warning">✦</span>
                        <span className="fw-medium text-dark">{g.item || g.gift_item || g.name}</span>
                        {g.qty && <span className="badge bg-light text-secondary border">Qty: {g.qty}</span>}
                      </div>
                      {!hideAmounts && g.rate ? (
                        <span className="fw-semibold text-muted small">{Number(g.rate).toLocaleString()} PKR</span>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="m-0 text-secondary small d-flex align-items-center gap-2">
                    <span className="text-warning">✦</span>
                    {data.gift || data.gift_details || "Complimentary Gift Included"}
                  </p>
                )}
              </div>

              {!hideAmounts && (
                <div className="d-flex justify-content-end align-items-center pt-1">
                  <span className="small text-muted me-2">Gifting Value:</span>
                  <span className="fw-bold text-dark fs-6" style={{ color: "#92400e" }}>
                    {giftPKR.toLocaleString()} PKR
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== AGENT COMMISSION SECTION ===== */}
        {showAgentComm && (
          <>
            <hr />
            <h5 className="fw-bold text-dark mb-2">💼 Agent Commission</h5>
            <div className="border p-2 rounded mb-2 shadow-sm bg-light">
              {Array.isArray(data.agent_comm) && data.agent_comm.length > 0 ? (
                data.agent_comm.map((a, i) => (
                  <div key={i} className="mb-1">
                    <b>Type / Details:</b> {a.type || "Agent Commission"}{" "}
                    {a.persons ? `(${a.persons} Persons)` : ""}
                    {!hideAmounts && a.rate ? ` — Rate: ${a.rate} PKR` : ""}
                  </div>
                ))
              ) : (
                <p className="m-0">
                  <b>Agent Name / Details:</b> {data.agent_name || "Agent Commission"}
                </p>
              )}
              {!hideAmounts && (
                <p className="m-0 mt-1 fw-bold text-dark">
                  Commission Amount: {agentCommPKR.toLocaleString()} PKR
                </p>
              )}
            </div>
          </>
        )}

        <hr />

        <h4 className="fw-bold text-end text-success">
          NET PKR TOTAL: {Number(data.net_pkr_total || 0).toLocaleString()}
        </h4>  

        <hr />

        <div className="border rounded p-3 bg-light">
          <h5 className="fw-bold mb-3">👥 Per Person Cost</h5>

          <div className="d-flex justify-content-between border-bottom py-2">
            <span><b>Adults ({adultCount})</b></span>
            <span className="fw-bold">{adultPerPerson.toLocaleString()} PKR</span>
          </div>

          <div className="d-flex justify-content-between border-bottom py-2">
            <span><b>Children ({childCount})</b></span>
            <span className="fw-bold">{childPerPerson.toLocaleString()} PKR</span>
          </div>

          <div className="d-flex justify-content-between py-2">
            <span><b>Infants ({infantCount})</b></span>
            <span className="fw-bold">{infantPerPerson.toLocaleString()} PKR</span>
          </div>
        </div>
      </div>
    </div>
  );
}