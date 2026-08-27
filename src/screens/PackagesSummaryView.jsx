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

export default function PackagesViewSummary({ id, onNavigate, fromPage }) {
  const [data, setData] = useState(null);

  // CONTROL SWITCHES
  const [showGift, setShowGift] = useState(false);
  const [showAgentComm, setShowAgentComm] = useState(false);

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

  if (!data) return <div className="p-4">Loading Package Summary...</div>;

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

  const flightPKR = Number(data.flight_pkr_total || flightTotal * rate.flight);
  const hotelsPKR = Number(data.hotel_pkr_total || hotelsTotal * rate.hotels);
  const visaPKR = Number(data.visa_pkr_total || visaTotal * rate.visa);
  const transportPKR = Number(data.transport_pkr_total || transportTotal * rate.transport);
  const ziyaratPKR = Number(data.ziyarat_pkr_total || ziyaratTotal * rate.ziyarat);

  // Gifting PKR Total
  let giftPKR = Number(data.gifting_total || data.gifting_pkr_total || 0);
  if (!giftPKR && Array.isArray(data.gifting)) {
    giftPKR = data.gifting.reduce((acc, item) => {
      const itemTotal = Number(item.total || Number(item.qty || 0) * Number(item.rate || 0));
      return acc + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
  }

  // Agent Commission PKR Total
  let agentCommPKR = Number(data.agent_comm_total || data.agent_commission_pkr || 0);
  if (!agentCommPKR && Array.isArray(data.agent_comm)) {
    agentCommPKR = data.agent_comm.reduce((acc, item) => {
      const itemTotal = Number(item.total || Number(item.persons || 0) * Number(item.rate || 0));
      return acc + (isNaN(itemTotal) ? 0 : itemTotal);
    }, 0);
  }
  if (isNaN(agentCommPKR)) agentCommPKR = 0;

  // GRAND TOTAL INCLUDING AGENT COMM AND GIFTING (IF TOGGLED)
  const grandPKR =
    flightPKR +
    hotelsPKR +
    visaPKR +
    transportPKR +
    ziyaratPKR +
    (showGift ? giftPKR : 0) +
    (showAgentComm ? agentCommPKR : 0);

  // ================= PER PERSON CALCULATION =================
  const adultCount = Number(data.adult_count || 0);
  const childCount = Number(data.child_count || 0);
  const infantCount = Number(data.infant_count || 0);

  const totalPassengers = adultCount + childCount + infantCount;

  const adultFlightPKR = adultCount * Number(data.adult_rate || 0) * rate.flight;
  const childFlightPKR = childCount * Number(data.child_rate || 0) * rate.flight;
  const infantFlightPKR = infantCount * Number(data.infant_rate || 0) * rate.flight;

  // Visa & Agent Comm divided equally among all passengers
  const visaPerPerson = totalPassengers > 0 ? visaPKR / totalPassengers : 0;
  const agentCommPerPerson =
    showAgentComm && totalPassengers > 0 ? agentCommPKR / totalPassengers : 0;

  // Hotels, Transport, Ziyarat & Gift shared only among adults
  const sharedPKR = hotelsPKR + transportPKR + ziyaratPKR + (showGift ? giftPKR : 0);
  const sharedPerAdult = adultCount > 0 ? sharedPKR / adultCount : 0;

  const adultPerPerson = Math.round(
    adultCount > 0 ? adultFlightPKR / adultCount + visaPerPerson + sharedPerAdult + agentCommPerPerson : 0
  );

  const childPerPerson = Math.round(
    childCount > 0 ? childFlightPKR / childCount + visaPerPerson + agentCommPerPerson : 0
  );

  const infantPerPerson = Math.round(
    infantCount > 0 ? infantFlightPKR / infantCount + visaPerPerson + agentCommPerPerson : 0
  );

  return (
    <div className="container mt-3 mb-5">
      {/* ============ TOP ACTIONS & TOGGLES ============ */}
      <div className="d-flex justify-content-between mb-3 align-items-center flex-wrap gap-2">
        <div className="d-flex gap-2">
          <button
            className="btn btn-sm text-white fw-bold shadow"
            style={{
              background: "linear-gradient(135deg,#000,#434343)",
              borderRadius: 8,
              padding: "6px 16px",
            }}
            onClick={() => onNavigate(fromPage || "allreports")}
          >
            ⬅ Back
          </button>
        </div>

        {/* TOGGLE SWITCHES */}
        <div className="d-flex gap-3 bg-white p-2 rounded shadow-sm border align-items-center">
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
            <p className="m-0">No flights</p>
          )}
        </div>
        <p>
          Adults: {data.adult_count} × {data.adult_rate} <br />
          Child: {data.child_count} × {data.child_rate} <br />
          Infant: {data.infant_count} × {data.infant_rate} <br />
          <b>Flight SAR:</b> {flightTotal.toLocaleString()} <br />
          <b>SAR Rate:</b> {rate.flight} <br />
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
              Rate: {h.rate} — Total: {h.total}
            </div>
          ))
        ) : (
          <p>No hotels</p>
        )}
        <p>
          <b>Hotel SAR:</b> {hotelsTotal.toLocaleString()} <br />
          <b>SAR Rate:</b> {rate.hotels} <br />
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
          <b>SAR Rate:</b> {rate.visa} <br />
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
          <b>SAR Rate:</b> {rate.transport} <br />
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
          <b>SAR Rate:</b> {rate.ziyarat} <br />
          <b>Ziyarat PKR:</b> {ziyaratPKR.toLocaleString()}
        </p>

        {/* ===== GIFTING SECTION ===== */}
        {showGift && (
          <>
            <hr />
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
                        {g.rate ? (
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

                <div className="d-flex justify-content-end align-items-center pt-1">
                  <span className="small text-muted me-2">Gifting Value:</span>
                  <span className="fw-bold text-dark fs-6" style={{ color: "#92400e" }}>
                    {giftPKR.toLocaleString()} PKR
                  </span>
                </div>
              </div>
            </div>
          </>
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
                    {a.rate ? ` — Rate: ${a.rate} PKR` : ""}
                  </div>
                ))
              ) : (
                <p className="m-0">
                  <b>Agent Name / Details:</b> {data.agent_name || "Agent Commission"}
                </p>
              )}
              <p className="m-0 mt-1 fw-bold text-dark">
                Commission Amount: {agentCommPKR.toLocaleString()} PKR
              </p>
            </div>
          </>
        )}

        <hr />

        <h4 className="fw-bold text-end text-success">
          NET PKR TOTAL: {grandPKR.toLocaleString()} PKR
        </h4>  

        <hr />

        {/* ===== SUMMARY TABLE ===== */}
        <h6 className="fw-bold mb-2">📊 Summary</h6>
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
            {showGift && (
              <tr>
                <td>Gifting</td>
                <td>—</td>
                <td>—</td>
                <td className="fw-bold">{giftPKR.toLocaleString()}</td>
              </tr>
            )}
            {showAgentComm && (
              <tr>
                <td>Agent Commission</td>
                <td>—</td>
                <td>—</td>
                <td className="fw-bold">{agentCommPKR.toLocaleString()}</td>
              </tr>
            )}
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
              <td className="fw-bold">{adultPerPerson.toLocaleString()} PKR</td>
            </tr>
            <tr style={{ background: "#f1f1f1" }}>
              <td className="fw-bold">Per Person (Children)</td>
              <td>{childCount}</td>
              <td></td>
              <td className="fw-bold">{childPerPerson.toLocaleString()} PKR</td>
            </tr>
            <tr style={{ background: "#f1f1f1" }}>
              <td className="fw-bold">Per Person (Infants)</td>
              <td>{infantCount}</td>
              <td></td>
              <td className="fw-bold">{infantPerPerson.toLocaleString()} PKR</td>
            </tr>
          </tbody>
        </table>

        <hr />

        {/* FOOTER NOTE */}
        <div
          className="mt-2 p-2 text-center small rounded"
          style={{ background: "#12c1d8", color: "white" }}
        >
          THESE ARE TENTATIVE RATES AND CAN CHANGE WITHOUT NOTICE.
          PACKAGE CAN BE FINALIZED AFTER BOOKING PAYMENTS AND MAY VARY WITH ROE.
        </div>
      </div>
    </div>
  );
}