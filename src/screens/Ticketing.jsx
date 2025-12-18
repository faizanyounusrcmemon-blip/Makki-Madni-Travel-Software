import React, { useState, useRef } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function Ticketing({ onNavigate }) {
  const [customerName, setCustomerName] = useState("");
  const [refNo, setRefNo] = useState("");
  const [bookingDate, setBookingDate] = useState("");

  // Flight Rows (FROM / TO / DATE)
  const [flights, setFlights] = useState([
    { from: "", to: "", date: "" },
    { from: "", to: "", date: "" },
  ]);

  // Adult / Child / Infant
  const [adultQty, setAdultQty] = useState(0);
  const [adultRate, setAdultRate] = useState(0);

  const [childQty, setChildQty] = useState(0);
  const [childRate, setChildRate] = useState(0);

  const [infantQty, setInfantQty] = useState(0);
  const [infantRate, setInfantRate] = useState(0);

  const totalSAR =
    adultQty * adultRate +
    childQty * childRate +
    infantQty * infantRate;

  // PKR CONVERSION
  const [ticketRate, setTicketRate] = useState(0);
  const totalPKR = totalSAR * ticketRate;

  const pdfRef = useRef(null);

  // Export PDF
  const exportPDF = async () => {
    const canvas = await html2canvas(pdfRef.current, {
      scale: 4,
    });

    const img = canvas.toDataURL("image/jpeg");
    const pdf = new jsPDF("l", "mm", "a4");

    pdf.addImage(
      img,
      "JPEG",
      0,
      0,
      pdf.internal.pageSize.getWidth(),
      pdf.internal.pageSize.getHeight()
    );

    pdf.save("ticketing.pdf");
  };

  // SAVE API
  const saveData = async () => {
    const payload = {
      customer_name: customerName,
      booking_date: bookingDate,
      flights,
      adultQty,
      adultRate,
      childQty,
      childRate,
      infantQty,
      infantRate,
      total_sar: totalSAR,
      pkr_rate: ticketRate,
      total_pkr: totalPKR,
    };

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/ticketing/save`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      const data = await res.json();

      if (data.success) {
        setRefNo(data.ref_no);
        alert("Ticketing Saved Successfully!");
        onNavigate("dashboard");
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Network Error: " + err.message);
    }
  };

  return (
    <div className="container-fluid py-3" style={{ background: "#eef4f7" }}>
      {/* TOP ACTION BAR */}
      <div className="d-flex justify-content-between mb-3">
        <button className="btn btn-dark btn-sm" onClick={() => onNavigate("dashboard")}>
          ← Back
        </button>

        <div className="d-flex gap-2">
          <button className="btn btn-primary btn-sm" onClick={saveData}>
            💾 Save
          </button>

          <button className="btn btn-success btn-sm" onClick={exportPDF}>
            📄 Export PDF
          </button>
        </div>
      </div>

      {/* PDF CONTENT */}
      <div
        ref={pdfRef}
        className="bg-white p-3"
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
          border: "1px solid #ccc",
        }}
      >
        <h3 className="text-center fw-bold">MAKKI MADNI TRAVEL</h3>
        <h4 className="fw-bold mb-3">TICKETING QUOTATION</h4>

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
          </div>
        </div>

        {/* ================================
            FLIGHT DETAILS SECTION
        ================================= */}
        <h6 className="bg-info text-white p-1">Flight Details</h6>

        <table className="table table-sm">
          <thead>
            <tr>
              <th>From</th>
              <th>To</th>
              <th>Date</th>
            </tr>
          </thead>

          <tbody>
            {flights.map((f, i) => (
              <tr key={i}>
                <td>
                  <input
                    className="form-control form-control-sm"
                    value={f.from}
                    onChange={(e) => {
                      const u = [...flights];
                      u[i].from = e.target.value;
                      setFlights(u);
                    }}
                  />
                </td>

                <td>
                  <input
                    className="form-control form-control-sm"
                    value={f.to}
                    onChange={(e) => {
                      const u = [...flights];
                      u[i].to = e.target.value;
                      setFlights(u);
                    }}
                  />
                </td>

                <td>
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
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ================================
            PASSENGER FARE SECTION
        ================================= */}
        <h6 className="bg-info text-white p-1">Passenger Fares</h6>

        <table className="table table-sm">
          <thead>
            <tr>
              <th>Type</th>
              <th>Qty</th>
              <th>Rate</th>
              <th>Total</th>
            </tr>
          </thead>

          <tbody>
            {/* Adult */}
            <tr>
              <td>Adult</td>

              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={adultQty}
                  onChange={(e) => setAdultQty(+e.target.value)}
                />
              </td>

              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={adultRate}
                  onChange={(e) => setAdultRate(+e.target.value)}
                />
              </td>

              <td className="fw-bold">{adultQty * adultRate}</td>
            </tr>

            {/* Child */}
            <tr>
              <td>Child</td>

              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={childQty}
                  onChange={(e) => setChildQty(+e.target.value)}
                />
              </td>

              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={childRate}
                  onChange={(e) => setChildRate(+e.target.value)}
                />
              </td>

              <td className="fw-bold">{childQty * childRate}</td>
            </tr>

            {/* Infant */}
            <tr>
              <td>Infant</td>

              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={infantQty}
                  onChange={(e) => setInfantQty(+e.target.value)}
                />
              </td>

              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={infantRate}
                  onChange={(e) => setInfantRate(+e.target.value)}
                />
              </td>

              <td className="fw-bold">{infantQty * infantRate}</td>
            </tr>

            {/* GRAND TOTAL */}
            <tr className="table-info">
              <td className="fw-bold">Total SAR</td>
              <td></td>
              <td></td>
              <td className="fw-bold">{totalSAR}</td>
            </tr>
          </tbody>
        </table>

        {/* ================================
            SUMMARY (PKR)
        ================================= */}
        <h6 className="bg-info text-white p-1">Summary</h6>

        <table className="table table-sm">
          <tbody>
            <tr>
              <td>Total SAR</td>
              <td className="fw-bold">{totalSAR}</td>

              <td>Rate</td>
              <td>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  value={ticketRate}
                  onChange={(e) => setTicketRate(+e.target.value)}
                />
              </td>

              <td className="fw-bold">{totalPKR.toLocaleString()}</td>
            </tr>
          </tbody>
        </table>

      </div>
    </div>
  );
}
