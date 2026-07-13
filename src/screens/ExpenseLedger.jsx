import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const fmtDate = (val) => {
  if (!val) return "-";

  const d = new Date(val);
  if (isNaN(d.getTime())) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();

  return `${day}/${month}/${year}`; // 👉 01/Feb/2026
};

export default function ExpenseLedger({ onNavigate }) {
  const today = new Date().toISOString().slice(0, 10);

  const [rows, setRows] = useState([]);

  // ADD EXPENSE STATES
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [remarks, setRemarks] = useState("");

  // FILTER STATES
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

  /* ================= LOAD ================= */
  const load = async () => {
    const r = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/expense-ledger`
    );
    const d = await r.json();
    if (d.success) setRows(d.rows || []);
  };

  useEffect(() => {
    load();
  }, []);

/* ================= PASSWORD POPUP (DYNAMIC) ================= */
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
            style="height:34px;font-size:13px;width:100%;margin:0;padding-right:40px"
            placeholder="Enter password"
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
    confirmButtonText: "Delete",
    focusConfirm: false,

    preConfirm: () => {
      const input = document.getElementById("swal-pass");
      const val = input.value.trim();

      // Khaali input check karega
      if (!val) {
        Swal.showValidationMessage("Password required");
        return false;
      }

      // ❌ LOCAL HARDCODED "786" CHECK REMOVED
      // Ab value direct return hogi aur match/mismatch backend handle karega
      return val;
    },

    didOpen: () => {
      const input = document.getElementById("swal-pass");
      const toggle = document.getElementById("toggle-pass");

      let show = false;

      // 👁 SHOW / HIDE TOGGLE
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
          const confirmBtn = document.querySelector(".swal2-confirm");
          if (confirmBtn) confirmBtn.click();
        }
      };

      document.addEventListener("keydown", handleEnter);

      // Cleanup listener when popup closes
      Swal.getPopup().addEventListener("remove", () => {
        document.removeEventListener("keydown", handleEnter);
      });
    }
  });

  return value;
};


/* ================= SAVE ================= */
const save = async () => {

  if (!date || !title || !amount) {
    return Swal.fire({
      width: "300px",
      icon: "warning",
      text: "Missing fields"
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
      `${import.meta.env.VITE_BACKEND_URL}/api/expense-ledger/add`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expense_date: date,
          title,
          amount: amount.replace(/,/g, ""),
          payment_method: method,
          remarks,
        }),
      }
    );

    const d = await r.json();

    Swal.close();

    if (d.success) {

      setTitle("");
      setAmount("");
      setRemarks("");

      load();

      Swal.fire({
        width: "280px",
        icon: "success",
        text: "Expense Saved Successfully"
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


/* ======================== DELETE ======================== */
const del = async (id) => {

  const confirmDelete = await Swal.fire({
    width: "300px",
    icon: "warning",
    text: "Delete this expense?",
    showCancelButton: true,
    confirmButtonText: "Delete"
  });

  if (!confirmDelete.isConfirmed) return;

  // ✅ PASSWORD POPUP (Ab yeh direct user input bina hardcoding ke return karega)
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
      load();

      Swal.fire({
        width: "280px",
        icon: "success",
        text: "Expense Deleted Successfully"
      });

    } else {
      // Wrong password ka catch backend se direct yahan handler me display hoga
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

  /* ================= FILTER ================= */
  const filteredRows = rows.filter((r) => {
    const d = r.expense_date?.slice(0, 10);
    if (fromDate && d < fromDate) return false;
    if (toDate && d > toDate) return false;
    if (search && !r.title?.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const totalAmount = filteredRows.reduce(
    (sum, r) => sum + Number(r.amount || 0),
    0
  );

  const isFiltered = fromDate || toDate || search;

  return (
    <div className="container p-3">

      {/* HEADER */}
      <div
        className="p-3 mb-3 rounded text-white"
        style={{
          background: "linear-gradient(135deg,#6f42c1,#d63384)",
          boxShadow: "0 6px 18px rgba(0,0,0,.25)",
        }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="fw-bold m-0">💸 Expense Ledger</h4>
          <button
            className="btn btn-light btn-sm fw-bold"
            onClick={() => onNavigate("dashboard")}
          >
            ⬅ Back
          </button>
        </div>
      </div>

      {/* ADD EXPENSE */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h6 className="fw-bold text-primary mb-2">➕ Add Expense</h6>
          <div className="row g-2 small fw-bold">
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm"
                value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <input className="form-control form-control-sm"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="col-md-2">
              <input className="form-control form-control-sm"
                placeholder="Amount"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                      .replace(/,/g, "")
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  )
                } />
            </div>
            <div className="col-md-2">
              <select className="form-control form-control-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}>
                <option>Cash</option>
                <option>Bank</option>
              </select>
            </div>
            <div className="col-md-2">
              <input className="form-control form-control-sm"
                placeholder="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)} />
            </div>
            <div className="col-md-1">
              <button className="btn btn-success btn-sm w-100" onClick={save}>
                Save
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <h6 className="fw-bold text-info mb-2">🔍 Filters</h6>
          <div className="row g-2 small fw-bold">
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm"
                value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm"
                value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="col-md-4">
              <input className="form-control form-control-sm"
                placeholder="Search title"
                value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-responsive shadow-sm rounded">
        <table className="table table-sm table-bordered mb-0 align-middle">
          <thead style={{ background: "#212529", color: "#ffc107" }}>
            <tr className="small text-center">
              <th>Date</th>
              <th>Title</th>
              <th>Amount</th>
              <th>Method</th>
              <th>Remarks</th>
              <th></th>
            </tr>
          </thead>
          <tbody className="small fw-bold">
            {filteredRows.map((r) => (
              <tr key={r.id}>
                <td>{fmtDate(r.expense_date)}</td>
                <td>{r.title}</td>
                <td className="text-end text-success">
                  {Number(r.amount).toLocaleString()}
                </td>
                <td>{r.payment_method}</td>
                <td>{r.remarks}</td>
                <td className="text-center">
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => del(r.id)}
                  >
                    ❌
                  </button>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center text-muted py-3">
                  No expenses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* TOTAL */}
      <div className="d-flex justify-content-end mt-3">
        <div
          className="fw-bold"
          style={{
            background: "linear-gradient(135deg,#198754,#20c997)",
            color: "#fff",
            padding: "12px 22px",
            borderRadius: "30px",
            fontSize: "18px",
            boxShadow: "0 4px 12px rgba(0,0,0,.25)",
          }}
        >
          {isFiltered ? "Filtered Total" : "Total Expense"}:{" "}
          {totalAmount.toLocaleString()}
        </div>
      </div>
    </div>
  );
}
