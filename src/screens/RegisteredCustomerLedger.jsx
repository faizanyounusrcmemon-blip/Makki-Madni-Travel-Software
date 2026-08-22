import React, { useState, useEffect } from "react";
import useLedgerExport from "../hooks/useLedgerExport";
import Swal from "sweetalert2";


/* ================= DATE HELPER FUNCTIONS ================= */

const toInputDate = (d) => {
  if (!d) return "";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "";
  const year = dt.getFullYear();
  const month = String(dt.getMonth() + 1).padStart(2, "0");
  const day = String(dt.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const formatDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  const day = String(dt.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[dt.getMonth()];
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
};

const getTripDurationText = (dates) => {
  if (!Array.isArray(dates) || dates.length < 2) return "Standard Duration";
  const valid = dates.map((d) => new Date(d)).filter((d) => !isNaN(d.getTime())).sort((a, b) => a - b);
  if (valid.length < 2) return "Standard Duration";
  const diff = Math.ceil((valid[valid.length - 1] - valid[0]) / (1000 * 60 * 60 * 24));
  return `${diff + 1} Days / ${diff} Nights`;
};

const getRowDate = (r) => {
  if (!r) return "-";
  return formatDate(r.date || r.payment_date || r.created_at);
};

const fmtAmt = (v) =>
  v === null || v === undefined || v === "" ? "0" : Number(v).toLocaleString("en-US");

const parseAmt = (v) => Number(String(v).replace(/,/g, "") || 0);

const numberToWords = (num) => {
  if (!num) return "";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

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

const getTodayInputDate = () => toInputDate(new Date());

export default function RegisteredCustomerLedger({ onNavigate }) {
  const [customerCode, setCustomerCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [rows, setRows] = useState([]);
  const [pending, setPending] = useState([]);
  const { exportPDF: handleExportPDF, exportExcel: handleExportExcel } = useLedgerExport();

  // Date Filters
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Transaction Form
  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");
  const [date, setDate] = useState(getTodayInputDate());
  const [type, setType] = useState("payment");
  const [method, setMethod] = useState("Bank");
  const [saving, setSaving] = useState(false);

  // Dynamic Detail Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailType, setDetailType] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);
  const getModalTotalSar = () => Number(detailData?.total_sar || detailData?.grand_total_sar || 0);
  const getModalPkrRate = () => Number(detailData?.pkr_rate || detailData?.rate || 0);
  const getModalTotalPkr = () => Number(detailData?.total_pkr || detailData?.grand_total || detailData?.total_amount || 0);


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

/* =========================
   FETCH SALE DETAIL MODAL (FIXED)
========================== */
const handleSuccessResponse = (data, ledgerVal, originalId, currentType) => {
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
    } else if (currentType === "HOTEL") {
      row.hotels = safeParse(row.hotels);
    } else if (currentType === "PACKAGE") {
      row.flights = safeParse(row.flights);
      row.hotels = safeParse(row.hotels);
      row.visa = safeParse(row.visa);
      row.transport = safeParse(row.transport);
      row.ziyarat = safeParse(row.ziyarat);
    } else if (["VISA", "ZIYARAT", "TRANSPORT", "CARD", "GROUPS"].includes(currentType)) {
      row.rows = safeParse(row.rows);
    }

    row.total_pkr = Number(row.total_pkr || row.grand_total || row.total_amount || row.total_amount_pkr || ledgerVal || 0);
    row.grand_total = row.total_pkr;
    row.total_amount = row.total_pkr;

    setDetailData(row);
  } else {
    setDetailData({
      ref_no: originalId || "N/A",
      customer_name: customerName,
      booking_date: getTodayInputDate(),
      description: "",
      total_pkr: ledgerVal,
      grand_total: ledgerVal,
      total_amount: ledgerVal
    });
  }
};

const fetchSaleDetail = async (id, description) => {
  const idStr = String(id || "").toUpperCase();
  let detectedType = "INVOICE";
  let endpoint = "";

  let cleanRef = idStr;
  if (idStr.startsWith("SALE-")) {
    cleanRef = idStr.replace("SALE-", "");
  }

  const matchedLedgerRow = rows.find(r => String(r.id) === idStr);
  const ledgerVal = matchedLedgerRow ? Number(matchedLedgerRow.credit || matchedLedgerRow.debit || 0) : 0;

  // Prefixes Normalized for both VIS-/VISA-, CRD-/CARD-, BKG-/PKG-
  if (cleanRef.startsWith("TIC-")) {
    detectedType = "TICKETING";
    endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/ticketing/get/${cleanRef}`;
  } else if (cleanRef.startsWith("HOT-")) {
    detectedType = "HOTEL";
    endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/hotels/get/${cleanRef}`;
  } else if (cleanRef.startsWith("VISA-") || cleanRef.startsWith("VIS-")) {
    detectedType = "VISA";
    endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/visa/get/${cleanRef}`;
  } else if (cleanRef.startsWith("PKG-") || cleanRef.startsWith("BKG-")) {
    detectedType = "PACKAGE";
    endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/bookings/get/${cleanRef}`;
  } else if (cleanRef.startsWith("ZIY-")) {
    detectedType = "ZIYARAT";
    endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/ziyarat/get/${cleanRef}`;
  } else if (cleanRef.startsWith("TRN-")) {
    detectedType = "TRANSPORT";
    endpoint = `${import.meta.env.VITE_BACKEND_URL}/api/transport/get/${cleanRef}`;
  } else if (cleanRef.startsWith("CARD-") || cleanRef.startsWith("CRD-")) {
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
      booking_date: matchedLedgerRow?.date || getTodayInputDate(),
      description: description,
      total_pkr: ledgerVal,
      grand_total: ledgerVal,
      total_amount: ledgerVal,
      total_sar: 0,
      pkr_rate: 0
    });
  };

  if (!endpoint) {
    useBackupFallback();
    setDetailLoading(false);
    return;
  }

  try {
    const res = await fetch(endpoint);

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
          return handleSuccessResponse(altData, ledgerVal, cleanRef, detectedType);
        }
      }
    }

    if (!res.ok) {
      throw new Error("API status: " + res.status);
    }

    const data = await res.json();
    handleSuccessResponse(data, ledgerVal, cleanRef, detectedType);
  } catch (err) {
    console.error("Error fetching detail:", err);
    useBackupFallback();
  } finally {
    setDetailLoading(false);
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
      title: "Saving Entry...",
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
          payment_date: date || getTodayInputDate(),
          payment_method: method,
          type
        }),
      });

      const d = await r.json();
      Swal.close();

      if (d.success) {
        setAmountRaw(0);
        setAmountDisp("");
        setDate(getTodayInputDate());
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

/* =========================
   EDIT ROW (STEP 1: PASSWORD -> STEP 2: EDIT FORM)
========================== */
const editRow = async (row) => {
  if (
    String(row.id).startsWith("SALE-") || 
    String(row.id).startsWith("TIC-") || 
    String(row.id).startsWith("HOT-") ||
    String(row.id).startsWith("SNAPSHOT")
  ) {
    return Swal.fire({ 
      width: "300px", 
      icon: "warning", 
      text: "Invoice / Snapshot entries cannot be edited here. Edit from original module." 
    });
  }

  // STEP 1: Pehle Password Pop-up Khulega
  const { value: passInput } = await Swal.fire({
    width: "320px",
    title: "🔒 Authorization Required",
    html: `
      <div style="text-align:left;">
        <label style="font-size:13px; font-weight:bold;">Enter Password to Edit:</label>
        <div style="position:relative; margin-top:8px;">
          <input id="swal-pass-edit" type="password" class="swal2-input" 
            style="width:100%; height:38px; margin:0; padding-right:40px; font-size:14px;" placeholder="Password" />
          <span id="eye-toggle-edit-step1" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); cursor:pointer; font-size:16px; user-select:none;">👁</span>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Verify Password",
    preConfirm: () => {
      const val = document.getElementById("swal-pass-edit").value.trim();
      if (!val) {
        Swal.showValidationMessage("Password cannot be empty");
        return false;
      }
      return val;
    },
    didOpen: () => {
      const input = document.getElementById("swal-pass-edit");
      const eye = document.getElementById("eye-toggle-edit-step1");
      let visible = false;
      eye.addEventListener("click", () => {
        visible = !visible;
        input.type = visible ? "text" : "password";
        eye.textContent = visible ? "🙈" : "👁";
      });
    }
  });

  if (!passInput) return;

  // Backend par Password Check Karein
  Swal.fire({
    width: "250px",
    title: "Verifying...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const verifyRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/registered-ledger/verify-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: passInput })
    });
    const verifyData = await verifyRes.json();
    Swal.close();

    if (!verifyData.success) {
      return Swal.fire({ width: "300px", icon: "error", text: verifyData.error || "Wrong Password!" });
    }
  } catch (err) {
    Swal.close();
    return Swal.fire({ width: "300px", icon: "error", text: "Network verification error" });
  }

  // STEP 2: Password Sahi Hone par Form Khulega
  const formattedDate = toInputDate(row.date || row.payment_date) || getTodayInputDate();
  const currentType = (row.type || "payment").toLowerCase();

  const { value: formValues } = await Swal.fire({
    width: "360px",
    title: "✏️ Edit Payment Entry",
    html: `
      <div style="text-align:left; font-size:12px;" class="d-flex flex-column gap-2">
        <div>
          <label class="fw-bold mb-1">Amount (PKR)</label>
          <input id="swal-edit-amount" type="number" class="form-control form-control-sm" value="${row.debit || row.credit || 0}" />
        </div>
        <div>
          <label class="fw-bold mb-1">Receipt Date</label>
          <input id="swal-edit-date" type="date" class="form-control form-control-sm" value="${formattedDate}" />
          <div id="swal-edit-date-text" class="text-primary fw-bold mt-1" style="font-size: 11px;">
            ${formatDate(formattedDate)}
          </div>
        </div>
        <div>
          <label class="fw-bold mb-1">Transaction Type</label>
          <select id="swal-edit-type" class="form-select form-select-sm">
            <option value="payment" ${currentType.includes("payment") ? "selected" : ""}>Payment (Debit)</option>
            <option value="adjustment" ${currentType.includes("adjustment") ? "selected" : ""}>Adjustment (Debit)</option>
            <option value="opening_balance" ${currentType.includes("opening") ? "selected" : ""}>🔑 Opening Balance (Credit)</option>
          </select>
        </div>
        <div>
          <label class="fw-bold mb-1">Payment Method</label>
          <select id="swal-edit-method" class="form-select form-select-sm">
            <option value="Bank" ${row.description?.includes("Bank") ? "selected" : ""}>Bank</option>
            <option value="Cash" ${row.description?.includes("Cash") ? "selected" : ""}>Cash</option>
          </select>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Update Entry",
    focusConfirm: false,
    didOpen: () => {
      const dateInput = document.getElementById("swal-edit-date");
      const dateTextLabel = document.getElementById("swal-edit-date-text");
      dateInput.addEventListener("change", (e) => {
        dateTextLabel.textContent = formatDate(e.target.value);
      });
    },
    preConfirm: () => {
      const amount = document.getElementById("swal-edit-amount").value;
      const payment_date = document.getElementById("swal-edit-date").value;
      const payment_method = document.getElementById("swal-edit-method").value;
      const type = document.getElementById("swal-edit-type").value;

      if (!amount || Number(amount) <= 0) {
        Swal.showValidationMessage("Valid amount required");
        return false;
      }
      if (!payment_date) {
        Swal.showValidationMessage("Valid date required");
        return false;
      }

      return {
        amount: Number(amount),
        payment_date,
        payment_method,
        type,
        password: passInput // Pehle step se verified password bhej rahe hain
      };
    }
  });

  if (!formValues) return;

  // STEP 3: Submit Update
  Swal.fire({
    width: "250px",
    title: "Updating...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/registered-ledger/edit/${row.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formValues)
    });

    const d = await r.json();
    Swal.close();

    if (d.success) {
      await loadLedger(customerCode);
      await loadPending();
      Swal.fire({ width: "280px", icon: "success", text: "Transaction Updated Successfully" });
    } else {
      Swal.fire({ width: "300px", icon: "error", text: d.error || "Update Failed!" });
    }
  } catch (err) {
    Swal.close();
    Swal.fire({ width: "300px", icon: "error", text: "Network communication error" });
  }
};

/* =========================
     EXPORTS (USING CUSTOM HOOK)
  ========================== */
  const exportPDF = () => {
    handleExportPDF({
      code: customerCode,
      name: customerName,
      fromDate: startDate,
      toDate: endDate,
      ledgerData: rows,
      title: "REGISTERED CUSTOMER LEDGER STATEMENT",
    });
  };

  const exportExcel = () => {
    handleExportExcel({
      code: customerCode,
      name: customerName,
      fromDate: startDate,
      toDate: endDate,
      ledgerData: rows,
      title: "REGISTERED CUSTOMER FINANCIAL LEDGER",
    });
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
        {/* LEFT PANEL */}
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
                        <span className={`badge py-0 px-1 ${
                          p.payment_status === "PENDING" ? "bg-danger" :
                          p.payment_status === "EXTRA PAID" ? "bg-success" : "bg-warning text-dark"
                        }`} style={{ fontSize: "0.7rem" }}>
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
                  <div className="d-flex flex-column gap-1">
                    <button className="btn btn-primary w-100 fw-bold btn-sm" onClick={() => loadLedger()}>
                      🔍 Load Ledger
                    </button>
                    <div className="d-flex gap-1">
                      <button className="btn btn-success w-100 fw-bold btn-sm" onClick={exportExcel} disabled={rows.length === 0}>
                        🟢 Excel
                      </button>
                      <button className="btn btn-danger w-100 fw-bold btn-sm" onClick={exportPDF} disabled={rows.length === 0}>
                        🔴 PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={`card shadow-sm mb-3 ${!customerCode ? "opacity-50" : ""}`} style={{ pointerEvents: !customerCode ? "none" : "auto" }}>
            <div className="card-header bg-dark text-white fw-bold">📥 Post New Payment / Entry</div>
            <div className="card-body">
              <div className="row g-2 mb-3">
                <div className="col-md-3">
                  <label className="form-label small text-muted mb-1">Receipt Date</label>
                  <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
                  <span className="text-primary fw-bold d-block mt-1" style={{ fontSize: "0.75rem" }}>
                    {formatDate(date)}
                  </span>
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
                    <option value="payment">payment (Debit)</option>
                    <option value="adjustment">adjustment (Debit)</option>
                    <option value="opening_balance">🔑 opening_balance (Credit)</option>
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
    <th style={{ width: "36%" }}>Details / Description</th>
    <th style={{ width: "12%" }}>Method</th>  {/* 👈 Added */}
    <th style={{ width: "12%" }} className="text-end">Debit (-)</th>
    <th style={{ width: "12%" }} className="text-end">Credit (+)</th>
    <th style={{ width: "12%" }} className="text-end">Balance</th>
    <th style={{ width: "4%" }} className="text-center">Action</th>
  </tr>
</thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
<td colSpan="7" className="text-center p-4 text-muted fs-6">
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
<td className="text-center small">
  {r.payment_method && r.payment_method !== "-" ? (
    <span
      className={`badge ${
        r.payment_method.toLowerCase() === "cash"
          ? "bg-success"
          : r.payment_method.toLowerCase() === "bank"
          ? "bg-primary"
          : "bg-info text-dark"
      }`}
    >
      {r.payment_method}
    </span>
  ) : (
    "-"
  )}
</td>
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
                              <div className="d-flex gap-1 justify-content-center">
                                <button
                                  className="btn btn-outline-primary btn-sm py-0 px-1"
                                  style={{ fontSize: "11px" }}
                                  onClick={() => editRow(r)}
                                >
                                  Edit
                                </button>
                                <button
                                  className="btn btn-outline-danger btn-sm py-0 px-1"
                                  style={{ fontSize: "11px" }}
                                  onClick={() => deleteRow(r.id)}
                                >
                                  Del
                                </button>
                              </div>
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

      {/* DETAIL MODAL */}
      {detailModalOpen && (
        <div
          className="modal show d-block animate__animated animate__fadeIn"
          tabIndex="-1"
          style={{ backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 1055 }}
        >
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content rounded-4 border-0 shadow-lg">
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

              <div className="modal-body bg-light p-4">
                {detailLoading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted fw-bold">Fetching details, please wait...</p>
                  </div>
                ) : detailData ? (
                  <div>
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
                            {getRowDate({ date: detailData.booking_date || detailData.created_at })}
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
                                  📅 {getRowDate({ date: detailData.flight_date?.[idx] })}
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
                                  <b>Check-in:</b> <span className="text-primary fw-bold">{getRowDate({ date: h.checkIn })}</span>
                                </div>
                                <div className="col-6">
                                  <b>Check-out:</b> <span className="text-danger fw-bold">{getRowDate({ date: h.checkOut })}</span>
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

{detailType === "PACKAGE" && (() => {
  /* ================= PACKAGE DURATION ================= */
  const flightDates = Array.isArray(detailData.flights)
    ? detailData.flights.map((f) => f.date).filter(Boolean).sort()
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

  /* ================= PER PERSON CALCULATION ================= */
  const adultCount = Number(detailData.adult_count || 0);
  const childCount = Number(detailData.child_count || 0);
  const infantCount = Number(detailData.infant_count || 0);

  const rate = {
    flight: Number(detailData.flight_sar_rate || 0),
    hotels: Number(detailData.hotel_sar_rate || 0),
    visa: Number(detailData.visa_sar_rate || 0),
    transport: Number(detailData.transport_sar_rate || 0),
    ziyarat: Number(detailData.ziyarat_sar_rate || 0),
  };

  const adultFlightPKR = adultCount * Number(detailData.adult_rate || 0) * rate.flight;
  const childFlightPKR = childCount * Number(detailData.child_rate || 0) * rate.flight;
  const infantFlightPKR = infantCount * Number(detailData.infant_rate || 0) * rate.flight;

  const visaPersons = (detailData.visa || []).reduce((sum, v) => sum + Number(v.persons || 0), 0);
  const visaPKR = Number(detailData.visa_sar_total || 0) * rate.visa;
  const visaPerPerson = visaPersons > 0 ? visaPKR / visaPersons : 0;

  const hotelsPKR = Number(detailData.hotel_sar_total || 0) * rate.hotels;
  const transportPKR = Number(detailData.transport_sar_total || 0) * rate.transport;
  const ziyaratPKR = Number(detailData.ziyarat_sar_total || 0) * rate.ziyarat;

  const sharedPKR = hotelsPKR + transportPKR + ziyaratPKR;
  const sharedPerAdult = adultCount > 0 ? sharedPKR / adultCount : 0;

  const adultPerPerson = Math.round(
    adultCount > 0 ? adultFlightPKR / adultCount + visaPerPerson + sharedPerAdult : 0
  );

  const childPerPerson = Math.round(
    childCount > 0 ? childFlightPKR / childCount + visaPerPerson : 0
  );

  const infantPerPerson = Math.round(
    infantCount > 0 ? infantFlightPKR / infantCount + visaPerPerson : 0
  );

  return (
    <div className="mb-4 text-start">
      {/* 📅 DURATION CARD */}
      <div
        className="border rounded-3 p-3 mb-4 shadow-sm"
        style={{
          background: "linear-gradient(135deg,#f8f9fa,#e9f7ef)",
          borderLeft: "5px solid #198754",
        }}
      >
        <div className="text-uppercase fw-bold text-muted small">Package Duration</div>
        <div className="fs-4 fw-bold text-success mt-1">
          📅 {packageDays} Days / 🌙 {packageNights} Nights
        </div>
      </div>

      {/* ✈️ FLIGHTS */}
      <h5 className="fw-bold text-primary mb-2">✈️ Flight</h5>
      <div className="border p-3 rounded-3 bg-white mb-2 shadow-sm">
        {Array.isArray(detailData.flights) && detailData.flights.length > 0 ? (
          detailData.flights.map((f, i) => (
            <div key={i} className="mb-1 text-dark">
              {getRowDate({ date: f.date })} — <span className="fw-bold">{f.from}</span> → <span className="fw-bold">{f.to}</span> {f.airline && <b>({f.airline})</b>}
            </div>
          ))
        ) : (
          <p className="text-muted mb-0">No flights</p>
        )}
      </div>
      <div className="small text-muted bg-white p-2 rounded border mb-3">
        Adults: {detailData.adult_count || 0} × {fmtAmt(detailData.adult_rate || 0)} | Child: {detailData.child_count || 0} × {fmtAmt(detailData.child_rate || 0)} | Infant: {detailData.infant_count || 0} × {fmtAmt(detailData.infant_rate || 0)} <br />
        <b>Flight SAR:</b> {fmtAmt(detailData.flight_sar_total || 0)} | <b>Flight PKR:</b> {fmtAmt(detailData.flight_pkr_total || 0)}
      </div>

      {/* 🏨 HOTELS */}
      <h5 className="fw-bold text-success mb-2">🏨 Hotels</h5>
      {Array.isArray(detailData.hotels) && detailData.hotels.length > 0 ? (
        detailData.hotels.map((h, i) => (
          <div key={i} className="border p-3 rounded-3 bg-white mb-2 shadow-sm">
            <b>🛏️ {h.hotel}</b> — 📍 {h.location}<br />
            Check In: <span className="text-primary fw-bold">{getRowDate({ date: h.checkIn })}</span> → Check Out: <span className="text-danger fw-bold">{getRowDate({ date: h.checkOut })}</span><br />
            <span className="small text-muted">Nights: {h.nights}, Rooms: {h.rooms}, Type: {h.type} | Rate: {fmtAmt(h.rate)} SAR — Total: {fmtAmt(h.total)} SAR</span>
          </div>
        ))
      ) : (
        <p className="text-muted">No hotels</p>
      )}
      <div className="small text-muted bg-white p-2 rounded border mb-3">
        <b>Hotel SAR:</b> {fmtAmt(detailData.hotel_sar_total || 0)} | <b>Hotel PKR:</b> {fmtAmt(detailData.hotel_pkr_total || 0)}
      </div>

      {/* 🛂 VISA */}
      <h5 className="fw-bold text-warning mb-2">🛂 Visa</h5>
      {Array.isArray(detailData.visa) && detailData.visa.length > 0 ? (
        detailData.visa.map((v, i) => (
          <div key={i} className="border p-2 rounded bg-white mb-1 shadow-sm d-flex justify-content-between">
            <span>{v.type || v.title || "Visa"} — {v.persons || v.qty || 1} Persons</span>
            <span>× {fmtAmt(v.rate || 0)} = {fmtAmt(v.total || 0)} SAR</span>
          </div>
        ))
      ) : (
        <p className="text-muted">No visa</p>
      )}
      <div className="small text-muted bg-white p-2 rounded border mb-3">
        <b>Visa SAR:</b> {fmtAmt(detailData.visa_sar_total || 0)} | <b>Visa PKR:</b> {fmtAmt(detailData.visa_pkr_total || 0)}
      </div>

      {/* 🚐 TRANSPORT */}
      <h5 className="fw-bold text-danger mb-2">🚐 Transport</h5>
      {Array.isArray(detailData.transport) && detailData.transport.length > 0 ? (
        detailData.transport.map((t, i) => (
          <div key={i} className="border p-2 rounded bg-white mb-1 shadow-sm d-flex justify-content-between">
            <span>{t.text || t.sector || t.route || t.vehicle || "Transport Service"}</span>
            <span>{fmtAmt(t.amount || t.total || 0)} SAR</span>
          </div>
        ))
      ) : (
        <p className="text-muted">No transport</p>
      )}
      <div className="small text-muted bg-white p-2 rounded border mb-3">
        <b>Transport SAR:</b> {fmtAmt(detailData.transport_sar_total || 0)} | <b>Transport PKR:</b> {fmtAmt(detailData.transport_pkr_total || 0)}
      </div>

      {/* 🕌 ZIYARAT */}
      <h5 className="fw-bold mb-2" style={{ color: "#6f42c1" }}>🕌 Ziyarat</h5>
      {Array.isArray(detailData.ziyarat) && detailData.ziyarat.length > 0 ? (
        detailData.ziyarat.map((z, i) => (
          <div key={i} className="border p-2 rounded bg-white mb-1 shadow-sm d-flex justify-content-between">
            <span>{z.text || z.route || z.description || z.city || "Ziyarat Tour"}</span>
            <span>{fmtAmt(z.amount || z.total || 0)} SAR</span>
          </div>
        ))
      ) : (
        <p className="text-muted">No ziyarat</p>
      )}
      <div className="small text-muted bg-white p-2 rounded border mb-3">
        <b>Ziyarat SAR:</b> {fmtAmt(detailData.ziyarat_sar_total || 0)} | <b>Ziyarat PKR:</b> {fmtAmt(detailData.ziyarat_pkr_total || 0)}
      </div>

      {/* 👥 PER PERSON COST BREAKDOWN */}
      <div className="border rounded-3 p-3 bg-white shadow-sm mt-3">
        <h6 className="fw-bold mb-3 text-dark">👥 Per Person Cost</h6>

        <div className="d-flex justify-content-between border-bottom py-2">
          <span><b>Adults ({adultCount})</b></span>
          <span className="fw-bold text-success">{fmtAmt(adultPerPerson)} PKR</span>
        </div>

        <div className="d-flex justify-content-between border-bottom py-2">
          <span><b>Children ({childCount})</b></span>
          <span className="fw-bold text-success">{fmtAmt(childPerPerson)} PKR</span>
        </div>

        <div className="d-flex justify-content-between py-2">
          <span><b>Infants ({infantCount})</b></span>
          <span className="fw-bold text-success">{fmtAmt(infantPerPerson)} PKR</span>
        </div>
      </div>
    </div>
  );
})()}

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
