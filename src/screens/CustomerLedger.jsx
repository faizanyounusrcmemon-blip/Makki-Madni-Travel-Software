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
  // Hook initialization
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
     LOAD PENDING LIST
  ========================== */
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

  /* =========================
     LOAD LEDGER
  ========================== */
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
     SAVE ENTRY
  ========================== */
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

  /* ================= EDIT PAYMENT ENTRY ================= */
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

/* =========================
     EXPORT FUNCTIONS (PDF & EXCEL)
  ========================== */
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

  return (
    <div className="container-fluid p-4">
      {/* HEADER BANNER */}
      <div className="card shadow-sm mb-4">
        <div className="card-body d-flex justify-content-between align-items-center bg-dark text-white rounded">
          <h4 className="fw-bold mb-0 text-white">
            📘 CUSTOMER LEDGER {refNo && `— ${refNo}`}
            {paymentStatus === "PENDING" && <span className="badge bg-danger ms-2">PENDING</span>}
            {paymentStatus === "PARTIAL" && <span className="badge bg-warning text-dark ms-2">PARTIAL</span>}
            {paymentStatus === "CLEARED" && refNo && <span className="badge bg-success ms-2">CLEARED</span>}
          </h4>
          <button className="btn btn-light btn-sm fw-bold" onClick={() => onNavigate("dashboard")}>⬅ Back to Home</button>
        </div>
      </div>

      <div className="row">
        {/* SIDEBAR: PENDING / PARTIAL LIST */}
        <div className="col-lg-3 col-md-4 mb-4">
          <div className="card shadow-sm h-100">
            <div className="card-header bg-danger text-white fw-bold d-flex align-items-center">
              <span>⏳ Pending / Partial Ledgers</span>
            </div>
            <div className="card-body p-2" style={{ maxHeight: "70vh", overflowY: "auto" }}>
              {pending.length === 0 ? (
                <div className="p-3 text-center text-success">
                  <h5>✅ All Cleared!</h5>
                  <p className="small mb-0 text-muted">No pending/partial manual ledgers found.</p>
                </div>
              ) : (
                <div className="list-group list-group-flush">
                  {pending.map((p, i) => (
                    <div
                      key={i}
                      onClick={() => loadLedger(p.ref_no)}
                      className="list-group-item list-group-item-action p-3 mb-2 rounded border-start border-4 cursor-pointer"
                      style={{
                        cursor: "pointer",
                        borderStartColor: p.payment_status === "PENDING" ? "#dc3545" : "#ffc107",
                        backgroundColor: p.ref_no === refNo ? "#e9ecef" : "#f8f9fa"
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-start mb-1">
                        <span className="badge bg-dark font-monospace">{p.ref_no}</span>
                        <span className={`badge ${p.payment_status === "PENDING" ? "bg-danger" : "bg-warning text-dark"}`}>
                          {p.payment_status}
                        </span>
                      </div>
                      <div className="fw-bold text-truncate text-primary" style={{ fontSize: "0.95rem" }}>
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
          <div className="card shadow-sm mb-3">
            <div className="card-body py-3">
              <div className="row g-2">
                <div className="col-md-5">
                  <input
                    className="form-control form-control-lg"
                    placeholder="Enter Reference Number (e.g., PKG-1002)"
                    value={refNo}
                    onChange={(e) => setRefNo(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="col-md-3">
                  <button className="btn btn-primary btn-lg w-100 fw-bold" onClick={() => loadLedger()}>
                    🔍 Load Ledger
                  </button>
                </div>
                <div className="col-md-2">
                  <button
                    className="btn btn-danger btn-lg w-100 fw-bold"
                    onClick={exportPDF}
                    disabled={rows.length === 0}
                  >
                    📄 PDF
                  </button>
                </div>
                <div className="col-md-2">
                  <button
                    className="btn btn-success btn-lg w-100 fw-bold"
                    onClick={exportExcel}
                    disabled={rows.length === 0}
                  >
                    📊 Excel
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className={`card shadow-sm mb-3 ${!refNo ? "opacity-50" : ""}`} style={{ pointerEvents: !refNo ? "none" : "auto" }}>
            <div className="card-header bg-light fw-bold text-secondary">📥 Add Payment / Adjustment Receipt</div>
            <div className="card-body">
              <div className="row g-2 mb-3">
                <div className="col-md-2">
                  <label className="form-label small text-muted mb-1">Date</label>
                  <input type="date" className="form-control" value={date} onChange={(e) => setDate(e.target.value)} />
                  <span className="text-primary fw-bold d-block mt-1" style={{ fontSize: "0.75rem" }}>
                    {formatDate(date)}
                  </span>
                </div>
                <div className="col-md-3">
                  <label className="form-label small text-muted mb-1">Amount</label>
                  <input
                    className="form-control fw-bold text-success"
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
                    <div className="mt-1 small text-success fw-semibold text-truncate">
                      {numberToWords(amountRaw)}
                    </div>
                  )}
                </div>
                <div className="col-md-2">
                  <label className="form-label small text-muted mb-1">Type</label>
                  <select className="form-select" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="payment">Payment</option>
                    <option value="adjustment">Adjustment</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label small text-muted mb-1">Method</label>
                  <select className="form-select" value={method} onChange={(e) => setMethod(e.target.value)}>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
                {method === "Bank" && (
                  <div className="col-md-3">
                    <label className="form-label small text-muted mb-1">Select Bank Account</label>
                    <select
                      className="form-select fw-bold"
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
                )}
              </div>
              <button className="btn btn-success px-4 py-2 fw-bold" disabled={saving || !refNo} onClick={saveEntry}>
                {saving ? "Saving..." : "💾 Save Transaction"}
              </button>
            </div>
          </div>

          <div ref={pdfRef} className="card shadow-sm overflow-hidden">
            <div className="table-responsive">
              <table className="table table-striped table-hover table-bordered mb-0 align-middle">
<thead className="table-dark">
  <tr>
    <th style={{ width: "12%" }}>Date</th>
    <th style={{ width: "35%" }}>Description</th>
    <th style={{ width: "15%" }}>Method</th> {/* 👈 Naya Column Header */}
    <th style={{ width: "11%" }} className="text-end">Debit (-)</th>
    <th style={{ width: "11%" }} className="text-end">Credit (+)</th>
    <th style={{ width: "11%" }} className="text-end">Balance</th>
    <th style={{ width: "5%" }} className="text-center">Action</th>
  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center p-4 text-muted fs-5">
                        No ledger entries loaded. Enter a valid Ref No above and click "Load".
                      </td>
                    </tr>
                  ) : (
                    rows.map((r, i) => (
                      <tr key={r.id || i}>
                        <td>{getRowDate(r)}</td>
{/* Description Cell */}
<td className={r.id === "CUSTOMER" ? "fw-bold text-primary" : ""}>
  {r.description}
</td>

{/* 👈 NAYA PAYMENT METHOD CELL */}
<td>
  {r.payment_method?.toLowerCase() === "bank" ? (
    <span className="badge bg-primary">
      🏦 {r.bank_name || "Bank"}
    </span>
  ) : r.payment_method?.toLowerCase() === "cash" ? (
    <span className="badge bg-success">💵 Cash</span>
  ) : (
    <span className="text-muted">-</span>
  )}
</td>

{/* Debit Cell */}

                        <td className="text-end text-danger fw-bold">{r.debit > 0 ? fmtAmt(r.debit) : "-"}</td>
                        <td className="text-end text-success fw-bold">{r.credit > 0 ? fmtAmt(r.credit) : "-"}</td>
                        <td className="text-end fw-bold" style={{ backgroundColor: "#f8f9fa" }}>
                          {fmtAmt(r.balance)}
                        </td>
                        <td className="text-center">
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
  );
}
