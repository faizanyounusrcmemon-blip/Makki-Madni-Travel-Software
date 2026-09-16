import React, { useState, useRef, useEffect } from "react";
import Swal from "sweetalert2";
import useLedgerExport from "../hooks/useLedgerExport";

/* =========================
   HELPERS
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

export default function ExpenseLedger({ onNavigate }) {
  const exportUtils = useLedgerExport();
  const handleExportPDF = exportUtils?.handleExportPDF || exportUtils?.exportPDF;
  const handleExportExcel = exportUtils?.handleExportExcel || exportUtils?.exportExcel;

  const [rows, setRows] = useState([]);
  const [bankProfiles, setBankProfiles] = useState([]);

  // FORM STATES
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");
  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");
  const [method, setMethod] = useState("Cash");
  const [selectedBankProfile, setSelectedBankProfile] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  // FILTER STATES
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [ledgerView, setLedgerView] = useState([]);
  const pdfRef = useRef(null);

  /* ================= LOAD DATA & BANK PROFILES ================= */
  const load = async () => {
    try {
      const r = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/expense-ledger`
      );
      const d = await r.json();
      if (d.success) setRows(d.rows || []);
    } catch (err) {
      console.error("Error loading expenses:", err);
    }
  };

  const loadBankProfiles = async () => {
    try {
      const r = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger/profiles`
      );
      const d = await r.json();
      if (d.success) setBankProfiles(d.profiles || []);
    } catch (err) {
      console.error("Error loading bank profiles:", err);
    }
  };

  useEffect(() => {
    load();
    loadBankProfiles();
  }, []);

/* ================= AUTO FILTER & LEDGER VIEW ================= */
useEffect(() => {
  let filtered = [...rows];
  if (fromDate) filtered = filtered.filter((r) => r.expense_date?.slice(0, 10) >= fromDate);
  if (toDate) filtered = filtered.filter((r) => r.expense_date?.slice(0, 10) <= toDate);
  if (search) filtered = filtered.filter((r) => r.title?.toLowerCase().includes(search.toLowerCase()));

  // 1. First sort Oldest to Newest to compute correct running balance
  filtered.sort((a, b) => new Date(a.expense_date) - new Date(b.expense_date));

  // 2. Map running balance
  let runningBal = 0;
  const mapped = filtered.map((r) => {
    const amt = Number(r.amount || 0);
    runningBal += amt;
    return {
      ...r,
      debit: amt,
      credit: 0,
      balance: runningBal,
    };
  });

  // 3. Reverse the array so latest date comes on top (Descending View)
  setLedgerView(mapped.reverse());
}, [fromDate, toDate, search, rows]);

  /* ================= PASSWORD POPUP ================= */
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

  /* ================= SAVE ENTRY ================= */
  const saveEntry = async () => {
    if (!date || !title.trim() || amountRaw <= 0) {
      return Swal.fire({
        width: "300px",
        icon: "warning",
        text: "Please enter valid date, title, and amount",
      });
    }

    if (method === "Bank" && !selectedBankProfile) {
      return Swal.fire({
        width: "300px",
        icon: "warning",
        text: "Please select a Bank Profile",
      });
    }

    setSaving(true);
    Swal.fire({
      width: "260px",
      title: "Saving...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const r = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/expense-ledger/add`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expense_date: date,
            title: title.trim(),
            amount: amountRaw,
            payment_method: method,
            bank_profile_id: method === "Bank" ? selectedBankProfile : null,
            remarks: remarks.trim(),
          }),
        }
      );

      const d = await r.json();
      Swal.close();

      if (d.success) {
        setTitle("");
        setAmountRaw(0);
        setAmountDisp("");
        setRemarks("");
        setSelectedBankProfile("");

        await load();

        Swal.fire({
          width: "280px",
          icon: "success",
          text: "Expense Saved Successfully",
        });
      } else {
        Swal.fire({
          width: "300px",
          icon: "error",
          text: d.error || "Save failed",
        });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({
        width: "300px",
        icon: "error",
        text: "Network Error",
      });
    } finally {
      setSaving(false);
    }
  };

  /* ================= EDIT ENTRY ================= */
  const editExpense = async (row) => {
    if (!row || !row.id) return;

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
        `${import.meta.env.VITE_BACKEND_URL}/api/expense-ledger/verify-password`,
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

    const rawDate = row.expense_date ? row.expense_date.slice(0, 10) : today;

    const bankOptions = bankProfiles
      .map(
        (p) =>
          `<option value="${p.id}" ${
            row.bank_profile_id == p.id ? "selected" : ""
          }>${p.bank_name} (${p.account_number})</option>`
      )
      .join("");

    const { value: formValues } = await Swal.fire({
      title: "✏️ Edit Expense",
      width: "360px",
      html: `
        <div style="text-align:left; font-size:12px;" class="d-flex flex-column gap-2">
          <div>
            <label class="fw-bold mb-1">Date</label>
            <input id="edit-date" type="date" class="form-control form-control-sm" value="${rawDate}">
            <div id="edit-date-text" class="text-primary fw-bold mt-1" style="font-size:11px;">${formatDate(rawDate)}</div>
          </div>
          <div>
            <label class="fw-bold mb-1">Title</label>
            <input id="edit-title" type="text" class="form-control form-control-sm" value="${row.title || ""}">
          </div>
          <div>
            <label class="fw-bold mb-1">Amount (PKR)</label>
            <input id="edit-amount" type="number" class="form-control form-control-sm" value="${row.amount || ""}">
          </div>
          <div>
            <label class="fw-bold mb-1">Payment Method</label>
            <select id="edit-method" class="form-select form-select-sm">
              <option value="Cash" ${row.payment_method === "Cash" ? "selected" : ""}>Cash</option>
              <option value="Bank" ${row.payment_method === "Bank" ? "selected" : ""}>Bank</option>
            </select>
          </div>
          <div id="edit-bank-box" style="display:${row.payment_method === "Bank" ? "block" : "none"}">
            <label class="fw-bold mb-1">Select Bank Profile</label>
            <select id="edit-bank-id" class="form-select form-select-sm">
              <option value="">-- Choose Bank --</option>
              ${bankOptions}
            </select>
          </div>
          <div>
            <label class="fw-bold mb-1">Remarks</label>
            <input id="edit-remarks" type="text" class="form-control form-control-sm" value="${row.remarks || ""}">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Update Entry",
      focusConfirm: false,

      didOpen: () => {
        const dateInput = document.getElementById("edit-date");
        const dateTextLabel = document.getElementById("edit-date-text");
        const methodEl = document.getElementById("edit-method");
        const bankBox = document.getElementById("edit-bank-box");

        dateInput.addEventListener("change", (e) => {
          dateTextLabel.textContent = formatDate(e.target.value);
        });

        if (methodEl && bankBox) {
          methodEl.addEventListener("change", (e) => {
            bankBox.style.display = e.target.value === "Bank" ? "block" : "none";
          });
        }
      },

      preConfirm: () => {
        const expense_date = document.getElementById("edit-date").value;
        const title = document.getElementById("edit-title").value.trim();
        const amount = document.getElementById("edit-amount").value;
        const payment_method = document.getElementById("edit-method").value;
        const bank_profile_id = document.getElementById("edit-bank-id").value;
        const remarks = document.getElementById("edit-remarks").value.trim();

        if (!expense_date || !title || !amount || Number(amount) <= 0) {
          Swal.showValidationMessage("Please fill required fields with valid amount");
          return false;
        }

        if (payment_method === "Bank" && !bank_profile_id) {
          Swal.showValidationMessage("Please select a bank profile");
          return false;
        }

        return {
          expense_date,
          title,
          amount: Number(amount),
          payment_method,
          bank_profile_id: payment_method === "Bank" ? bank_profile_id : null,
          remarks,
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
      const r = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/expense-ledger/update/${row.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formValues),
        }
      );

      const d = await r.json();
      Swal.close();

      if (d.success) {
        await load();
        Swal.fire({
          width: "280px",
          icon: "success",
          text: "Expense Updated Successfully",
        });
      } else {
        Swal.fire({
          width: "300px",
          icon: "error",
          text: d.error || "Update failed",
        });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({
        width: "300px",
        icon: "error",
        text: "Network Error",
      });
    }
  };

  /* ================= DELETE ================= */
  const del = async (id) => {
    const confirmDelete = await Swal.fire({
      width: "300px",
      icon: "warning",
      text: "Delete this expense?",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!confirmDelete.isConfirmed) return;

    const pass = await askPassword("🔐 Enter Delete Password");
    if (!pass) return;

    Swal.fire({
      width: "260px",
      title: "Deleting...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const r = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/expense-ledger/delete/${id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pass }),
        }
      );

      const d = await r.json();
      Swal.close();

      if (d.success) {
        await load();
        Swal.fire({
          width: "280px",
          icon: "success",
          text: "Expense Deleted Successfully",
        });
      } else {
        Swal.fire({
          width: "300px",
          icon: "error",
          text: d.error || "Delete failed",
        });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({
        width: "300px",
        icon: "error",
        text: "Network Error",
      });
    }
  };

  /* ================= EXPORTS ================= */
  const exportPDF = () => {
    if (ledgerView.length === 0) {
      return Swal.fire({ width: "300px", icon: "warning", text: "No expenses to export!" });
    }
    if (typeof handleExportPDF !== "function") {
      return Swal.fire({ width: "300px", icon: "error", text: "PDF Export Hook Function Error!" });
    }

    handleExportPDF({
      code: "EXPENSE",
      name: "General Expenses",
      fromDate: fromDate,
      toDate: toDate,
      ledgerData: ledgerView.map((r) => ({
        ...r,
        date: r.expense_date,
        type: "Expense",
        detail: r.title,
        description: r.remarks,
      })),
      title: "EXPENSE LEDGER STATEMENT",
      filePrefix: "Expense_Ledger_Statement",
    });
  };

  const exportExcel = () => {
    if (ledgerView.length === 0) {
      return Swal.fire({ width: "300px", icon: "warning", text: "No expenses to export!" });
    }
    if (typeof handleExportExcel !== "function") {
      return Swal.fire({ width: "300px", icon: "error", text: "Excel Export Hook Function Error!" });
    }

    handleExportExcel({
      code: "EXPENSE",
      name: "General Expenses",
      fromDate: fromDate,
      toDate: toDate,
      ledgerData: ledgerView.map((r) => ({
        ...r,
        date: r.expense_date,
        type: "Expense",
        detail: r.title,
        description: r.remarks,
      })),
      title: "EXPENSE FINANCIAL LEDGER",
      filePrefix: "Expense_Ledger_Statement",
    });
  };

  // Metrics computation for summary cards
  const totalExpense = ledgerView.reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const cashTotal = ledgerView.filter((r) => r.payment_method === "Cash").reduce((acc, r) => acc + (Number(r.amount) || 0), 0);
  const bankTotal = ledgerView.filter((r) => r.payment_method === "Bank").reduce((acc, r) => acc + (Number(r.amount) || 0), 0);

  return (
    <div className="expense-ledger-page">
      <style>{`
        .expense-ledger-page {
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
.report-table { width: 100%; border-collapse: collapse; font-size: 13px; }
.report-table th { background: linear-gradient(135deg, #073d7a, #0d6efd); color: #fff; padding: 10px 6px; white-space: nowrap; font-size: 13px; }
.report-table td { padding: 8px 6px; border-bottom: 1px solid #edf1f5; vertical-align: middle; }
        .report-table tbody tr:hover { background: #f8fbff; }
        @media print { .filter-card, .no-print { display: none !important; } }
      `}</style>

      <div className="ledger-shell">
        {/* Banner */}
        <div className="ledger-hero">
          <div>
            <h2>💸 Expense Ledger Statement</h2>
            <p>
              Daily business expenses, bank transfers, cash payments aur financial record tracking.
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

        {/* Filter Panel */}
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
              <div className="filter-label">Search Title</div>
              <input
                className="form-control form-control-sm"
                placeholder="Search expense title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-2 d-grid">
              <button className="btn btn-primary preset-btn btn-sm" onClick={load}>
                🔍 Load
              </button>
            </div>
            <div className="col-md-1 d-grid">
              <button
                className="btn btn-outline-danger preset-btn btn-sm"
                onClick={exportPDF}
                disabled={ledgerView.length === 0}
              >
                📄 PDF
              </button>
            </div>
            <div className="col-md-2 d-grid">
              <button
                className="btn btn-outline-success preset-btn btn-sm"
                onClick={exportExcel}
                disabled={ledgerView.length === 0}
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
            <div className="label">Cash Expenses</div>
            <div className="value">{fmtAmt(cashTotal)}</div>
          </div>
          <div className="summary-card credit">
            <div className="label">Bank Expenses</div>
            <div className="value">{fmtAmt(bankTotal)}</div>
          </div>
          <div className="summary-card balance">
            <div className="label">Total Amount</div>
            <div className="value">{fmtAmt(totalExpense)}</div>
          </div>
        </div>

        {/* Transaction Form Card */}
        <div className="filter-card no-print mb-3">
          <div className="filter-label mb-2">📥 Add Expense Entry</div>
          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <div className="filter-label">Date</div>
              <input
                type="date"
                className="form-control form-control-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <span className="text-primary fw-bold d-block mt-1" style={{ fontSize: "10px" }}>
                {formatDate(date)}
              </span>
            </div>
            <div className="col-md-2">
              <div className="filter-label">Expense Title</div>
              <input
                className="form-control form-control-sm"
                placeholder="e.g. Tea / Office Rent"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <div className="filter-label">Amount (PKR)</div>
              <input
                className="form-control form-control-sm fw-bold text-danger"
                placeholder="Amount"
                value={amountDisp}
                onChange={(e) => {
                  const raw = parseAmt(e.target.value);
                  setAmountRaw(raw);
                  setAmountDisp(fmtAmt(raw));
                }}
              />
              {amountRaw > 0 && (
                <div className="mt-1 text-danger fw-semibold text-truncate" style={{ fontSize: "10px" }}>
                  {numberToWords(amountRaw)}
                </div>
              )}
            </div>
            <div className="col-md-2">
              <div className="filter-label">Method</div>
              <select
                className="form-select form-select-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
              </select>
            </div>
            {method === "Bank" ? (
              <div className="col-md-2">
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
            ) : null}
            <div className={method === "Bank" ? "col-md-2" : "col-md-3"}>
              <div className="filter-label">Remarks</div>
              <input
                className="form-control form-control-sm"
                placeholder="Optional Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>
            <div className="col-md-1 d-grid">
              <button
                className="btn btn-success preset-btn btn-sm"
                disabled={saving}
                onClick={saveEntry}
              >
                {saving ? "Saving..." : "💾 Save"}
              </button>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div ref={pdfRef} className="table-card">
          <div className="table-head">
            <div>
              <strong>Expense Ledger Records</strong>
            </div>
          </div>

          <div className="table-responsive">
            <table className="report-table">
              <thead>
                <tr>
                  <th style={{ width: "10%", textAlign: "center" }}>Date</th>
                  <th style={{ width: "20%" }}>Expense Title</th>
                  <th style={{ width: "12%", textAlign: "center" }}>Method</th>
                  <th style={{ width: "26%" }}>Remarks / Description</th>
                  <th style={{ width: "10%", textAlign: "right" }}>Debit (-)</th>
                  <th style={{ width: "10%", textAlign: "right" }}>Credit (+)</th>
                  <th style={{ width: "12%", textAlign: "right" }}>Total Balance</th>
                  <th style={{ width: "0%", textAlign: "center" }}>Action</th>
                </tr>
              </thead>
<tbody style={{ fontSize: "14px" }}>
  {ledgerView.length === 0 ? (
    <tr>
      <td colSpan="8" className="text-center py-4 text-muted fs-6">
        No expense records found.
      </td>
    </tr>
  ) : (
    ledgerView.map((r, i) => (
      <tr key={r.id || i}>
        <td className="text-center fw-bold">{formatDate(r.expense_date)}</td>
        <td className="fw-bold text-primary">{r.title}</td>
        <td className="text-center">
          <span
            className={`badge ${
              r.payment_method === "Bank" ? "bg-primary" : "bg-success"
            }`}
            style={{ fontSize: "11px" }}
          >
            {r.payment_method === "Bank" && r.bank_name
              ? `🏦 ${r.bank_name}`
              : r.payment_method === "Bank"
              ? "🏦 Bank"
              : "💵 Cash"}
          </span>
        </td>
        <td className="text-dark fw-semibold">{r.remarks || "-"}</td>
        <td style={{ textAlign: "right" }} className="text-danger fw-bold fs-6">
          {fmtAmt(r.debit)}
        </td>
        <td style={{ textAlign: "right" }} className="text-success fw-bold fs-6">
          -
        </td>
        <td style={{ textAlign: "right" }} className="fw-bold fs-6 text-dark">
          {fmtAmt(r.balance)}
        </td>
        <td style={{ textAlign: "center" }}>
          <div className="d-flex gap-1 justify-content-center">
            <button
              className="btn btn-outline-primary btn-sm py-0 px-1"
              style={{ fontSize: "11px" }}
              onClick={() => editExpense(r)}
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
        </td>
      </tr>
    ))
  )}
</tbody>
            </table>
          </div>

          {/* Footer Metrics */}
          <div className="p-2 bg-light border-top">
            <div className="row text-center text-md-start">
              <div className="col-md-4">
                <span className="text-muted small">Total Records:</span>{" "}
                <strong className="small">{ledgerView.length}</strong>
              </div>
              <div className="col-md-4">
                <span className="text-muted small">Cash / Bank Mix:</span>{" "}
                <strong className="text-dark small">
                  {fmtAmt(cashTotal)} / {fmtAmt(bankTotal)}
                </strong>
              </div>
              <div className="col-md-4 text-md-end">
                <span className="text-muted small">Total Expense:</span>{" "}
                <strong className="text-primary">{fmtAmt(totalExpense)}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}