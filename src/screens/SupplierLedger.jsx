import React, { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import useLedgerExport from "../hooks/useLedgerExport";

/* =========================
   HELPERS (NO -0 EVER)
========================= */
const normalizeZero = (n) => Math.abs(Number(n || 0)) < 0.005 ? 0 : Number(n);

const fmtAmt = (v) => {
  let n = normalizeZero(v);
  return n.toLocaleString("en-US");
};

const parseAmt = (v) => {
  const n = Number(String(v).replace(/,/g, ""));
  return normalizeZero(Math.round(n || 0));
};

/* ================= DATE FORMATTER: DD/MMM/YYYY (e.g. 20/Jul/2026) ================= */
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

  const { exportPDF: handleExportPDF, exportExcel: handleExportExcel } = useLedgerExport();
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

/* =========================
   LOAD PENDING / PARTIAL
========================== */
const loadPendingAlways = async () => {
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/pending`);
    const d = await res.json();
    if (d.success) {
      const clean = (d.pending || [])
        .map(p => ({
          ...p,
          pending_amount: normalizeZero(p.pending_amount),
          total_purchase: normalizeZero(p.total_purchase),
          total_paid: normalizeZero(p.total_paid)
        }))
        // Filter handles zero-check cleanly for both unpaid purchases & opening balance entries
        .filter(p => p.status !== "PAID" || Math.abs(p.pending_amount) > 0.5)
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
        text: "Supplier Code required"
      });
    }

    Swal.fire({
      width: "260px",
      title: "Loading Ledger...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
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
          text: d.error || "Failed to load ledger"
        });
      }

      setSnapshotDate(d.snapshotDate || null);
      setOpeningBalance(Number(d.openingBalance || 0));

      const mapped = (d.ledger || []).map(row => {
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
          ref_no: row.ref_no || "-"
        };
      });

      setLedger(mapped);
      setLedgerView(mapped);

      let supplierName = "Unknown Supplier";
      const found = pending?.find(p => p.supplier_code === code);
      if (found?.supplier_name) {
        supplierName = found.supplier_name;
      }

      Swal.close();

      Swal.fire({
        width: "300px",
        icon: "success",
        title: "Ledger Loaded",
        html: `
          <div style="text-align:left; font-size:12px; line-height:1.4;">
            <div style="background:#0d6efd; color:#fff; padding:6px 8px; border-radius:8px; font-weight:bold; margin-bottom:8px;">
              📦 Supplier Info
            </div>
            <div style="margin-bottom:6px;">
              <span style="color:#777;">Supplier Code:</span><br/>
              <span style="background:#212529; color:#fff; padding:3px 6px; border-radius:6px; font-weight:600; display:inline-block;">
                ${code}
              </span>
            </div>
            <div>
              <span style="color:#777;">Supplier Name:</span><br/>
              <span style="background:linear-gradient(135deg,#198754,#20c997); color:#fff; padding:4px 8px; border-radius:6px; font-weight:600; display:inline-block;">
                ${supplierName}
              </span>
            </div>
          </div>
        `,
        showConfirmButton: true,
        confirmButtonText: "OK",
        confirmButtonColor: "#0d6efd"
      });

    } catch (e) {
      console.error("Ledger load error:", e);
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    }
  };

  useEffect(() => { loadPendingAlways(); }, []);

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
    if (!supplierCode) return Swal.fire({ icon: "warning", text: "Supplier Code required" });
    if (!amountRaw || amountRaw <= 0) return Swal.fire({ icon: "warning", text: "Amount required" });

    setSaving(true);
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
            amount: amountRaw,
            type
          }),
        }
      );

      const d = await res.json();
      if (!d.success) {
        Swal.fire({ icon: "error", text: d.error || "Save failed" });
        return;
      }

      setAmountRaw(0);
      setAmountDisp("");
      await loadLedger();
      await loadPendingAlways();
      Swal.fire({ icon: "success", text: "Entry saved" });
    } finally {
      setSaving(false);
    }
  };

  /* ====================================================
     DELETE ENTRY WITH PASSWORD
  ==================================================== */
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
      confirmButtonText: "OK",
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
        const handleEnter = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            document.querySelector(".swal2-confirm").click();
          }
        };
        document.addEventListener("keydown", handleEnter);
        Swal.getPopup().addEventListener("remove", () => {
          document.removeEventListener("keydown", handleEnter);
        });
      }
    });
    return value;
  };

  const deleteEntry = async (entry) => {
    if (entry.entry_type !== "payment" || !entry.id) return;

    const confirm = await Swal.fire({
      width: "300px",
      icon: "warning",
      text: "Delete this entry?",
      showCancelButton: true,
      confirmButtonText: "Delete"
    });

    if (!confirm.isConfirmed) return;

    const pwd = await askPassword("Enter Delete Password");
    if (!pwd) return;

    Swal.fire({
      width: "260px",
      title: "Deleting...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
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
        Swal.fire({ icon: "error", text: d.error || "Delete failed" });
        return;
      }

      await loadLedger();
      await loadPendingAlways();
      Swal.fire({ icon: "success", text: "Entry deleted" });
    } catch (err) {
      Swal.close();
      Swal.fire({ icon: "error", text: "Network Error" });
    }
  };

/* ====================================================
   EDIT ENTRY (STEP 1: PASSWORD -> STEP 2: EDIT FORM)
==================================================== */
const editEntry = async (entry) => {
  if (entry.entry_type !== "payment" || !entry.id) return;

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
    const verifyRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/supplier-ledger/verify-password`, {
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
  const formattedDate = entry.date ? new Date(entry.date).toISOString().split('T')[0] : today;
  const currentType = (entry.type || "payment").toLowerCase();

  const { value: formValues } = await Swal.fire({
    width: "360px",
    title: "✏️ Edit Ledger Entry",
    html: `
      <div style="text-align:left; font-size:12px;" class="d-flex flex-column gap-2">
        <div>
          <label class="fw-bold mb-1">Amount (PKR)</label>
          <input id="swal-edit-amount" type="number" class="form-control form-control-sm" value="${entry.debit || entry.credit || 0}" />
        </div>
        <div>
          <label class="fw-bold mb-1">Payment Date</label>
          <input id="swal-edit-date" type="date" class="form-control form-control-sm" value="${formattedDate}" />
          <div id="swal-edit-date-text" class="text-primary fw-bold mt-1" style="font-size: 11px;">
            ${formatDate(formattedDate)}
          </div>
        </div>
        <div>
          <label class="fw-bold mb-1">Transaction Type</label>
          <select id="swal-edit-type" class="form-select form-select-sm">
            <option value="payment" ${currentType.includes("payment") ? "selected" : ""}>Payment</option>
            <option value="adjustment" ${currentType.includes("adjustment") ? "selected" : ""}>Adjustment</option>
            <option value="opening_balance" ${currentType.includes("opening") ? "selected" : ""}>🔑 Opening Balance (Debit)</option>
          </select>
        </div>
        <div>
          <label class="fw-bold mb-1">Method</label>
          <select id="swal-edit-method" class="form-select form-select-sm">
            <option value="Bank" ${entry.payment_method === "Bank" ? "selected" : ""}>Bank</option>
            <option value="Cash" ${entry.payment_method === "Cash" ? "selected" : ""}>Cash</option>
          </select>
        </div>
      </div>
    `,
    showCancelButton: true,
    confirmButtonText: "Update",
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
        password: passInput // Step 1 ka verified password pass kar rahe hain
      };
    }
  });

  if (!formValues) return;

  // STEP 3: Save Update
  Swal.fire({
    width: "260px",
    title: "Updating...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
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
      Swal.fire({ icon: "error", text: d.error || "Update failed" });
      return;
    }

    await loadLedger();
    await loadPendingAlways();
    Swal.fire({ icon: "success", text: "Entry updated successfully" });
  } catch (err) {
    Swal.close();
    Swal.fire({ icon: "error", text: "Network Error" });
  }
};

/* ✅ CORRECTED EXPORT FUNCTIONS */
const exportPDF = () => {
  if (!supplierCode) {
    return Swal.fire({ icon: "warning", text: "Please load a supplier first!" });
  }

  // Pending list se supplier ka name find kar rahe hain
  const currentSupplier = pending.find((p) => p.supplier_code === supplierCode);

  handleExportPDF({
    code: supplierCode,
    name: currentSupplier ? currentSupplier.supplier_name : "Supplier",
    fromDate: fromDate,
    toDate: toDate,
    ledgerData: ledgerView,
    title: "SUPPLIER LEDGER STATEMENT",
  });
};

const exportExcel = () => {
  if (!supplierCode) {
    return Swal.fire({ icon: "warning", text: "Please load a supplier first!" });
  }

  const currentSupplier = pending.find((p) => p.supplier_code === supplierCode);

  handleExportExcel({
    code: supplierCode,
    name: currentSupplier ? currentSupplier.supplier_name : "Supplier",
    fromDate: fromDate,
    toDate: toDate,
    ledgerData: ledgerView,
    title: "SUPPLIER FINANCIAL LEDGER",
  });
};

  return (
    <div className="container-fluid p-3">
      {/* HEADER CARD */}
      <div className="card shadow-sm mb-3">
        <div className="card-body d-flex justify-content-between align-items-center py-2">
          <h4 className="fw-bold mb-0 text-primary">📘 SUPPLIER LEDGER SYSTEM</h4>
          <button className="btn btn-secondary btn-sm" onClick={() => onNavigate("dashboard")}>⬅ Back</button>
        </div>
      </div>

      <div className="row g-3">
        {/* LEFT COLUMN */}
        <div className="col-lg-3 col-md-4 col-12">
          <div className="card shadow-sm" style={{ maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
            <div className="card-header fw-bold text-danger bg-light sticky-top">⏳ Pending / Partial List</div>
            <ul className="list-group list-group-flush">
              {pending.length === 0 && <li className="list-group-item text-success text-center py-3">✅ No pending</li>}
              {pending.map((p, i) => (
                <li key={i} className="list-group-item p-2 d-flex flex-column gap-1">
                  <div className="d-flex justify-content-between align-items-start">
                    <span className="fw-bold text-dark small" style={{ maxWidth: "70%" }}>
                      {p.supplier_code} <span className="text-primary d-block">{p.supplier_name}</span>
                    </span>
                    <span className={`badge ${
                      p.status === "EXTRA PAID" ? "bg-primary"
                      : normalizeZero(p.pending_amount) === 0 ? "bg-success"
                      : p.status === "PARTIAL" ? "bg-warning text-dark"
                      : "bg-danger"
                    }`} style={{ fontSize: "0.68rem" }}>
                      {normalizeZero(p.pending_amount) === 0 ? "PAID" : p.status}
                    </span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-1">
                    <span className="text-danger fw-bold small">Rs {fmtAmt(p.pending_amount)}</span>
                    <button className="btn btn-xs btn-primary py-0 px-2" style={{ fontSize: "0.75rem" }}
                      onClick={() => { setSupplierCode(p.supplier_code); loadLedger(p.supplier_code); }}>
                      Load
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-lg-9 col-md-8 col-12">
          <div className="card mb-3 shadow-sm">
            <div className="card-body p-2 d-flex flex-wrap gap-2">
              <div className="d-flex align-items-center gap-1 flex-grow-1">
                <span className="small fw-bold text-muted text-nowrap">From:</span>
                <input type="date" className="form-control form-control-sm" value={fromDate} onChange={e => setFromDate(e.target.value)} />
              </div>
              <div className="d-flex align-items-center gap-1 flex-grow-1">
                <span className="small fw-bold text-muted text-nowrap">To:</span>
                <input type="date" className="form-control form-control-sm" value={toDate} onChange={e => setToDate(e.target.value)} />
              </div>
              <div className="d-flex align-items-center gap-1 flex-grow-1">
                <input className="form-control form-control-sm" placeholder="Supplier Code" value={supplierCode} onChange={e => setSupplierCode(e.target.value)} />
              </div>
              <div className="d-flex gap-1 ms-auto">
                <button className="btn btn-sm btn-primary px-3" onClick={() => loadLedger()}>Load</button>
                <button className="btn btn-sm btn-danger px-3" onClick={exportPDF}>PDF</button>
                <button className="btn btn-sm btn-success px-3" onClick={exportExcel}>Excel</button>
              </div>
            </div>
          </div>

          {/* ENTRY FORM */}
          <div className="card shadow-sm mb-3 bg-light">
            <div className="card-body py-2 px-3 row g-2 align-items-end">
              <div className="col-md-2">
                <label className="form-label small fw-bold mb-1">Payment Date</label>
                <input type="date" className="form-control form-control-sm" value={payDate} onChange={e => setPayDate(e.target.value)} />
                {/* LIVE FORMATTED DATE TEXT DISPLAY */}
                <span className="text-primary fw-bold d-block mt-1" style={{ fontSize: "0.75rem" }}>
                  {formatDate(payDate)}
                </span>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-bold mb-1">Amount (PKR)</label>
                <input className="form-control form-control-sm" placeholder="Amount" value={amountDisp}
                  onChange={e => {
                    const raw = parseAmt(e.target.value);
                    setAmountRaw(raw);
                    setAmountDisp(fmtAmt(raw));
                  }} />
                {amountRaw > 0 && (
                  <span className="d-block mt-1 text-success fw-bold" style={{ fontSize: "0.75rem" }}>
                    {numberToWords(amountRaw)}
                  </span>
                )}
              </div>
              <div className="col-md-3">
                <label className="form-label small text-muted mb-1">Transaction Type</label>
                <select className="form-select form-select-sm" value={type} onChange={(e) => setType(e.target.value)}>
                  <option value="payment">Payment</option>
                  <option value="adjustment">Adjustment</option>
                  <option value="opening_balance">🔑 opening_balance (Debit)</option>
                </select>
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-bold mb-1">Method</label>
                <select className="form-control form-control-sm" value={method} onChange={e => setMethod(e.target.value)}>
                  <option>Bank</option>
                  <option>Cash</option>
                </select>
              </div>
              <div className="col-md-2">
                <button className="btn btn-success btn-sm w-100" disabled={saving} onClick={saveEntry}>
                  {saving ? "Saving..." : "💾 Save"}
                </button>
              </div>
            </div>
          </div>

          {/* LEDGER TABLE CARD */}
          <div ref={pdfRef} className="card shadow-sm">
            <div className="table-responsive">
              <table className="table table-bordered table-sm mb-0 text-end" style={{ fontSize: "0.85rem" }}>
                <thead className="table-dark text-center">
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Ref No</th>
                    <th>Supplier</th>
                    <th>Item Detail</th>
                    <th>Payment Method</th>
                    <th>Debit</th>
                    <th>Credit</th>
                    <th>Balance</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.length === 0 && (
                    <tr>
                      <td colSpan="10" className="text-center text-muted py-3">
                        No ledger entries. Please load a supplier first.
                      </td>
                    </tr>
                  )}
                  {ledgerView.map((r, i) => {
                    const currentType = (r.type || "").toLowerCase();
                    let badgeClass = "bg-primary"; 
                    if (currentType === "purchase") badgeClass = "bg-danger";
                    if (currentType === "payment") badgeClass = "bg-success";
                    if (currentType === "opening bal" || currentType === "opening_balance") badgeClass = "bg-warning text-dark";
                    if (currentType === "adjustment") badgeClass = "bg-info text-dark";

                    let itemDetail = "-";
                    if (currentType === "purchase") {
                      itemDetail = r.detail || "Purchase Entry";
                    } else if (currentType === "opening bal" || currentType === "opening_balance") {
                      itemDetail = "🔑 Opening Balance Entry";
                    } else if (r.type === "Snapshot Opening") {
                      itemDetail = "📦 Archived Snapshot Balance";
                    } else {
                      itemDetail = r.description || `${r.type} (${r.payment_method || ""})`;
                    }

                    return (
                      <tr key={i}>
                        <td className="text-center fw-bold small">{formatDate(r.date)}</td>
                        <td className="text-center">
                          <span className={`badge ${badgeClass}`} style={{ fontSize: "0.75rem" }}>
                            {r.type}
                          </span>
                        </td>
                        <td className="text-center fw-bold text-secondary small">{r.ref_no || "-"}</td>
                        <td className="text-start fw-bold text-primary small">{currentType === "purchase" ? r.supplier_name : "-"}</td>
                        <td className="text-start fw-bold text-success small">{itemDetail}</td>
                        <td className="text-center small">
                          {r.payment_method && r.payment_method !== "-" ? (
                            <span className={`badge ${r.payment_method.toLowerCase() === "cash" ? "bg-success" : "bg-primary"}`}>{r.payment_method}</span>
                          ) : "-"}
                        </td>
                        <td className={normalizeZero(r.debit) > 0 ? "text-danger fw-bold" : ""}>{fmtAmt(r.debit)}</td>
                        <td className={normalizeZero(r.credit) > 0 ? "text-success fw-bold" : ""}>{fmtAmt(r.credit)}</td>
                        <td className="fw-bold">{fmtAmt(r.balance)}</td>
                        <td className="text-center">
                          {r.entry_type === "payment" && r.id && r.id !== 0 ? (
                            <div className="d-flex gap-1 justify-content-center">
                              <button 
                                className="btn btn-xs btn-outline-primary py-0 px-1" 
                                onClick={() => editEntry(r)}
                                style={{ fontSize: "0.75rem" }}
                              >
                                Edit
                              </button>
                              <button 
                                className="btn btn-xs btn-outline-danger py-0 px-1" 
                                onClick={() => deleteEntry(r)}
                                style={{ fontSize: "0.75rem" }}
                              >
                                Delete
                              </button>
                            </div>
                          ) : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* LEDGER FOOTER METADATA OUTSIDE TABLE HTML */}
            <div className="card p-2 m-2 bg-light border-0">
              <div className="row text-center text-md-start">
                <div className="col-md-4">
                  <span className="text-muted small">Snapshot Date:</span> <strong className="small">{snapshotDate ? formatDate(snapshotDate) : "No Snapshot"}</strong>
                </div>
                <div className="col-md-4">
                  <span className="text-muted small">Opening Balance:</span> <strong className="text-dark small">{fmtAmt(openingBalance)}</strong>
                </div>
                <div className="col-md-4 text-md-end">
                  <span className="text-muted small">Current Balance:</span> <strong className="text-primary">{ledger.length ? fmtAmt(ledger[ledger.length - 1].balance) : 0}</strong>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
}
