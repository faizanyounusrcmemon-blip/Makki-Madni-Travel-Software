import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

const fmtDate = (val) => {
  if (!val) return "-";

  const d = new Date(val);
  if (isNaN(d.getTime())) return "-";

  const day = String(d.getDate()).padStart(2, "0");
  const month = d.toLocaleString("en-US", { month: "short" });
  const year = d.getFullYear();

  return `${day}/${month}/${year}`;
};

export default function ExpenseLedger({ onNavigate }) {
  const today = new Date().toISOString().slice(0, 10);

  const [rows, setRows] = useState([]);
  const [bankProfiles, setBankProfiles] = useState([]);

  // ADD EXPENSE STATES
  const [date, setDate] = useState(today);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("Cash");
  const [selectedBankProfile, setSelectedBankProfile] = useState("");
  const [remarks, setRemarks] = useState("");

  // FILTER STATES
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");

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

  /* ================= PASSWORD POPUP ================= */
  const askPassword = async (title = "Enter Password") => {
    let handleEnter;

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
      confirmButtonText: "Confirm",
      focusConfirm: false,

      preConfirm: () => {
        const input = document.getElementById("swal-pass");
        const val = input ? input.value.trim() : "";
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

        if (toggle && input) {
          toggle.onclick = () => {
            show = !show;
            input.type = show ? "text" : "password";
            toggle.textContent = show ? "🙈" : "👁";
          };
          setTimeout(() => input.focus(), 100);
        }

        handleEnter = (e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const confirmBtn = document.querySelector(".swal2-confirm");
            if (confirmBtn) confirmBtn.click();
          }
        };

        document.addEventListener("keydown", handleEnter);
      },

      willClose: () => {
        if (handleEnter) {
          document.removeEventListener("keydown", handleEnter);
        }
      },
    });

    return value;
  };

  /* ================= SAVE ================= */
  const save = async () => {
    const rawAmount = amount.replace(/,/g, "");

    if (!date || !title.trim() || !rawAmount || Number(rawAmount) <= 0) {
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
            amount: rawAmount,
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
        setAmount("");
        setRemarks("");
        setSelectedBankProfile("");

        load();

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
    }
  };

  /* ================= EDIT EXPENSE (2-STEP VERIFICATION FLOW) ================= */
  const editExpense = async (row) => {
    if (!row || !row.id) return;

    // STEP 1: PASSWORD VERIFICATION POPUP
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

    // STEP 2: EDIT FORM POPUP
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
      width: "420px",
      html: `
        <div style="text-align:left; font-size:13px;">
          <label style="margin-top:8px" class="fw-bold">Date:</label>
          <input id="edit-date" type="date" class="swal2-input" style="height:35px;margin:5px 0 10px 0;width:100%" value="${rawDate}">
          
          <label class="fw-bold">Title:</label>
          <input id="edit-title" type="text" class="swal2-input" style="height:35px;margin:5px 0 10px 0;width:100%" value="${row.title || ""}">
          
          <label class="fw-bold">Amount:</label>
          <input id="edit-amount" type="number" class="swal2-input" style="height:35px;margin:5px 0 10px 0;width:100%" value="${row.amount || ""}">
          
          <label class="fw-bold">Payment Method:</label>
          <select id="edit-method" class="swal2-select" style="height:35px;margin:5px 0 10px 0;width:100%">
            <option value="Cash" ${row.payment_method === "Cash" ? "selected" : ""}>Cash</option>
            <option value="Bank" ${row.payment_method === "Bank" ? "selected" : ""}>Bank</option>
          </select>

          <div id="edit-bank-box" style="display:${row.payment_method === "Bank" ? "block" : "none"}">
            <label class="fw-bold">Select Bank:</label>
            <select id="edit-bank-id" class="swal2-select" style="height:35px;margin:5px 0 10px 0;width:100%">
              <option value="">-- Choose Bank --</option>
              ${bankOptions}
            </select>
          </div>

          <label class="fw-bold">Remarks:</label>
          <input id="edit-remarks" type="text" class="swal2-input" style="height:35px;margin:5px 0 10px 0;width:100%" value="${row.remarks || ""}">
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Update Expense",
      focusConfirm: false,

      didOpen: () => {
        const methodEl = document.getElementById("edit-method");
        const bankBox = document.getElementById("edit-bank-box");

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
      width: "260px",
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
        load();

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
        load();

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
              <label className="text-muted small mb-1">Date</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="text-muted small mb-1">Title</label>
              <input
                className="form-control form-control-sm"
                placeholder="Expense Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <label className="text-muted small mb-1">Amount</label>
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
              <label className="text-muted small mb-1">Method</label>
              <select
                className="form-control form-control-sm"
                value={method}
                onChange={(e) => setMethod(e.target.value)}
              >
                <option value="Cash">Cash</option>
                <option value="Bank">Bank</option>
              </select>
            </div>

            {/* DYNAMIC BANK PROFILE DROPDOWN */}
            {method === "Bank" && (
              <div className="col-md-2">
                <label className="text-muted small mb-1">
                  Select Bank Account
                </label>
                <select
                  className="form-control form-control-sm text-primary fw-bold"
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

            <div className={method === "Bank" ? "col-md-1" : "col-md-3"}>
              <label className="text-muted small mb-1">Remarks</label>
              <input
                className="form-control form-control-sm"
                placeholder="Remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
              />
            </div>

            <div className="col-md-1 d-flex align-items-end">
              <button
                className="btn btn-success btn-sm w-100 fw-bold"
                onClick={save}
              >
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
              <th>Action</th>
            </tr>
          </thead>
          <tbody className="small fw-bold">
            {filteredRows.map((r) => (
              <tr key={r.id}>
                <td className="text-center">{fmtDate(r.expense_date)}</td>
                <td>{r.title}</td>
                <td className="text-end text-success">
                  {Number(r.amount).toLocaleString()}
                </td>
                <td className="text-center">
                  {r.payment_method === "Bank" && r.bank_name ? (
                    <span className="badge bg-info text-dark">
                      🏦 {r.bank_name}
                    </span>
                  ) : (
                    <span className="badge bg-secondary">💵 Cash</span>
                  )}
                </td>
                <td>{r.remarks || "-"}</td>
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