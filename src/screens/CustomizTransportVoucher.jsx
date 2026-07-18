import React, { useState } from "react";
import Header from "../components/Header";
import jsPDF from "jspdf"; 
import html2canvas from "html2canvas"; 

export default function CustomizTransportVoucher({ onNavigate }) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Form State
  const [voucherData, setVoucherData] = useState({
    voucherNo: "",
    date: "", 
    services: [
      { sNo: "1", service: "", vehicle: "", pickupDateTime: "", clientDetail: "", driverDetail: "" }
    ],
    clientName: "",
    totalPax: "",
    guests: [
      { sNo: "1", guestName: "", passportNo: "" },
      { sNo: "2", guestName: "", passportNo: "" },
      { sNo: "3", guestName: "", passportNo: "" }
    ]
  });

  const formatCustomDate = (dateString) => {
    if (!dateString) return "";
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return dateString;
    const day = String(dateObj.getDate()).padStart(2, '0');
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${day}/${months[dateObj.getMonth()]}/${dateObj.getFullYear()}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setVoucherData((prev) => ({ ...prev, [name]: value }));
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...voucherData.services];
    updatedServices[index][field] = value;
    setVoucherData((prev) => ({ ...prev, services: updatedServices }));
  };

  const addServiceRow = () => {
    setVoucherData((prev) => ({
      ...prev,
      services: [...prev.services, { sNo: (prev.services.length + 1).toString(), service: "", vehicle: "", pickupDateTime: "", clientDetail: "", driverDetail: "" }]
    }));
  };

  const deleteServiceRow = (index) => {
    if (voucherData.services.length === 1) return;
    const updatedServices = voucherData.services
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, sNo: (idx + 1).toString() }));
    setVoucherData((prev) => ({ ...prev, services: updatedServices }));
  };

  const handleGuestChange = (index, field, value) => {
    const updatedGuests = [...voucherData.guests];
    updatedGuests[index][field] = value;
    setVoucherData((prev) => ({ ...prev, guests: updatedGuests }));
  };

  const addGuestRow = () => {
    setVoucherData((prev) => ({
      ...prev,
      guests: [...prev.guests, { sNo: (prev.guests.length + 1).toString(), guestName: "", passportNo: "" }]
    }));
  };

  const deleteGuestRow = (index) => {
    if (voucherData.guests.length === 1) return;
    const updatedGuests = voucherData.guests
      .filter((_, i) => i !== index)
      .map((item, idx) => ({ ...item, sNo: (idx + 1).toString() }));
    setVoucherData((prev) => ({ ...prev, guests: updatedGuests }));
  };

  const handleDownloadPDF = async () => {
    const originalElement = document.getElementById("transport-voucher-print-area");
    if (!originalElement) return;

    setIsGeneratingPDF(true);

    // 1. Element ka clean deep clone banayein
    const clonedElement = originalElement.cloneNode(true);
    
    // 2. Clone me se buttons aur 'no-print' items ko strip kar dein
    const noPrintElements = clonedElement.querySelectorAll('.no-print');
    noPrintElements.forEach(el => el.remove());

    // 3. Table cells aur inputs data ko spans me badlein
    clonedElement.querySelectorAll('input, textarea').forEach(input => {
      const parent = input.parentNode;
      const textNode = document.createElement('span');
      
      if (input.type === 'date' && input.getAttribute('data-date')) {
        textNode.innerText = input.getAttribute('data-date');
      } else {
        textNode.innerText = input.value || input.placeholder || '';
      }
      
      textNode.style.fontSize = window.getComputedStyle(input).fontSize || '13px';
      textNode.style.fontWeight = 'bold';
      textNode.style.display = 'block';
      textNode.style.width = '100%';
      textNode.style.minHeight = '20px';
      textNode.style.whiteSpace = 'pre-wrap';
      textNode.style.wordBreak = 'break-word';
      textNode.style.padding = '2px';
      
      parent.replaceChild(textNode, input);
    });

    // 4. Logo / Images handle karein explicit configuration ke sath
    const images = clonedElement.querySelectorAll("img");
    images.forEach(img => {
      img.setAttribute("crossOrigin", "anonymous");
    });

    await Promise.all(
      Array.from(images).map(img => {
        if (img.complete && img.naturalWidth > 0) return Promise.resolve();
        return new Promise(resolve => { 
          img.onload = resolve; 
          img.onerror = resolve; 
        });
      })
    );

    // 5. Empty size wale canvas elements ko remove karein
    const canvases = clonedElement.querySelectorAll("canvas");
    canvases.forEach(c => {
      if (c.width === 0 || c.height === 0) {
        c.remove();
      }
    });

    // 6. Cloned panel append karein
    clonedElement.style.position = 'fixed';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    clonedElement.style.width = '850px'; 
    document.body.appendChild(clonedElement);

    try {
      // 7. Aapki secure settings ke mutabiq html2canvas execution
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        foreignObjectRendering: false,
        backgroundColor: "#ffffff",
        logging: false,
        imageTimeout: 0,
        removeContainer: true
      });
      
      const imgData = canvas.toDataURL("image/jpeg", 0.95);
      const pdf = new jsPDF("p", "mm", "a4");
      
      const imgWidth = 210 - (12 * 2); 
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 12; 

      pdf.addImage(imgData, "JPEG", 12, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight + 12;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 12, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`Transport-Voucher-${voucherData.voucherNo || "Draft"}.pdf`);
    } catch (error) {
      console.error("PDF generation failed:", error);
    } finally {
      clonedElement.remove();
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      
      <div className="no-print" style={styles.actionContainer}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={() => onNavigate && onNavigate("dashboard")} style={styles.backButton}>
            ⬅ Back to Dashboard
          </button>
          <button onClick={addServiceRow} style={styles.addButton}>
            ➕ Add Service Row
          </button>
          <button onClick={addGuestRow} style={styles.addButton}>
            ➕ Add Guest Row
          </button>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button onClick={() => window.print()} style={styles.printButton}>
            🖨️ Print Voucher
          </button>
          <button 
            onClick={handleDownloadPDF} 
            style={{ ...styles.pdfButton, opacity: isGeneratingPDF ? 0.6 : 1 }}
            disabled={isGeneratingPDF}
          >
            {isGeneratingPDF ? "⏳ Processing..." : "📥 Download PDF"}
          </button>
        </div>
      </div>

      <div id="transport-voucher-print-area" className="printable-voucher-sheet" style={styles.voucherPaper}>
        <Header title="TRANSPORT VOUCHER" />

        <div style={styles.metaRow}>
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
        </div>

        <div style={{ marginBottom: "25px" }}>
          <h3 style={styles.sectionHeader}>📋 Service Details</h3>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={{ ...styles.th, width: "6%" }}>S NO</th>
                <th style={{ ...styles.th, width: "18%" }}>Service</th>
                <th style={{ ...styles.th, width: "15%" }}>Vehicle</th>
                <th style={{ ...styles.th, width: "20%" }}>Pick Up Date / Time</th>
                <th style={{ ...styles.th, width: "23%" }}>Client Detail</th>
                <th style={{ ...styles.th, width: "13%" }}>Driver Detail</th>
                <th className="no-print" style={{ ...styles.th, width: "5%", textAlign: "center" }}>Act</th>
              </tr>
            </thead>
            <tbody>
              {voucherData.services.map((service, index) => (
                <tr key={index}>
                  <td style={{ ...styles.td, textAlign: "center", fontWeight: "bold" }}>{service.sNo}</td>
                  <td style={styles.td}><textarea value={service.service} onChange={(e) => handleServiceChange(index, "service", e.target.value)} style={styles.tableTextarea} placeholder="..." rows={2} /></td>
                  <td style={styles.td}><textarea value={service.vehicle} onChange={(e) => handleServiceChange(index, "vehicle", e.target.value)} style={styles.tableTextarea} placeholder="..." rows={2} /></td>
                  <td style={styles.td}><textarea value={service.pickupDateTime} onChange={(e) => handleServiceChange(index, "pickupDateTime", e.target.value)} style={styles.tableTextarea} placeholder="..." rows={2} /></td>
                  <td style={styles.td}><textarea value={service.clientDetail} onChange={(e) => handleServiceChange(index, "clientDetail", e.target.value)} style={styles.tableTextarea} placeholder="Details..." rows={2} /></td>
                  <td style={styles.td}><textarea value={service.driverDetail} onChange={(e) => handleServiceChange(index, "driverDetail", e.target.value)} style={styles.tableTextarea} placeholder="..." rows={2} /></td>
                  <td className="no-print" style={{ ...styles.td, textAlign: "center", verticalAlign: "middle" }}>
                    <button onClick={() => deleteServiceRow(index)} style={styles.deleteBtn} disabled={voucherData.services.length === 1}>❌</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.guestHeaderRow}>
          <div>
            <strong>Name:</strong>{" "}
            <input type="text" name="clientName" value={voucherData.clientName} onChange={handleChange} style={styles.inlineInput} placeholder="Lead Passenger Name" />
          </div>
          <div>
            <strong>Total Pax:</strong>{" "}
            <input type="text" name="totalPax" value={voucherData.totalPax} onChange={handleChange} style={{ ...styles.inlineInput, width: "50px", textAlign: "center" }} placeholder="0" />
          </div>
        </div>

        <div style={{ marginBottom: "25px" }}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeaderRow}>
                <th style={{ ...styles.th, width: "10%" }}>S NO</th>
                <th style={{ ...styles.th, width: "50%" }}>Guest Name</th>
                <th style={{ ...styles.th, width: "35%" }}>Passport No</th>
                <th className="no-print" style={{ ...styles.th, width: "5%", textAlign: "center" }}>Act</th>
              </tr>
            </thead>
            <tbody>
              {voucherData.guests.map((guest, index) => (
                <tr key={index}>
                  <td style={{ ...styles.td, textAlign: "center" }}>{guest.sNo}</td>
                  <td style={styles.td}><input type="text" value={guest.guestName} onChange={(e) => handleGuestChange(index, "guestName", e.target.value)} style={styles.tableInput} placeholder="Enter Guest Name" /></td>
                  <td style={styles.td}><input type="text" value={guest.passportNo} onChange={(e) => handleGuestChange(index, "passportNo", e.target.value)} style={styles.tableInput} placeholder="Enter Passport No" /></td>
                  <td className="no-print" style={{ ...styles.td, textAlign: "center", verticalAlign: "middle" }}>
                    <button onClick={() => deleteGuestRow(index)} style={styles.deleteBtn} disabled={voucherData.guests.length === 1}>❌</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={styles.notesContainer}>
          <h4 style={styles.notesHeader}>⚠️ Important Notes & Condition:</h4>
          <p style={styles.notesContent}>Be Carefull 24 Hours Before Contact this Number otherwise Vehicle not be given &amp; If Caught Police &amp; give Fine Company not responsible.</p>
        </div>

        <div style={styles.signatureRow}>
          <div style={styles.sigBox}><div style={styles.sigLine} /><p style={styles.sigText}>Prepared By</p></div>
          <div style={styles.sigBox}><div style={styles.sigLine} /><p style={styles.sigText}>Driver's Signature</p></div>
          <div style={styles.sigBox}><div style={styles.sigLine} /><p style={styles.sigText}>Customer / Passenger Signature</p></div>
        </div>
      </div>

      <style>{`
        .custom-date-input { position: relative; }
        .custom-date-input::-webkit-datetime-edit { color: transparent; }
        .custom-date-input::before { content: attr(data-date); position: absolute; left: 6px; top: 50%; transform: translateY(-50%); color: #111; font-weight: bold; font-size: 14px; white-space: nowrap; }
        @media print {
          body * { visibility: hidden; }
          .printable-voucher-sheet, .printable-voucher-sheet * { visibility: visible; }
          .no-print, .no-print * { display: none !important; }
          .printable-voucher-sheet { position: absolute; left: 0; top: 0; width: 100% !important; max-width: 100% !important; border: none !important; box-shadow: none !important; padding: 0 !important; margin: 0 !important; }
          @page { size: A4 portrait; margin: 12mm; }
          input, textarea { border: none !important; background: transparent !important; padding: 0 !important; font-size: 11pt !important; color: #000 !important; resize: none !important; }
          input::placeholder, textarea::placeholder { color: transparent !important; }
          table, th, td { border: 1px solid #444 !important; }
          th { background-color: #eaeaea !important; }
        }
      `}</style>
    </div>
  );
}

const styles = {
  actionContainer: { maxWidth: "850px", margin: "0 auto 20px auto", display: "flex", justifyContent: "space-between", alignItems: "center", backgroundColor: "#e8f4fd", padding: "15px", borderRadius: "8px", border: "1px solid #b3d7f7" },
  backButton: { backgroundColor: "#6c757d", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" },
  printButton: { backgroundColor: "#198754", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" },
  pdfButton: { backgroundColor: "#dc3545", color: "#fff", border: "none", padding: "10px 18px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" },
  addButton: { backgroundColor: "#0b3d91", color: "#fff", border: "none", padding: "10px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "14px", fontWeight: "bold" },
  deleteBtn: { background: "none", border: "none", cursor: "pointer", fontSize: "14px", padding: "2px 5px" },
  voucherPaper: { maxWidth: "850px", margin: "0 auto", backgroundColor: "#fff", border: "1px solid #ddd", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", padding: "35px", boxSizing: "border-box" },
  metaRow: { display: "flex", justifyContent: "space-between", marginBottom: "20px", fontSize: "14px", color: "#333", paddingBottom: "10px", borderBottom: "1px solid #eee" },
  inlineInput: { border: "none", borderBottom: "1px dashed #d4af37", marginLeft: "5px", padding: "2px 5px", outline: "none", fontSize: "14px", backgroundColor: "transparent" },
  inlineInputDate: { border: "none", borderBottom: "1px dashed #d4af37", marginLeft: "5px", padding: "2px 5px", outline: "none", fontSize: "14px", backgroundColor: "transparent", width: "115px", cursor: "pointer" },
  sectionHeader: { margin: "0 0 10px 0", fontSize: "14px", color: "#0b3d91", fontWeight: "bold" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "5px", tableLayout: "fixed" },
  tableHeaderRow: { backgroundColor: "#f5f5f5" },
  th: { border: "1px solid #ddd", padding: "8px", fontSize: "12px", fontWeight: "bold", color: "#333", textAlign: "left" },
  td: { border: "1px solid #ddd", padding: "6px", fontSize: "13px", verticalAlign: "top", wordBreak: "break-word", overflow: "visible" },
  tableInput: { width: "100%", border: "none", outline: "none", padding: "4px", fontSize: "13px", boxSizing: "border-box", backgroundColor: "transparent" },
  tableTextarea: { width: "100%", border: "none", outline: "none", padding: "4px", fontSize: "13px", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical", backgroundColor: "transparent", whiteSpace: "pre-wrap", wordWrap: "break-word", height: "auto", minHeight: "34px" },
  guestHeaderRow: { display: "flex", gap: "30px", marginBottom: "10px", fontSize: "14px", backgroundColor: "#fafafa", padding: "10px", borderRadius: "6px", border: "1px solid #eee" },
  notesContainer: { marginTop: "25px", padding: "15px", backgroundColor: "#fff5f5", border: "1px solid #fbc4c4", borderRadius: "8px" },
  notesHeader: { margin: "0 0 6px 0", color: "#c92a2a", fontSize: "14px", fontWeight: "bold" },
  notesContent: { margin: 0, fontSize: "12.5px", lineHeight: "1.5", color: "#2b2b2b", fontWeight: "bold" },
  signatureRow: { display: "flex", justifyContent: "space-between", marginTop: "60px", paddingTop: "10px" },
  sigBox: { width: "28%", textAlign: "center" },
  sigLine: { borderBottom: "1px solid #999", marginBottom: "8px" },
  sigText: { fontSize: "11px", color: "#666", fontWeight: "bold", margin: 0 }
};