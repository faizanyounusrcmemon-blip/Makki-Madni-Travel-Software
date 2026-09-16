import React, { useState, useRef, useEffect } from "react";
import useLedgerExport from "../hooks/useLedgerExport";
import Swal from "sweetalert2";

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

const fmtAmt = (v) =>
  v === null || v === undefined || v === "" ? "-" : Number(v).toLocaleString("en-US");

const parseAmt = (v) => Number(String(v).replace(/,/g, "") || 0);

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
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: "12%" }}>Date</th>
                      <th style={{ width: "35%" }}>Description</th>
                      <th style={{ width: "15%" }}>Method</th>
                      <th style={{ width: "11%", textAlign: "right" }}>Debit (-)</th>
                      <th style={{ width: "11%", textAlign: "right" }}>Credit (+)</th>
                      <th style={{ width: "11%", textAlign: "right" }}>Balance</th>
                      <th style={{ width: "5%", textAlign: "center" }}>Action</th>
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
                      rows.map((r, i) => (
                        <tr key={r.id || i}>
                          <td className="fw-bold">{getRowDate(r)}</td>
                          <td className={r.id === "CUSTOMER" ? "fw-bold text-primary" : ""}>
                            {r.description}
                          </td>
                          <td>
                            {r.payment_method?.toLowerCase() === "bank" ? (
                              <span className="badge bg-primary">🏦 {r.bank_name || "Bank"}</span>
                            ) : r.payment_method?.toLowerCase() === "cash" ? (
                              <span className="badge bg-success">💵 Cash</span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }} className="text-danger fw-bold">
                            {r.debit > 0 ? fmtAmt(r.debit) : "-"}
                          </td>
                          <td style={{ textAlign: "right" }} className="text-success fw-bold">
                            {r.credit > 0 ? fmtAmt(r.credit) : "-"}
                          </td>
                          <td style={{ textAlign: "right" }} className="fw-bold">
                            {fmtAmt(r.balance)}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            {r.id !== "SALE" && r.id !== "CUSTOMER" ? (
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
                                  onClick={() => del(r.id)}
                                >
                                  Del
                                </button>
                              </div>
                            ) : (
                              <span className="text-muted small">-</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}