import React, { useState } from "react";
import Header from "../components/Header";

export default function HotelVoucher({ onNavigate }) {
  // State: Default fields empty hain
  const [voucherData, setVoucherData] = useState({
    voucherNo: "",
    date: "", 
    clientName: "",
    totalPax: "",
    
    bookings: [
      {
        sNo: "1",
        hotelName: "",
        address: "",
        roomType: "",
        checkIn: "",  
        checkOut: "", 
        nights: "",
        noOfRooms: "",
        bookingRef: "",
        contactNo: ""
      }
    ]
  });

  // Helper: Date format parser (YYYY-MM-DD -> DD/MMM/YYYY)
  const formatCustomDate = (dateString) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return dateString;

    const day = String(dateObj.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();

    return `${day}/${month}/${year}`;
  };

  // Main field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setVoucherData((prev) => ({ ...prev, [name]: value }));
  };

  // Table grid changes
  const handleBookingChange = (index, field, value) => {
    const updatedBookings = [...voucherData.bookings];
    updatedBookings[index][field] = value;
    setVoucherData((prev) => ({ ...prev, bookings: updatedBookings }));
  };

  const addBookingRow = () => {
    setVoucherData((prev) => ({
      ...prev,
      bookings: [
        ...prev.bookings,
        {
          sNo: (prev.bookings.length + 1).toString(),
          hotelName: "",
          address: "",
          roomType: "",
          checkIn: "",
          checkOut: "",
          nights: "",
          noOfRooms: "",
          bookingRef: "",
          contactNo: ""
        }
      ]
    }));
  };

  const deleteBookingRow = (index) => {
    if (voucherData.bookings.length === 1) return;
    const updatedBookings = voucherData.bookings
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, sNo: (idx + 1).toString() }));
    setVoucherData((prev) => ({ ...prev, bookings: updatedBookings }));
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      
      {/* Action Bar */}
      <div className="no-print" style={styles.actionContainer}>
        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => onNavigate && onNavigate("dashboard")} style={styles.backButton}>
            ⬅ Back to Dashboard
          </button>
          <button onClick={addBookingRow} style={styles.addButton}>
            ➕ Add Hotel Booking Row
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => window.print()} style={styles.printButton}>
            🖨️ Print Voucher
          </button>
          <button onClick={() => window.print()} style={styles.pdfButton}>
            📥 Download PDF
          </button>
        </div>
      </div>

      {/* Main Voucher Sheet */}
      <div className="printable-voucher-sheet" style={styles.voucherPaper}>
        
        {/* Real Header Component */}
        <Header title="HOTEL VOUCHER" />

        {/* 4 Main Upper Fields row layout */}
        <div style={styles.topInfoContainer}>
          <div>
            <strong>Voucher No:</strong>{" "}
            <input
              type="text"
              name="voucherNo"
              value={voucherData.voucherNo}
              onChange={handleChange}
              style={styles.inlineInput}
              placeholder="Enter Voucher No"
            />
          </div>
          
          {/* Main Date */}
          <div>
            <strong>Date:</strong>{" "}
            <div style={{ display: "inline-block", position: "relative" }}>
              <input
                type="date"
                name="date"
                value={voucherData.date}
                onChange={handleChange}
                data-date={formatCustomDate(voucherData.date)}
                className="custom-date-input"
                style={styles.inlineInputDate}
              />
            </div>
          </div>

          <div>
            <strong>Pax Name:</strong>{" "}
            <input
              type="text"
              name="clientName"
              value={voucherData.clientName}
              onChange={handleChange}
              style={styles.inlineInput}
              placeholder="Passenger Name"
            />
          </div>
          <div>
            <strong>Total Pax:</strong>{" "}
            <input
              type="text"
              name="totalPax"
              value={voucherData.totalPax}
              onChange={handleChange}
              style={{ ...styles.inlineInput, width: "50px", textAlign: "center" }}
              placeholder="0"
            />
          </div>
        </div>

        {/* SECTION: BOOKING DETAILS (Dynamic Grid) */}
        <div style={{ marginBottom: "25px" }}>
          <h3 style={styles.sectionHeader}>📋 Booking Details</h3>
          
          {voucherData.bookings.map((booking, index) => (
            <div key={index} style={styles.bookingBlock}>
              
              <div style={styles.bookingBlockHeader}>
                <span><strong>ROOM / HOTEL ENTRY #{booking.sNo}</strong></span>
                <button 
                  className="no-print"
                  onClick={() => deleteBookingRow(index)} 
                  style={styles.deleteBtn}
                  disabled={voucherData.bookings.length === 1}
                >
                  ❌ Remove Block
                </button>
              </div>

              {/* 🔥 4 Fields Upar aur 4 Fields Niche Form Layout */}
              <div style={styles.fieldsGrid}>
                
                {/* ROW 1: UPPER 4 FIELDS */}
                <div style={styles.fieldBox}>
                  <label style={styles.fieldLabel}>Hotel Name</label>
                  <textarea
                    value={booking.hotelName}
                    onChange={(e) => handleBookingChange(index, "hotelName", e.target.value)}
                    style={styles.blockTextarea}
                    placeholder="Enter Hotel Name..."
                    rows={2}
                  />
                </div>

                <div style={styles.fieldBox}>
                  <label style={styles.fieldLabel}>Room Type</label>
                  <input
                    type="text"
                    value={booking.roomType}
                    onChange={(e) => handleBookingChange(index, "roomType", e.target.value)}
                    style={styles.blockInput}
                    placeholder="e.g. QUAINT (R.O)"
                  />
                </div>

                {/* Check-In Date */}
                <div style={styles.fieldBox}>
                  <label style={styles.fieldLabel}>Check-In Date</label>
                  <input
                    type="date"
                    value={booking.checkIn}
                    onChange={(e) => handleBookingChange(index, "checkIn", e.target.value)}
                    data-date={formatCustomDate(booking.checkIn)}
                    className="custom-date-input"
                    style={styles.blockInputDate}
                  />
                </div>

                {/* Check-Out Date */}
                <div style={styles.fieldBox}>
                  <label style={styles.fieldLabel}>Check-Out Date</label>
                  <input
                    type="date"
                    value={booking.checkOut}
                    onChange={(e) => handleBookingChange(index, "checkOut", e.target.value)}
                    data-date={formatCustomDate(booking.checkOut)}
                    className="custom-date-input"
                    style={styles.blockInputDate}
                  />
                </div>

                {/* ROW 2: LOWER 4 FIELDS */}
                <div style={styles.fieldBox}>
                  <label style={styles.fieldLabel}>Nights</label>
                  <input
                    type="text"
                    value={booking.nights}
                    onChange={(e) => handleBookingChange(index, "nights", e.target.value)}
                    style={styles.blockInput}
                    placeholder="e.g. 8 Nights"
                  />
                </div>

                <div style={styles.fieldBox}>
                  <label style={styles.fieldLabel}>No of Rooms</label>
                  <input
                    type="text"
                    value={booking.noOfRooms}
                    onChange={(e) => handleBookingChange(index, "noOfRooms", e.target.value)}
                    style={styles.blockInput}
                    placeholder="No of Rooms"
                  />
                </div>

                <div style={styles.fieldBox}>
                  <label style={styles.fieldLabel}>Booking Ref No</label>
                  <input
                    type="text"
                    value={booking.bookingRef}
                    onChange={(e) => handleBookingChange(index, "bookingRef", e.target.value)}
                    style={styles.blockInput}
                    placeholder="Ref Number"
                  />
                </div>

                <div style={styles.fieldBox}>
                  <label style={styles.fieldLabel}>Hotel Address / Contact</label>
                  <textarea
                    value={booking.address}
                    onChange={(e) => handleBookingChange(index, "address", e.target.value)}
                    style={styles.blockTextarea}
                    placeholder="Address & Contact info..."
                    rows={2}
                  />
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* POLICY NOTES */}
        <div style={styles.notesContainer}>
          <h4 style={styles.notesHeader}>Notes: Check-in/Check-out, Timing & Policy:</h4>
          <p style={styles.notesContent}>
            The usual check-in time is 4:00 PM hours. Room may not be available for early Check-ins, unless specifically required in advance. However luggage may be deposited at the hotel reception and collected once the room is allotted. Note the reservation may be cancelled automatically 18:00 hours if hotels are not informed about the approximate time of late arrivals. Officially check-out time is at 12:00 hours. Any late checkout may involve additional charges. Please check with the hotel reception in advance.
          </p>
          <p style={{ ...styles.notesContent, marginTop: "8px", color: "#0b3d91" }}>
            Check your booking details carefully and inform us immediately.
          </p>
        </div>

        {/* SIGNATURES */}
        <div style={styles.signatureRow}>
          <div style={styles.sigBox}>
            <div style={styles.sigLine} />
            <p style={styles.sigText}>Prepared By (Al Mukarram)</p>
          </div>
          <div style={styles.sigBox}>
            <div style={styles.sigLine} />
            <p style={styles.sigText}>Hotel Reception Stamp</p>
          </div>
          <div style={styles.sigBox}>
            <div style={styles.sigLine} />
            <p style={styles.sigText}>Customer Signature</p>
          </div>
        </div>

      </div>

      {/* Advanced Webkit Formatting CSS Rule Injection */}
      <style>{`
        /* Magic CSS: calendar text format mask DD/MMM/YYYY */
        .custom-date-input {
          position: relative;
        }
        .custom-date-input::-webkit-datetime-edit {
          color: transparent;
        }
        .custom-date-input::before {
          content: attr(data-date);
          position: absolute;
          left: 6px;
          top: 50%;
          transform: translateY(-50%);
          color: #111;
          font-weight: bold;
          font-size: 13px;
          white-space: nowrap;
        }
        .custom-date-input:focus::before,
        .custom-date-input:not([value=""]): Fleeting before {
          color: #000;
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .printable-voucher-sheet, .printable-voucher-sheet * {
            visibility: visible;
          }
          .no-print, .no-print * {
            display: none !important;
          }
          .custom-date-input::-webkit-calendar-picker-indicator {
            display: none !important;
            -webkit-appearance: none;
          }
          .printable-voucher-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm;
          }
          input, textarea {
            border: none !important;
            background: transparent !important;
            font-size: 11pt !important;
            color: #000 !important;
            resize: none !important; /* Printing me resizer visual handle hide ho jaye */
          }
          .printable-voucher-sheet input,
          .printable-voucher-sheet textarea {
            border-bottom: none !important;
            background-color: transparent !important;
            padding-left: 0 !important;
          }
          label {
            background-color: transparent !important;
            color: #333 !important;
            border: none !important;
            padding: 0 !important;
          }
          input::placeholder, textarea::placeholder {
            color: transparent !important;
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  actionContainer: {
    maxWidth: "1000px", margin: "0 auto 20px auto", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#eaf5ea", padding: "15px", borderRadius: "8px", border: "1px solid #c2e0c2",
  },
  backButton: {
    backgroundColor: "#6c757d", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "bold",
  },
  addButton: {
    backgroundColor: "#0b3d91", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "bold",
  },
  printButton: {
    backgroundColor: "#198754", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "bold",
  },
  pdfButton: {
    backgroundColor: "#dc3545", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "bold",
  },
  deleteBtn: {
    background: "none", border: "none", color: "#dc3545", cursor: "pointer", fontSize: "12px", fontWeight: "bold",
  },
  voucherPaper: {
    maxWidth: "1000px", margin: "0 auto", backgroundColor: "#fff", border: "1px solid #ddd", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", padding: "40px", boxSizing: "border-box"
  },
  topInfoContainer: {
    display: "grid", gridTemplateColumns: "1.1fr 1.3fr 1.2fr 0.7fr", gap: "10px", marginBottom: "25px", fontSize: "13px", padding: "12px", backgroundColor: "#f9f9f9", borderRadius: "6px", border: "1px solid #eee"
  },
  inlineInput: {
    border: "none", borderBottom: "1px dashed #d4af37", marginLeft: "5px", padding: "2px 5px", outline: "none", fontSize: "13px", backgroundColor: "transparent", width: "65%",
  },
  inlineInputDate: {
    border: "none", borderBottom: "1px dashed #d4af37", marginLeft: "5px", padding: "2px 5px", outline: "none", fontSize: "13px", backgroundColor: "transparent", width: "115px", cursor: "pointer"
  },
  sectionHeader: {
    margin: "0 0 12px 0", fontSize: "15px", color: "#0b3d91", fontWeight: "bold", borderBottom: "1px dashed #0b3d91", paddingBottom: "4px"
  },
  bookingBlock: {
    border: "1px solid #0b3d91", borderRadius: "6px", padding: "15px", marginBottom: "20px", backgroundColor: "#fff",
  },
  bookingBlockHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #eee", paddingBottom: "6px", marginBottom: "12px", fontSize: "12px", color: "#0b3d91", fontWeight: "bold"
  },
  fieldsGrid: {
    display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "15px 12px",
  },
  fieldBox: {
    display: "flex", flexDirection: "column", border: "1px solid #0b3d91", borderRadius: "4px", overflow: "hidden", backgroundColor: "#fff"
  },
  fieldLabel: {
    fontSize: "11px", fontWeight: "bold", color: "#ffffff", backgroundColor: "#0b3d91", padding: "5px 8px", textTransform: "uppercase", letterSpacing: "0.5px"
  },
  blockInput: {
    border: "none", padding: "6px 8px", fontSize: "13px", outline: "none", backgroundColor: "transparent", width: "100%", fontWeight: "500", boxSizing: "border-box"
  },
  blockInputDate: {
    border: "none", padding: "6px 8px", fontSize: "13px", outline: "none", backgroundColor: "transparent", width: "100%", cursor: "pointer", fontWeight: "500", boxSizing: "border-box"
  },
  
  /* 🔥 Wapas active kar diya vertical resize click handles ke liye */
  blockTextarea: {
    border: "none", padding: "6px 8px", fontSize: "13px", fontFamily: "inherit", outline: "none", backgroundColor: "transparent", width: "100%", resize: "vertical", minHeight: "34px", whiteSpace: "pre-wrap", wordWrap: "break-word", fontWeight: "500", boxSizing: "border-box"
  },
  
  notesContainer: {
    marginTop: "25px", padding: "15px", backgroundColor: "#fcfcfc", border: "1px dashed #999", borderRadius: "6px",
  },
  notesHeader: {
    margin: "0 0 6px 0", color: "#333", fontSize: "13px", fontWeight: "bold",
  },
  notesContent: {
    margin: 0, fontSize: "11.5px", lineHeight: "1.6", color: "#444", textAlign: "justify",
  },
  signatureRow: {
    display: "flex", justifyContent: "space-between", marginTop: "50px",
  },
  sigBox: {
    width: "28%", textAlign: "center",
  },
  sigLine: {
    borderBottom: "1px solid #aaa", marginBottom: "6px",
  },
  sigText: {
    fontSize: "11px", color: "#555", fontWeight: "bold", margin: 0,
  },
};