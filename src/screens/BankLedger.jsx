import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";

/* ================= COLOR PALETTE ================= */
const colorPalette = ["#FF6B6B", "#4ECDC4", "#FFD93D", "#6A4C93", "#FF8C42", "#00A6ED", "#FF5D8F"];

/* ================= HELPERS ================= */
const fmtAmount = (v) => (v !== null && v !== undefined && v !== "" ? Number(v).toLocaleString("en-US") : "-");

const numberToWords = (num) => {
  if (!num) return "";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "PKR",
    currencyDisplay: "name",
    maximumFractionDigits: 0,
  })
    .format(num)
    .replace("Pakistani rupees", "Rupees");
};

/* ================= DATE FORMATTER ================= */
const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;

  const day = String(date.getDate()).padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
};

/* ================= MAIN COMPONENT ================= */
export default function BankLedger({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState("");
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState(null);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("deposit");
  const [comment, setComment] = useState("");
  const [bankProfileId, setBankProfileId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const supplierColorMap = useRef({});

  const extractName = (str) => {
    if (!str) return "";
    const match = str.match(/- (.+?) \(/);
    if (match) return match[1].trim();
    return str.trim();
  };

  const isCustomerPayment = (str) => str?.toLowerCase().includes("customer") || false;

  const getSupplierColor = (str) => {
    const name = extractName(str);
    if (!name) return "#000";
    if (isCustomerPayment(str)) return "#007BFF";
    if (!supplierColorMap.current[name]) {
      const index = Object.keys(supplierColorMap.current).length % colorPalette.length;
      supplierColorMap.current[name] = colorPalette[index];
    }
    return supplierColorMap.current[name];
  };

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
    // اگر کوئی بینک سلیکٹ نہیں ہے تو ڈیٹا لوڈ نہ کریں
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

  /* ================= SAVE NEW TRANSACTION ================= */
  const save = async () => {
    const targetBank = bankProfileId || selectedProfile;
    if (!date || !amount || !targetBank) {
      return Swal.fire({
        width: "300px",
        icon: "warning",
        text: "Date, Bank Profile & Amount required",
      });
    }

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
          amount: amount.replace(/,/g, ""),
          comment,
          bank_profile_id: targetBank,
        }),
      });

      const d = await r.json();
      Swal.close();

      if (d.success) {
        setMsg({ type: "success", text: d.message });
        setAmount("");
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
    }
  };

/* ================= EDIT TRANSACTION (2-STEP VERIFICATION FLOW) ================= */
const editRow = async (row) => {
  if (!row || !row.id) return;

  // ----------------------------------------------------
  // STEP 1: PASSWORD VERIFICATION POPUP
  // ----------------------------------------------------
  const passInput = await askPassword("🔐 Authorization Password Required");
  if (!passInput) return; // User canceled or empty

  // Verification loading state
  Swal.fire({
    width: "250px",
    title: "Verifying...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading(),
  });

  // Verify password with backend
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

  // ----------------------------------------------------
  // STEP 2: EDIT FORM POPUP (Password Verified True!)
  // ----------------------------------------------------
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

  /* ================= PASSWORD POPUP FOR DELETE ================= */
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
      },
    });
    return value;
  };

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

  const currentBalance = rows.length ? rows[0].balance : 0;

  return (
    <div className="container-fluid py-4">
      <div className="row">
        {/* SIDEBAR: BANK PROFILES LIST */}
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-primary text-white fw-bold d-flex justify-content-between align-items-center">
              <span>🏦 Bank Profiles</span>
              <span className="badge bg-light text-primary">{profiles.length}</span>
            </div>
            <div className="list-group list-group-flush" style={{ maxHeight: "400px", overflowY: "auto" }}>
              {profiles.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`list-group-item list-group-item-action ${
                    String(selectedProfile) === String(p.id) ? "active fw-bold" : ""
                  }`}
                  onClick={() => {
                    setSelectedProfile(p.id);
                    setBankProfileId(p.id);
                  }}
                >
                  <div className="fw-bold">{p.bank_name}</div>
                  <small className={String(selectedProfile) === String(p.id) ? "text-light" : "text-muted"}>
                    {p.account_title ? `${p.account_title} - ` : ""}
                    {p.account_number}
                  </small>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className="col-md-9">
          {/* HEADER */}
          <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
            <div className="d-flex align-items-center mb-2 mb-md-0">
              <span className="fs-3 me-2">🏦</span>
              <h4 className="fw-bold mb-0 text-primary">Bank Ledger</h4>
            </div>
            <button className="btn btn-outline-secondary btn-sm" onClick={() => onNavigate && onNavigate("dashboard")}>
              ⬅ Back
            </button>
          </div>

{/* BALANCE CARD */}
<div className="card shadow-sm mb-3 border-0 bg-light">
  <div className="card-body d-flex justify-content-between align-items-center">
    <div>
      {/* selected profile details */}
      {selectedProfile && (() => {
        const activeBank = profiles.find((p) => String(p.id) === String(selectedProfile));
        return activeBank ? (
          <div className="mb-1">
            <span className="fw-bold text-primary fs-5 d-block">
              {activeBank.bank_name}
            </span>
            <small className="text-secondary fw-semibold">
              {activeBank.account_title ? `${activeBank.account_title} - ` : ""}
              {activeBank.account_number}
            </small>
          </div>
        ) : null;
      })()}
      
      {/* Label */}
      <small className="text-muted fw-bold d-block mt-1">
        {selectedProfile ? "Selected Bank Balance" : "Account Balance"}
      </small>

      {/* Balance Amount */}
      <h3 className="fw-bold text-success mb-0">
        {selectedProfile ? `PKR ${fmtAmount(currentBalance)}` : "Select a Bank Account"}
      </h3>
    </div>
    <div className="fs-1">💳</div>
  </div>
</div>

          {/* MESSAGE */}
          {msg && <div className={`alert alert-${msg.type} py-2`}>{msg.text}</div>}

          {/* FILTER + SEARCH */}
          <div className="card shadow-sm mb-3 border-0">
            <div className="card-body">
              <div className="row g-2 align-items-center">
                <div className="col-md-3">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div className="col-md-3">
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
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
          </div>

          {/* NEW ENTRY FORM */}
          <div className="card shadow-sm mb-3 border-0">
            <div className="card-body">
              <h6 className="fw-bold mb-3">➕ Deposit / Withdraw Cash</h6>
              <div className="row g-2 align-items-end">
                <div className="col-md-2">
                  <label className="form-label mb-0 small fw-bold">Date</label>
                  <input
                    type="date"
                    className="form-control form-control-sm"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                  <div className="text-primary fw-bold mt-1" style={{ fontSize: "11px" }}>
                    {formatDate(date)}
                  </div>
                </div>
                <div className="col-md-3">
                  <label className="form-label mb-0 small fw-bold">Bank Profile</label>
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
                  <label className="form-label mb-0 small fw-bold">Type</label>
                  <select className="form-select form-select-sm fw-bold" value={type} onChange={(e) => setType(e.target.value)}>
                    <option value="deposit">➕ Deposit</option>
                    <option value="withdraw">➖ Withdraw</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <label className="form-label mb-0 small fw-bold">Amount</label>
                  <input
                    className="form-control form-control-sm"
                    placeholder="Amount"
                    value={amount}
                    onChange={(e) =>
                      setAmount(e.target.value.replace(/,/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","))
                    }
                  />
                </div>
                <div className="col-md-3">
                  <button
                    className={`btn btn-sm w-100 fw-bold ${type === "deposit" ? "btn-success" : "btn-danger"}`}
                    onClick={save}
                  >
                    {type === "deposit" ? "➕ Process Deposit" : "➖ Process Withdraw"}
                  </button>
                </div>
              </div>
              <div className="row mt-2">
                <div className="col-md-12">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Optional Comment / Description..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                </div>
              </div>
              {amount && <div className="text-muted small mt-2"> 💬 {numberToWords(amount.replace(/,/g, ""))} </div>}
            </div>
          </div>

          {/* TABLE */}
          <div className="card shadow-sm border-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0 align-middle">
                <thead className="table-light">
                  <tr>
                    <th style={{ fontSize: "0.85rem" }}>Date</th>
                    <th style={{ fontSize: "0.85rem" }}>Description</th>
                    <th className="text-danger text-end" style={{ fontSize: "0.85rem" }}>Debit (-)</th>
                    <th className="text-success text-end" style={{ fontSize: "0.85rem" }}>Credit (+)</th>
                    <th className="text-end" style={{ fontSize: "0.85rem" }}>Balance</th>
                    <th className="text-center" style={{ fontSize: "0.85rem" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map((r, i) => (
                    <tr key={i}>
                      <td style={{ fontSize: "0.85rem" }}>
                        <span className="text-muted fw-bold">{formatDate(r.txn_date)}</span>
                      </td>
                      <td
                        className="fw-bold"
                        style={{
                          fontSize: "0.85rem",
                          color: r.type === "withdraw" ? "red" : getSupplierColor(r.description || r.supplier_name || ""),
                        }}
                      >
                        {r.description || "-"}
                      </td>
                      <td className="text-danger fw-bold text-end" style={{ fontSize: "0.85rem" }}>
                        {fmtAmount(r.debit)}
                      </td>
                      <td className="text-success fw-bold text-end" style={{ fontSize: "0.85rem" }}>
                        {fmtAmount(r.credit)}
                      </td>
                      <td className="fw-bold text-end" style={{ fontSize: "0.85rem" }}>
                        {fmtAmount(r.balance)}
                      </td>
                      <td className="text-center">
                        {r.source === "manual" ? (
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
                  ))}
                  {paginatedRows.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center text-muted py-4">
                        {selectedProfile
                          ? "No transaction entries found for this bank account."
                          : "👈 Please select a Bank Profile from the sidebar to view transactions."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PAGINATION CONTROLS */}
            {selectedProfile && paginatedRows.length > 0 && (
              <div className="d-flex justify-content-between align-items-center mt-2 p-2 flex-wrap gap-2">
                <select
                  className="form-select form-select-sm"
                  style={{ width: "100px" }}
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={75}>75</option>
                  <option value={100}>100</option>
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
  );
}