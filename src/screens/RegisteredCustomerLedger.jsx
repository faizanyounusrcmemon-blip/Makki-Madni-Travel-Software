import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import Swal from "sweetalert2";

/* =========================
   HELPERS & UTILS
========================= */
const getRowDate = (r) => {
  if (!r?.date) return "-";
  const d = new Date(r.date);
  if (isNaN(d.getTime())) return "-";
  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const fmtAmt = (v) =>
  v === null || v === undefined || v === "" ? "0" : Number(v).toLocaleString("en-US");

const parseAmt = (v) => Number(String(v).replace(/,/g, "") || 0);

const numberToWords = (num) => {
  if (!num) return "";
  const a = ["","One","Two","Three","Four","Five","Six","Seven","Eight","Nine",
    "Ten","Eleven","Twelve","Thirteen","Fourteen","Fifteen","Sixteen","Seventeen","Eighteen","Nineteen"];
  const b = ["","","Twenty","Thirty","Forty","Fifty","Sixty","Seventy","Eighty","Ninety"];

  const w = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + w(n % 100) : "");
    if (n < 1000000) return w(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + w(n % 1000) : "");
    if (n < 10000000) return w(Math.floor(n / 100000)) + " Lac" + (n % 100000 ? " " + w(n % 100000) : "");
    return "";
  };
  return w(num) + " Only";
};

const today = new Date().toISOString().split("T")[0];

export default function RegisteredCustomerLedger({ onNavigate }) {
  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [rows, setRows] = useState([]);
  const [pending, setPending] = useState([]);
  
  // Date Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Add Transaction Form
  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");
  const [date, setDate] = useState(today);
  const [type, setType] = useState("payment");
  const [method, setMethod] = useState("Bank");
  const [saving, setSaving] = useState(false);

  // --- DYNAMIC DETAILED MODAL STATES ---
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailType, setDetailType] = useState(""); 
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  /* =========================
     LOAD PENDING CUSTOMERS
  ========================== */
  const loadPending = async () => {
    try {
      const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/registered-ledger/pending/list`);
      const d = await r.json();
      if (d.success) {
        setPending(d.rows || []);
      }
    } catch (e) {
      console.error("Error loading pending registered users:", e);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  /* =========================
     LOAD SPECIFIC LEDGER
  ========================== */
  const loadLedger = async (code = customerCode) => {
    const targetCode = String(code || "").trim().toUpperCase();
    if (!targetCode) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Please enter or select a Customer Code" });
    }
    setCustomerCode(targetCode);

    Swal.fire({
      width: "250px",
      title: "Loading...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      let url = `${import.meta.env.VITE_BACKEND_URL}/api/registered-ledger/detail/${targetCode}`;
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
      if (params.length > 0) url += `?${params.join("&")}`;

      const res = await fetch(url);
      const d = await res.json();
      Swal.close();

      if (!d.success) {
        Swal.fire({ width: "320px", icon: "error", text: d.error || "Data load failed" });
        setRows([]);
        setCustomerName("");
        return;
      }

      setRows(d.rows || []);
      setCustomerName(d.customerName || "Registered Customer");
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network connection error" });
    }
  };

  /* ==========================================================
       SMART DYNAMIC FETCH: PARSES EXACT DB REFERENCE KEY & ENDPOINTS
    ============================================================= */
  const fetchSaleDetail = async (id, description) => {
    const idStr = String(id || "").toUpperCase();
    let detectedType = "INVOICE";
    let endpoint = "";

    // Step 1: Extract real reference key (e.g., "SALE-TIC-00032" -> "TIC-00032")
    // taake backend correct dynamic key match kar sake.
    let cleanRef = idStr;
    if (idStr.startsWith("SALE-")) {
      cleanRef = idStr.replace("SALE-", "");
    }

    // Exact Ledger row matching fallback ke liye balance fetch karne ke liye
    const matchedLedgerRow = rows.find(r => String(r.id) === idStr);
    const ledgerDebitVal = matchedLedgerRow ? Number(matchedLedgerRow.debit || 0) : 0;

    // Step 2: Set matching base routers
    if (cleanRef.startsWith("TIC-")) {
      detectedType = "TICKETING";
      endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/ticketing/get/${cleanRef}`;
    } else if (cleanRef.startsWith("HOT-")) {
      detectedType = "HOTEL";
      endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/hotels/get/${cleanRef}`;
    } else if (cleanRef.startsWith("VISA-")) {
      detectedType = "VISA";
      endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/visa/get/${cleanRef}`;
    } else if (cleanRef.startsWith("PKG-")) {
      detectedType = "PACKAGE";
      endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/bookings/get/${cleanRef}`;
    } else if (cleanRef.startsWith("ZIY-")) {
      detectedType = "ZIYARAT";
      endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/ziyarat/get/${cleanRef}`;
    } else if (cleanRef.startsWith("TRN-")) {
      detectedType = "TRANSPORT";
      endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/transport/get/${cleanRef}`;
    } else if (cleanRef.startsWith("CARD-")) {
      detectedType = "CARD";
      endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/card/get/${cleanRef}`;
    } else if (cleanRef.startsWith("GRP-")) {
      detectedType = "GROUPS";
      endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/groups/get/${cleanRef}`;
    }

    setDetailType(detectedType);
    setDetailModalOpen(true);
    setDetailLoading(true);
    setDetailData(null);

    const useBackupFallback = () => {
      setDetailData({
        ref_no: cleanRef,
        customer_name: customerName,
        booking_date: matchedLedgerRow?.date || today,
        description: description,
        total_pkr: ledgerDebitVal,
        grand_total: ledgerDebitVal,
        total_amount: ledgerDebitVal,
        total_sar: 0,
        pkr_rate: 0
      });
    };

    try {
      const res = await fetch(endpoint);
      
      // Secondary Plural endpoints handling for robustness
      if (!res.ok) {
        let retryUrl = "";
        if (detectedType === "CARD") {
          retryUrl = `${import.meta.env.VITE_BACKEND_URL}/api/cards/get/${cleanRef}`;
        } else if (detectedType === "TICKETING") {
          retryUrl = `${import.meta.env.VITE_BACKEND_URL}/api/ticket/get/${cleanRef}`;
        }
        
        if (retryUrl) {
          const altRes = await fetch(retryUrl);
          if (altRes.ok) {
            const altData = await altRes.json();
            return handleSuccessResponse(altData, ledgerDebitVal, cleanRef, detectedType);
          }
        }
      }
      
      if (!res.ok) {
        throw new Error("API status: " + res.status);
      }

      const data = await res.json();
      handleSuccessResponse(data, ledgerDebitVal, cleanRef, detectedType);
    } catch (err) {
      console.error("Error fetching detail:", err);
      useBackupFallback();
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSuccessResponse = (data, ledgerDebitVal, originalId, currentType) => {
    if (data.success && data.row) {
      const row = data.row;
      
      const safeParse = (v) => {
        if (!v) return [];
        if (Array.isArray(v)) return v;
        try { return JSON.parse(v); } catch { return []; }
      };

      if (currentType === "TICKETING" || String(row.ref_no || "").includes("TIC")) {
        row.flight_from = safeParse(row.flight_from);
        row.flight_to = safeParse(row.flight_to);
        row.flight_date = safeParse(row.flight_date);
        row.airline = safeParse(row.airline);
      } else if (["VISA", "ZIYARAT", "TRANSPORT", "CARD", "GROUPS"].includes(currentType)) {
        row.rows = safeParse(row.rows);
      }

      // ⚡ Total extraction is strict to make sure it NEVER falls back to 0 if debit exists
      row.total_pkr = Number(row.total_pkr || row.grand_total || row.total_amount || row.total_amount_pkr || ledgerDebitVal || 0);
      row.grand_total = row.total_pkr;
      row.total_amount = row.total_pkr;

      setDetailData(row);
    } else {
      setDetailData({
        ref_no: originalId || "N/A",
        customer_name: customerName,
        booking_date: today,
        description: "",
        total_pkr: ledgerDebitVal,
        grand_total: ledgerDebitVal,
        total_amount: ledgerDebitVal
      });
    }
  };

  /* =========================
     SAVE PAYMENT/ADJUSTMENT
  ========================== */
  const saveEntry = async () => {
    if (!customerCode) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Customer Code is required" });
    }
    if (amountRaw <= 0) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Please enter a valid amount" });
    }

    setSaving(true);
    Swal.fire({
      width: "250px",
      title: "Saving Receipt...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/registered-ledger/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_code: customerCode,
          amount: Number(amountRaw),
          payment_date: date,
          payment_method: method,
          type
        }),
      });

      const d = await r.json();
      Swal.close();

      if (d.success) {
        setAmountRaw(0);
        setAmountDisp("");
        setDate(today);
        await loadLedger(customerCode);
        await loadPending();
        Swal.fire({ width: "280px", icon: "success", text: "Transaction Saved Successfully!" });
      } else {
        Swal.fire({ width: "300px", icon: "error", text: d.error || "Failed to save" });
      }
    } catch (err) {
      Swal.close();
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  /* =========================
     DELETE ROW
  ========================== */
  const deleteRow = async (id) => {
    if (String(id).startsWith("SALE-") || String(id).startsWith("TIC-") || String(id).startsWith("HOT-")) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Invoice entry cannot be deleted from ledger. Delete from original module." });
    }

    const { value: isConfirmed } = await Swal.fire({
      width: "300px",
      text: "Are you sure you want to delete this transaction?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it"
    });

    if (!isConfirmed) return;

    const { value: passInput } = await Swal.fire({
      width: "320px",
      html: `
        <div style="text-align:left;">
          <label style="font-size:13px; font-weight:bold;">Enter Authorization Password:</label>
          <div style="position:relative; margin-top:8px;">
            <input id="swal-pass" type="password" class="swal2-input" 
              style="width:100%; height:38px; margin:0; padding-right:40px; font-size:14px;" placeholder="Password" />
            <span id="eye-toggle" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); cursor:pointer; font-size:16px; user-select:none;">👁</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Authorize & Delete",
      preConfirm: () => {
        const val = document.getElementById("swal-pass").value;
        if (!val) {
          Swal.showValidationMessage("Password cannot be empty");
          return false;
        }
        return val;
      },
      didOpen: () => {
        const input = document.getElementById("swal-pass");
        const eye = document.getElementById("eye-toggle");
        let visible = false;
        eye.addEventListener("click", () => {
          visible = !visible;
          input.type = visible ? "text" : "password";
          eye.textContent = visible ? "🙈" : "👁";
        });
      }
    });

    if (!passInput) return;

    Swal.fire({
      width: "250px",
      title: "Deleting...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/registered-ledger/delete/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passInput })
      });

      const d = await r.json();
      Swal.close();

      if (d.success) {
        await loadLedger(customerCode);
        await loadPending();
        Swal.fire({ width: "280px", icon: "success", text: "Transaction Deleted Successfully" });
      } else {
        Swal.fire({ width: "300px", icon: "error", text: d.error || "Incorrect Password!" });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network communication error" });
    }
  };

  /* ==========================================
     A4 MULTI-PAGE PDF GENERATOR
  ========================================== */
  const exportPDF = () => {
    if (rows.length === 0) return;

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    let y = 15;

    const drawHeader = (pageNum) => {
      pdf.setFillColor(18, 97, 160);
      pdf.rect(0, 0, pageWidth, 26, "F");

      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(16);
      pdf.text("MAKKI MADNI TRAVEL & TOURS", pageWidth / 2, 12, { align: "center" });

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9);
      pdf.text(`REGISTERED CUSTOMER LEDGER STATEMENT — Page ${pageNum}`, pageWidth / 2, 19, { align: "center" });

      pdf.setFillColor(242, 245, 248);
      pdf.rect(10, 29, pageWidth - 20, 22, "F");

      pdf.setTextColor(33, 37, 41);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(10);
      pdf.text(`CUSTOMER NAME: ${customerName.toUpperCase()}`, 13, 36);
      pdf.text(`CUSTOMER CODE: ${customerCode}`, 13, 44);

      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(9.5);
      const periodStr = startDate || endDate ? `${startDate || "Start"} to ${endDate || "Present"}` : "All Records";
      pdf.text(`Statement Period: ${periodStr}`, pageWidth - 95, 36);
      pdf.text(`Printed On: ${getRowDate({ date: today })}`, pageWidth - 95, 44);

      pdf.setFillColor(33, 37, 41);
      pdf.rect(10, 55, pageWidth - 20, 8, "F");
      pdf.setTextColor(255, 255, 255);
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(9);
      pdf.text("Date", 13, 60.5);
      pdf.text("Description", 35, 60.5);
      pdf.text("Debit (Dr)", pageWidth - 80, 60.5, { align: "right" });
      pdf.text("Credit (Cr)", pageWidth - 50, 60.5, { align: "right" });
      pdf.text("Balance", pageWidth - 14, 60.5, { align: "right" });
    };

    let currentPage = 1;
    drawHeader(currentPage);
    y = 68;

    rows.forEach((row) => {
      if (y > pageHeight - 18) {
        pdf.addPage();
        currentPage++;
        drawHeader(currentPage);
        y = 68;
      }

      pdf.setTextColor(50, 50, 50);
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(8.5);

      pdf.text(getRowDate(row), 13, y);
      pdf.text(row.description, 35, y, { maxWidth: 80 });

      const debVal = row.debit > 0 ? fmtAmt(row.debit) : "-";
      const credVal = row.credit > 0 ? fmtAmt(row.credit) : "-";

      pdf.text(debVal, pageWidth - 80, y, { align: "right" });
      pdf.text(credVal, pageWidth - 50, y, { align: "right" });

      pdf.setFont("helvetica", "bold");
      pdf.text(fmtAmt(row.balance), pageWidth - 14, y, { align: "right" });

      pdf.setDrawColor(230, 230, 230);
      pdf.setLineWidth(0.1);
      pdf.line(10, y + 2.5, pageWidth - 10, y + 2.5);

      y += 8;
    });

    const safeName = customerName.replace(/[^a-zA-Z0-9]/g, "_");
    pdf.save(`Ledger-${customerCode}-${safeName}.pdf`);
  };

  /* =======================================================
     DYNAMIC TRIP DURATION GENERATOR (FOR TICKET MODAL VIEW)
  ======================================================= */
  const getTripDurationText = (flightDatesArray) => {
    const dates = (flightDatesArray || []).filter(Boolean).sort();
    if (dates.length >= 2) {
      const start = new Date(dates[0]);
      const end = new Date(dates[dates.length - 1]);
      const diff = (end - start) / (1000 * 60 * 60 * 24);
      return `${diff + 1} Days / ${diff} Nights`;
    }
    return "Standard Duration";
  };

  /* =====================================================================
     SMART DYNAMIC VALUE GETTERS (MAPS DATABASE KEYS ROBUSTLY)
  ===================================================================== */
  const getModalTotalSar = () => {
    if (!detailData) return 0;
    return (
      detailData.total_sar || 
      detailData.sar_total || 
      detailData.hotels_total || 
      detailData.flight_sar_total || 
      detailData.total_sar_rate || 
      0
    );
  };

  const getModalPkrRate = () => {
    if (!detailData) return 0;
    return (
      detailData.pkr_rate || 
      detailData.sar_rate || 
      detailData.exchange_rate || 
      detailData.rate ||
      0
    );
  };

  const getModalTotalPkr = () => {
    if (!detailData) return 0;
    return (
      detailData.total_pkr || 
      detailData.net_pkr_total || 
      detailData.grand_total || 
      detailData.total_amount || 
      detailData.total_amount_pkr || 
      detailData.debit || 
      0
    );
  };

  return (
    <div className="container-fluid p-4">
      {/* HEADER CARD */}
      <div className="card shadow-sm mb-4">
        <div className="card-body d-flex justify-content-between align-items-center bg-primary text-white rounded">
          <h4 className="fw-bold mb-0 text-white">
            🏦 REGISTERED CUSTOMER FINANCIAL LEDGER {customerCode && `— [${customerCode}]`}
          </h4>
          <button className="btn btn-light btn-sm fw-bold" onClick={() => onNavigate("dashboard")}>
            ⬅ Back to Dashboard
          </button>
        </div>
      </div>

      <div className="row">
        {/* LEFT PANEL: PENDING LIST */}
        <div className="col-lg-3 col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-danger text-white fw-bold d-flex justify-content-between align-items-center">
              <span>⏳ Outstanding Ledgers</span>
              <button className="btn btn-outline-light btn-sm py-0 px-2" onClick={loadPending}>🔄</button>
            </div>
            <div className="card-body p-2" style={{ maxHeight: "75vh", overflowY: "auto" }}>
              {pending.length === 0 ? (
                <div className="p-3 text-center text-muted">
                  <h6>✅ No Pending Ledger</h6>
                  <p className="small mb-0">All registered customers are clear!</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {pending.map((p, i) => (
                    <div
                      key={i}
                      onClick={() => {
                        setCustomerCode(p.customer_code);
                        loadLedger(p.customer_code);
                      }}
                      className="list-group-item list-group-item-action p-2 mb-2 rounded border-start border-4 cursor-pointer"
                      style={{
                        cursor: "pointer",
                        borderStartColor: p.payment_status === "PENDING" ? "#dc3545" : "#ffc107",
                        backgroundColor: p.customer_code === customerCode ? "#e2eafd" : "#f8f9fa"
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="badge bg-dark font-monospace" style={{ fontSize: "0.75rem" }}>{p.customer_code}</span>
                        <span className={`badge py-0 px-1 ${p.payment_status === "PENDING" ? "bg-danger" : "bg-warning text-dark"}`} style={{ fontSize: "0.7rem" }}>
                          {p.payment_status}
                        </span>
                      </div>
                      <div className="fw-bold text-truncate text-primary" style={{ fontSize: "0.85rem" }}>
                        {p.customer_name || "Registered Customer"}
                      </div>
                      <div className="text-end text-danger fw-bold small mt-1" style={{ fontSize: "0.8rem" }}>
                        PKR {fmtAmt(p.remaining_balance)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className="col-lg-9 col-md-8">
          
          {/* SEARCH & FILTERS CONTROLS */}
          <div className="card shadow-sm mb-3 border-start border-primary border-3">
            <div className="card-body">
              <div className="row g-2 align-items-end">
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">Customer Code</label>
                  <input
                    className="form-control font-monospace fw-bold"
                    placeholder="E.g., CUST-102"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") loadLedger();
                    }}
                  />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">From Date</label>
                  <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small fw-bold text-muted mb-1">To Date</label>
                  <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <div className="d-flex gap-2">
                    <button className="btn btn-primary w-100 fw-bold" onClick={() => loadLedger()}>
                      🔍 Load Ledger
                    </button>
                    <button className="btn btn-success w-100 fw-bold" onClick={exportPDF} disabled={rows.length === 0}>
                      📄 Export PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ADD PAYMENT RECIEPT FORM */}
          <div className={`card shadow-sm mb-3 ${!customerCode ? "opacity-50" : ""}`} style={{ pointerEvents: !customerCode ? "none" : "auto" }}>
            <div className="card-header bg-dark text-white fw-bold">📥 Post New Payment / Receipt</div>
            <div className="card-body">
              <div className="row g-2 mb-3">
                <div className="col-md-3">
                  <label className="form-label small text-muted mb-1">Receipt Date</label>
                  <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
                </div>
                <div className="col-md-3">
                  <label className="form-label small text-muted mb-1">Amount (PKR)</label>
                  <input
                    className="form-control fw-bold text-success font-monospace"
                    placeholder="Enter Amount"
                    value={amountDisp}
                    onChange={(e) => {
                      const raw = parseAmt(e.target.value);
                      if (!isNaN(raw)) {
                        setAmountRaw(raw);
                        setAmountDisp(fmtAmt(raw));
                      }
                    }}
                  />
                  {amountRaw > 0 && (
                    <div className="mt-1 small text-success fw-semibold text-truncate" style={{ fontSize: "0.75rem" }}>
                      {numberToWords(amountRaw)}
                    </div>
                  )}
                </div>
                <div className="col-md-3">
                  <label className="form-label small text-muted mb-1">Transaction Type</label>
                  <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="payment">payment</option>
                    <option value="adjustment">adjustment</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label small text-muted mb-1">Payment Method</label>
                  <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="Bank">Bank</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-success px-4 fw-bold" disabled={saving || !customerCode} onClick={saveEntry}>
                {saving ? "Saving Entry..." : "💾 Save Entry"}
              </button>
            </div>
          </div>

          {/* LEDGER DATA TABLE CARD */}
          <div className="card shadow-sm overflow-hidden">
            <div className="card-header bg-secondary text-white fw-bold d-flex justify-content-between align-items-center">
              <span>📊 Statement Details</span>
              {customerName && <span className="badge bg-light text-dark fw-bold">Customer: {customerName.toUpperCase()}</span>}
            </div>
            <div className="table-responsive">
              <table className="table table-striped table-hover table-bordered mb-0 align-middle">
                <thead className="table-dark">
                  <tr>
                    <th style={{ width: "12%" }}>Date</th>
                    <th style={{ width: "48%" }}>Details / Description</th>
                    <th style={{ width: "12%" }} className="text-end">Debit (-)</th>
                    <th style={{ width: "12%" }} className="text-end">Credit (+)</th>
                    <th style={{ width: "12%" }} className="text-end">Balance</th>
                    <th style={{ width: "4%" }} className="text-center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center p-4 text-muted fs-6">
                        No transactions to display. Enter a Customer Code above and click "Load Ledger".
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, i) => {
                      const idStr = String(r.id || "");
                      const isSale = idStr.startsWith("SALE-") || idStr.startsWith("BKG-") || idStr.startsWith("TIC-") || idStr.startsWith("HOT-") || idStr.startsWith("VIS-") || idStr.startsWith("PKG-") || idStr.startsWith("ZIY-") || idStr.startsWith("TRN-") || idStr.startsWith("CRD-") || idStr.startsWith("GRP-");
                      return (
                        <tr key={r.id || i}>
                          <td>{getRowDate(r)}</td>
                          <td>{r.description}</td>
                          <td className="text-end text-danger fw-bold font-monospace">{r.debit > 0 ? fmtAmt(r.debit) : "-"}</td>
                          <td className="text-end text-success fw-bold font-monospace">{r.credit > 0 ? fmtAmt(r.credit) : "-"}</td>
                          <td className="text-end fw-bold font-monospace" style={{ backgroundColor: "#fdfdfd" }}>
                            {fmtAmt(r.balance)}
                          </td>
                          <td className="text-center">
                            {isSale ? (
                              <button 
                                className="btn btn-sm btn-info py-0 px-2 text-white fw-bold"
                                style={{ fontSize: "11px" }}
                                onClick={() => fetchSaleDetail(r.id, r.description)}
                              >
                                👁 View
                              </button>
                            ) : (
                              <button className="btn btn-outline-danger btn-sm py-0 px-2" onClick={() => deleteRow(r.id)}>
                                Del
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      {/* =====================================================
          ✨ BEAUTIFUL DYNAMIC DETAIL MODAL (POPUP)
         ===================================================== */}
      {detailModalOpen && (
        <div 
          className="modal show d-block animate__animated animate__fadeIn" 
          tabIndex="-1" 
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1055 }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0 shadow-lg">
              
              {/* Modal Header */}
              <div className="modal-header text-white bg-dark border-0 rounded-top-4">
                <h5 className="modal-title fw-bold">
                  📄 {detailType === "CARD" ? "INVOICE" : detailType} DETAILS
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => setDetailModalOpen(false)}
                ></button>
              </div>

              {/* Modal Body */}
              <div className="modal-body bg-light p-4">
                {detailLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted fw-bold">Fetching details, please wait...</p>
                  </div>
                ) : detailData ? (
                  <div>
                    {/* ===== INFO CARDS LAYOUT ===== */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="bg-white border rounded-4 p-3 shadow-sm h-100">
                          <span className="text-muted small d-block">Reference No</span>
                          <strong className="fs-5 text-primary">{detailData.ref_no || detailData.id}</strong>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="bg-white border rounded-4 p-3 shadow-sm h-100">
                          <span className="text-muted small d-block">Customer Name</span>
                          <strong className="fs-5 text-dark">{detailData.customer_name || customerName}</strong>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div className="bg-white border rounded-4 p-3 shadow-sm text-center">
                          <span className="text-muted small d-block">📅 Booking Date</span>
                          <strong className="text-dark">
                            {detailData.booking_date || detailData.created_at ? new Date(detailData.booking_date || detailData.created_at).toLocaleDateString("en-GB") : "-"}
                          </strong>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <div
                          style={{
                            background: "linear-gradient(135deg,#ff6f61,#ffa07a)",
                            color: "#fff",
                            padding: "12px",
                            borderRadius: "12px",
                            textAlign: "center",
                            fontWeight: "700",
                            boxShadow: "0 3px 8px rgba(0,0,0,0.1)"
                          }}
                        >
                          📅 {detailType === "TICKETING" ? getTripDurationText(detailData.flight_date) : "Standard Duration"}
                        </div>
                      </div>
                    </div>

                    <hr />

                    {/* ===== 1. TICKETING SPECIFIC VIEW ===== */}
                    {detailType === "TICKETING" && (
                      <div className="mb-4">
                        <h5 className="fw-bold text-primary mb-3">✈️ Flight Routes</h5>
                        {(!detailData.flight_from || detailData.flight_from.length === 0) ? (
                          <p className="text-muted">No routes added</p>
                        ) : (
                          detailData.flight_from.map((f, idx) => (
                            <div key={idx} className="border rounded-3 p-3 mb-2 bg-white shadow-sm">
                              <div className="fw-bold fs-6 text-dark d-flex justify-content-between">
                                <span>{f} → {detailData.flight_to?.[idx] || "N/A"}</span>
                                {detailData.airline?.[idx] && (
                                  <span className="fw-bold text-success">
                                    ✈️ {detailData.airline[idx]}
                                  </span>
                                )}
                              </div>
                              <div className="mt-2">
                                <span className="badge bg-primary" style={{ fontSize: "12px", padding: "6px 10px" }}>
                                  📅 {detailData.flight_date?.[idx] ? new Date(detailData.flight_date[idx]).toLocaleDateString("en-GB") : "-"}
                                </span>
                              </div>
                            </div>
                          ))
                        )}

                        <hr />

                        <h5 className="fw-bold text-primary mb-3">👥 Passengers Breakdown</h5>
                        <div className="bg-white border rounded-4 p-3 shadow-sm">
                          <div className="row text-center">
                            <div className="col-4 border-end">
                              <span className="text-muted small d-block">Adult</span>
                              <strong>{detailData.adult_qty || 0} × {fmtAmt(detailData.adult_rate || detailData.rate || 0)}</strong>
                            </div>
                            <div className="col-4 border-end">
                              <span className="text-muted small d-block">Child</span>
                              <strong>{detailData.child_qty || 0} × {fmtAmt(detailData.child_rate || 0)}</strong>
                            </div>
                            <div className="col-4">
                              <span className="text-muted small d-block">Infant</span>
                              <strong>{detailData.infant_qty || 0} × {fmtAmt(detailData.infant_rate || 0)}</strong>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* ===== 2. HOTEL SPECIFIC VIEW ===== */}
                    {detailType === "HOTEL" && (
                      <div className="mb-4">
                        <h5 className="fw-bold text-primary mb-3">🏨 Hotel Details</h5>
                        {(!Array.isArray(detailData.hotels) || detailData.hotels.length === 0) ? (
                          <p className="text-muted">No hotel details available</p>
                        ) : (
                          detailData.hotels.map((h, idx) => (
                            <div key={idx} className="border rounded-3 p-3 mb-2 bg-white shadow-sm">
                              <div className="fw-bold mb-1 text-dark">
                                {idx + 1}. 🛏️ {h.hotel}
                              </div>
                              <div className="row small">
                                <div className="col-6"><b>📍 Location:</b> {h.location}</div>
                                <div className="col-6"><b>Type:</b> {h.type}</div>
                                <div className="col-6">
                                  <b>Check-in:</b> <span className="text-primary fw-bold">{h.checkIn ? new Date(h.checkIn).toLocaleDateString("en-GB") : "-"}</span>
                                </div>
                                <div className="col-6">
                                  <b>Check-out:</b> <span className="text-danger fw-bold">{h.checkOut ? new Date(h.checkOut).toLocaleDateString("en-GB") : "-"}</span>
                                </div>
                                <div className="col-6"><b>Nights:</b> {h.nights}</div>
                                <div className="col-6"><b>Rooms:</b> {h.rooms}</div>
                                <div className="col-6"><b>Rate (SAR):</b> {fmtAmt(h.rate)}</div>
                                <div className="col-6"><b>Total (SAR):</b> {fmtAmt(h.total)}</div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* ===== 3. PACKAGE SPECIFIC VIEW ===== */}
                    {detailType === "PACKAGE" && (
                      <div className="mb-4">
                        <h5 className="fw-bold text-primary mb-2">✈️ Flights Included</h5>
                        <div className="border p-2 bg-white rounded mb-3">
                          {Array.isArray(detailData.flights) && detailData.flights.length > 0 ? (
                            detailData.flights.map((f, idx) => (
                              <div key={idx} className="mb-1 text-muted">
                                {f.date ? new Date(f.date).toLocaleDateString("en-GB") : "-"} — {f.from} → {f.to} {f.airline && <b>({f.airline})</b>}
                              </div>
                            ))
                          ) : (
                            <p className="mb-0 text-muted">No flights</p>
                          )}
                        </div>

                        <h5 className="fw-bold text-success mb-2">🏨 Hotels Included</h5>
                        {Array.isArray(detailData.hotels) && detailData.hotels.length > 0 ? (
                          detailData.hotels.map((h, idx) => (
                            <div key={idx} className="border p-2 bg-white rounded mb-2 shadow-sm">
                              <b>🛏️ {h.hotel}</b> — 📍 {h.location}<br />
                              Check In: <span className="text-primary fw-bold">{h.checkIn ? new Date(h.checkIn).toLocaleDateString("en-GB") : "-"}</span> → 
                              Check Out: <span className="text-danger fw-bold">{h.checkOut ? new Date(h.checkOut).toLocaleDateString("en-GB") : "-"}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted">No hotels included</p>
                        )}
                      </div>
                    )}

                    {/* ===== 4. ARRAYS-BASED MODULES (VISA, ZIYARAT, TRANSPORT, CARD, GROUPS) ===== */}
                    {["VISA", "ZIYARAT", "TRANSPORT", "CARD", "GROUPS"].includes(detailType) && (
                      <div className="mb-4">
                        <h5 className="fw-bold text-primary mb-3">Entries Details</h5>
                        {(!detailData.rows || detailData.rows.length === 0) ? (
                          <div className="p-3 text-center border rounded bg-white text-muted">
                            {detailData.description || "No detail rows found for this invoice entry."}
                          </div>
                        ) : (
                          <div className="bg-white rounded-3 shadow-sm p-2 border">
                            {detailData.rows.map((r, idx) => (
                              <div key={idx} className="d-flex justify-content-between border-bottom py-2 px-3 align-items-center">
                                <div>
                                  <strong className="text-dark">{r.type || r.description || r.text || r.route || "Item"}</strong>
                                  {r.persons && <span className="badge bg-secondary ms-2">{r.persons} Persons</span>}
                                </div>
                                <span className="fw-bold text-success font-monospace">
                                  {fmtAmt(r.total || r.sar || r.pkr || 0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <hr />

                    {/* ===== TOTALS FOOTER BREAKDOWN ===== */}
                    <div className="row g-3 bg-white p-3 rounded-4 shadow-sm border mb-4">
                      <div className="col-4 text-center border-end">
                        <span className="text-muted small">Total SAR</span>
                        <h5 className="fw-bold text-dark font-monospace">
                          {fmtAmt(getModalTotalSar())}
                        </h5>
                      </div>
                      <div className="col-4 text-center border-end">
                        <span className="text-muted small">PKR Rate</span>
                        <h5 className="fw-bold text-dark font-monospace">
                          {fmtAmt(getModalPkrRate())}
                        </h5>
                      </div>
                      <div className="col-4 text-center">
                        <span className="text-muted small">Grand Total (PKR)</span>
                        <h5 className="fw-bold text-success font-monospace">
                          PKR {fmtAmt(getModalTotalPkr())}
                        </h5>
                      </div>
                    </div>

                    {/* ===== TOTAL GRAND SUMMARY ===== */}
                    <div className="d-flex justify-content-between align-items-center bg-dark text-white p-3 rounded-3 shadow-sm">
                      <span className="fw-bold">TOTAL AMOUNT (PKR):</span>
                      <h4 className="mb-0 fw-bold font-monospace">
                        PKR {fmtAmt(getModalTotalPkr())}
                      </h4>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-5">
                    <p className="text-danger fw-bold">Failed to load detailed transaction records.</p>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer bg-light border-0 rounded-bottom-4">
                <button 
                  type="button" 
                  className="btn btn-secondary px-4 fw-bold" 
                  onClick={() => setDetailModalOpen(false)}
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

    </div>
  );
}