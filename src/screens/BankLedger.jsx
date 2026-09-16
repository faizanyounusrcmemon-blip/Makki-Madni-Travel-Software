import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";

/* ================= HELPERS ================= */
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

/* ================= DATE FORMATTER ================= */
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

{/* Description Text Color Helper */}
const getDescriptionColor = (desc) => {
  if (!desc) return "text-secondary";
  const str = desc.toLowerCase();
  
  if (str.includes("supplier") || str.includes("purchase") || str.includes("vendor")) {
    return "text-success fw-bold"; // Supplier Color (Orange/Yellow)
  }
  if (str.includes("customer") || str.includes("sale") || str.includes("client")) {
    return "text-primary fw-bold"; // Customer Color (Blue)
  }
  if (str.includes("expense") || str.includes("pay") || str.includes("bill")) {
    return "text-danger fw-bold"; // Expense Color (Red)
  }
  
  return "text-dark fw-semibold"; // Default Text Color
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

const today = new Date().toISOString().slice(0, 10);

/* ================= MAIN COMPONENT ================= */
export default function BankLedger({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState(null);

  const [date, setDate] = useState(today);
  const [amountRaw, setAmountRaw] = useState(0);
  const [amountDisp, setAmountDisp] = useState("");
  const [type, setType] = useState("deposit");
  const [comment, setComment] = useState("");
  const [bankProfileId, setBankProfileId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [saving, setSaving] = useState(false);

  /* ================= LOAD PROFILES & LEDGER ================= */
  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    loadLedger();
  }, [selectedProfile]);

  const loadProfiles = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger/profiles`);
      const d = await res.json();
      if (d.success) setProfiles(d.profiles || []);
    } catch (err) {
      console.error("Error loading profiles:", err);
    }
  };

  const loadLedger = async () => {
    if (!selectedProfile) {
      setRows([]);
      setFiltered([]);
      return;
    }

    try {
      const url = `${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger?bank_profile_id=${selectedProfile}`;
      const r = await fetch(url);
      const d = await r.json();
      if (d.success) {
        const list = (d.rows || []).slice().reverse();
        setRows(list);
        setFiltered(list);
      }
    } catch (err) {
      console.error("Error loading ledger:", err);
    }
  };

  /* ================= FILTER / SEARCH ================= */
  useEffect(() => {
    let temp = [...rows];
    if (fromDate) {
      const from = new Date(fromDate + "T00:00:00");
      temp = temp.filter((r) => new Date(r.txn_date) >= from);
    }
    if (toDate) {
      const to = new Date(toDate + "T23:59:59");
      temp = temp.filter((r) => new Date(r.txn_date) <= to);
    }
    if (search) {
      const s = search.toLowerCase();
      temp = temp.filter(
        (r) =>
          formatDate(r.txn_date).toLowerCase().includes(s) ||
          (r.description || "").toLowerCase().includes(s) ||
          (r.debit || "").toString().includes(s) ||
          (r.credit || "").toString().includes(s) ||
          (r.balance || "").toString().includes(s)
      );
    }
    setFiltered(temp);
    setCurrentPage(1);
  }, [fromDate, toDate, rows, search]);

  /* ================= PASSWORD POPUP ================= */
  const askPassword = async (title = "Enter Password") => {
    const { value } = await Swal.fire({
      width: "300px",
      html: `
        <div style="text-align:left;font-size:13px">
          <b>${title}</b>
          <div style="position:relative;margin-top:10px">
            <input 
              id="swal-pass"
              type="password"
              class="swal2-input"
              placeholder="Enter password"
              style="height:34px;font-size:13px;width:100%;margin:0;padding-right:40px"
            />
            <span id="toggle-pass" style="
              position:absolute;
              right:12px;
              top:50%;
              transform:translateY(-50%);
              cursor:pointer;
              user-select:none;
              font-size:16px;
            ">👁</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Verify Password",
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
            const confirmBtn = document.querySelector(".swal2-confirm");
            if (confirmBtn) confirmBtn.click();
          }
        };
        document.addEventListener("keydown", handleEnter);
        Swal.getPopup().addEventListener("remove", () => {
          document.removeEventListener("keydown", handleEnter);
        });
      },
    });
    return value;
  };

  /* ================= SAVE NEW TRANSACTION ================= */
  const save = async () => {
    const targetBank = bankProfileId || selectedProfile;
    if (!date || !amountRaw || amountRaw <= 0 || !targetBank) {
      return Swal.fire({
        width: "300px",
        icon: "warning",
        text: "Date, Bank Profile & Valid Amount required",
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
      const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger/transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txn_date: date,
          type,
          amount: amountRaw,
          comment,
          bank_profile_id: targetBank,
        }),
      });

      const d = await r.json();
      Swal.close();

      if (d.success) {
        setMsg({ type: "success", text: d.message });
        setAmountRaw(0);
        setAmountDisp("");
        setComment("");
        loadLedger();
        Swal.fire({
          width: "280px",
          icon: "success",
          text: d.message || "Transaction Saved Successfully",
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
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    } finally {
      setSaving(false);
    }
  };

  /* ================= EDIT TRANSACTION ================= */
  const editRow = async (row) => {
    if (!row || !row.id) return;

    const passInput = await askPassword("🔒 Authorization Password Required");
    if (!passInput) return;

    Swal.fire({
      width: "250px",
      title: "Verifying...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const verifyRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger/verify-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: passInput }),
        }
      );
      const verifyData = await verifyRes.json();
      Swal.close();

      if (!verifyData.success) {
        return Swal.fire({
          width: "300px",
          icon: "error",
          text: verifyData.error || "Incorrect Authorization Password!",
        });
      }
    } catch (err) {
      Swal.close();
      return Swal.fire({
        width: "300px",
        icon: "error",
        text: "Network error during password verification",
      });
    }

    const formattedDateForInput = row.txn_date
      ? new Date(row.txn_date).toISOString().split("T")[0]
      : today;
    const currentAmount = row.credit > 0 ? row.credit : row.debit;
    const currentType = row.credit > 0 ? "deposit" : "withdraw";
    const currentBankProfileId = row.bank_profile_id || selectedProfile || "";

    const profileOptionsHTML = profiles
      .map(
        (p) =>
          `<option value="${p.id}" ${
            String(p.id) === String(currentBankProfileId) ? "selected" : ""
          }>
            ${p.bank_name} (${p.account_number})
          </option>`
      )
      .join("");

    const { value: formValues } = await Swal.fire({
      width: "360px",
      title: "✏️ Edit Bank Transaction",
      html: `
        <div style="text-align:left; font-size:12px;" class="d-flex flex-column gap-2">
          <div>
            <label class="fw-bold mb-1">Transaction Date</label>
            <input id="swal-edit-date" type="date" class="form-control form-control-sm" value="${formattedDateForInput}" />
            <div id="swal-edit-date-text" class="text-primary fw-bold mt-1" style="font-size: 11px;">
              ${formatDate(formattedDateForInput)}
            </div>
          </div>
          <div>
            <label class="fw-bold mb-1">Bank Profile</label>
            <select id="swal-edit-bank" class="form-select form-select-sm">
              <option value="">Select Bank Profile</option>
              ${profileOptionsHTML}
            </select>
          </div>
          <div>
            <label class="fw-bold mb-1">Amount (PKR)</label>
            <input id="swal-edit-amount" type="number" class="form-control form-control-sm" value="${currentAmount || 0}" />
          </div>
          <div>
            <label class="fw-bold mb-1">Type</label>
            <select id="swal-edit-type" class="form-select form-select-sm">
              <option value="deposit" ${currentType === "deposit" ? "selected" : ""}>➕ Deposit</option>
              <option value="withdraw" ${currentType === "withdraw" ? "selected" : ""}>➖ Withdraw</option>
            </select>
          </div>
          <div>
            <label class="fw-bold mb-1">Comment / Description</label>
            <input id="swal-edit-comment" type="text" class="form-control form-control-sm" value="${row.description || ""}" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Update Transaction",
      focusConfirm: false,
      didOpen: () => {
        const dateInput = document.getElementById("swal-edit-date");
        const dateTextLabel = document.getElementById("swal-edit-date-text");
        dateInput.addEventListener("change", (e) => {
          dateTextLabel.textContent = formatDate(e.target.value);
        });
      },
      preConfirm: () => {
        const txn_date = document.getElementById("swal-edit-date").value;
        const bank_profile_id = document.getElementById("swal-edit-bank").value;
        const amountVal = document.getElementById("swal-edit-amount").value;
        const typeVal = document.getElementById("swal-edit-type").value;
        const commentVal = document.getElementById("swal-edit-comment").value.trim();

        if (!txn_date) {
          Swal.showValidationMessage("Date required");
          return false;
        }
        if (!bank_profile_id) {
          Swal.showValidationMessage("Bank Profile required");
          return false;
        }
        if (!amountVal || Number(amountVal) <= 0) {
          Swal.showValidationMessage("Valid amount required");
          return false;
        }

        return {
          txn_date,
          bank_profile_id,
          amount: Number(amountVal),
          type: typeVal,
          comment: commentVal,
          password: passInput,
        };
      },
    });

    if (!formValues) return;

    Swal.fire({
      width: "260px",
      title: "Updating...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const r = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger/transaction/${row.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formValues),
        }
      );

      const d = await r.json();
      Swal.close();

      if (d.success) {
        loadLedger();
        Swal.fire({
          width: "280px",
          icon: "success",
          text: "Transaction Updated Successfully",
        });
      } else {
        Swal.fire({
          width: "300px",
          icon: "error",
          text: d.error || "Update Failed!",
        });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    }
  };

  /* ================= DELETE ================= */
  const del = async (id) => {
    const confirmDelete = await Swal.fire({
      width: "300px",
      icon: "warning",
      text: "Delete this transaction?",
      showCancelButton: true,
      confirmButtonText: "Delete",
    });

    if (!confirmDelete.isConfirmed) return;

    const pass = await askPassword("Enter Delete Password");
    if (!pass) return;

    Swal.fire({
      width: "260px",
      title: "Deleting...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger/transaction/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      });

      const d = await r.json();
      Swal.close();

      if (d.success) {
        setMsg({ type: "success", text: d.message });
        loadLedger();
        Swal.fire({
          width: "280px",
          icon: "success",
          text: d.message || "Transaction Deleted Successfully",
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
      Swal.fire({ width: "300px", icon: "error", text: "Network Error" });
    }
  };

  /* ================= PAGINATION ================= */
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginatedRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const getPagination = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    for (let i of range) {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l > 2) rangeWithDots.push("…");
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };

  // Metrics computation
  const totalDebit = filtered.reduce((acc, r) => acc + (Number(r.debit) || 0), 0);
  const totalCredit = filtered.reduce((acc, r) => acc + (Number(r.credit) || 0), 0);
  const currentBalance = rows.length ? rows[0].balance : 0;

  return (
    <div className="bank-ledger-page">
      <style>{`
        .bank-ledger-page {
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
        .pending-header { background: linear-gradient(135deg, #073d7a, #0d6efd); color: #fff; padding: 10px 12px; font-weight: 800; font-size: 12px; }
      `}</style>

      <div className="ledger-shell">
        {/* Banner */}
        <div className="ledger-hero">
          <div>
            <h2>🏦 Bank Ledger Statement</h2>
            <p>Bank accounts tracking, deposits, withdrawals, aur bank transactions ledger control.</p>
          </div>
          <div>
            <button
              className="btn btn-light btn-sm fw-bold rounded-pill px-3 py-1"
              style={{ fontSize: "12px" }}
              onClick={() => onNavigate && onNavigate("dashboard")}
            >
              ⬅ Back to Home
            </button>
          </div>
        </div>

        {/* Alert Msg */}
        {msg && <div className={`alert alert-${msg.type} py-2 mt-2 mb-0`}>{msg.text}</div>}

        <div className="row mt-3 g-2">
          {/* SIDEBAR: BANK PROFILES LIST */}
          <div className="col-lg-2 col-md-3 mb-3">
            <div className="pending-card h-100">
              <div className="pending-header d-flex align-items-center justify-content-between">
                <span>🏦 Bank Profiles</span>
                <span className="badge bg-light text-primary">{profiles.length}</span>
              </div>
              <div className="p-1" style={{ maxHeight: "72vh", overflowY: "auto" }}>
                {profiles.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      setSelectedProfile(p.id);
                      setBankProfileId(p.id);
                    }}
                    className="list-group-item list-group-item-action p-2 mb-1 rounded border-start border-3"
                    style={{
                      cursor: "pointer",
                      borderStartColor: String(selectedProfile) === String(p.id) ? "#0d6efd" : "#6c757d",
                      backgroundColor: String(selectedProfile) === String(p.id) ? "#e6f0ff" : "#fff",
                    }}
                  >
                    <div className="fw-bold text-truncate text-primary" style={{ fontSize: "0.8rem" }}>
                      {p.bank_name}
                    </div>
                    <div className="text-muted fw-semibold mt-1" style={{ fontSize: "0.75rem" }}>
                      {p.account_title ? `${p.account_title} - ` : ""}
                      {p.account_number}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* MAIN PANEL */}
          <div className="col-lg-10 col-md-9">
            {/* Filter Card */}
            <div className="filter-card mb-3">
              <div className="row g-2 align-items-end">
                <div className="col-md-3">
                  <div className="filter-label">From Date</div>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <div className="filter-label">To Date</div>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <div className="filter-label">Search Transaction</div>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="🔍 Search description, date, amount..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Summary Grid */}
            <div className="summary-grid">
              <div className="summary-card total">
                <div className="label">Total Records</div>
                <div className="value">{filtered.length}</div>
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
                <div className="label">Account Balance</div>
                <div className="value">{selectedProfile ? fmtAmt(currentBalance) : "Select Bank"}</div>
              </div>
            </div>

            {/* New Transaction Form */}
            <div className="filter-card mb-3">
              <div className="filter-label mb-2">📥 Deposit / Withdraw Cash (Bank)</div>
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
                <div className="col-md-3">
                  <div className="filter-label">Bank Profile</div>
                  <select
                    className="form-select form-select-sm fw-bold"
                    value={bankProfileId || selectedProfile}
                    onChange={(e) => setBankProfileId(e.target.value)}
                  >
                    <option value="">Select Bank Profile</option>
                    {profiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.bank_name} ({p.account_number})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-2">
                  <div className="filter-label">Type</div>
                  <select
                    className="form-select form-select-sm fw-bold"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="deposit">➕ Deposit</option>
                    <option value="withdraw">➖ Withdraw</option>
                  </select>
                </div>
                <div className="col-md-2">
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
                <div className="col-md-3">
                  <div className="filter-label">Comment / Description</div>
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Optional Comment / Description..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
                <div className="col-md-12 text-end mt-2">
                  <button
                    className={`btn btn-sm preset-btn px-4 fw-bold ${type === "deposit" ? "btn-success" : "btn-danger"}`}
                    onClick={save}
                    disabled={saving}
                  >
                    {saving ? "Saving..." : type === "deposit" ? "➕ Process Deposit" : "➖ Process Withdraw"}
                  </button>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="table-card">
              <div className="table-head">
                <div>
                  <strong>
                    {selectedProfile
                      ? `Bank Transactions for ${
                          profiles.find((p) => String(p.id) === String(selectedProfile))?.bank_name || ""
                        }`
                      : "Bank Ledger Transactions"}
                  </strong>
                </div>
                <span className="badge bg-primary">Total Records: {filtered.length}</span>
              </div>

              <div className="table-responsive">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th style={{ width: "12%", textAlign: "center" }}>Date</th>
                      <th style={{ width: "38%" }}>Description</th>
                      <th style={{ width: "12%", textAlign: "right" }}>Debit (-)</th>
                      <th style={{ width: "12%", textAlign: "right" }}>Credit (+)</th>
                      <th style={{ width: "14%", textAlign: "right" }}>Balance</th>
                      <th style={{ width: "12%", textAlign: "center" }}>Actions</th>
                    </tr>
                  </thead>
<tbody style={{ fontSize: "12px" }}>
  {paginatedRows.length === 0 ? (
    <tr>
      <td colSpan="6" className="text-center py-4 text-muted">
        {selectedProfile
          ? "No transaction entries found for this bank account."
          : "👈 Please select a Bank Profile from the sidebar to view transactions."}
      </td>
    </tr>
  ) : (
    paginatedRows.map((r, i) => (
      <tr key={i}>
        <td className="text-center fw-semibold">{formatDate(r.txn_date)}</td>
        <td className={getDescriptionColor(r.description)}>
          {r.description || "-"}
        </td>
        <td style={{ textAlign: "right" }} className="text-danger fw-bold">
          {normalizeZero(r.debit) > 0 ? fmtAmt(r.debit) : "-"}
        </td>
        <td style={{ textAlign: "right" }} className="text-success fw-bold">
          {normalizeZero(r.credit) > 0 ? fmtAmt(r.credit) : "-"}
        </td>
        <td style={{ textAlign: "right" }} className="fw-bold text-dark">
          {fmtAmt(r.balance)}
        </td>
        <td style={{ textAlign: "center" }}>
          {r.source === "manual" ? (
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
            <span className="text-muted small">-</span>
          )}
        </td>
      </tr>
    ))
  )}
</tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              {selectedProfile && paginatedRows.length > 0 && (
                <div className="d-flex justify-content-between align-items-center p-2 flex-wrap gap-2 border-top bg-light">
                  <select
                    className="form-select form-select-sm"
                    style={{ width: "100px" }}
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setCurrentPage(1);
                    }}
                  >
                    <option value={25}>25 View</option>
                    <option value={50}>50 View</option>
                    <option value={75}>75 View</option>
                    <option value={100}>100 View</option>
                    <option value={1000000}>Full View</option>
                  </select>

                  <div className="d-flex gap-1 align-items-center flex-wrap">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(currentPage - 1)}
                    >
                      ⬅ Prev
                    </button>
                    {getPagination().map((p, idx) => (
                      <button
                        key={idx}
                        className={`btn btn-sm ${p === currentPage ? "btn-primary" : "btn-outline-primary"}`}
                        disabled={p === "…"}
                        onClick={() => typeof p === "number" && setCurrentPage(p)}
                      >
                        {p}
                      </button>
                    ))}
                    <button
                      className="btn btn-sm btn-outline-primary"
                      disabled={currentPage === totalPages || totalPages === 0}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    >
                      Next ➡
                    </button>
                  </div>

                  <input
                    type="number"
                    min={1}
                    max={totalPages}
                    placeholder="Go"
                    className="form-control form-control-sm"
                    style={{ width: "70px" }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        let val = Number(e.target.value);
                        if (val >= 1 && val <= totalPages) setCurrentPage(val);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}