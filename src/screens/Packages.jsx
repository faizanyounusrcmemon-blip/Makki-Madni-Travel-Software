
import "./packages.css";
import React, { useState, useRef } from "react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import Swal from "sweetalert2";
import Header from "../components/Header";

const calcNights = (inD, outD) => {
  if (!inD || !outD) return "";
  const diff = (new Date(outD) - new Date(inD)) / (1000 * 60 * 60 * 24);
  return diff > 0 ? diff : "";
};

export default function Packages({ onNavigate }) {
  const [refNo, setRefNo] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [bookingDate, setBookingDate] = useState("");
  const [contactNo, setContactNo] = useState("");
  const [searchRef, setSearchRef] = useState("");
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);


  const [adultCount, setAdultCount] = useState(0);
  const [adultRate, setAdultRate] = useState(0);
  const [childCount, setChildCount] = useState(0);
  const [childRate, setChildRate] = useState(0);
  const [infantCount, setInfantCount] = useState(0);
  const [infantRate, setInfantRate] = useState(0);


  const flightTotal = adultCount * adultRate + childCount * childRate + infantCount * infantRate;

  const [flights, setFlights] = useState([
    { date: "", from: "", to: "", airline: "" },
    { date: "", from: "", to: "", airline: "" },
  ]);

  const [hotels, setHotels] = useState([]);
  const addHotelRow = () => setHotels([...hotels, { checkIn: "", checkOut: "", nights: "", location: "", hotel: "", rooms: "", type: "", rate: "", total: 0 }]);
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

  const [visaRows, setVisaRows] = useState([]);

  const addVisaRow = () =>
    setVisaRows([...visaRows, { type: "", persons: 0, rate: 0, total: 0 }]);

  const removeVisaRow = (i) =>
    setVisaRows(visaRows.filter((_, x) => x !== i));

  const handleVisaChange = (i, field, value) => {
    const rows = [...visaRows];
    rows[i][field] = value;

    const persons = Number(rows[i].persons);
    const rate = Number(rows[i].rate);
    rows[i].total = persons * rate;

    setVisaRows(rows);
  };

  const visaTotal = visaRows.reduce((sum, v) => sum + (v.total || 0), 0);

  const [transportRows, setTransportRows] = useState([]);
  const addTransportRow = () => setTransportRows([...transportRows, { text: "", amount: 0 }]);
  const removeTransportRow = (i) => setTransportRows(transportRows.filter((_, x) => x !== i));
  const transportTotal = transportRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  const [ziyaratRows, setZiyaratRows] = useState([]);
  const addZiyaratRow = () => setZiyaratRows([...ziyaratRows, { text: "", amount: 0 }]);
  const removeZiyaratRow = (i) => setZiyaratRows(ziyaratRows.filter((_, x) => x !== i));
  const ziyaratTotal = ziyaratRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  const [flightRate, setFlightRate] = useState(0);
  const [hotelsRate, setHotelsRate] = useState(0);
  const [visaRatePKR, setVisaRatePKR] = useState(0);
  const [transportRate, setTransportRate] = useState(0);
  const [ziyaratRate, setZiyaratRate] = useState(0);

  const flightPKR = flightTotal * flightRate;
  const hotelsPKR = hotelsTotal * hotelsRate;
  const sarToPkrRate = Number(visaRatePKR || 0);
  const visaPKR = visaTotal * sarToPkrRate;
  const transportPKR = transportTotal * transportRate;
  const ziyaratPKR = ziyaratTotal * ziyaratRate;
  const grandPKR = flightPKR + hotelsPKR + visaPKR + transportPKR + ziyaratPKR;

// ================= PER PERSON LOGIC =================

// Total flight in PKR per category
const adultFlightPKRTotal = adultCount * adultRate * flightRate;
const childFlightPKRTotal = childCount * childRate * flightRate;
const infantFlightPKRTotal = infantCount * infantRate * flightRate;

// Visa total per person
const visaPersons = visaRows.reduce((s, v) => s + Number(v.persons || 0), 0);
const visaPerPerson = visaPersons > 0 ? visaPKR / visaPersons : 0;

// Shared expenses only for adults (hotels + transport + ziyarat)
const sharedPKR = hotelsPKR + transportPKR + ziyaratPKR;
const sharedPerAdult = adultCount > 0 ? sharedPKR / adultCount : 0;

// ======== FINAL PER PERSON CALCULATION ========
const adultPerPerson = Math.round(
  (adultCount > 0 ? adultFlightPKRTotal / adultCount : 0) + visaPerPerson + sharedPerAdult
);

const childPerPerson = childCount > 0
  ? Math.round((childFlightPKRTotal / childCount) + visaPerPerson)
  : 0;

const infantPerPerson = infantCount > 0
  ? Math.round((infantFlightPKRTotal / infantCount) + visaPerPerson)
  : 0;

const totalPassengers = Number(adultCount || 0) + Number(childCount || 0) + Number(infantCount || 0);

// ===================================================

// ===================================================

  const quoteRef = useRef(null);

  const showDate = (val) => {
    if (!val) return "";
    const d = new Date(val);
    const day = String(d.getDate()).padStart(2, "0");
    const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = d.getFullYear();
    return `${day}/${mon}/${year}`;
  };

  const cleanName = (name) => name ? name.replace(/[^a-zA-Z0-9]/g, "_") : "Customer";
  const formatDateForFile = (date) => {
    if (!date) return "NoDate";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const mon = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${mon}-${year}`;
  };

  const handleExportPDF = async () => {
    quoteRef.current.classList.add("pdf-mode");
    const canvas = await html2canvas(quoteRef.current, { scale: 2, useCORS: true, backgroundColor: "#ffffff" });
    const img = canvas.toDataURL("image/png");
    const pdf = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    const imgProps = pdf.getImageProperties(img);
    const pdfWidth = w - 20;
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
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
    const fileName = `${cleanName(customerName)}_${formatDateForFile(bookingDate)}.pdf`;
    pdf.save(fileName);
    quoteRef.current.classList.remove("pdf-mode");
  };

const loadPackage = async () => {

  if (!searchRef) {
    return Swal.fire({
      width: "280px",
      icon: "warning",
      text: "Search Ref No likho"
    });
  }

  try {

    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bookings/get/${searchRef}`);
    const data = await res.json();

    if (!data.success) {
      return Swal.fire({
        width: "280px",
        icon: "error",
        text: "Record not found"
      });
    }

    const d = data.row;

    // 🔹 Purchase check
    const purchaseRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase/check/${d.ref_no}`);
    const purchaseData = await purchaseRes.json();

    if (purchaseData.total > 0) {
      return Swal.fire({
        width: "300px",
        icon: "error",
        text: "❌ Cannot edit. Purchase entries exist.\nDelete purchases first."
      });
    }

    // 🔹 Load data
    setRefNo(d.ref_no);
    setCustomerName(d.customer_name);
    setContactNo(d.contact_no);
    setBookingDate(d.booking_date);
    setAdultCount(d.adult_count);
    setAdultRate(d.adult_rate);
    setChildCount(d.child_count);
    setChildRate(d.child_rate);
    setInfantCount(d.infant_count);
    setInfantRate(d.infant_rate);
    setFlights(d.flights || []);
    setHotels(d.hotels || []);

    setVisaRows(
      d.visa && d.visa.length > 0
        ? d.visa
        : d.visa_persons > 0
        ? [{
            type: "Visa",
            persons: d.visa_persons,
            rate: d.visa_rate,
            total: d.visa_total
          }]
        : []
    );

    setTransportRows(d.transport || []);
    setZiyaratRows(d.ziyarat || []);
    setZiyaratRate(d.ziyarat_sar_rate || 0);
    setFlightRate(d.flight_sar_rate);
    setHotelsRate(d.hotel_sar_rate);
    setVisaRatePKR(d.visa_sar_rate);
    setTransportRate(d.transport_sar_rate);
    setIsEdit(true);

    Swal.fire({
      width: "260px",
      icon: "success",
      text: "Package Edit Mode Loaded"
    });

  } catch (err) {
    Swal.fire({
      width: "300px",
      icon: "error",
      text: "Load failed"
    });
  }
};

const handleSavePackage = async () => {

  if (saving) return;

  setSaving(true);

  const payload = {
    ref_no: refNo || null,
    customer_name: customerName,
    contact_no: contactNo,
    booking_date: bookingDate,
    adult_count: adultCount,
    adult_rate: adultRate,
    child_count: childCount,
    child_rate: childRate,
    infant_count: infantCount,
    infant_rate: infantRate,
    flight_total: flightTotal,
    flights,
    hotels,
    hotels_total: hotelsTotal,
    transport: transportRows,
    transport_total: transportTotal,
    ziyarat: ziyaratRows,
    ziyarat_total: ziyaratTotal,
    flight_sar_total: flightTotal,
    hotel_sar_total: hotelsTotal,
    visa: visaRows,
    visa_total: visaTotal,
    visa_sar_total: visaTotal,
    transport_sar_total: transportTotal,
    ziyarat_sar_total: ziyaratTotal,
    flight_sar_rate: flightRate,
    hotel_sar_rate: hotelsRate,
    visa_sar_rate: visaRatePKR,
    transport_sar_rate: transportRate,
    ziyarat_sar_rate: ziyaratRate,
    flight_pkr_total: flightPKR,
    hotel_pkr_total: hotelsPKR,
    visa_pkr_total: visaPKR,
    transport_pkr_total: transportPKR,
    ziyarat_pkr_total: ziyaratPKR,
    net_pkr_total: grandPKR,
    total_sar: flightTotal + hotelsTotal + visaTotal + transportTotal + ziyaratTotal,
    total_pkr: grandPKR,
    per_person_qty: totalPassengers,
    per_person_final: adultPerPerson,
    adult_per_person: adultPerPerson,
    child_per_person: childPerPerson,
    infant_per_person: infantPerPerson
  };

  try {

    Swal.fire({
      width: "260px",
      title: "Saving...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/bookings/save`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await res.json();

    Swal.close();

    if (data.success) {

      setRefNo(data.ref_no);

      Swal.fire({
        width: "280px",
        icon: "success",
        text: `Saved Successfully! Ref#: ${data.ref_no}`
      });

      onNavigate("bookings");

    } else {
      Swal.fire({
        width: "300px",
        icon: "error",
        text: data.error || "Save failed"
      });
    }

  } catch (err) {

    Swal.close();

    Swal.fire({
      width: "300px",
      icon: "error",
      text: "Server Error"
    });
  }

  setSaving(false);
};


  // ==============================
  // STYLES
  // ==============================
  const styles = {
    container: { minHeight: "100vh", padding: 20, background: "linear-gradient(to right, #e0f7fa, #fdf6e3)", fontFamily: "'Cairo', sans-serif" },
    quoteCard: { background: "#fff", borderRadius: 15, padding: 20, boxShadow: "0 8px 20px rgba(0,0,0,0.12)" },
    brandTitle: { textAlign: "center", color: "#0066cc", fontWeight: "bold" },
    sectionTitle: { background: "linear-gradient(to right, #007bff, #00cfff)", color: "#fff", padding: "5px 10px", borderRadius: 5, marginTop: 20, marginBottom: 10, fontWeight: "600" },
  };

  return (
    <div style={styles.container}>
      {/* TOP BAR */}
      <div className="d-flex justify-content-between mb-3">
        <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>⬅ Back</button>
        <div className="d-flex gap-2">
<button
  className={`btn btn-sm ${
    isEdit ? "btn-warning text-dark" : "btn-primary"
  }`}
  style={styles.button}
  onClick={handleSavePackage}
  disabled={saving}
>
  {saving ? "Saving..." : isEdit ? "✏ Update Save" : "💾 Save"}
</button>

          <input className="form-control form-control-sm" style={{ width: "150px" }} placeholder="Search Ref No" value={searchRef} onChange={(e) => setSearchRef(e.target.value)} />
          <button className="btn btn-warning btn-sm" onClick={loadPackage}>🔄 Load / Edit</button>
          <button className="btn btn-success btn-sm" onClick={handleExportPDF}>📄 Export PDF</button>
        </div>
      </div>

      {/* QUOTE CARD */}
      <div ref={quoteRef} style={styles.quoteCard}>


        <Header title="PACKAGE QUOTATION" />

        {/* CUSTOMER INFO */}
        <div className="d-flex gap-3 mb-3">
          <div>
            <label>Ref No</label>
            <input className="form-control form-control-sm" value={refNo} readOnly />
          </div>
          <div>
            <label>Customer Name</label>
            <input className="form-control form-control-sm" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
          </div>
          <div>
            <label>Contact No</label>
            <input type="text" className="form-control form-control-sm" value={contactNo} onChange={(e) => setContactNo(e.target.value)} />
          </div>
          <div>
            <label>Booking Date</label>
            <input type="date" className="form-control form-control-sm" value={bookingDate} onChange={(e) => setBookingDate(e.target.value)} />
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

                   <input
                     type="text"
                     placeholder="Airline"
                     className="form-control form-control-sm"
                     style={{ width: "140px" }}
                     value={f.airline}
                     onChange={(e) => {
                       const updated = [...flights];
                       updated[idx].airline = e.target.value;
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

{/* HOTELS SECTION */}
<h6 className="section-title">🏨 Hotels</h6>

<button className="btn btn-outline-primary btn-sm mb-2" onClick={addHotelRow}>
  ➕ Add Hotel Row
</button>

<table className="table table-sm">
  <tbody>
    {hotels.map((h, i) => (
      <React.Fragment key={i}>
        {/* HOTEL NAME HEADER */}
        <tr>
          <td colSpan={10} style={{ fontWeight: "700", textAlign: "left", padding: "5px 10px", background: "#cce5ff" }}>
            HOTEL NAME
          </td>
        </tr>

        {/* HOTEL NAME INPUT */}
        <tr>
          <td colSpan={10}>
            <input
              type="text"
              className="form-control form-control-sm"
              placeholder="Enter Hotel Name"
              value={h.hotel}
              onChange={(e) => handleHotelChange(i, "hotel", e.target.value)}
            />
          </td>
        </tr>

        {/* FIELD NAMES ROW */}
        <tr style={{ background: "#20c997", color: "#fff", fontWeight: "600", textAlign: "center" }}>
          <td>Check-in</td>
          <td>Check-out</td>
          <td>Nights</td>
          <td>Location</td>
          <td>Rooms</td>
          <td>Type</td>
          <td>Rate</td>
          <td>Total</td>
          <td colSpan={2}></td>
        </tr>

        {/* FIELD INPUTS ROW */}
        <tr>
          <td>
            <input
              type="date"
              className="form-control form-control-sm"
              value={h.checkIn}
              onChange={(e) => handleHotelChange(i, "checkIn", e.target.value)}
            />
            <small className="text-muted">{showDate(h.checkIn)}</small>
          </td>

          <td>
            <input
              type="date"
              className="form-control form-control-sm"
              value={h.checkOut}
              onChange={(e) => handleHotelChange(i, "checkOut", e.target.value)}
            />
            <small className="text-muted">{showDate(h.checkOut)}</small>
          </td>

          <td>
            <input
              type="number"
              className="form-control form-control-sm text-center"
              value={h.nights}
              readOnly
            />
          </td>

          <td style={{ minWidth: "220px" }}>
            <input
              type="text"
              className="form-control form-control-sm"
              value={h.location}
              onChange={(e) => handleHotelChange(i, "location", e.target.value)}
            />
          </td>

          <td style={{ width: "80px" }}>
            <input
              type="number"
              className="form-control form-control-sm text-center"
              value={h.rooms}
              onChange={(e) => handleHotelChange(i, "rooms", e.target.value)}
            />
          </td>

          <td>
            <input
              type="text"
              className="form-control form-control-sm"
              value={h.type}
              onChange={(e) => handleHotelChange(i, "type", e.target.value)}
            />
          </td>

          <td>
            <input
              type="number"
              className="form-control form-control-sm"
              value={h.rate}
              onChange={(e) => handleHotelChange(i, "rate", e.target.value)}
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
      </React.Fragment>
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

        <button
          className="btn btn-outline-primary btn-sm mb-2"
          onClick={addVisaRow}
        >
          ➕ Add Visa Row
        </button>

        <table className="table table-sm">
          <thead>
            <tr>
              <th>Visa Type</th>
              <th width="120">Persons</th>
              <th width="150">Rate</th>
              <th width="150">Total</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {visaRows.map((v, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Visa Type"
                    value={v.type}
                    onChange={(e) =>
                      handleVisaChange(i, "type", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={v.persons}
                    onChange={(e) =>
                      handleVisaChange(i, "persons", e.target.value)
                    }
                  />
                </td>

                <td>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={v.rate}
                    onChange={(e) =>
                      handleVisaChange(i, "rate", e.target.value)
                    }
                  />
                </td>

                <td className="fw-bold">{v.total}</td>

                <td>
                  <button
                    className="btn btn-link text-danger"
                    onClick={() => removeVisaRow(i)}
                  >
                    ✖
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {visaRows.length > 0 && (
          <div className="fw-bold text-end mb-3">
            Visa Total: {visaTotal.toLocaleString()}
          </div>
        )}

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
            ZIYARAT SECTION
        ============================= */}
        <h6 className="section-title">🕌 Ziyarat</h6>

        <button
          className="btn btn-outline-primary btn-sm mb-2"
          onClick={addZiyaratRow}
        >
          ➕ Add Ziyarat Row
        </button>

        <table className="table table-sm">
          <tbody>
            {ziyaratRows.map((z, i) => (
              <tr key={i}>
                <td>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Ziyarat Detail"
                    value={z.text}
                    onChange={(e) => {
                      const updated = [...ziyaratRows];
                      updated[i].text = e.target.value;
                      setZiyaratRows(updated);
                    }}
                  />
                </td>

                <td width="150">
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={z.amount}
                    onChange={(e) => {
                      const updated = [...ziyaratRows];
                      updated[i].amount = +e.target.value;
                      setZiyaratRows(updated);
                    }}
                  />
                </td>

                <td>
                  <button
                    className="btn btn-link text-danger"
                    onClick={() => removeZiyaratRow(i)}
                  >
                    ✖
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {ziyaratRows.length > 0 && (
          <div className="fw-bold text-end mb-3">
            Ziyarat Total: {ziyaratTotal.toLocaleString()}
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

            {/* ZIYARAT */}
            <tr>
              <td>Ziyarat</td>
              <td>{ziyaratTotal.toLocaleString()}</td>
              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={ziyaratRate}
                  onChange={(e) => setZiyaratRate(+e.target.value)}
                />
              </td>
              <td className="fw-bold">{ziyaratPKR.toLocaleString()}</td>
            </tr>


            {/* GRAND TOTAL */}
            <tr className="table-info">
              <td className="fw-bold">Grand Total PKR</td>
              <td></td>
              <td></td>
              <td className="fw-bold">{grandPKR.toLocaleString()}</td>
            </tr>

            {/* PER PERSON */}
            <tr style={{ background: "#d4edda" }}>
              <td className="fw-bold">Adult Per Person</td>
              <td>{adultCount}</td>
              <td></td>
              <td className="fw-bold">{adultPerPerson.toLocaleString()}</td>
            </tr>

            <tr style={{ background: "#fff3cd" }}>
              <td className="fw-bold">Child Per Person</td>
              <td>{childCount}</td>
              <td></td>
              <td className="fw-bold">{childPerPerson.toLocaleString()}</td>
            </tr>

            <tr style={{ background: "#f8d7da" }}>
              <td className="fw-bold">Infant Per Person</td>
              <td>{infantCount}</td>
              <td></td>
              <td className="fw-bold">{infantPerPerson.toLocaleString()}</td>
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