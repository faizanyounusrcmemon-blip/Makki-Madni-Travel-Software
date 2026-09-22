import React, { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import useLedgerExport from "../hooks/useLedgerExport";

/* =========================
   HELPERS (NO -0 EVER)
========================= */
const normalizeZero = (n) => (Math.abs(Number(n || 0)) < 0.005 ? 0 : Number(n));

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

/* ================= DATE FORMATTER: DD/MMM/YYYY ================= */
const formatDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  const day = String(dt.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const month = monthNames[dt.getMonth()];
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
};

// Category Icon Helper
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


const showRefDetails = (row) => {
  const isReg = row.customer_type === "REGISTERED";
  const typeBadgeHtml = isReg
    ? `<span style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold; border:1px solid #bae6fd;">REGISTERED</span>`
    : `<span style="background:#fef3c7; color:#b45309; padding:2px 8px; border-radius:4px; font-size:11px; font-weight:bold; border:1px solid #fde68a;">WALK-IN</span>`;

  // Prefer Sale Date if available, fallback to entry date
  const displayDate = row.sale_date || row.date;

  Swal.fire({
    title: "📋 Ref Details",
    width: "380px",
    html: `
      <div style="text-align:left; font-size:13px; background:#f8f9fa; padding:14px; border-radius:8px; border:1px solid #e9ecef;">
        <div style="margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
          <div>
            <b style="color:#52647a; font-size:11px;">REF NO:</b><br/>
            <span style="color:#0d6efd; font-weight:bold; font-size:15px;">${row.ref_no}</span>
          </div>
          <div>
            ${typeBadgeHtml}
          </div>
        </div>

        <div style="margin-bottom:10px;">
          <b style="color:#52647a; font-size:11px;">CUSTOMER / PASSENGER NAME:</b><br/>
          <span style="color:#198754; font-weight:bold; font-size:14px;">${row.customer_name || "N/A"}</span>
        </div>

        <div>
          <b style="color:#52647a; font-size:11px;">SALE DATE:</b><br/>
          <span style="font-weight:bold; color:#212529;">${formatDate(displayDate)}</span>
        </div>
      </div>
    `,
    confirmButtonText: "Close",
    confirmButtonColor: "#0d6efd"
  });
};


const numberToWords = (num) => {
  if (!num) return "";
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
    "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
    "Seventeen", "Eighteen", "Nineteen"
  ];
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

export default function SupplierLedger({ onNavigate }) {
  const exportUtils = useLedgerExport();
  const handleExportPDF = exportUtils?.handleExportPDF || exportUtils?.exportPDF;
  const handleExportExcel = exportUtils?.handleExportExcel || exportUtils?.exportExcel;

  const [supplierCode, setSupplierCode] = useState("");
  const [ledger, setLedger] = useState([]);
  const [pending, setPending] = useState([]);
  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");
  const [payDate, setPayDate] = useState(today);
  const [method, setMethod] = useState("Bank");
  const [type, setType] = useState("payment");
  const [saving, setSaving] = useState(false);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [ledgerView, setLedgerView] = useState([]);
  const pdfRef = useRef(null);
  const [snapshotDate, setSnapshotDate] = useState(null);
  const [openingBalance, setOpeningBalance] = useState(0);

  // Bank Profiles state
  const [bankProfiles, setBankProfiles] = useState([]);
  const [selectedBankProfile, setSelectedBankProfile] = useState("");

  /* =========================
     LOAD BANK PROFILES
  ========================== */
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

  /* =========================
     LOAD PENDING / PARTIAL
  ========================== */
  const loadPendingAlways = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/pending`);
      const d = await res.json();
      if (d.success) {
        const clean = (d.pending || [])
          .map((p) => ({
            ...p,
            pending_amount: normalizeZero(p.pending_amount),
            total_purchase: normalizeZero(p.total_purchase),
            total_paid: normalizeZero(p.total_paid),
          }))
          .filter((p) => p.status !== "PAID" && Math.abs(p.pending_amount) > 0.5)
          .sort((a, b) => b.pending_amount - a.pending_amount);
        setPending(clean);
      }
    } catch (e) {
      console.error("Pending load error:", e);
    }
  };

  /* =========================
     LOAD LEDGER
  ========================== */
  const loadLedger = async (code = supplierCode) => {
    if (!code) {
      return Swal.fire({
        width: "300px",
        icon: "warning",
        text: "Supplier Code required",
      });
    }

    setSupplierCode(code);

    Swal.fire({
      width: "260px",
      title: "Loading Ledger...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/${code}`
      );
      const d = await res.json();

      if (!d.success) {
        Swal.close();
        return Swal.fire({
          width: "300px",
          icon: "error",
          text: d.error || "Failed to load ledger",
        });
      }

      setSnapshotDate(d.snapshotDate || null);
      setOpeningBalance(Number(d.openingBalance || 0));

const mapped = (d.ledger || []).map((row) => {
  const debit = Math.round(normalizeZero(row.debit));
  const credit = Math.round(normalizeZero(row.credit));
  const balance = Math.round(normalizeZero(row.balance));

  return {
    ...row,
    entry_type: row.entry_type,
    id: row.id,
    type: row.type,
    detail: row.description || row.item || "Purchase Entry",
    debit,
    credit,
    balance,
    ref_no: row.ref_no || "-",
    // ✨ Customer name yahan ensure karein:
    customer_name: row.customer_name || row.passenger_name || row.pax_name || "-"
  };
});

      setLedger(mapped);
      setLedgerView(mapped);

      let supplierName = "Unknown Supplier";
      const found = pending?.find((p) => p.supplier_code === code);
      if (found?.supplier_name) {
        supplierName = found.supplier_name;
      }

      Swal.close();

      Swal.fire({
        width: "360px",
        icon: "success",
        title: "Ledger Loaded Successfully",
        html: `
          <div style="text-align:left;font-size:14px">
            <div style="background:#f8f9fa; padding:10px; border-radius:8px; margin-top:5px;">
              <b>Supplier Code:</b><br/>
              <span style="color:#0d6efd">${code}</span>
              <hr style="margin:8px 0"/>
              <b>Supplier Name:</b><br/>
              <span style="color:#198754">${supplierName}</span>
            </div>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: "OK",
        confirmButtonColor: "#0d6efd",
      });
    } catch (e) {
      console.error("Ledger load error:", e);
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    }
  };

  useEffect(() => {
    loadPendingAlways();
  }, []);

  /* =========================
     AUTO DATE FILTER
  ========================== */
  useEffect(() => {
    let rows = [...ledger];
    if (fromDate) rows = rows.filter((r) => new Date(r.date) >= new Date(fromDate));
    if (toDate) rows = rows.filter((r) => new Date(r.date) <= new Date(toDate));
    setLedgerView([...rows].reverse());
  }, [fromDate, toDate, ledger]);

  /* =========================
     SAVE ENTRY
  ========================== */
  const saveEntry = async () => {
    if (!supplierCode) return Swal.fire({ width: "300px", icon: "warning", text: "Supplier Code required" });
    if (!amountRaw || amountRaw <= 0) return Swal.fire({ width: "300px", icon: "warning", text: "Amount required" });
    if (method === "Bank" && !selectedBankProfile) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Please select a Bank Profile" });
    }

    setSaving(true);
    Swal.fire({
      width: "260px",
      title: "Saving...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            supplier_code: supplierCode,
            payment_date: payDate,
            payment_method: method,
            bank_profile_id: method === "Bank" ? selectedBankProfile : null,
            amount: amountRaw,
            type,
          }),
        }
      );

      const d = await res.json();
      Swal.close();

      if (!d.success) {
        Swal.fire({ width: "300px", icon: "error", text: d.error || "Save failed" });
        return;
      }

      setAmountRaw(0);
      setAmountDisp("");
      setSelectedBankProfile("");
      await loadLedger();
      await loadPendingAlways();
      Swal.fire({ width: "280px", icon: "success", text: "Entry saved successfully" });
    } catch (err) {
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    } finally {
      setSaving(false);
    }
  };

  /* ====================================================
     DELETE ENTRY WITH PASSWORD
  ==================================================== */
  const askPassword = async (title = "🔐 Enter Delete Password") => {
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
        toggle.onclick = () => {
          show = !show;
          input.type = show ? "text" : "password";
          toggle.textContent = show ? "🙈" : "👁";
        };
        setTimeout(() => input.focus(), 100);
      },
    });
    return value;
  };

  const deleteEntry = async (entry) => {
    if (entry.entry_type !== "payment" || !entry.id) return;

    const confirm = await Swal.fire({
      width: "300px",
      icon: "warning",
      text: "Are you sure you want to delete this entry?",
      showCancelButton: true,
      confirmButtonText: "Yes Delete",
    });

    if (!confirm.isConfirmed) return;

    const pwd = await askPassword("🔐 Enter Delete Password");
    if (!pwd) return;

    Swal.fire({
      width: "260px",
      title: "Deleting...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/delete/${entry.id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pwd, type: "payment" }),
        }
      );

      const d = await res.json();
      Swal.close();

      if (!d.success) {
        Swal.fire({ width: "300px", icon: "error", text: d.error || "Delete failed" });
        return;
      }

      await loadLedger();
      await loadPendingAlways();
      Swal.fire({ width: "280px", icon: "success", text: "Entry Deleted Successfully" });
    } catch (err) {
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    }
  };

  /* ====================================================
     EDIT ENTRY (2-STEP VERIFICATION FLOW)
  ==================================================== */
  const editEntry = async (entry) => {
    if (entry.entry_type !== "payment" || !entry.id) return;

    const { value: passInput } = await Swal.fire({
      width: "320px",
      title: "🔐 Enter Edit Password",
      html: `
        <div style="text-align:left;">
          <label style="font-size:13px; font-weight:bold;">Enter Password to Unlock Edit:</label>
          <div style="position:relative; margin-top:8px;">
            <input id="swal-edit-auth-pass" type="password" class="swal2-input" 
              style="width:100%; height:38px; margin:0; padding-right:40px; font-size:14px;" placeholder="Password" />
            <span id="eye-toggle-auth" style="position:absolute; right:12px; top:50%; transform:translateY(-50%); cursor:pointer; font-size:16px; user-select:none;">👁</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Verify Password",
      preConfirm: () => {
        const val = document.getElementById("swal-edit-auth-pass").value;
        if (!val) {
          Swal.showValidationMessage("Password cannot be empty");
          return false;
        }
        return val;
      },
      didOpen: () => {
        const input = document.getElementById("swal-edit-auth-pass");
        const eye = document.getElementById("eye-toggle-auth");
        let visible = false;
        eye.addEventListener("click", () => {
          visible = !visible;
          input.type = visible ? "text" : "password";
          eye.textContent = visible ? "🙈" : "👁";
        });
      },
    });

    if (!passInput) return;

    Swal.fire({
      width: "250px",
      title: "Verifying...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const verifyRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/verify-password`,
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

    const formattedDate = entry.date
      ? new Date(entry.date).toISOString().split("T")[0]
      : today;

    let currentTypeVal = "payment";
    const rawType = (entry.type || "").toLowerCase();
    if (rawType.includes("opening")) {
      currentTypeVal = "opening_balance";
    } else if (rawType.includes("adjust")) {
      currentTypeVal = "adjustment";
    }

    const { value: formValues } = await Swal.fire({
      width: "360px",
      title: "✏️ Edit Ledger Entry",
      html: `
        <div style="text-align:left; font-size:12px;" class="d-flex flex-column gap-2">
          <div>
            <label class="fw-bold mb-1">Amount (PKR)</label>
            <input id="swal-edit-amount" type="number" class="form-control form-control-sm" value="${
              entry.debit || entry.credit || 0
            }" />
          </div>
          <div>
            <label class="fw-bold mb-1">Payment Date</label>
            <input id="swal-edit-date" type="date" class="form-control form-control-sm" value="${formattedDate}" />
            <div id="swal-edit-date-text" class="text-primary fw-bold mt-1" style="font-size: 11px;">
              ${formatDate(formattedDate)}
            </div>
          </div>
          <div>
            <label class="fw-bold mb-1">Entry Type</label>
            <select id="swal-edit-type" class="form-select form-select-sm">
              <option value="payment" ${currentTypeVal === "payment" ? "selected" : ""}>Payment</option>
              <option value="adjustment" ${currentTypeVal === "adjustment" ? "selected" : ""}>Adjustment</option>
              <option value="opening_balance" ${currentTypeVal === "opening_balance" ? "selected" : ""}>🔑 Opening Balance</option>
            </select>
          </div>
          <div>
            <label class="fw-bold mb-1">Payment Method / Bank</label>
            <select id="swal-edit-method" class="form-select form-select-sm">
              <option value="Cash" ${!entry.bank_profile_id && entry.payment_method === "Cash" ? "selected" : ""}>
                💵 Cash
              </option>
              ${
                bankProfiles.length > 0
                  ? bankProfiles
                      .map(
                        (p) => `
                        <option 
                          value="Bank_${p.id}" 
                          ${entry.bank_profile_id == p.id ? "selected" : ""}
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
        const selectedVal = document.getElementById("swal-edit-method").value;
        const selectedType = document.getElementById("swal-edit-type").value;

        if (!amount || Number(amount) <= 0) {
          Swal.showValidationMessage("Valid amount required");
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
          payment_method,
          bank_profile_id,
          type: selectedType,
        };
      },
    });

    if (!formValues) return;

    Swal.fire({
      width: "250px",
      title: "Updating...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/edit/${entry.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formValues),
        }
      );

      const d = await res.json();
      Swal.close();

      if (!d.success) {
        Swal.fire({ width: "300px", icon: "error", text: d.error || "Update failed" });
        return;
      }

      await loadLedger();
      await loadPendingAlways();
      Swal.fire({ width: "280px", icon: "success", text: "Entry updated successfully" });
    } catch (err) {
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    }
  };

  /* EXPORT FUNCTIONS */
  const exportPDF = () => {
    if (!supplierCode || ledger.length === 0) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Please load a supplier first!" });
    }

    if (typeof handleExportPDF !== "function") {
      return Swal.fire({ width: "300px", icon: "error", text: "PDF Export Hook Function Error!" });
    }

    const currentSupplier = pending.find((p) => p.supplier_code === supplierCode);
    const supplierName = currentSupplier ? currentSupplier.supplier_name : "Supplier";

    handleExportPDF({
      code: supplierCode,
      name: supplierName,
      fromDate: fromDate,
      toDate: toDate,
      ledgerData: ledgerView,
      title: "SUPPLIER LEDGER STATEMENT",
      filePrefix: `Supplier_Ledger_${supplierName.replace(/\s+/g, "_")}`,
    });
  };

  const exportExcel = () => {
    if (!supplierCode || ledger.length === 0) {
      return Swal.fire({ width: "300px", icon: "warning", text: "Please load a supplier first!" });
    }

    if (typeof handleExportExcel !== "function") {
      return Swal.fire({ width: "300px", icon: "error", text: "Excel Export Hook Function Error!" });
    }

    const currentSupplier = pending.find((p) => p.supplier_code === supplierCode);
    const supplierName = currentSupplier ? currentSupplier.supplier_name : "Supplier";

    handleExportExcel({
      code: supplierCode,
      name: supplierName,
      fromDate: fromDate,
      toDate: toDate,
      ledgerData: ledgerView,
      title: "SUPPLIER FINANCIAL LEDGER",
      filePrefix: `Supplier_Ledger_${supplierName.replace(/\s+/g, "_")}`,
    });
  };

  // Metrics computation for summary cards
  const totalDebit = ledgerView.reduce((acc, r) => acc + (Number(r.debit) || 0), 0);
  const totalCredit = ledgerView.reduce((acc, r) => acc + (Number(r.credit) || 0), 0);
  const currentBal = ledger.length ? ledger[ledger.length - 1].balance : 0;

  return (
    <div className="supplier-ledger-page">
      <style>{`
        .supplier-ledger-page {
          min-height: calc(100vh - 65px);
          padding: 16px;
          background: radial-gradient(circle at 10% 10%, rgba(255,215,120,.22), transparent 28%), radial-gradient(circle at 90% 0%, rgba(13,110,253,.12), transparent 30%), linear-gradient(135deg, #f8fbff 0%, #eef6ff 45%, #fffaf0 100%);
          font-family: Arial, sans-serif;
        }
        .ledger-shell { max-width: 100%; margin: auto; }
        .ledger-hero {
          border-radius: 18px; padding: 16px 20px; color: #fff;
          background: linear-gradient(135deg, #063b78, #0d6efd 55%, #d4a72c);
          box-shadow: 0 14px 34px rgba(10,55,105,.22); position: relative; overflow: hidden;
          display: flex; justify-content: space-between; align-items: center;
        }
        .ledger-hero h2 { margin: 0; font-weight: 800; letter-spacing: .3px; font-size: 1.5rem; }
        .ledger-hero p { margin: 4px 0 0; opacity: .9; font-size: 0.85rem; }
        .filter-card {
          margin-top: 14px; background: rgba(255,255,255,.94);
          border: 1px solid #dbe7f5; border-radius: 16px; padding: 12px 14px;
          box-shadow: 0 8px 24px rgba(30,65,100,.10);
        }
        .filter-label { font-size: 10px; font-weight: 800; color: #52647a; text-transform: uppercase; letter-spacing: .5px; margin-bottom: 4px; }
        .preset-btn { border-radius: 8px !important; font-weight: 700; }
        .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 14px 0; }
        .summary-card { background: #fff; border-radius: 14px; padding: 10px 12px; border: 1px solid #e2eaf3; box-shadow: 0 6px 18px rgba(0,0,0,.06); }
        .summary-card .label { font-size: 10px; color: #64748b; font-weight: 800; text-transform: uppercase; }
        .summary-card .value { font-size: 18px; font-weight: 900; color: #102a43; margin-top: 2px; }
        .summary-card.total { border-left: 4px solid #0d6efd; }
        .summary-card.debit { border-left: 4px solid #dc3545; }
        .summary-card.credit { border-left: 4px solid #20c997; }
        .summary-card.balance { border-left: 4px solid #d4a72c; }
        .table-card { background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #dfe8f2; box-shadow: 0 10px 28px rgba(30,65,100,.10); }
        .table-head { padding: 10px 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px; border-bottom: 1px solid #e8eef5; }
        .report-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .report-table th { background: linear-gradient(135deg, #073d7a, #0d6efd); color: #fff; padding: 8px 5px; white-space: nowrap; }
        .report-table td { padding: 6px 5px; border-bottom: 1px solid #edf1f5; vertical-align: middle; }
        .report-table tbody tr:hover { background: #f8fbff; }
        .pending-card { background: rgba(255,255,255,.94); border: 1px solid #dbe7f5; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 24px rgba(30,65,100,.10); }
        .pending-header { background: linear-gradient(135deg, #dc3545, #b4232f); color: #fff; padding: 10px 12px; font-weight: 800; font-size: 12px; }
        @media print { .filter-card, .no-print, .pending-card { display: none !important; } }
      `}</style>

      <div className="ledger-shell">
        {/* Banner */}
        <div className="ledger-hero">
          <div>
            <h2>📘 Supplier Ledger Statement</h2>
            <p>
              Supplier purchases, payments, adjustments, credit/debit records aur financial balance tracking.
            </p>
          </div>
          <div>
            <button
              className="btn btn-light btn-sm fw-bold rounded-pill px-3 py-1"
              style={{ fontSize: "12px" }}
              onClick={() => onNavigate("dashboard")}
            >
              ⬅ Back to Home
            </button>
          </div>
        </div>

        <div className="row mt-3 g-2">
          {/* SIDEBAR: PENDING / PARTIAL LIST (REDUCED TO col-lg-2) */}
          <div className="col-lg-2 col-md-3 mb-3">
            <div className="pending-card h-100">
              <div className="pending-header d-flex align-items-center justify-content-between">
                <span>⏳ Pending</span>
                <span className="badge bg-light text-dark">{pending.length}</span>
              </div>
              <div className="p-1" style={{ maxHeight: "72vh", overflowY: "auto" }}>
                {pending.length === 0 ? (
                  <div className="p-3 text-center text-success">
                    <h6 className="fw-bold style={{ fontSize: '12px' }}">✅ Cleared!</h6>
                    <p className="small mb-0 text-muted" style={{ fontSize: '10px' }}>No pending ledgers.</p>
                  </div>
                ) : (
                  <div className="list-group list-group-flush">
                    {pending.map((p, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSupplierCode(p.supplier_code);
                          loadLedger(p.supplier_code);
                        }}
                        className="list-group-item list-group-item-action p-2 mb-1 rounded border-start border-3"
                        style={{
                          cursor: "pointer",
                          borderStartColor:
                            p.status === "EXTRA PAID"
                              ? "#0d6efd"
                              : normalizeZero(p.pending_amount) === 0
                              ? "#198754"
                              : p.status === "PARTIAL"
                              ? "#ffc107"
                              : "#dc3545",
                          backgroundColor: p.supplier_code === supplierCode ? "#e6f0ff" : "#fff",
                        }}
                      >
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className="badge bg-dark font-monospace" style={{ fontSize: "9px" }}>{p.supplier_code}</span>
                          <span
                            className={`badge ${
                              p.status === "EXTRA PAID"
                                ? "bg-primary"
                                : normalizeZero(p.pending_amount) === 0
                                ? "bg-success"
                                : p.status === "PARTIAL"
                                ? "bg-warning text-dark"
                                : "bg-danger"
                            }`}
                            style={{ fontSize: "9px" }}
                          >
                            {normalizeZero(p.pending_amount) === 0 ? "PAID" : p.status}
                          </span>
                        </div>
                        <div className="fw-bold text-truncate text-primary" style={{ fontSize: "0.8rem" }}>
                          {p.supplier_name || "-"}
                        </div>
                        <div className="text-danger fw-bold mt-1" style={{ fontSize: "0.75rem" }}>
                          Rs {fmtAmt(p.pending_amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* MAIN PANEL (EXPANDED TO col-lg-10) */}
          <div className="col-lg-10 col-md-9">
            {/* Filter / Load Panel */}
            <div className="filter-card no-print mb-3">
              <div className="row g-2 align-items-end">
                <div className="col-md-2">
                  <div className="filter-label">From Date</div>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="col-md-2">
                  <div className="filter-label">To Date</div>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <div className="filter-label">Supplier Code</div>
                  <input
                    className="form-control form-control-sm"
                    placeholder="Enter Supplier Code"
                    value={supplierCode}
                    onChange={(e) => setSupplierCode(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="col-md-2 d-grid">
                  <button className="btn btn-primary preset-btn btn-sm" onClick={() => loadLedger()}>
                    🔍 Load
                  </button>
                </div>
                <div className="col-md-1 d-grid">
                  <button
                    className="btn btn-outline-danger preset-btn btn-sm"
                    onClick={exportPDF}
                    disabled={ledger.length === 0}
                  >
                    📄 PDF
                  </button>
                </div>
                <div className="col-md-2 d-grid">
                  <button
                    className="btn btn-outline-success preset-btn btn-sm"
                    onClick={exportExcel}
                    disabled={ledger.length === 0}
                  >
                    📊 Excel
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Metric Cards */}
            <div className="summary-grid">
              <div className="summary-card total">
                <div className="label">Total Entries</div>
                <div className="value">{ledgerView.length}</div>
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
                <div className="value">{fmtAmt(currentBal)}</div>
              </div>
            </div>

            {/* Transaction Form Card */}
            <div
              className={`filter-card no-print mb-3 ${!supplierCode ? "opacity-50" : ""}`}
              style={{ pointerEvents: !supplierCode ? "none" : "auto" }}
            >
              <div className="filter-label mb-2">📥 Add Payment / Adjustment Entry</div>
              <div className="row g-2 align-items-end">
                <div className="col-md-2">
                  <div className="filter-label">Date</div>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={payDate}
                    onChange={(e) => setPayDate(e.target.value)}
                  />
                  <span className="text-primary fw-bold d-block mt-1" style={{ fontSize: "10px" }}>
                    {formatDate(payDate)}
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
                      setAmountRaw(raw);
                      setAmountDisp(fmtAmt(raw));
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
                  <select
                    className="form-select form-select-sm"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="payment">Payment</option>
                    <option value="adjustment">Adjustment</option>
                    <option value="opening_balance">🔑 Opening Balance</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <div className="filter-label">Method</div>
                  <select
                    className="form-select form-select-sm"
                    value={method}
                    onChange={(e) => setMethod(e.target.value)}
                  >
                    <option value="Bank">Bank</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                {method === "Bank" ? (
                  <div className="col-md-3">
                    <div className="filter-label">Select Bank Profile</div>
                    <select
                      className="form-select form-select-sm"
                      value={selectedBankProfile}
                      onChange={(e) => setSelectedBankProfile(e.target.value)}
                    >
                      <option value="">-- Choose Bank --</option>
                      {bankProfiles.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.bank_name} ({p.account_number})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="col-md-3 d-grid">
                    <button
                      className="btn btn-success preset-btn btn-sm"
                      disabled={saving || !supplierCode}
                      onClick={saveEntry}
                    >
                      {saving ? "Saving..." : "💾 Save Entry"}
                    </button>
                  </div>
                )}
                {method === "Bank" && (
                  <div className="col-md-12 text-end mt-2">
                    <button
                      className="btn btn-success preset-btn btn-sm px-4"
                      disabled={saving || !supplierCode}
                      onClick={saveEntry}
                    >
                      {saving ? "Saving..." : "💾 Save Entry"}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Data Table */}
            <div ref={pdfRef} className="table-card">
              <div className="table-head">
                <div>
                  <strong>Ledger Records for {supplierCode || "Selected Supplier"}</strong>
                </div>
              </div>

              <div className="table-responsive">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: "9%", textAlign: "center" }}>Date</th>
                      <th style={{ width: "8%", textAlign: "center" }}>Type</th>
                      <th style={{ width: "9%", textAlign: "center" }}>Ref No</th>
                      <th style={{ width: "16%" }}>Supplier</th>
                      <th style={{ width: "22%" }}>Item Detail</th>
                      <th style={{ width: "10%", textAlign: "center" }}>Method</th>
                      <th style={{ width: "8%", textAlign: "right" }}>Debit</th>
                      <th style={{ width: "8%", textAlign: "right" }}>Credit</th>
                      <th style={{ width: "10%", textAlign: "right" }}>Balance</th>
                      <th style={{ width: "0%", textAlign: "center" }}>Action</th>
                    </tr>
                  </thead>
<tbody style={{ fontSize: "12px" }}>
  {ledgerView.length === 0 ? (
    <tr>
      <td colSpan="10" className="text-center py-4 text-muted">
        No ledger entries loaded. Enter a Supplier Code and click "Load".
      </td>
    </tr>
  ) : (
    ledgerView.map((r, i) => {
      const currentType = (r.type || "").toLowerCase();
      let badgeClass = "bg-primary";
      if (currentType === "purchase") badgeClass = "bg-danger";
      if (currentType === "payment") badgeClass = "bg-success";
      if (currentType === "opening bal" || currentType === "opening_balance")
        badgeClass = "bg-warning text-dark";
      if (currentType === "adjustment") badgeClass = "bg-info text-dark";

      let itemDetail = "-";
      if (currentType === "purchase") {
        itemDetail = r.detail || "Purchase Entry";
      } else if (
        currentType === "opening bal" ||
        currentType === "opening_balance"
      ) {
        itemDetail = "🔑 Opening Balance Entry";
      } else if (r.type === "Snapshot Opening") {
        itemDetail = "📦 Archived Snapshot Balance";
      } else {
        itemDetail =
          r.description || `${r.type} (${r.payment_method || ""})`;
      }

      return (
        <tr key={i}>
          <td className="text-center fw-bold">{formatDate(r.date)}</td>
<td className="text-center">
            <span className={`badge ${badgeClass} fw-semibold px-2 py-1`}>
              {r.type}
            </span>
          </td>
<td className="text-center align-middle">
  {r.ref_no && r.ref_no !== "-" ? (
    (() => {
      const str = String(r.ref_no).toUpperCase();
      let badgeBg = "#f3e8ff";    
      let badgeColor = "#6b21a8"; 

      if (str.includes("HOT")) { 
        badgeBg = "#ffedd5"; badgeColor = "#c2410c"; 
      } else if (str.includes("PKG") || str.includes("BKG")) { 
        badgeBg = "#ecfdf5"; badgeColor = "#047857"; 
      } else if (str.includes("ZIY")) { 
        badgeBg = "#fef3c7"; badgeColor = "#b45309"; 
      } else if (str.includes("TIC") || str.includes("TKT")) { 
        badgeBg = "#fae8ff"; badgeColor = "#86198f"; 
      } else if (str.includes("VISA")) { 
        badgeBg = "#ffe4e6"; badgeColor = "#be123c"; 
      }

      return (
        <span
          onClick={() => showRefDetails(r)} // ✨ Click handler added
          className="badge fw-bold px-2 py-1"
          style={{
            fontSize: "10px",
            letterSpacing: "0.4px",
            backgroundColor: badgeBg,
            color: badgeColor,
            border: `1px solid ${badgeColor}30`,
            borderRadius: "5px",
            cursor: "pointer" // ✨ Pointer cursor
          }}
        >
          <span style={{ fontSize: "11px", marginRight: "3px" }}>
            {getCategoryIcon(r.ref_no || r.detail || r.description)}
          </span>
          {r.ref_no}
        </span>
      );
    })()
  ) : (
    <span className="text-muted small">-</span>
  )}
</td>
          <td className="fw-bold text-primary">
            {currentType === "purchase" ? r.supplier_name : "-"}
          </td>
          <td className="fw-bold text-success">{itemDetail}</td>
          <td className="text-center">
            {r.payment_method && r.payment_method !== "-" ? (
              <span
                className={`badge ${
                  r.payment_method.toLowerCase() === "cash"
                    ? "bg-success"
                    : "bg-primary"
                }`}
              >
                {r.bank_name ? `🏦 ${r.bank_name}` : r.payment_method}
              </span>
            ) : (
              <span className="text-muted">-</span>
            )}
          </td>
          <td style={{ textAlign: "right", fontSize: "0.85rem" }} className="text-danger fw-bold">
            {normalizeZero(r.debit) > 0 ? fmtAmt(r.debit) : "-"}
          </td>
          <td style={{ textAlign: "right", fontSize: "0.85rem" }} className="text-success fw-bold">
            {normalizeZero(r.credit) > 0 ? fmtAmt(r.credit) : "-"}
          </td>
          <td style={{ textAlign: "right", fontSize: "0.85rem" }} className="fw-bold">
            {fmtAmt(r.balance)}
          </td>
          <td style={{ textAlign: "center" }}>
            {r.entry_type === "payment" && r.id && r.id !== 0 ? (
              <div className="d-flex gap-1 justify-content-center">
                <button
                  className="btn btn-outline-primary btn-sm py-0 px-1"
                  style={{ fontSize: "10px" }}
                  onClick={() => editEntry(r)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-outline-danger btn-sm py-0 px-1"
                  style={{ fontSize: "10px" }}
                  onClick={() => deleteEntry(r)}
                >
                  Del
                </button>
              </div>
            ) : (
              <span className="text-muted small">-</span>
            )}
          </td>
        </tr>
      );
    })
  )}
</tbody>
                </table>
              </div>

              {/* Snapshot & Opening Info Footer */}
              <div className="p-2 bg-light border-top">
                <div className="row text-center text-md-start">
                  <div className="col-md-4">
                    <span className="text-muted small">Snapshot Date:</span>{" "}
                    <strong className="small">
                      {snapshotDate ? formatDate(snapshotDate) : "No Snapshot"}
                    </strong>
                  </div>
                  <div className="col-md-4">
                    <span className="text-muted small">Opening Balance:</span>{" "}
                    <strong className="text-dark small">{fmtAmt(openingBalance)}</strong>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <span className="text-muted small">Current Balance:</span>{" "}
                    <strong className="text-primary">{fmtAmt(currentBal)}</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}