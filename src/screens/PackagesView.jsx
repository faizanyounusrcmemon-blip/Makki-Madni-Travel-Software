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
{/* ===== COMPACT VIP COLORFUL GIFTING ===== */}
{showGift && (
  <div className="my-2">
    <div
      className="position-relative overflow-hidden rounded-4"
      style={{
        background:
          "linear-gradient(135deg, #fff7ed 0%, #fef3c7 45%, #fce7f3 100%)",
        border: "1px solid #f3c56b",
        boxShadow: "0 5px 16px rgba(146,64,14,.10)",
      }}
    >
      {/* ===== DECORATIVE COLORFUL GLOW ===== */}
      <div
        className="position-absolute"
        style={{
          width: "110px",
          height: "110px",
          right: "-40px",
          top: "-50px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(236,72,153,.18) 0%, rgba(236,72,153,.04) 65%, transparent 72%)",
          pointerEvents: "none",
        }}
      />

      <div
        className="position-absolute"
        style={{
          width: "85px",
          height: "85px",
          left: "-35px",
          bottom: "-40px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(59,130,246,.13) 0%, rgba(59,130,246,.03) 65%, transparent 72%)",
          pointerEvents: "none",
        }}
      />

      {/* ===== MAIN CONTENT ===== */}
      <div className="px-3 py-2 position-relative">

        {/* =====================================================
            HEADER
        ====================================================== */}
        <div className="d-flex justify-content-between align-items-center mb-2">

          {/* LEFT HEADER */}
          <div className="d-flex align-items-center gap-2">

            {/* Gift Icon */}
            <div
              className="d-flex align-items-center justify-content-center rounded-3 position-relative"
              style={{
                width: "39px",
                height: "39px",
                flexShrink: 0,
                background:
                  "linear-gradient(135deg, #f59e0b 0%, #ef4444 55%, #ec4899 100%)",
                color: "#fff",
                fontSize: "18px",
                boxShadow:
                  "0 4px 10px rgba(239,68,68,.25)",
                border: "2px solid rgba(255,255,255,.85)",
              }}
            >
              🎁

              {/* Sparkle */}
              <span
                className="position-absolute"
                style={{
                  top: "-7px",
                  right: "-6px",
                  fontSize: "11px",
                  lineHeight: 1,
                }}
              >
                ✨
              </span>
            </div>

            {/* Heading */}
            <div>
              <div
                className="fw-bold"
                style={{
                  color: "#7c2d12",
                  fontSize: "13px",
                  lineHeight: "1.1",
                  letterSpacing: ".5px",
                }}
              >
                COMPLIMENTARY GIFT
              </div>

              <div
                style={{
                  color: "#b45309",
                  fontSize: "9px",
                  marginTop: "3px",
                }}
              >
                Special gift included with your booking
              </div>
            </div>
          </div>

          {/* VIP BADGE */}
          <span
            className="d-inline-flex align-items-center rounded-pill px-2 py-1"
            style={{
              background:
                "linear-gradient(135deg, #ec4899, #8b5cf6)",
              color: "#fff",
              fontSize: "8px",
              fontWeight: "800",
              letterSpacing: ".5px",
              boxShadow:
                "0 3px 8px rgba(139,92,246,.22)",
              whiteSpace: "nowrap",
            }}
          >
            ✨ VIP
          </span>
        </div>

        {/* =====================================================
            GOLDEN DIVIDER
        ====================================================== */}
        <div
          className="d-flex align-items-center gap-2 mb-2"
          style={{ opacity: 0.75 }}
        >
          <div
            style={{
              height: "1px",
              flex: 1,
              background:
                "linear-gradient(90deg, transparent, #eab308)",
            }}
          />

          <span
            style={{
              color: "#d97706",
              fontSize: "9px",
            }}
          >
            ✦
          </span>

          <div
            style={{
              height: "1px",
              flex: 1,
              background:
                "linear-gradient(90deg, #eab308, transparent)",
            }}
          />
        </div>

        {/* =====================================================
            GIFT ITEMS CARD
        ====================================================== */}
        <div
          className="rounded-3 overflow-hidden"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,.95), rgba(255,251,235,.92))",
            border: "1px solid rgba(245,158,11,.28)",
            boxShadow:
              "0 3px 10px rgba(120,53,15,.05)",
          }}
        >
          {Array.isArray(data.gifting) &&
          data.gifting.length > 0 ? (
            data.gifting.map((g, i) => (
              <div
                key={i}
                className="d-flex justify-content-between align-items-center px-2 py-2"
                style={{
                  borderBottom:
                    i !== data.gifting.length - 1
                      ? "1px solid rgba(245,158,11,.15)"
                      : "none",
                }}
              >
                {/* ================= LEFT ================= */}
                <div
                  className="d-flex align-items-center gap-2"
                  style={{
                    minWidth: 0,
                  }}
                >
                  {/* Gift Bullet */}
                  <span
                    className="d-flex align-items-center justify-content-center rounded-circle"
                    style={{
                      width: "25px",
                      height: "25px",
                      flexShrink: 0,
                      background:
                        "linear-gradient(135deg, #fef3c7, #fce7f3)",
                      color: "#e11d48",
                      fontSize: "11px",
                      border: "1px solid #f9c2d5",
                    }}
                  >
                    ✦
                  </span>

                  {/* ITEM INFO */}
                  <div
                    style={{
                      minWidth: 0,
                    }}
                  >
                    {/* Item Name */}
                    <div
                      className="fw-semibold"
                      style={{
                        color: "#3f3f46",
                        fontSize: "11px",
                        lineHeight: "1.15",
                      }}
                    >
                      {g.item ||
                        g.gift_item ||
                        g.name ||
                        "Gift Item"}
                    </div>

                    {/* ================= QTY ================= */}
                    {g.qty !== undefined &&
                      g.qty !== null &&
                      g.qty !== "" && (
                        <span
                          className="d-inline-flex align-items-center mt-1 px-2 py-1 rounded-pill"
                          style={{
                            background:
                              "linear-gradient(135deg, #fef3c7 0%, #fce7f3 100%)",
                            color: "#9d174d",
                            border:
                              "1px solid #f5b7c9",
                            fontSize: "9px",
                            fontWeight: "800",
                            lineHeight: "1",
                            boxShadow:
                              "0 2px 5px rgba(190,24,93,.08)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          <span
                            style={{
                              fontSize: "9px",
                              marginRight: "3px",
                            }}
                          >
                            🎁
                          </span>

                          QTY: {g.qty}
                        </span>
                      )}
                  </div>
                </div>

                {/* ================= RIGHT AMOUNT ================= */}
                {!hideAmounts && g.rate ? (
                  <div
                    className="text-end ms-2"
                    style={{
                      minWidth: "75px",
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        color: "#b45309",
                        fontSize: "7px",
                        fontWeight: "700",
                        letterSpacing: ".5px",
                      }}
                    >
                      GIFT VALUE
                    </div>

                    <div
                      className="fw-bold text-nowrap"
                      style={{
                        color: "#be123c",
                        fontSize: "10px",
                        marginTop: "1px",
                      }}
                    >
                      {Number(g.rate).toLocaleString()}

                      <span
                        style={{
                          color: "#7c3aed",
                          fontSize: "8px",
                          marginLeft: "3px",
                        }}
                      >
                        PKR
                      </span>
                    </div>
                  </div>
                ) : null}
              </div>
            ))
          ) : (
            /* =================================================
               NO GIFT ARRAY
            ================================================== */
            <div className="px-2 py-2 d-flex align-items-center gap-2">

              <span
                className="d-flex align-items-center justify-content-center rounded-circle"
                style={{
                  width: "26px",
                  height: "26px",
                  flexShrink: 0,
                  background:
                    "linear-gradient(135deg,#fef3c7,#fce7f3)",
                  color: "#e11d48",
                  fontSize: "11px",
                  border: "1px solid #f9c2d5",
                }}
              >
                ✦
              </span>

              <span
                className="fw-semibold"
                style={{
                  color: "#3f3f46",
                  fontSize: "11px",
                }}
              >
                {data.gift ||
                  data.gift_details ||
                  "Complimentary Gift Included"}
              </span>
            </div>
          )}
        </div>

        {/* =====================================================
            TOTAL GIFT VALUE
        ====================================================== */}
        {!hideAmounts && (
          <div
            className="d-flex justify-content-between align-items-center mt-2 pt-2"
            style={{
              borderTop:
                "1px dashed rgba(217,119,6,.35)",
            }}
          >
            {/* LEFT */}
            <div>
              <div
                className="fw-bold"
                style={{
                  color: "#c2410c",
                  fontSize: "8px",
                  letterSpacing: ".7px",
                }}
              >
                🎀 GIFT VALUE
              </div>

              <div
                style={{
                  color: "#a16207",
                  fontSize: "8px",
                  marginTop: "2px",
                }}
              >
                Complimentary benefit included
              </div>
            </div>

            {/* RIGHT TOTAL */}
            <div
              className="fw-bold px-2 py-1 rounded-3"
              style={{
                background:
                  "linear-gradient(135deg,#fef3c7,#fce7f3)",
                color: "#be123c",
                border: "1px solid #f5c2d7",
                fontSize: "13px",
                boxShadow:
                  "0 2px 7px rgba(190,24,93,.08)",
                whiteSpace: "nowrap",
              }}
            >
              {giftPKR.toLocaleString()}

              <span
                style={{
                  fontSize: "8px",
                  marginLeft: "3px",
                  color: "#7c3aed",
                }}
              >
                PKR
              </span>
            </div>
          </div>
        )}

        {/* =====================================================
            FOOTER
        ====================================================== */}
        <div
          className="text-center mt-1"
          style={{
            color: "#c2410c",
            fontSize: "7px",
            letterSpacing: ".6px",
          }}
        >
          ✨ WITH OUR COMPLIMENTS ✨
        </div>

      </div>
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