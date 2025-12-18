import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function Booking({ onBack }) {
  const [agencyName] = useState("Makki Madni Travel");

  // CUSTOMER INFO
  const [customerName, setCustomerName] = useState("");
  const [bookingDate, setBookingDate] = useState("");

  // FLIGHT PERSON SYSTEM
  const [adultCount, setAdultCount] = useState(1);
  const [adultRate, setAdultRate] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [childRate, setChildRate] = useState(0);

  const flightTotal = adultCount * adultRate + childCount * childRate;
  const totalPersons = adultCount + childCount;

  // FLIGHTS (2 legs)
  const [flights, setFlights] = useState([
    { date: "2025-11-12", from: "DXB", to: "JED" },
    { date: "2025-11-24", from: "JED", to: "DXB" },
  ]);

  // HOTELS
  const [hotels, setHotels] = useState([
    {
      checkIn: "2025-11-12",
      checkOut: "2025-11-19",
      nights: 7,
      location: "MAKKAH",
      hotel: "FUNDAQ BILAL",
      rooms: 1,
      type: "DOUBLE",
      rate: 100,
      total: 700,
    },
    {
      checkIn: "2025-11-19",
      checkOut: "2025-11-22",
      nights: 3,
      location: "MADINAH",
      hotel: "GRAND ZOWAR",
      rooms: 1,
      type: "DOUBLE",
      rate: 300,
      total: 900,
    },
  ]);

  const quoteRef = useRef(null);

  const handleHotelChange = (index, field, value) => {
    const updated = [...hotels];
    if (["rate", "rooms", "nights"].includes(field)) {
      value = Number(value) || 0;
    }
    updated[index][field] = value;
    updated[index].total =
      (Number(updated[index].rate) || 0) *
      (Number(updated[index].nights) || 0) *
      (Number(updated[index].rooms) || 0);
    setHotels(updated);
  };

  const addHotelRow = () => {
    setHotels([
      ...hotels,
      {
        checkIn: "",
        checkOut: "",
        nights: 1,
        location: "",
        hotel: "",
        rooms: 1,
        type: "DOUBLE",
        rate: 0,
        total: 0,
      },
    ]);
  };

  const removeHotelRow = (i) => {
    setHotels(hotels.filter((_, x) => x !== i));
  };

  const hotelsTotal = hotels.reduce((s, h) => s + (Number(h.total) || 0), 0);

  // VISA
  const [visaPersons, setVisaPersons] = useState(2);
  const [visaRate, setVisaRate] = useState(750);
  const visaTotal = (Number(visaPersons) || 0) * (Number(visaRate) || 0);

  // TRANSPORT (multiple rows)
  const [transportRows, setTransportRows] = useState([
    { text: "JED MAKKAH MADINAH JED", amount: 1250 },
  ]);

  const transportTotal = transportRows.reduce(
    (sum, r) => sum + (Number(r.amount) || 0),
    0
  );

  const addTransportRow = () =>
    setTransportRows([...transportRows, { text: "", amount: 0 }]);

  const removeTransportRow = (index) =>
    setTransportRows(transportRows.filter((_, i) => i !== index));

  // ROE
  const [roe, setRoe] = useState(77.5);

  // MAIN GRAND TOTALS
  const grandSar = hotelsTotal + visaTotal + transportTotal + flightTotal;
  const totalPKR = grandSar * (Number(roe) || 0);

  // OLD PKG PER PERSON (adult + child se)
  const pkgPerPerson =
    totalPersons > 0 ? Math.round(totalPKR / totalPersons) : 0;

  // NEW — MANUAL PERSON QTY (Summary last row)
  const [personQty, setPersonQty] = useState(1);
  const manualPerPerson =
    personQty > 0 ? Math.round(totalPKR / Number(personQty)) : 0;

  // PDF EXPORT
  const handleExportPDF = async () => {
    if (!quoteRef.current) return;
    const canvas = await html2canvas(quoteRef.current, { scale: 2 });
    const img = canvas.toDataURL("image/png");

    const pdf = new jsPDF("l", "mm", "a4");
    const w = pdf.internal.pageSize.getWidth();
    const h = (canvas.height * w) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, w, h);
    pdf.save(`quotation-${Date.now()}.pdf`);
  };

  // SAVE TO BACKEND
  const handleSaveBooking = async () => {
    const payload = {
      customer_name: customerName,
      booking_date: bookingDate,

      adult_count: adultCount,
      adult_rate: adultRate,
      child_count: childCount,
      child_rate: childRate,
      flight_total: flightTotal,

      flights,
      hotels,
      hotels_total: hotelsTotal,

      visa_persons: visaPersons,
      visa_rate: visaRate,
      visa_total: visaTotal,

      transport: transportRows,
      transport_total: transportTotal,

      total_sar: grandSar,
      roe,
      total_pkr: totalPKR,

      pkg_per_person: pkgPerPerson,
      total_persons: totalPersons,

      per_person_qty: personQty,
      per_person_final: manualPerPerson,
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
    if (data.success) alert("Saved Successfully!");
    else alert("Error: " + data.error);
  };

  return (
    <div
      className="container-fluid py-3"
      style={{ background: "#f2f8fb", minHeight: "100vh" }}
    >
      {/* TOP BUTTONS */}
      <div className="d-flex justify-content-between mb-3">
        <button className="btn btn-secondary btn-sm" onClick={onBack}>
          ⬅ Back
        </button>

        <div className="d-flex gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSaveBooking}
          >
            💾 Save Booking
          </button>
          <button
            className="btn btn-success btn-sm"
            onClick={handleExportPDF}
          >
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* QUOTATION CARD */}
      <div
        ref={quoteRef}
        className="mx-auto bg-white"
        style={{
          maxWidth: "1100px",
          border: "1px solid #ccc",
          boxShadow: "0px 0px 10px rgba(0,0,0,0.15)",
        }}
      >
        {/* HEADER STRIP */}
        <div
          style={{
            background: "#00a8e8",
            height: "70px",
            position: "relative",
          }}
        >
          <h2
            style={{
              position: "absolute",
              left: "20px",
              bottom: "10px",
              color: "white",
              fontWeight: "bold",
            }}
          >
            {agencyName}
          </h2>
        </div>

        <div className="p-3">
          {/* TITLE */}
          <h5
            style={{
              fontWeight: "bold",
              borderBottom: "2px solid #00bcd4",
              color: "#00838f",
            }}
          >
            QUOTATION
          </h5>

          {/* CUSTOMER INFO */}
          <div className="d-flex gap-3 mb-3">
            <div>
              <label className="form-label">Customer Name</label>
              <input
                type="text"
                className="form-control form-control-sm"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Booking Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={bookingDate}
                onChange={(e) => setBookingDate(e.target.value)}
              />
            </div>
          </div>

          {/* FLIGHT SECTION */}
          <div className="mb-3">
            <div
              style={{
                background: "#00bcd4",
                color: "white",
                padding: "4px 8px",
                fontWeight: "bold",
              }}
            >
              Flight
            </div>

            <table className="table table-sm mb-1">
              <thead>
                <tr style={{ background: "#e0f7fa" }}>
                  <th>Date / From / To</th>
                  <th style={{ width: "170px" }}>Adult</th>
                  <th style={{ width: "170px" }}>Child</th>
                  <th style={{ width: "130px" }}>Total (SAR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  {/* FLIGHT LEGS */}
                  <td>
                    {flights.map((f, i) => (
                      <div key={i} className="d-flex gap-2 mb-1">
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={f.date}
                          onChange={(e) => {
                            const u = [...flights];
                            u[i].date = e.target.value;
                            setFlights(u);
                          }}
                        />
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={f.from}
                          onChange={(e) => {
                            const u = [...flights];
                            u[i].from = e.target.value;
                            setFlights(u);
                          }}
                        />
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={f.to}
                          onChange={(e) => {
                            const u = [...flights];
                            u[i].to = e.target.value;
                            setFlights(u);
                          }}
                        />
                      </div>
                    ))}
                  </td>

                  {/* ADULT */}
                  <td>
                    <div className="mb-1">
                      <small>Qty</small>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={adultCount}
                        onChange={(e) =>
                          setAdultCount(Number(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div>
                      <small>Rate</small>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={adultRate}
                        onChange={(e) =>
                          setAdultRate(Number(e.target.value) || 0)
                        }
                      />
                    </div>
                  </td>

                  {/* CHILD */}
                  <td>
                    <div className="mb-1">
                      <small>Qty</small>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={childCount}
                        onChange={(e) =>
                          setChildCount(Number(e.target.value) || 0)
                        }
                      />
                    </div>
                    <div>
                      <small>Rate</small>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={childRate}
                        onChange={(e) =>
                          setChildRate(Number(e.target.value) || 0)
                        }
                      />
                    </div>
                  </td>

                  {/* FLIGHT TOTAL */}
                  <td className="text-end align-middle fw-bold">
                    {flightTotal.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* HOTELS SECTION */}
          <div className="mb-3">
            <div className="d-flex justify-content-between">
              <div
                style={{
                  background: "#00bcd4",
                  color: "white",
                  padding: "4px 8px",
                  fontWeight: "bold",
                }}
              >
                Hotels
              </div>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={addHotelRow}
              >
                ➕ Add Hotel Row
              </button>
            </div>

            <table className="table table-sm">
              <thead>
                <tr style={{ background: "#e0f7fa" }}>
                  <th>Check-in</th>
                  <th>Check-out</th>
                  <th>Nights</th>
                  <th>Location</th>
                  <th>Hotel</th>
                  <th>Rooms</th>
                  <th>Type</th>
                  <th>Rate</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {hotels.map((h, i) => (
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
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={h.nights}
                        onChange={(e) =>
                          handleHotelChange(i, "nights", e.target.value)
                        }
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
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={h.hotel}
                        onChange={(e) =>
                          handleHotelChange(i, "hotel", e.target.value)
                        }
                      />
                    </td>
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
                    <td className="text-end">
                      {h.total.toLocaleString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-link text-danger"
                        onClick={() => removeHotelRow(i)}
                      >
                        ✖
                      </button>
                    </td>
                  </tr>
                ))}

                <tr>
                  <td colSpan={8} className="text-end fw-bold">
                    Hotels Total
                  </td>
                  <td className="text-end fw-bold">
                    {hotelsTotal.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* VISA SECTION */}
          <div className="mb-3">
            <div
              style={{
                background: "#00bcd4",
                color: "white",
                padding: "4px 8px",
                fontWeight: "bold",
              }}
            >
              Visa
            </div>

            <table className="table table-sm">
              <thead>
                <tr style={{ background: "#e0f7fa" }}>
                  <th>Persons</th>
                  <th>Rate (SAR)</th>
                  <th>Total (SAR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={visaPersons}
                      onChange={(e) =>
                        setVisaPersons(Number(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      className="form-control form-control-sm"
                      value={visaRate}
                      onChange={(e) =>
                        setVisaRate(Number(e.target.value) || 0)
                      }
                    />
                  </td>
                  <td className="text-end fw-bold">
                    {visaTotal.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* TRANSPORT SECTION */}
          <div className="mb-3">
            <div className="d-flex justify-content-between">
              <div
                style={{
                  background: "#00bcd4",
                  color: "white",
                  padding: "4px 8px",
                  fontWeight: "bold",
                }}
              >
                Transportation
              </div>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={addTransportRow}
              >
                ➕ Add Transport Row
              </button>
            </div>

            <table className="table table-sm">
              <thead>
                <tr style={{ background: "#e0f7fa" }}>
                  <th>Detail</th>
                  <th>Amount (SAR)</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {transportRows.map((t, i) => (
                  <tr key={i}>
                    <td>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={t.text}
                        onChange={(e) => {
                          const u = [...transportRows];
                          u[i].text = e.target.value;
                          setTransportRows(u);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className="form-control form-control-sm text-end"
                        value={t.amount}
                        onChange={(e) => {
                          const u = [...transportRows];
                          u[i].amount = Number(e.target.value) || 0;
                          setTransportRows(u);
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

                <tr>
                  <td className="text-end fw-bold">Transport Total</td>
                  <td className="text-end fw-bold">
                    {transportTotal.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SUMMARY SECTION */}
          <div className="mb-3">
            <div
              style={{
                background: "#00bcd4",
                color: "white",
                padding: "4px 8px",
                fontWeight: "bold",
              }}
            >
              Summary
            </div>

            <table className="table table-sm">
              <thead>
                <tr style={{ background: "#e0f7fa" }}>
                  <th>Description</th>
                  <th>SAR</th>
                  <th>ROE / Persons</th>
                  <th>Total / Per Person (PKR)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Flight</td>
                  <td className="text-end">
                    {flightTotal.toLocaleString()}
                  </td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Hotels</td>
                  <td className="text-end">
                    {hotelsTotal.toLocaleString()}
                  </td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Visa</td>
                  <td className="text-end">{visaTotal.toLocaleString()}</td>
                  <td></td>
                  <td></td>
                </tr>
                <tr>
                  <td>Transport</td>
                  <td className="text-end">
                    {transportTotal.toLocaleString()}
                  </td>
                  <td></td>
                  <td></td>
                </tr>

                {/* ROE + GRAND TOTAL */}
                <tr>
                  <td className="fw-bold">Grand Total (SAR)</td>
                  <td className="fw-bold text-end">
                    {grandSar.toLocaleString()}
                  </td>
                  <td>
                    <div>
                      <small>ROE</small>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={roe}
                        onChange={(e) =>
                          setRoe(Number(e.target.value) || 0)
                        }
                      />
                    </div>
                  </td>
                  <td className="fw-bold text-end">
                    {totalPKR.toLocaleString()}
                  </td>
                </tr>

                {/* PKG PER PERSON (MANUAL QTY) */}
                <tr style={{ background: "#f1f1f1" }}>
                  <td className="fw-bold">PKG Per Person</td>
                  <td></td>
                  <td>
                    <div>
                      <small>Persons</small>
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        value={personQty}
                        onChange={(e) =>
                          setPersonQty(Number(e.target.value) || 0)
                        }
                      />
                    </div>
                  </td>
                  <td className="fw-bold text-end">
                    {manualPerPerson.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* NOTE */}
          <div
            className="mt-2 p-2"
            style={{
              background: "#12c1d8",
              color: "white",
              fontSize: "11px",
            }}
          >
            THESE ARE TENTATIVE RATES AND CAN CHANGE WITHOUT NOTICE. PACKAGE
            CAN BE FINALIZED AFTER BOOKING PAYMENTS AND MAY VARY WITH ROE
            FLUCTUATION.
          </div>
        </div>
      </div>
    </div>
  );
}
