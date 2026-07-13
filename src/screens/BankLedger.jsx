import React, { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";


/* ================= COLOR PALETTE ================= */
const colorPalette = ["#FF6B6B", "#4ECDC4", "#FFD93D", "#6A4C93", "#FF8C42", "#00A6ED", "#FF5D8F"];

/* ================= HELPERS ================= */
const fmtAmount = (v) => (v !== null && v !== undefined ? Number(v).toLocaleString("en-US") : "-");

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

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
};

/* ================= MAIN COMPONENT ================= */
export default function BankLedger({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [msg, setMsg] = useState(null);

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("deposit");
  const [comment, setComment] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  /* ================= COLOR MAP REF ================= */
  const supplierColorMap = useRef({});

  /* ================= NAME EXTRACTION ================= */
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

  /* ================= LOAD DATA ================= */
  useEffect(() => { load(); }, []);
  const load = async () => {
    const r = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger`);
    const d = await r.json();
    if (d.success) {
      const list = d.rows.slice().reverse();
      setRows(list);
      setFiltered(list);
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

  /* ================= SAVE ================= */
const save = async () => {

  if (!date || !amount) {
    return Swal.fire({
      width: "300px",
      icon: "warning",
      text: "Date & Amount required"
    });
  }

  Swal.fire({
    width: "260px",
    title: "Saving...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {

    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger/transaction`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          txn_date: date,
          type,
          amount: amount.replace(/,/g, ""),
          comment
        }),
      }
    );

    const d = await r.json();

    Swal.close();

    if (d.success) {

      setMsg({
        type: "success",
        text: d.message
      });

      setAmount("");
      setComment("");

      load();

      Swal.fire({
        width: "280px",
        icon: "success",
        text: d.message || "Transaction Saved Successfully"
      });

    } else {

      Swal.fire({
        width: "300px",
        icon: "error",
        text: d.error || "Save failed"
      });
    }

  } catch (err) {

    Swal.close();

    Swal.fire({
      width: "300px",
      icon: "error",
      text: "Network Error"
    });
  }
};

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
    confirmButtonText: "OK",
    focusConfirm: false,

    preConfirm: () => {
      const input = document.getElementById("swal-pass");
      const val = input.value.trim();

      if (!val) {
        Swal.showValidationMessage("Password required");
        return false;
      }

      // ❌ LOCAL HARDCODED "786" CHECK REMOVED
      // Ab value direct return hogi aur match ya mismatch backend handle karega
      return val;
    },

    didOpen: () => {
      const input = document.getElementById("swal-pass");
      const toggle = document.getElementById("toggle-pass");

      let show = false;

      // 👁 SHOW / HIDE
      toggle.onclick = () => {
        show = !show;
        input.type = show ? "text" : "password";
        toggle.textContent = show ? "🙈" : "👁";
      };

      // 🔥 AUTO FOCUS
      setTimeout(() => input.focus(), 100);

      // 🔥 ENTER KEY SUPPORT
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

const del = async (id) => {
  const confirmDelete = await Swal.fire({
    width: "300px",
    icon: "warning",
    text: "Delete this transaction?",
    showCancelButton: true,
    confirmButtonText: "Delete"
  });

  if (!confirmDelete.isConfirmed) return;

  const pass = await askPassword("Enter Delete Password");
  if (!pass) return;

  Swal.fire({
    width: "260px",
    title: "Deleting...",
    allowOutsideClick: false,
    didOpen: () => Swal.showLoading()
  });

  try {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/bank-ledger/transaction/${id}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pass }),
      }
    );

    const d = await r.json();
    Swal.close();

    if (d.success) {
      setMsg({
        type: "success",
        text: d.message
      });

      load();

      Swal.fire({
        width: "280px",
        icon: "success",
        text: d.message || "Transaction Deleted Successfully"
      });
    } else {
      // Galat password daalne par backend ka response yahan trigger hoga
      Swal.fire({
        width: "300px",
        icon: "error",
        text: d.error || "Delete failed"
      });
    }
  } catch (err) {
    Swal.close();
    Swal.fire({
      width: "300px",
      icon: "error",
      text: "Network Error"
    });
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

  /* ================= CURRENT BALANCE ================= */
  const currentBalance = rows.length ? rows[0].balance : 0;

  /* ================= RENDER ================= */
  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap">
        <div className="d-flex align-items-center mb-2 mb-md-0">
          <span className="fs-3 me-2">🏦</span>
          <h4 className="fw-bold mb-0 text-primary">Bank Ledger</h4>
        </div>
        <button className="btn btn-outline-secondary btn-sm" onClick={() => onNavigate("dashboard")}>
          ⬅ Back
        </button>
      </div>

      {/* BALANCE CARD */}
      <div className="card shadow-sm mb-3 border-0">
        <div className="card-body d-flex justify-content-between align-items-center">
          <div>
            <small className="text-muted">Current Balance</small>
            <h3 className="fw-bold text-success mb-0"> PKR {fmtAmount(currentBalance)} </h3>
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
              <input type="date" className="form-control form-control-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control form-control-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="col-md-6">
              <input type="text" className="form-control form-control-sm" placeholder="🔍 Search any field..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* ENTRY */}
      <div className="card shadow-sm mb-3 border-0">
        <div className="card-body">
          <h6 className="fw-bold mb-3">➕ New Transaction</h6>
          <div className="row g-2 align-items-end">
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="col-md-2">
              <input className="form-control form-control-sm" placeholder="Amount" value={amount} onChange={(e) =>
                setAmount(e.target.value.replace(/,/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ","))
              } />
            </div>
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="deposit">➕ Deposit</option>
                <option value="withdraw">➖ Withdraw</option>
              </select>
            </div>
            <div className="col-md-4">
              <input className="form-control form-control-sm" placeholder="Comment" value={comment} onChange={(e) => setComment(e.target.value)} />
            </div>
            <div className="col-md-2">
              <button className="btn btn-success btn-sm w-100" onClick={save}> Save </button>
            </div>
          </div>
          {amount && <div className="text-muted small mt-2"> 💬 {numberToWords(amount.replace(/,/g, ""))} </div>}
        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow-sm border-0">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="table-light">
              <tr>
                <th style={{ fontSize: "0.85rem" }}>Date</th>
                <th style={{ fontSize: "0.85rem" }}>Description</th>
                <th className="text-danger" style={{ fontSize: "0.85rem" }}>Debit</th>
                <th className="text-success" style={{ fontSize: "0.85rem" }}>Credit</th>
                <th style={{ fontSize: "0.85rem" }}>Balance</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((r, i) => (
                <tr key={i}>
                  <td style={{ fontSize: "0.85rem" }}><span className="text-muted fw-bold">{formatDate(r.txn_date)}</span></td>
                  <td
                    className="fw-bold"
                    style={{
                      fontSize: "0.85rem",
                      color: r.type === "withdraw" ? "red" : getSupplierColor(r.description || r.supplier_name || "")
                    }}
                  >
                    {r.description || "-"}
                  </td>
                  <td className="text-danger fw-bold" style={{ fontSize: "0.85rem" }}>{fmtAmount(r.debit)}</td>
                  <td className="text-success fw-bold" style={{ fontSize: "0.85rem" }}>{fmtAmount(r.credit)}</td>
                  <td className="fw-bold" style={{ fontSize: "0.85rem" }}>{fmtAmount(r.balance)}</td>
                  <td>
                    {r.source === "manual" && <button className="btn btn-outline-danger btn-sm" onClick={() => del(r.id)}> ❌ </button>}
                  </td>
                </tr>
              ))}
              {paginatedRows.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-muted py-3">No entries</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

{/* PAGINATION CONTROLS */}
<div className="d-flex justify-content-between align-items-center mt-2 flex-wrap gap-2">

  {/* Rows per page */}
  <select
    className="form-select form-select-sm"
    style={{ width: "100px" }}
    value={pageSize}
    onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
  >
    <option value={25}>25</option>
    <option value={50}>50</option>
    <option value={75}>75</option>
    <option value={100}>100</option>
    <option value={1000000}>Full View</option>
  </select>

  {/* Prev / Next + Page numbers */}
  <div className="d-flex gap-1 align-items-center flex-wrap">
    <button className="btn btn-sm btn-outline-primary" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>⬅ Prev</button>
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
    <button className="btn btn-sm btn-outline-primary" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(currentPage + 1)}>Next ➡</button>
  </div>

  {/* Jump */}
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

      </div>
    </div>
  );
}