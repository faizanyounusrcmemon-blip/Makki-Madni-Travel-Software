import "./packages.css";
import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

  const calcNights = (inD, outD) => {
    if (!inD || !outD) return "";
    const diff =
      (new Date(outD) - new Date(inD)) / (1000 * 60 * 60 * 24);
    return diff > 0 ? diff : "";
  };


export default function Packages({ onNavigate }) {
  // BACKEND REF NO
  const [refNo, setRefNo] = useState("");

// DATE DISPLAY HELPER
  const showDate = (val) => {
    if (!val) return "";
    const d = new Date(val);
    const day = String(d.getDate()).padStart(2, "0");
    const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = d.getFullYear();
    return `${day}/${mon}/${year}`;
  };


  // CUSTOMER
  const [customerName, setCustomerName] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [searchRef, setSearchRef] = useState("");

  // ============================
  // FLIGHT PERSONS
  // ============================
  const [adultCount, setAdultCount] = useState(0);
  const [adultRate, setAdultRate] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [childRate, setChildRate] = useState(0);
  const [infantCount, setInfantCount] = useState(0);
  const [infantRate, setInfantRate] = useState(0);

  const flightTotal =
    adultCount * adultRate +
    childCount * childRate +
    infantCount * infantRate;

  // ============================
  // FLIGHT DETAILS
  // ============================
  const [flights, setFlights] = useState([
    { date: "", from: "", to: "" },
    { date: "", from: "", to: "" },
  ]);

  // ============================
  // HOTELS
  // ============================
  const [hotels, setHotels] = useState([]);

  const addHotelRow = () =>
    setHotels([
      ...hotels,
      {
        checkIn: "",
        checkOut: "",
        nights: "",
        location: "",
        hotel: "",
        rooms: "",
        type: "",
        rate: "",
        total: 0,
      },
    ]);

  const removeHotelRow = (i) => setHotels(hotels.filter((_, x) => x !== i));

  const handleHotelChange = (i, field, value) => {
    const rows = [...hotels];
    rows[i][field] = value;

    if (field === "checkIn" || field === "checkOut") {
      rows[i].nights = calcNights(rows[i].checkIn, rows[i].checkOut);
    }

    const rate = Number(rows[i].rate);
    const rooms = Number(rows[i].rooms);
    const nights = Number(rows[i].nights);

    rows[i].total = rate * rooms * nights;
    setHotels(rows);
  };

  const hotelsTotal = hotels.reduce((sum, h) => sum + (h.total || 0), 0);

  // ============================
  // VISA
  // ============================
  const [visaPersons, setVisaPersons] = useState(0);
  const [visaRate, setVisaRate] = useState(0);
  const visaTotal = visaPersons * visaRate;

  // ============================
  // TRANSPORT
  // ============================
  const [transportRows, setTransportRows] = useState([]);

  const addTransportRow = () =>
    setTransportRows([...transportRows, { text: "", amount: 0 }]);

  const removeTransportRow = (i) =>
    setTransportRows(transportRows.filter((_, x) => x !== i));

  const transportTotal = transportRows.reduce(
    (sum, row) => sum + (Number(row.amount) || 0),
    0
  );

  // ============================
  // SUMMARY (PKR)
  // ============================
  const [flightRate, setFlightRate] = useState(0);
  const [hotelsRate, setHotelsRate] = useState(0);
  const [visaRatePKR, setVisaRatePKR] = useState(0);
  const [transportRate, setTransportRate] = useState(0);

  const flightPKR = flightTotal * flightRate;
  const hotelsPKR = hotelsTotal * hotelsRate;
  const visaPKR = visaTotal * visaRatePKR;
  const transportPKR = transportTotal * transportRate;
  const grandPKR = flightPKR + hotelsPKR + visaPKR + transportPKR;

  const [personQty, setPersonQty] = useState(1);
  const perPerson = personQty > 0 ? Math.round(grandPKR / personQty) : 0;

  const quoteRef = useRef(null);

  // ============================
  // PDF
  // ============================
  const handleExportPDF = async () => {

    quoteRef.current.classList.add("pdf-mode");

    const canvas = await html2canvas(quoteRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
  });

    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "a4",
  });

    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(img);
    const pdfWidth = w - 20; // margins
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    pdf.text("MAKKI MADNI TRAVEL", w / 2, 10, { align: "center" });

    let position = 15;
    let heightLeft = pdfHeight;
    const x = (w - pdfWidth) / 2;

    pdf.addImage(img, "PNG", x, position, pdfWidth, pdfHeight);
    heightLeft -= h;

    while (heightLeft > 0) {
      position = heightLeft - pdfHeight + 15;
      pdf.addPage();
      pdf.addImage(img, "PNG", x, position, pdfWidth, pdfHeight);
      heightLeft -= h;
    }

    pdf.save(`${refNo || "quotation"}.pdf`);

    quoteRef.current.classList.remove("pdf-mode");
  };
// =======================================
// LOAD SAVED PACKAGE (EDIT MODE)
// =======================================
   const loadPackage = async () => {
     if (!searchRef) return alert("Search Ref No likho");

     const res = await fetch(
     `${import.meta.env.VITE_BACKEND_URL}/api/bookings/get/${searchRef}`
   );
     const data = await res.json();

     if (!data.success) return alert("Record not found");

     const d = data.row;

  // BASIC
     setCustomerName(d.customer_name);
     setBookingDate(d.booking_date);

  // FLIGHT PERSONS
     setAdultCount(d.adult_count);
     setAdultRate(d.adult_rate);
     setChildCount(d.child_count);
     setChildRate(d.child_rate);
     setInfantCount(d.infant_count);
     setInfantRate(d.infant_rate);

  // FLIGHTS
     setFlights(d.flights || []);

  // HOTELS
     setHotels(d.hotels || []);

  // VISA
     setVisaPersons(d.visa_persons);
     setVisaRate(d.visa_rate);

  // TRANSPORT
     setTransportRows(d.transport || []);

  // SUMMARY RATES
     setFlightRate(d.flight_sar_rate);
     setHotelsRate(d.hotel_sar_rate);
     setVisaRatePKR(d.visa_sar_rate);
     setTransportRate(d.transport_sar_rate);

     setPersonQty(d.per_person_qty || 1);

     alert("Package load ho gaya — ab edit karo");
  };


  // ============================
  // SAVE PACKAGE  (ONLY THIS PART UPDATED)
  // ============================
  const handleSavePackage = async () => {
    const payload = {
      ref_no: refNo || null,
      
      customer_name: customerName,
      booking_date: bookingDate,

      // ✅ FLIGHT PERSONS (FIX)
      adult_count: adultCount,
      adult_rate: adultRate,
      child_count: childCount,
      child_rate: childRate,
      infant_count: infantCount,
      infant_rate: infantRate,
      flight_total: flightTotal,

      // ✅ FLIGHT DETAILS
      flights,

      // ✅ HOTELS
      hotels,
      hotels_total: hotelsTotal,

      // ✅ VISA (FIX)
      visa_persons: visaPersons,
      visa_rate: visaRate,
      visa_total: visaTotal,

      // ✅ TRANSPORT
      transport: transportRows,
      transport_total: transportTotal,

      // ✅ SAR TOTALS
      flight_sar_total: flightTotal,
      hotel_sar_total: hotelsTotal,
      visa_sar_total: visaTotal,
      transport_sar_total: transportTotal,

      // ✅ SAR RATES
      flight_sar_rate: flightRate,
      hotel_sar_rate: hotelsRate,
      visa_sar_rate: visaRatePKR,
      transport_sar_rate: transportRate,

      // ✅ PKR TOTALS
      flight_pkr_total: flightPKR,
      hotel_pkr_total: hotelsPKR,
      visa_pkr_total: visaPKR,
      transport_pkr_total: transportPKR,

      // ✅ NET
      net_pkr_total: grandPKR,

      // ✅ OLD FIELDS (BACKWARD SAFE)
      total_sar: flightTotal + hotelsTotal + visaTotal + transportTotal,
      total_pkr: grandPKR,
      per_person_qty: personQty,
      per_person_final: perPerson
    };
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/bookings/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );

    const data = await res.json();
    if (data.success) {
      setRefNo(data.ref_no);
      alert("Saved Successfully! Ref#: " + data.ref_no);
      onNavigate("bookings");
    } else {
      alert("Error: " + data.error);
    }
  };

  // =====================================================
  // UI START
  // =====================================================

  return (
    <div className="package-page">
      {/* TOP BAR */}
      <div className="d-flex justify-content-between mb-3">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>

        <div className="d-flex gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSavePackage}
          >
            💾 Save
          </button>
          <input
            className="form-control form-control-sm"
            style={{ width: "150px" }}
            placeholder="Search Ref No"
            value={searchRef}
            onChange={(e) => setSearchRef(e.target.value)}
          />


          <button
            className="btn btn-warning btn-sm"
            onClick={loadPackage}
          >
            🔄 Load / Edit
          </button>


          <button className="btn btn-success btn-sm" onClick={handleExportPDF}>
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* QUOTATION BODY */}
      <div ref={quoteRef} className="quote-card">

        <h3 className="brand-title">✈️ MAKKI MADNI TRAVEL</h3>
        <h4 className="fw-bold mb-3">PACKAGE QUOTATION</h4>

        {/* CUSTOMER INFO */}
        <div className="d-flex gap-3 mb-3">
          <div>
            <label>Ref No</label>
            <input className="form-control form-control-sm" value={refNo} readOnly />
          </div>

          <div>
            <label>Customer Name</label>
            <input
              className="form-control form-control-sm"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </div>

          <div>
            <label>Booking Date</label>
            <input
              type="date"
              className="form-control form-control-sm"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
            />
            <small className="text-muted">{showDate(bookingDate)}</small>
          </div>
        </div>

        {/* =============================
            FLIGHT SECTION (FULL)
        ============================= */}
        <h6 className="section-title">✈️ Flight</h6>

        <table className="table table-sm">
          <thead>
            <tr>
              <th>Details</th>
              <th>Adult</th>
              <th>Child</th>
              <th>Infant</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>
                {flights.map((f, idx) => (
                  <div key={idx} className="d-flex gap-2 mb-1">
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={f.date}
                      onChange={(e) => {
                        const updated = [...flights];
                        updated[idx].date = e.target.value;
                        setFlights(updated);
                      }}
                    />
                    <small className="text-muted">{showDate(f.date)}</small>

                    <input
                      type="text"
                      placeholder="From"
                      className="form-control form-control-sm"
                      value={f.from}
                      onChange={(e) => {
                        const updated = [...flights];
                        updated[idx].from = e.target.value;
                        setFlights(updated);
                      }}
                    />

                    <input
                      type="text"
                      placeholder="To"
                      className="form-control form-control-sm"
                      value={f.to}
                      onChange={(e) => {
                        const updated = [...flights];
                        updated[idx].to = e.target.value;
                        setFlights(updated);
                      }}
                    />
                  </div>
                ))}
              </td>

              {/* ADULT */}
              <td>
                Qty:
                <input
                  type="number"
                  value={adultCount}
                  className="form-control form-control-sm"
                  onChange={(e) => setAdultCount(+e.target.value)}
                />
                Rate:
                <input
                  type="number"
                  value={adultRate}
                  className="form-control form-control-sm"
                  onChange={(e) => setAdultRate(+e.target.value)}
                />
              </td>

              {/* CHILD */}
              <td>
                Qty:
                <input
                  type="number"
                  value={childCount}
                  className="form-control form-control-sm"
                  onChange={(e) => setChildCount(+e.target.value)}
                />
                Rate:
                <input
                  type="number"
                  value={childRate}
                  className="form-control form-control-sm"
                  onChange={(e) => setChildRate(+e.target.value)}
                />
              </td>

              {/* INFANT */}
              <td>
                Qty:
                <input
                  type="number"
                  value={infantCount}
                  className="form-control form-control-sm"
                  onChange={(e) => setInfantCount(+e.target.value)}
                />
                Rate:
                <input
                  type="number"
                  value={infantRate}
                  className="form-control form-control-sm"
                  onChange={(e) => setInfantRate(+e.target.value)}
                />
              </td>

              <td className="fw-bold">{flightTotal.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        {/* =============================
            HOTELS SECTION
        ============================= */}
        <h6 className="section-title">🏨 Hotels</h6>

        <button className="btn btn-outline-primary btn-sm mb-2" onClick={addHotelRow}>
          ➕ Add Hotel Row
        </button>

        <table className="table table-sm">
          <thead>
            <tr>
              <th style={{ width: "140px" }}>Check-in</th>
              <th style={{ width: "140px" }}>Check-out</th>
              <th style={{ width: "110px" }}>Nights</th>
              <th style={{ width: "190px" }}>Location</th>

              <th style={{ width: "380px" }}>Hotel (Full Row)</th>

              <th style={{ width: "120px" }}>Rooms</th>
              <th style={{ width: "150px" }}>Type</th>
              <th style={{ width: "140px" }}>Rate</th>
              <th style={{ width: "140px" }}>Total</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {hotels.map((h, i) => (
              <>
                {/* HOTEL NAME FULL WIDTH */}
                <tr key={i + "-hotelname"}>
                  <td colSpan={10}>
                    <input
                      type="text"
                      className="form-control form-control-sm fw-bold"
                      placeholder="HOTEL NAME"
                      value={h.hotel}
                      onChange={(e) =>
                        handleHotelChange(i, "hotel", e.target.value)
                      }
                    />
                  </td>
                </tr>

                {/* DETAIL ROW */}
                <tr key={i}>
                  <td>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={h.checkIn}
                      onChange={(e) =>
                        handleHotelChange(i, "checkIn", e.target.value)
                      }
                    />
                    <small className="text-muted">{showDate(h.checkIn)}</small>
                  </td>

                  <td>
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={h.checkOut}
                      onChange={(e) =>
                        handleHotelChange(i, "checkOut", e.target.value)
                      }
                    />
                    <small className="text-muted">{showDate(h.checkOut)}</small>
                  </td>

                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={h.nights}
                      readOnly
                    />
                  </td>

                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={h.location}
                      onChange={(e) =>
                        handleHotelChange(i, "location", e.target.value)
                      }
                    />
                  </td>

                  <td className="text-muted text-center">—</td>

                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={h.rooms}
                      onChange={(e) =>
                        handleHotelChange(i, "rooms", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      value={h.type}
                      onChange={(e) =>
                        handleHotelChange(i, "type", e.target.value)
                      }
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={h.rate}
                      onChange={(e) =>
                        handleHotelChange(i, "rate", e.target.value)
                      }
                    />
                  </td>

                  <td className="fw-bold">{h.total}</td>

                  <td>
                    <button
                      className="btn btn-link text-danger"
                      onClick={() => removeHotelRow(i)}
                    >
                      ✖
                    </button>
                  </td>
                </tr>
              </>
            ))}
          </tbody>
        </table>

        <div className="fw-bold text-end mb-3">
          Hotels Total: {hotelsTotal.toLocaleString()}
        </div>

        {/* =============================
            VISA SECTION
        ============================= */}
        <h6 className="section-title">🛂 Visa</h6>

        <table className="table table-sm">
          <tbody>
            <tr>
              <td width="150">Persons</td>
              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={visaPersons}
                  onChange={(e) => setVisaPersons(+e.target.value)}
                />
              </td>

              <td width="150">Rate</td>
              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={visaRate}
                  onChange={(e) => setVisaRate(+e.target.value)}
                />
              </td>

              <td className="fw-bold">{visaTotal.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

        {/* =============================
            TRANSPORT SECTION
        ============================= */}
        <h6 className="section-title">🚐 Transport</h6>

        <button
          className="btn btn-outline-primary btn-sm mb-2"
          onClick={addTransportRow}
        >
          ➕ Add Transport Row
        </button>

        <table className="table table-sm">
          <tbody>
            {transportRows.map((t, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    value={t.text}
                    onChange={(e) => {
                      const updated = [...transportRows];
                      updated[i].text = e.target.value;
                      setTransportRows(updated);
                    }}
                  />
                </td>

                <td width="150">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={t.amount}
                    onChange={(e) => {
                      const updated = [...transportRows];
                      updated[i].amount = +e.target.value;
                      setTransportRows(updated);
                    }}
                  />
                </td>

                <td>
                  <button
                    className="btn btn-link text-danger"
                    onClick={() => removeTransportRow(i)}
                  >
                    ✖
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {transportRows.length > 0 && (
          <div className="fw-bold text-end mb-3">
            Transport Total: {transportTotal.toLocaleString()}
          </div>
        )}

        {/* =============================
            SUMMARY SECTION
        ============================= */}
        <h6 className="section-title">📊 Summary</h6>

        <table className="table table-sm">
          <thead>
            <tr>
              <th>Item</th>
              <th>SAR</th>
              <th>Rate</th>
              <th>PKR</th>
            </tr>
          </thead>

          <tbody>
            {/* FLIGHT */}
            <tr>
              <td>Flight</td>
              <td>{flightTotal.toLocaleString()}</td>
              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={flightRate}
                  onChange={(e) => setFlightRate(+e.target.value)}
                />
              </td>
              <td className="fw-bold">{flightPKR.toLocaleString()}</td>
            </tr>

            {/* HOTELS */}
            <tr>
              <td>Hotels</td>
              <td>{hotelsTotal.toLocaleString()}</td>
              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={hotelsRate}
                  onChange={(e) => setHotelsRate(+e.target.value)}
                />
              </td>
              <td className="fw-bold">{hotelsPKR.toLocaleString()}</td>
            </tr>

            {/* VISA */}
            <tr>
              <td>Visa</td>
              <td>{visaTotal.toLocaleString()}</td>
              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={visaRatePKR}
                  onChange={(e) => setVisaRatePKR(+e.target.value)}
                />
              </td>
              <td className="fw-bold">{visaPKR.toLocaleString()}</td>
            </tr>

            {/* TRANSPORT */}
            <tr>
              <td>Transport</td>
              <td>{transportTotal.toLocaleString()}</td>
              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={transportRate}
                  onChange={(e) => setTransportRate(+e.target.value)}
                />
              </td>
              <td className="fw-bold">{transportPKR.toLocaleString()}</td>
            </tr>

            {/* GRAND TOTAL */}
            <tr className="table-info">
              <td className="fw-bold">Grand Total PKR</td>
              <td></td>
              <td></td>
              <td className="fw-bold">{grandPKR.toLocaleString()}</td>
            </tr>

            {/* PER PERSON */}
            <tr style={{ background: "#f1f1f1" }}>
              <td className="fw-bold">Per Person</td>
              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={personQty}
                  onChange={(e) => setPersonQty(+e.target.value)}
                />
              </td>
              <td></td>
              <td className="fw-bold">{perPerson.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

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
