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
  const askPassword = async (titleText = "Enter Password") => {
    const { value } = await Swal.fire({
      width: "300px",
      html: `
        <div style="text-align:left;font-size:13px">
          <b>${titleText}</b>

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

  /* ================= EDIT EXPENSE (STEP 1: PASSWORD -> STEP 2: EDIT FORM) ================= */
  const editExpense = async (item) => {
    // STEP 1: Password Popup
    const pass = await askPassword("🔒 Enter Edit Password");
    if (!pass) return;

    // Verify Password with Backend
    Swal.fire({
      width: "250px",
      title: "Verifying...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    try {
      const verifyRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/expense-ledger/verify-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: pass }),
        }
      );

      const verifyData = await verifyRes.json();
      Swal.close();

      if (!verifyData.success) {
        return Swal.fire({
          width: "300px",
          icon: "error",
          text: verifyData.error || "Wrong Password!"
        });
      }
    } catch (err) {
      Swal.close();
      return Swal.fire({
        width: "300px",
        icon: "error",
        text: "Network verification error"
      });
    }

    // STEP 2: Edit Form Popup
    const formattedDate = item.expense_date
      ? new Date(item.expense_date).toISOString().split("T")[0]
      : today;

    const { value: formValues } = await Swal.fire({
      width: "360px",
      title: "✏️ Edit Expense",
      html: `
        <div style="text-align:left; font-size:12px;" class="d-flex flex-column gap-2">
          <div>
            <label class="fw-bold mb-1">Expense Date</label>
            <input id="swal-edit-date" type="date" class="form-control form-control-sm" value="${formattedDate}" />
          </div>
          <div>
            <label class="fw-bold mb-1">Title</label>
            <input id="swal-edit-title" type="text" class="form-control form-control-sm" value="${item.title || ""}" placeholder="Title" />
          </div>
          <div>
            <label class="fw-bold mb-1">Amount (PKR)</label>
            <input id="swal-edit-amount" type="number" class="form-control form-control-sm" value="${item.amount || 0}" />
          </div>
          <div>
            <label class="fw-bold mb-1">Payment Method</label>
            <select id="swal-edit-method" class="form-select form-select-sm">
              <option value="Cash" ${item.payment_method === "Cash" ? "selected" : ""}>Cash</option>
              <option value="Bank" ${item.payment_method === "Bank" ? "selected" : ""}>Bank</option>
            </select>
          </div>
          <div>
            <label class="fw-bold mb-1">Remarks</label>
            <input id="swal-edit-remarks" type="text" class="form-control form-control-sm" value="${item.remarks || ""}" placeholder="Remarks" />
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Update",
      focusConfirm: false,
      preConfirm: () => {
        const expense_date = document.getElementById("swal-edit-date").value;
        const editTitle = document.getElementById("swal-edit-title").value.trim();
        const editAmount = document.getElementById("swal-edit-amount").value;
        const payment_method = document.getElementById("swal-edit-method").value;
        const editRemarks = document.getElementById("swal-edit-remarks").value.trim();

        if (!expense_date) {
          Swal.showValidationMessage("Date required");
          return false;
        }
        if (!editTitle) {
          Swal.showValidationMessage("Title required");
          return false;
        }
        if (!editAmount || Number(editAmount) <= 0) {
          Swal.showValidationMessage("Valid amount required");
          return false;
        }

        return {
          expense_date,
          title: editTitle,
          amount: Number(editAmount),
          payment_method,
          remarks: editRemarks,
          password: pass // Step 1 verified password pass kar rahe hain
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
        `${import.meta.env.VITE_BACKEND_URL}/api/expense-ledger/edit/${item.id}`,
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

      load();
      Swal.fire({ icon: "success", text: "Expense updated successfully" });
    } catch (err) {
      Swal.close();
      Swal.fire({ icon: "error", text: "Network Error" });
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
              <input
                type="date"
                className="form-control form-control-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <input
                className="form-control form-control-sm"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <input
                className="form-control form-control-sm"
                placeholder="Amount"
                value={amount}
                onChange={(e) =>
                  setAmount(
                    e.target.value
                      .replace(/,/g, "")
                      .replace(/\B(?=(\d{3})+(?!\d))/g, ",")
                  )
                }
              />
            </div>
            <div className="col-md-2">
              <select
                className="form-control form-control-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option>Cash</option>
                <option>Bank</option>
              </select>
            </div>
            <div className="col-md-2">
              <input
                className="form-control form-control-sm"
                placeholder="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
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
              <input
                type="date"
                className="form-control form-control-sm"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <input
                type="date"
                className="form-control form-control-sm"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
            <div className="col-md-4">
              <input
                className="form-control form-control-sm"
                placeholder="Search title"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
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
              <th style={{ width: "90px" }}>Actions</th>
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