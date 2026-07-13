import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";

export default function PurchaseList({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfit, setShowProfit] = useState(false);

  // ✅ PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    loadList();
  }, []);

  useEffect(() => {
    const t = setTimeout(loadList, 400);
    return () => clearTimeout(t);
  }, [from, to]);

  /* ================= LOAD ================= */
  const loadList = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (from) qs.append("from", from);
    if (to) qs.append("to", to);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/list?${qs}`
      );
      const data = await res.json();
      if (data.success) setRows(data.rows || []);
    } catch {
      alert("Server error");
    }
    setLoading(false);
  };

  /* ================= DATE BUTTONS ================= */
  const setToday = () => {
    const t = new Date().toISOString().slice(0, 10);
    setFrom(t);
    setTo(t);
  };

  const setWeek = () => {
    const now = new Date();
    const first = new Date(now.setDate(now.getDate() - now.getDay()));
    const last = new Date(now.setDate(first.getDate() + 6));

    setFrom(first.toISOString().slice(0, 10));
    setTo(last.toISOString().slice(0, 10));
  };

  const setMonth = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setFrom(first.toISOString().slice(0, 10));
    setTo(last.toISOString().slice(0, 10));
  };

  const resetFilters = () => {
    setFrom("");
    setTo("");
    setSearch("");
  };

/* ================= DELETE ================= */
const deletePurchase = async (refNo, customer_name, sale_pkr, purchase_pkr) => {
  const password = await (async () => {
    const { value } = await Swal.fire({
      width: "360px",
      padding: "1em",
      html: `
        <div style="text-align:left;font-size:14px;line-height:1.5">
          <b style="color:#dc3545">DELETE PURCHASE RECORD</b><br>
          <b style="color:#dc3545">REF NO:</b> ${refNo}<br>
          <b>Customer:</b> ${customer_name}<br>
          <b>Sale Amount:</b> ${sale_pkr}<br>
          <b>Purchase Amount:</b> ${purchase_pkr}<br><br>
          <div style="position:relative">
            <input type="password" id="swal-pass" class="swal2-input" placeholder="Enter Security Password">
            <span id="toggle-pass" style="
              position:absolute;
              right:12px;
              top:50%;
              transform:translateY(-50%);
              cursor:pointer;
              font-size:14px;">👁</span>
          </div>
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: { confirmButton: "swal-btn-delete", cancelButton: "swal-btn-cancel" },
      allowOutsideClick: true,
      allowEscapeKey: true,

      didOpen: () => {
        const input = document.getElementById("swal-pass");
        const toggle = document.getElementById("toggle-pass");
        let show = false;
        toggle.addEventListener("click", () => {
          show = !show;
          input.type = show ? "text" : "password";
          toggle.textContent = show ? "🙈" : "👁";
        });
      },

      preConfirm: () => {
        const val = document.getElementById("swal-pass").value.trim();
        if (!val) {
          Swal.showValidationMessage("Password required");
          return false;
        }
        return val;
      }
    });
    return value;
  })();

  if (!password) return; 

  // Confirm Delete Dialog Box
  const confirmDelete = await Swal.fire({
    width: "320px",
    title: "Are you sure?",
    html: `This will move REF NO: <b>${refNo}</b> of <b>${customer_name}</b> to deleted list.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Yes, Delete it!",
    cancelButtonText: "Cancel",
    buttonsStyling: false,
    customClass: { confirmButton: "swal-btn-delete", cancelButton: "swal-btn-cancel" }
  });

  if (!confirmDelete.isConfirmed) return;

  Swal.fire({ title: "Deleting...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase/delete/${refNo}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }), // Server ko direct payload password bhejega
    });

    const data = await res.json();
    Swal.close();

    if (data.success) {
      Swal.fire("Deleted!", `REF NO: ${refNo} has been deleted.`, "success");
      loadList(); // Reload table row configurations
    } else {
      // 🔄 SHAKE EFFECT ON WRONG PASSWORD
      Swal.fire({
        title: "Error",
        text: data.error || "Delete failed",
        icon: "error",
        didOpen: () => {
          const popup = document.querySelector(".swal2-popup");
          if (popup) {
            popup.classList.add("shake");
            setTimeout(() => popup.classList.remove("shake"), 500);
          }
        }
      });
    }
  } catch {
    Swal.close();
    Swal.fire("Error", "Server error", "error");
  }
};

  /* ================= FILTER ================= */
  const filteredRows = useMemo(() => {
    if (!search) return rows;
    return rows.filter((r) =>
      Object.values(r).join(" ").toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  /* ================= PAGINATION ================= */
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, from, to]);

  // ✅ SMART PAGINATION
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);

      let start = Math.max(2, currentPage - Math.floor(maxVisible / 2));
      let end = Math.min(totalPages - 1, currentPage + Math.floor(maxVisible / 2));

      if (currentPage <= 3) {
        start = 2;
        end = 6;
      }

      if (currentPage >= totalPages - 2) {
        start = totalPages - 5;
        end = totalPages - 1;
      }

      if (start > 2) pages.push("...");

      for (let i = start; i <= end; i++) pages.push(i);

      if (end < totalPages - 1) pages.push("...");

      pages.push(totalPages);
    }

    return pages;
  };

  /* ================= TOTALS ================= */
  const totals = useMemo(() => {
    return filteredRows.reduce(
      (a, r) => {
        a.sale += +r.sale_pkr || 0;
        a.purchase += +r.purchase_pkr || 0;
        a.profit += +r.profit || 0;
        return a;
      },
      { sale: 0, purchase: 0, profit: 0 }
    );
  }, [filteredRows]);

  /* ================= FORMAT ================= */
  const fmtDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fmtPKR = (v) => {
    if (!v) return "0";
    return Number(v).toLocaleString("en-PK");
  };

  return (
    <div className="container py-3">

      {/* HEADER */}
      <div className="p-3 rounded text-white mb-3"
        style={{ background: "linear-gradient(90deg,#0d6efd,#6610f2)" }}>
        <div className="d-flex justify-content-between align-items-center">
          <button className="btn btn-light btn-sm"
            onClick={() => onNavigate("dashboard")}>
            ⬅ Back
          </button>
          <h4 className="fw-bold mb-0">🛒 Purchase List</h4>
        </div>
      </div>

      {/* FILTER */}
      <div className="card shadow-sm mb-2">
        <div className="card-body py-2">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <input type="date" className="form-control form-control-sm"
                value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control form-control-sm"
                value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div className="col-md-4">
              <input className="form-control form-control-sm"
                placeholder="🔍 Search anything..."
                value={search}
                onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="col-md-2">
              <div className="form-check mt-1">
                <input className="form-check-input"
                  type="checkbox"
                  checked={showProfit}
                  onChange={(e) => setShowProfit(e.target.checked)} />
                <label className="form-check-label fw-semibold">
                  Show Profit
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* DATE BUTTONS */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button className="btn btn-outline-primary btn-sm" onClick={setToday}>📅 Today</button>
        <button className="btn btn-outline-success btn-sm" onClick={setWeek}>📆 This Week</button>
        <button className="btn btn-outline-warning btn-sm" onClick={setMonth}>🗓 This Month</button>
        <button className="btn btn-outline-danger btn-sm" onClick={resetFilters}>♻ Reset</button>
      </div>

      {/* TABLE */}
      <div className="table-responsive shadow rounded">
        <table className="table table-sm align-middle mb-0">
          <thead className="text-white" style={{ background: "#212529" }}>
            <tr>
              <th>SR#</th>
              <th>Ref</th>
              <th>Customer</th>
              <th>Sale</th>
              <th>Purchase</th>
              {showProfit && <th>Profit</th>}
              <th>Date</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={showProfit ? 8 : 7} className="text-center py-3">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && currentRows.length === 0 && (
              <tr>
                <td colSpan={showProfit ? 8 : 7} className="text-center text-muted py-3">
                  No records found
                </td>
              </tr>
            )}

            {!loading &&
              currentRows.map((r, i) => (
                <tr key={i}>
                  <td className="fw-bold text-muted" style={{ fontSize: "12px" }}>
                    {i + 1 + indexOfFirst}
                  </td>
                  <td className="fw-bold text-nowrap small-cell">{r.ref_no}</td>
                  <td className="fw-semibold text-primary text-nowrap small-cell">{r.customer_name || "-"}</td>
                  <td><span className="badge bg-success">💰 {fmtPKR(r.sale_pkr)}</span></td>
                  <td><span className="badge bg-secondary">🛒 {fmtPKR(r.purchase_pkr)}</span></td>

                  {showProfit && (
                    <td>
                      <span className={`badge ${+r.profit >= 0 ? "bg-primary" : "bg-danger"}`}>
                        {fmtPKR(r.profit)}
                      </span>
                    </td>
                  )}

                  <td className="small text-muted">{fmtDate(r.created_at)}</td>

                  <td className="text-center">
                    <button className="btn btn-sm btn-outline-info me-1"
                      onClick={() => onNavigate("purchase_detail", r.ref_no)}>
                      👁️ Detail
                    </button>
                    <button className="btn btn-sm btn-outline-danger"
                      onClick={() => deletePurchase(r.ref_no, r.customer_name, r.sale_pkr, r.purchase_pkr)}>
                      🗑 Delete
                    </button>
                  </td>
                </tr>
              ))}

            {!loading && filteredRows.length > 0 && (
              <tr className="table-dark fw-bold">
                <td colSpan={3} className="text-end">TOTAL</td>
                <td>{fmtPKR(totals.sale)}</td>
                <td>{fmtPKR(totals.purchase)}</td>
                {showProfit && (
                  <td className={totals.profit >= 0 ? "text-primary" : "text-danger"}>
                    {fmtPKR(totals.profit)}
                  </td>
                )}
                <td colSpan={2}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {!loading && filteredRows.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">

          <select
            className="form-select form-select-sm"
            style={{ width: "100px" }}
            value={rowsPerPage}
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={75}>75</option>
            <option value={100}>100</option>
            <option value={(1000000)}>Full View</option>
          </select>

          <div className="d-flex flex-wrap gap-1">

            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => p - 1)}
            >
              ⬅ Prev
            </button>

            {getPageNumbers().map((num, i) =>
              num === "..." ? (
                <span key={i} className="px-2 align-self-center">...</span>
              ) : (
                <button
                  key={num}
                  className={`btn btn-sm ${
                    currentPage === num ? "btn-primary" : "btn-outline-primary"
                  }`}
                  onClick={() => setCurrentPage(num)}
                >
                  {num}
                </button>
              )
            )}

            <button
              className="btn btn-sm btn-outline-secondary"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => p + 1)}
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
                if (val >= 1 && val <= totalPages) {
                  setCurrentPage(val);
                }
              }
            }}
          />

        </div>
      )}
    </div>
  );
}