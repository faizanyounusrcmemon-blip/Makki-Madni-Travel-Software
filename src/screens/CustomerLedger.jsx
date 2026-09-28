import React, { useState, useRef, useEffect } from "react";
import useLedgerExport from "../hooks/useLedgerExport";
import Swal from "sweetalert2";

/* ================= HELPER FUNCTIONS ================= */

const normalizeZero = (n) => (Math.abs(Number(n || 0)) < 0.005 ? 0 : Number(n));

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

const getRowDate = (r) => {
  if (!r) return "-";
  return formatDate(r.date || r.payment_date || r.created_at);
};

const fmtAmt = (v) => {
  let n = normalizeZero(v);
  return n === 0 && (v === null || v === undefined || v === "")
    ? "-"
    : n.toLocaleString("en-US");
};

const parseAmt = (v) => {
  const n = Number(String(v).replace(/,/g, ""));
  return normalizeZero(Math.round(n || 0));
};

const getCategoryIcon = (refStr = "") => {
  const str = String(refStr).toUpperCase();
  if (str.includes("VISA")) return "🛂";
  if (str.includes("TIC") || str.includes("TKT")) return "✈️";
  if (str.includes("HOT")) return "🏨";
  if (str.includes("TRN")) return "🚐";
  if (str.includes("ZIY")) return "🕌";
  if (str.includes("PKG") || str.includes("BKG")) return "📦";
  if (str.includes("CRD") || str.includes("CARD")) return "💳";
  if (str.includes("GRP")) return "👥";
  return "📄";
};

const getTripDurationText = (dates) => {
  if (!Array.isArray(dates) || dates.length < 2) return "Standard Duration";
  const valid = dates.map((d) => new Date(d)).filter((d) => !isNaN(d.getTime())).sort((a, b) => a - b);
  if (valid.length < 2) return "Standard Duration";
  const diff = Math.ceil((valid[valid.length - 1] - valid[0]) / (1000 * 60 * 60 * 24));
  return `${diff + 1} Days / ${diff} Nights`;
};

const numberToWords = (num) => {
  if (!num) return "";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const w = (n) => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "");
    if (n < 1000)
      return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + w(n % 100) : "");
    if (n < 1000000)
      return w(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + w(n % 1000) : "");
    if (n < 10000000)
      return w(Math.floor(n / 100000)) + " Lac" + (n % 100000 ? " " + w(n % 100000) : "");
    if (n < 100000000)
      return w(Math.floor(n / 1000000)) + " Million" + (n % 1000000 ? " " + w(n % 1000000) : "");
    return "";
  };
  return w(num) + " Only";
};

const today = new Date().toISOString().split("T")[0];

export default function CustomerLedger({ onNavigate }) {
  const exportUtils = useLedgerExport();
  const handleExportPDF = exportUtils?.handleExportPDF || exportUtils?.exportPDF;
  const handleExportExcel = exportUtils?.handleExportExcel || exportUtils?.exportExcel;

  const [refNo, setRefNo] = useState("");
  const [rows, setRows] = useState([]);
  const [pending, setPending] = useState([]);
  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");
  const [date, setDate] = useState(today);
  const [type, setType] = useState("payment");
  const [method, setMethod] = useState("Cash");
  const [saving, setSaving] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState("");
  const [bankProfiles, setBankProfiles] = useState([]);
  const [selectedBankProfile, setSelectedBankProfile] = useState("");
  const pdfRef = useRef(null);

  // Dynamic Detail Modal States
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailType, setDetailType] = useState("");
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const getModalTotalSar = () => Number(detailData?.total_sar || detailData?.grand_total_sar || 0);
  const getModalPkrRate = () => Number(detailData?.pkr_rate || detailData?.rate || 0);
  const getModalTotalPkr = () => Number(detailData?.total_pkr || detailData?.grand_total || detailData?.total_amount || 0);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger/profiles`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setBankProfiles(data.profiles || []);
        }
      })
      .catch((err) => console.error("Error loading bank profiles:", err));
  }, []);

  const loadPending = async () => {
    try {
      const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/pending/list`);
      const d = await r.json();
      if (d.success) {
        setPending(d.rows || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const loadLedger = async (r = refNo) => {
    if (!r) {
      return Swal.fire({
        width: "300px",
        icon: "warning",
        text: "Ref No required"
      });
    }

    setRefNo(r);

    Swal.fire({
      width: "260px",
      title: "Loading Ledger...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/${r}`);
      const d = await res.json();

      if (!d.success) {
        Swal.close();
        Swal.fire({
          width: "300px",
          icon: "error",
          text: d.error || "Failed to load ledger"
        });
        setRows([]);
        return;
      }

      setRows(d.rows || []);
      const pendingItem = pending.find((x) => x.ref_no === r);
      const currentStatus = pendingItem?.payment_status || "CLEARED";
      setPaymentStatus(currentStatus);

      let customerName = "Unknown Customer";
      const customerRow = (d.rows || []).find((x) => x.id === "CUSTOMER");
      if (customerRow?.description) {
        customerName = customerRow.description;
      }

      Swal.close();
      Swal.fire({
        width: "360px",
        icon: "success",
        title: "Ledger Loaded Successfully",
        html: `
          <div style="text-align:left;font-size:14px">
            <div style="background:#f8f9fa; padding:10px; border-radius:8px; margin-top:5px;">
              <b>Ref No:</b><br/>
              <span style="color:#0d6efd">${r}</span>
              <hr style="margin:8px 0"/>
              <b>Customer:</b><br/>
              <span style="color:#198754">${customerName}</span>
              <hr style="margin:8px 0"/>
              <b>Payment Status:</b><br/>
              <span style="color:${
                currentStatus === "PENDING"
                  ? "#dc3545"
                  : currentStatus === "PARTIAL"
                  ? "#fd7e14"
                  : "#198754"
              }; font-weight:bold;">
                ${currentStatus}
              </span>
            </div>
          </div>
        `
      });
    } catch (err) {
      console.error("Ledger load error:", err);
      Swal.close();
      Swal.fire({
        width: "300px",
        icon: "error",
        text: "Network Error"
      });
    }
  };

  /* =========================
     FETCH SALE DETAIL MODAL
  ========================== */
  const handleSuccessResponse = (data, ledgerVal, originalId, currentType) => {
    let customerName = "Unknown Customer";
    const customerRow = rows.find((x) => x.id === "CUSTOMER");
    if (customerRow?.description) {
      customerName = customerRow.description;
    }

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
        ref_no: originalId || refNo || "N/A",
        customer_name: customerName,
        booking_date: today,
        description: "",
        total_pkr: ledgerVal,
        grand_total: ledgerVal,
        total_amount: ledgerVal
      });
    }
  };

  const fetchSaleDetail = async (id, description) => {
    let customerName = "Unknown Customer";
    const customerRow = rows.find((x) => x.id === "CUSTOMER");
    if (customerRow?.description) {
      customerName = customerRow.description;
    }

    let idStr = String(id || refNo || "").toUpperCase();
    if (idStr === "SALE" || idStr === "CUSTOMER") {
      idStr = refNo.toUpperCase();
    }

    let detectedType = "INVOICE";
    let endpoint = "";

    let cleanRef = idStr;
    if (idStr.startsWith("SALE-")) {
      cleanRef = idStr.replace("SALE-", "");
    }

    const matchedLedgerRow = rows.find(r => String(r.id) === idStr);
    const ledgerVal = matchedLedgerRow ? Number(matchedLedgerRow.credit || matchedLedgerRow.debit || 0) : 0;

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
        booking_date: matchedLedgerRow?.date || today,
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

  const saveEntry = async () => {
    if (!refNo) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Ref No required" });
    }
    if (!amountRaw || amountRaw <= 0) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Amount required" });
    }
    if (!date) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Date required" });
    }
    if (method === "Bank" && !selectedBankProfile) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Please select a Bank Profile" });
    }

    setSaving(true);
    Swal.fire({
      width: "260px",
      title: "Saving...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ref_no: refNo,
          amount: Number(amountRaw),
          payment_date: date,
          payment_method: method,
          bank_profile_id: method === "Bank" ? selectedBankProfile : null,
          type
        }),
      });

      const d = await r.json();
      Swal.close();

      if (!d.success) {
        Swal.fire({ width: "300px", icon: "error", text: d.error || "Save failed" });
      } else {
        setAmountRaw(0);
        setAmountDisp("");
        setDate(today);
        setSelectedBankProfile("");

        await loadLedger(refNo);
        await loadPending();

        Swal.fire({ width: "280px", icon: "success", text: "Entry Saved Successfully" });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    } finally {
      setSaving(false);
    }
  };

  const askPassword = async (title = "Enter Password") => {
    const { value } = await Swal.fire({
      width: "300px",
      html: `
        <div style="text-align:left;font-size:13px">
          <b>${title}</b>
          <div style="position:relative;margin-top:10px">
            <input id="swal-pass" type="password" class="swal2-input"
              style="height:34px;font-size:13px;width:100%;margin:0;padding-right:35px;" placeholder="Enter password"/>
            <span id="toggle-pass" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); cursor:pointer; user-select:none;">👁</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Confirm",
      focusConfirm: false,
      preConfirm: () => {
        const input = document.getElementById("swal-pass");
        const val = input.value.trim();
        if (!val) {
          Swal.showValidationMessage("Password required");
          return false;
        }
        return val;
      },
      didOpen: () => {
        const input = document.getElementById("swal-pass");
        const toggle = document.getElementById("toggle-pass");
        let show = false;
        toggle.addEventListener("click", () => {
          show = !show;
          input.type = show ? "text" : "password";
          toggle.textContent = show ? "🙈" : "👁";
        });
      }
    });
    return value;
  };

  const del = async (id) => {
    if (id === "SALE" || id === "CUSTOMER") {
      return Swal.fire({ width: "300px", icon: "warning", text: "Yeh entry delete nahi ho sakti" });
    }

    const confirmDelete = await Swal.fire({
      width: "300px",
      icon: "warning",
      text: "Are you sure you want to delete this entry?",
      showCancelButton: true,
      confirmButtonText: "Yes Delete"
    });

    if (!confirmDelete.isConfirmed) return;

    const pass = await askPassword("🔐 Enter Delete Password");
    if (!pass) return;

    Swal.fire({
      width: "260px",
      title: "Deleting...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/delete/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      });

      const d = await r.json();
      Swal.close();

      if (d.success) {
        await loadPending();
        await loadLedger(refNo);
        Swal.fire({ width: "280px", icon: "success", text: "Entry Deleted Successfully" });
      } else {
        Swal.fire({ width: "300px", icon: "error", text: d.error || "Delete failed" });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    }
  };

  const editRow = async (row) => {
    if (row.id === "SALE" || row.id === "CUSTOMER") {
      return Swal.fire({
        width: "300px",
        icon: "warning",
        text: "Yeh system invoice record edit nahi ho sakta."
      });
    }

    const passInput = await askPassword("🔐 Enter Edit Password");
    if (!passInput) return;

    Swal.fire({
      width: "250px",
      title: "Verifying...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const verifyRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/verify-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: passInput }),
        }
      );
      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        return Swal.fire({
          width: "300px",
          icon: "error",
          text: verifyData.error || "Incorrect Authorization Password!",
        });
      }
    } catch (err) {
      return Swal.fire({
        width: "300px",
        icon: "error",
        text: "Network error during password verification",
      });
    }

    const formattedDate = toInputDate(row.date || row.payment_date) || today;
    const isAdjustment = row.description === "Adjustment";

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
            <label class="fw-bold mb-1">Payment Date</label>
            <input id="swal-edit-date" type="date" class="form-control form-control-sm" value="${formattedDate}" />
            <div id="swal-edit-date-text" class="text-primary fw-bold mt-1" style="font-size: 11px;">
              ${formatDate(formattedDate)}
            </div>
          </div>
          <div>
            <label class="fw-bold mb-1">Type</label>
            <select id="swal-edit-type" class="form-select form-select-sm">
              <option value="payment" ${!isAdjustment ? "selected" : ""}>Payment</option>
              <option value="adjustment" ${isAdjustment ? "selected" : ""}>Adjustment</option>
            </select>
          </div>
          <div>
            <label class="fw-bold mb-1">Payment Method / Bank</label>
            <select id="swal-edit-method" class="form-select form-select-sm">
              <option value="Cash" ${!row.bank_profile_id && (row.description?.includes("Cash") || !row.description?.includes("Bank")) ? "selected" : ""}>
                💵 Cash
              </option>
              ${
                bankProfiles.length > 0
                  ? bankProfiles
                      .map(
                        (p) => `
                        <option 
                          value="Bank_${p.id}" 
                          ${row.bank_profile_id == p.id ? "selected" : ""}
                        >
                          🏦 ${p.bank_name} (${p.account_number})
                        </option>
                      `
                      )
                      .join("")
                  : `<option disabled>No Bank Profiles Found</option>`
              }
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
        const type = document.getElementById("swal-edit-type").value;
        const selectedVal = document.getElementById("swal-edit-method").value;

        if (!amount || Number(amount) <= 0) {
          Swal.showValidationMessage("Valid amount required");
          return false;
        }
        if (!payment_date) {
          Swal.showValidationMessage("Date required");
          return false;
        }

        let payment_method = "Cash";
        let bank_profile_id = null;

        if (selectedVal.startsWith("Bank_")) {
          payment_method = "Bank";
          bank_profile_id = selectedVal.split("_")[1];
        }

        return {
          amount: Number(amount),
          payment_date,
          type,
          payment_method,
          bank_profile_id,
        };
      }
    });

    if (!formValues) return;

    Swal.fire({
      width: "260px",
      title: "Updating...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/customer-ledger/edit/${row.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formValues)
      });

      const d = await r.json();
      Swal.close();

      if (d.success) {
        await loadLedger(refNo);
        await loadPending();
        Swal.fire({ width: "280px", icon: "success", text: "Entry Updated Successfully" });
      } else {
        Swal.fire({ width: "300px", icon: "error", text: d.error || "Update Failed!" });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    }
  };

  const exportPDF = () => {
    if (!refNo || rows.length === 0) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Please load a ledger first!" });
    }

    if (typeof handleExportPDF !== "function") {
      return Swal.fire({ width: "300px", icon: "error", text: "PDF Export Hook Function Error!" });
    }

    let customerName = "Customer";
    const customerRow = rows.find((r) => r.id === "CUSTOMER");
    if (customerRow?.description) {
      customerName = customerRow.description;
    }

    handleExportPDF({
      code: refNo,
      name: customerName,
      fromDate: "",
      toDate: "",
      ledgerData: rows,
      title: "CUSTOMER LEDGER STATEMENT",
      filePrefix: `Customer_Ledger_${customerName}`,
    });
  };

  const exportExcel = () => {
    if (!refNo || rows.length === 0) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Please load a ledger first!" });
    }

    if (typeof handleExportExcel !== "function") {
      return Swal.fire({ width: "300px", icon: "error", text: "Excel Export Hook Function Error!" });
    }

    let customerName = "Customer";
    const customerRow = rows.find((r) => r.id === "CUSTOMER");
    if (customerRow?.description) {
      customerName = customerRow.description;
    }

    handleExportExcel({
      code: refNo,
      name: customerName,
      fromDate: "",
      toDate: "",
      ledgerData: rows,
      title: "CUSTOMER FINANCIAL LEDGER",
      filePrefix: `Customer_Ledger_${customerName}`,
    });
  };

  // Metrics computation for summary cards
  const totalDebit = rows.reduce((acc, r) => acc + (Number(r.debit) || 0), 0);
  const totalCredit = rows.reduce((acc, r) => acc + (Number(r.credit) || 0), 0);
  const finalBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0;

  return (
    <div className="customer-ledger-page">
      <style>{`
        .customer-ledger-page {
          min-height: calc(100vh - 65px);
          padding: 24px;
          background: radial-gradient(circle at 10% 10%, rgba(255,215,120,.22), transparent 28%), radial-gradient(circle at 90% 0%, rgba(13,110,253,.12), transparent 30%), linear-gradient(135deg, #f8fbff 0%, #eef6ff 45%, #fffaf0 100%);
          font-family: Arial, sans-serif;
        }
        .ledger-shell { max-width: 1450px; margin: auto; }
        .ledger-hero {
          border-radius: 22px; padding: 20px 22px; color: #fff;
          background: linear-gradient(135deg, #063b78, #0d6efd 55%, #d4a72c);
          box-shadow: 0 14px 34px rgba(10,55,105,.22); position: relative; overflow: hidden;
          display: flex; justify-content: space-between; align-items: center;
        }
        .ledger-hero h2 { margin: 0; font-weight: 800; letter-spacing: .3px; }
        .ledger-hero p { margin: 6px 0 0; opacity: .9; }
        .filter-card {
          margin-top: 16px; background: rgba(255,255,255,.94);
          border: 1px solid #dbe7f5; border-radius: 18px; padding: 16px;
          box-shadow: 0 8px 24px rgba(30,65,100,.10);
        }
        .filter-label { font-size: 11px; font-weight: 800; color: #52647a; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 6px; }
        .preset-btn { border-radius: 10px !important; font-weight: 700; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 16px 0; }
        .summary-card { background: #fff; border-radius: 16px; padding: 14px 16px; border: 1px solid #e2eaf3; box-shadow: 0 6px 18px rgba(0,0,0,.06); }
        .summary-card .label { font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase; }
        .summary-card .value { font-size: 23px; font-weight: 900; color: #102a43; margin-top: 4px; }
        .summary-card.total { border-left: 5px solid #0d6efd; }
        .summary-card.debit { border-left: 5px solid #dc3545; }
        .summary-card.credit { border-left: 5px solid #20c997; }
        .summary-card.balance { border-left: 5px solid #d4a72c; }
        .table-card { background: #fff; border-radius: 18px; overflow: hidden; border: 1px solid #dfe8f2; box-shadow: 0 10px 28px rgba(30,65,100,.10); }
        .table-head { padding: 13px 16px; display: flex; justify-content: space-between; align-items: center; gap: 10px; border-bottom: 1px solid #e8eef5; }
        .report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
        .report-table th { background: linear-gradient(135deg, #073d7a, #0d6efd); color: #fff; padding: 11px 9px; white-space: nowrap; }
        .report-table td { padding: 10px 9px; border-bottom: 1px solid #edf1f5; vertical-align: middle; }
        .report-table tbody tr:hover { background: #f8fbff; }
        .amount-cell { font-size: 0.85rem !important; font-weight: 800 !important; letter-spacing: 0.3px; }
        .pending-card { background: rgba(255,255,255,.94); border: 1px solid #dbe7f5; border-radius: 18px; overflow: hidden; box-shadow: 0 8px 24px rgba(30,65,100,.10); }
        .pending-header { background: linear-gradient(135deg, #dc3545, #b4232f); color: #fff; padding: 12px 16px; font-weight: 800; }
        @media print { .filter-card, .no-print, .pending-card { display: none !important; } }
      `}</style>

      <div className="ledger-shell">
        {/* Banner */}
        <div className="ledger-hero">
          <div>
            <h2>📘 Customer Ledger Statement</h2>
            <p>
              Customer transaction logs, balance adjustments, credit/debit records aur ledger tracking.
            </p>
          </div>
          <div>
            <button className="btn btn-light btn-sm fw-bold rounded-pill px-3 py-2" onClick={() => onNavigate("dashboard")}>
              ⬅ Back to Home
            </button>
          </div>
        </div>

        <div className="row mt-3">
          {/* SIDEBAR: PENDING / PARTIAL LIST */}
          <div className="col-lg-3 col-md-4 mb-3">
            <div className="pending-card h-100">
              <div className="pending-header d-flex align-items-center justify-content-between">
                <span>⏳ Pending / Partial Ledgers</span>
                <span className="badge bg-light text-dark">{pending.length}</span>
              </div>
              <div className="p-2" style={{ maxHeight: "72vh", overflowY: "auto" }}>
                {pending.length === 0 ? (
                  <div className="p-4 text-center text-success">
                    <h6 className="fw-bold">✅ All Cleared!</h6>
                    <p className="small mb-0 text-muted">No pending or partial ledgers found.</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {pending.map((p, i) => (
                      <div
                        key={i}
                        onClick={() => loadLedger(p.ref_no)}
                        className="list-group-item list-group-item-action p-3 mb-2 rounded border-start border-4"
                        style={{
                          cursor: "pointer",
                          borderStartColor: p.payment_status === "PENDING" ? "#dc3545" : "#ffc107",
                          backgroundColor: p.ref_no === refNo ? "#e6f0ff" : "#fff"
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-start mb-1">
                          <span className="badge bg-dark font-monospace">{p.ref_no}</span>
                          <span className={`badge ${p.payment_status === "PENDING" ? "bg-danger" : "bg-warning text-dark"}`}>
                            {p.payment_status}
                          </span>
                        </div>
                        <div className="fw-bold text-truncate text-primary" style={{ fontSize: "0.9rem" }}>
                          {p.customer_name || "-"}
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
            {/* Filter / Load Panel */}
            <div className="filter-card no-print mb-3">
              <div className="row g-2 align-items-end">
                <div className="col-md-5">
                  <div className="filter-label">Customer Ref Number</div>
                  <input
                    className="form-control"
                    placeholder="Enter Ref No (e.g. PKG-1002)"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="col-md-3 d-grid">
                  <button className="btn btn-primary preset-btn" onClick={() => loadLedger()}>
                    🔍 Load Ledger
                  </button>
                </div>
                <div className="col-md-2 d-grid">
                  <button className="btn btn-outline-danger preset-btn" onClick={exportPDF} disabled={rows.length === 0}>
                    📄 Export PDF
                  </button>
                </div>
                <div className="col-md-2 d-grid">
                  <button className="btn btn-outline-success preset-btn" onClick={exportExcel} disabled={rows.length === 0}>
                    📊 Export Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Metric Cards */}
            <div className="summary-grid">
              <div className="summary-card total">
                <div className="label">Total Entries</div>
                <div className="value">{rows.length}</div>
              </div>
              <div className="summary-card debit">
                <div className="label">Total Debit (-)</div>
                <div className="value">{fmtAmt(totalDebit)}</div>
              </div>
              <div className="summary-card credit">
                <div className="label">Total Credit (+)</div>
                <div className="value">{fmtAmt(totalCredit)}</div>
              </div>
              <div className="summary-card balance">
                <div className="label">Current Balance</div>
                <div className="value">{fmtAmt(finalBalance)}</div>
              </div>
            </div>

            {/* Transaction Form Card */}
            <div className={`filter-card no-print mb-3 ${!refNo ? "opacity-50" : ""}`} style={{ pointerEvents: !refNo ? "none" : "auto" }}>
              <div className="filter-label mb-2">📥 Add Payment / Adjustment Receipt</div>
              <div className="row g-2 align-items-end">
                <div className="col-md-2">
                  <div className="filter-label">Date</div>
                  <input type="date" className="form-control form-control-sm" value={date} onChange={(e) => setDate(e.target.value)} />
                  <span className="text-primary fw-bold d-block mt-1" style={{ fontSize: "10px" }}>
                    {formatDate(date)}
                  </span>
                </div>
                <div className="col-md-3">
                  <div className="filter-label">Amount (PKR)</div>
                  <input
                    className="form-control form-control-sm fw-bold text-success"
                    placeholder="Amount"
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
                    <div className="mt-1 text-success fw-semibold text-truncate" style={{ fontSize: "10px" }}>
                      {numberToWords(amountRaw)}
                    </div>
                  )}
                </div>
                <div className="col-md-2">
                  <div className="filter-label">Type</div>
                  <select className="form-select form-select-sm" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="payment">Payment</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <div className="filter-label">Method</div>
                  <select className="form-select form-select-sm" value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
                {method === "Bank" ? (
                  <div className="col-md-3">
                    <div className="filter-label">Bank Profile</div>
                    <select
                      className="form-select form-select-sm"
                      value={selectedBankProfile}
                      onChange={(e) => setSelectedBankProfile(e.target.value)}
                    >
                      <option value="">Choose Bank</option>
                      {bankProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.bank_name} ({p.account_number})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="col-md-3 d-grid">
                    <button className="btn btn-success preset-btn btn-sm" disabled={saving || !refNo} onClick={saveEntry}>
                      {saving ? "Saving..." : "💾 Save Transaction"}
                    </button>
                  </div>
                )}
                {method === "Bank" && (
                  <div className="col-md-12 text-end mt-2">
                    <button className="btn btn-success preset-btn btn-sm px-4" disabled={saving || !refNo} onClick={saveEntry}>
                      {saving ? "Saving..." : "💾 Save Transaction"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Data Table */}
            <div ref={pdfRef} className="table-card">
              <div className="table-head">
                <div>
                  <strong>Ledger Records for {refNo || "Selected Customer"}</strong>
                  {paymentStatus && (
                    <span className={`badge ms-2 ${
                      paymentStatus === "PENDING"
                        ? "bg-danger"
                        : paymentStatus === "PARTIAL"
                        ? "bg-warning text-dark"
                        : "bg-success"
                    }`}>
                      {paymentStatus}
                    </span>
                  )}
                </div>
              </div>

              <div className="table-responsive">
                <table className="report-table align-middle">
                  <thead>
                    <tr>
                      <th style={{ width: "12%" }}>Date</th>
                      <th style={{ width: "35%" }}>Description</th>
                      <th style={{ width: "15%" }} className="text-center">Method</th>
                      <th style={{ width: "11%" }} className="text-end">Debit (-)</th>
                      <th style={{ width: "11%" }} className="text-end">Credit (+)</th>
                      <th style={{ width: "11%" }} className="text-end">Balance</th>
                      <th style={{ width: "5%" }} className="text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5 text-muted">
                          No ledger entries loaded. Enter a Ref No and click "Load Ledger".
                        </td>
                      </tr>
                    ) : (
                      rows.map((r, i) => {
                        const idStr = String(r.id || "");
                        const isSale =
                          idStr === "SALE" ||
                          idStr.startsWith("SALE-") ||
                          idStr.startsWith("BKG-") ||
                          idStr.startsWith("TIC-") ||
                          idStr.startsWith("HOT-") ||
                          idStr.startsWith("VIS-") ||
                          idStr.startsWith("PKG-") ||
                          idStr.startsWith("ZIY-") ||
                          idStr.startsWith("TRN-") ||
                          idStr.startsWith("CRD-") ||
                          idStr.startsWith("GRP-");

                        const descText = String(r.description || "");
                        const isAdjustment = descText.toLowerCase().includes("adjustment");
                        const isPayment = descText.toLowerCase().includes("payment") || descText.toLowerCase().includes("receipt");

                        return (
                          <tr key={r.id || i}>
                            <td className="fw-bold">{getRowDate(r)}</td>
                            <td>
                              {isSale ? (() => {
                                const matchedRef = r.ref_no || r.description?.match(/Ref:\s*([^\s]+)/i)?.[1] || refNo;
                                const catIcon = getCategoryIcon(r.description || matchedRef);

                                return (
                                  <div className="d-flex align-items-center gap-1">
                                    <span className="badge bg-primary" style={{ fontSize: "10px" }}>
                                      🧾 SALE INVOICE
                                    </span>
                                    <span className="fw-semibold text-dark ms-1">
                                      {catIcon} {matchedRef}
                                    </span>
                                  </div>
                                );
                              })() : isAdjustment ? (
                                <div className="d-flex align-items-center gap-1">
                                  <span className="badge bg-warning text-dark" style={{ fontSize: "10px" }}>
                                    ⚙️ ADJUSTMENT
                                  </span>
                                  <span className="fw-semibold text-dark ms-1">
                                    {r.ref_no || r.description?.match(/Ref:\s*([^\s]+)/i)?.[1] || r.description}
                                  </span>
                                </div>
                              ) : isPayment ? (
                                <div className="d-flex align-items-center gap-1">
                                  <span className="badge bg-success" style={{ fontSize: "10px" }}>
                                    💵 PAYMENT / RECEIPT
                                  </span>
                                  <span className="fw-semibold text-dark ms-1">
                                    {r.ref_no || r.description?.match(/Ref:\s*([^\s]+)/i)?.[1] || (r.payment_method ? `(${r.payment_method})` : "")}
                                  </span>
                                </div>
                              ) : (
                                <span className={r.id === "CUSTOMER" ? "fw-bold text-primary" : "fw-semibold text-dark"}>
                                  {r.description}
                                </span>
                              )}
                            </td>
                            <td className="text-center">
                              {r.payment_method?.toLowerCase() === "bank" ? (
                                <span className="badge bg-primary" style={{ fontSize: "9px" }}>
                                  🏦 {r.bank_name || "Bank"}
                                </span>
                              ) : r.payment_method?.toLowerCase() === "cash" ? (
                                <span className="badge bg-success" style={{ fontSize: "9px" }}>
                                  💵 Cash
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
                            </td>
                            <td className="text-danger fw-bold font-monospace amount-cell text-end">
                              {r.debit > 0 ? fmtAmt(r.debit) : "-"}
                            </td>
                            <td className="text-success fw-bold font-monospace amount-cell text-end">
                              {r.credit > 0 ? fmtAmt(r.credit) : "-"}
                            </td>
                            <td className="fw-bold font-monospace amount-cell text-end" style={{ backgroundColor: "#fdfdfd" }}>
                              {fmtAmt(r.balance)}
                            </td>
                            <td className="text-center">
                              {isSale ? (
                                <button
                                  className="btn btn-sm btn-info py-0 px-2 text-white fw-bold"
                                  style={{ fontSize: "10px" }}
                                  onClick={() => fetchSaleDetail(r.id, r.description)}
                                >
                                  👁 View
                                </button>
                              ) : r.id !== "CUSTOMER" ? (
                                <div className="d-flex gap-1 justify-content-center">
                                  <button
                                    className="btn btn-outline-primary btn-sm py-0 px-1"
                                    style={{ fontSize: "10px" }}
                                    onClick={() => editRow(r)}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="btn btn-outline-danger btn-sm py-0 px-1"
                                    style={{ fontSize: "10px" }}
                                    onClick={() => del(r.id)}
                                  >
                                    Del
                                  </button>
                                </div>
                              ) : (
                                "-"
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
                            <strong className="fs-5 text-primary">{detailData.ref_no || detailData.id || refNo}</strong>
                          </div>
                        </div>

                        <div className="col-md-6">
                          <div className="bg-white border rounded-4 p-3 shadow-sm h-100">
                            <span className="text-muted small d-block">Customer Name</span>
                            <strong className="fs-5 text-dark">
                              {detailData.customer_name || rows.find((x) => x.id === "CUSTOMER")?.description || "Customer"}
                            </strong>
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

                            <div className="border rounded-3 p-3 bg-white shadow-sm mt-3">
                              <h6 className="fw-bold mb-3 text-dark">👥 Per Person Cost</h6>

                              <div className="d-flex justify-content-between border-bottom py-2">
                                <span><b>Adults ({adultCount})</b></span>
                                <span className="fw-bold text-success fs-6">{fmtAmt(adultPerPerson)} PKR</span>
                              </div>

                              <div className="d-flex justify-content-between border-bottom py-2">
                                <span><b>Children ({childCount})</b></span>
                                <span className="fw-bold text-success fs-6">{fmtAmt(childPerPerson)} PKR</span>
                              </div>

                              <div className="d-flex justify-content-between py-2">
                                <span><b>Infants ({infantCount})</b></span>
                                <span className="fw-bold text-success fs-6">{fmtAmt(infantPerPerson)} PKR</span>
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
                                  <span className="fw-bold text-success font-monospace fs-6">
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
                          <h5 className="fw-bold text-dark font-monospace fs-5">
                            {fmtAmt(getModalTotalSar())}
                          </h5>
                        </div>
                        <div className="col-4 text-center border-end">
                          <span className="text-muted small">PKR Rate</span>
                          <h5 className="fw-bold text-dark font-monospace fs-5">
                            {fmtAmt(getModalPkrRate())}
                          </h5>
                        </div>
                        <div className="col-4 text-center">
                          <span className="text-muted small">Grand Total (PKR)</span>
                          <h5 className="fw-bold text-success font-monospace fs-5">
                            PKR {fmtAmt(getModalTotalPkr())}
                          </h5>
                        </div>
                      </div>

                      <div className="d-flex justify-content-between align-items-center bg-dark text-white p-3 rounded-3 shadow-sm">
                        <span className="fw-bold">TOTAL AMOUNT (PKR):</span>
                        <h4 className="mb-0 fw-bold font-monospace fs-4">
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
    </div>
  );
}