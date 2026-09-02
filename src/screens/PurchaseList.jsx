import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";

export default function PurchaseList({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfit, setShowProfit] = useState(false);

  // PAGINATION
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
      Swal.fire("Error", "Server connection failed", "error");
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
    const { value: password } = await Swal.fire({
      width: "380px",
      padding: "1.25em",
      customClass: { popup: "rounded-4 border-0 shadow-lg" },
      html: `
        <div style="text-align:left; font-size:13px; line-height:1.6; color: #1e293b;">
          <div style="margin-bottom:12px; font-size:16px; font-weight:700; color:#e11d48; display:flex; align-items:center; gap:8px;">
            <span>🗑️</span> Delete Purchase Record
          </div>
          <div style="background:#f8fafc; padding:12px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:12px;">
            <div><b>Ref No:</b> <span style="color:#2563eb; font-weight:600;">${refNo}</span></div>
            <div><b>Customer:</b> ${customer_name || "-"}</div>
            <div><b>Sale:</b> <span style="color:#059669; font-weight:700;">PKR ${sale_pkr}</span></div>
            <div><b>Purchase:</b> <span style="color:#dc2626; font-weight:700;">PKR ${purchase_pkr}</span></div>
          </div>
          <div style="position:relative;">
            <input id="swal-pass" type="password" class="swal2-input" 
              style="height:38px; font-size:13px; width:100%; box-sizing:border-box; padding-right:40px; margin:0; border-radius:8px;" 
              placeholder="Enter Security Password"/>
            <span id="toggle-pass" style="
              position:absolute; right:12px; top:50%; transform:translateY(-50%);
              cursor:pointer; font-size:14px; user-select:none; color:#64748b;
            ">👁</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Delete Record",
      confirmButtonColor: "#e11d48",
      focusConfirm: false,
      preConfirm: () => {
        const val = document.getElementById("swal-pass").value;
        if (!val || val.trim() === "") {
          Swal.showValidationMessage("Password required");
          return false;
        }
        return val.trim();
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

    if (!password) return;

    Swal.fire({ title: "Deleting...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase/delete/${refNo}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      Swal.close();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Deleted Successfully",
          text: `REF NO: ${refNo}`,
          timer: 1500,
          showConfirmButton: false,
        });
        loadList();
      } else {
        Swal.fire("Error", data.error || "Delete failed", "error");
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

  const fmtPKR = (v) => Number(v || 0).toLocaleString("en-PK");

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }} className="p-3 p-lg-4">
      
      {/* 🚀 BANNER HEADER */}
      <div 
        className="card border-0 shadow-sm mb-4" 
        style={{ 
          background: "linear-gradient(135deg, #0d6efd 0%, #0a58ca 100%)", 
          borderRadius: "16px",
          color: "#ffffff" 
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3" style={{ background: "rgba(255, 255, 255, 0.2)" }}>🛒</span>
              <h3 className="fw-bold mb-0">Purchase List</h3>
            </div>
            <p className="text-white-50 small mb-0 mt-1">
              Manage purchases, total sales, and track financial margins
            </p>
          </div>

          <button 
            className="btn btn-outline-light btn-sm rounded-pill px-3 py-2"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* 💳 SUMMARY STATS CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold">TOTAL SALES</div>
                <div className="h4 fw-bold text-success mb-0">PKR {fmtPKR(totals.sale)}</div>
              </div>
              <div className="bg-success-subtle p-3 rounded-circle text-success fw-bold fs-4">💰</div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold">TOTAL PURCHASES</div>
                <div className="h4 fw-bold text-secondary mb-0">PKR {fmtPKR(totals.purchase)}</div>
              </div>
              <div className="bg-secondary-subtle p-3 rounded-circle text-secondary fw-bold fs-4">🛍️</div>
            </div>
          </div>
        </div>

        {showProfit && (
          <div className="col-md-4">
            <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div className="text-muted small fw-semibold">TOTAL PROFIT</div>
                  <div className={`h4 fw-bold mb-0 ${totals.profit >= 0 ? "text-primary" : "text-danger"}`}>
                    PKR {fmtPKR(totals.profit)}
                  </div>
                </div>
                <div className="bg-primary-subtle p-3 rounded-circle text-primary fw-bold fs-4">📈</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 🎛️ SEARCH & FILTERS CARD */}
      <div className="card border-0 shadow-sm mb-4 rounded-4 p-3" style={{ background: "#ffffff" }}>
        <div className="row g-2 mb-3">
          <div className="col-lg-4 col-md-6">
            <input
              type="text"
              className="form-control border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              placeholder="🔍 Search Ref / Customer / Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-lg-3 col-md-3">
            <input
              type="date"
              className="form-control border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div className="col-lg-3 col-md-3">
            <input
              type="date"
              className="form-control border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="col-lg-2 col-md-12 d-flex align-items-center">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="showProfitSwitch"
                checked={showProfit}
                onChange={(e) => setShowProfit(e.target.checked)}
              />
              <label className="form-check-label fw-semibold text-secondary" htmlFor="showProfitSwitch" style={{ fontSize: "13px" }}>
                Show Profit
              </label>
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2 border-top">
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-light border fw-semibold rounded-pill px-3" style={{ fontSize: "12px" }} onClick={setToday}>📅 Today</button>
            <button className="btn btn-sm btn-light border fw-semibold rounded-pill px-3" style={{ fontSize: "12px" }} onClick={setWeek}>📆 This Week</button>
            <button className="btn btn-sm btn-light border fw-semibold rounded-pill px-3" style={{ fontSize: "12px" }} onClick={setMonth}>🗓️ This Month</button>
          </div>
          <button className="btn btn-sm btn-link text-danger text-decoration-none fw-semibold" style={{ fontSize: "12px" }} onClick={resetFilters}>
            ♻️ Reset Filters
          </button>
        </div>
      </div>

      {/* 📊 ELEGANT TABLE CONTAINER */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ background: "#ffffff" }}>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead className="table-light text-secondary">
              <tr>
                <th className="py-3 px-3 text-center" style={{ width: "50px" }}>SR#</th>
                <th className="py-3">Ref No</th>
                <th className="py-3">Customer Name</th>
                <th className="py-3 text-center">Code / Status</th>
                <th className="py-3">Sale Amount</th>
                <th className="py-3">Purchase Amount</th>
                {showProfit && <th className="py-3">Profit</th>}
                <th className="py-3 text-center">Date</th>
                <th className="py-3 text-center" style={{ width: "160px" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={showProfit ? 9 : 8} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Loading purchase records...
                  </td>
                </tr>
              )}

              {!loading && currentRows.map((r, i) => {
                const isRegistered = r.customer_code && r.customer_code.trim() !== "";
                return (
                  <tr key={i} className="align-middle">
                    <td className="text-center text-muted fw-bold">{i + 1 + indexOfFirst}</td>
                    <td className="fw-bold text-dark">{r.ref_no}</td>
                    
                    {/* CUSTOMER NAME COLORS: Walk-in = BLUE (#2563eb), Registered = GREEN (#16a34a) */}
                    <td className="fw-bold">
                      <span style={{ color: isRegistered ? "#16a34a" : "#2563eb" }}>
                        {r.customer_name || "-"}
                      </span>
                    </td>

                    {/* CODE / STATUS COLUMN */}
                    <td className="text-center">
                      {isRegistered ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill">
                          👤 {r.customer_code}
                        </span>
                      ) : (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill">
                          🚶 Walk-in
                        </span>
                      )}
                    </td>

                    <td className="fw-bold text-success">PKR {fmtPKR(r.sale_pkr)}</td>
                    <td className="fw-bold text-secondary">PKR {fmtPKR(r.purchase_pkr)}</td>

                    {showProfit && (
                      <td className={`fw-bold ${+r.profit >= 0 ? "text-primary" : "text-danger"}`}>
                        PKR {fmtPKR(r.profit)}
                      </td>
                    )}

                    <td className="text-center text-muted">{fmtDate(r.created_at)}</td>

                    {/* STRICT COLUMN-BASED ALIGNMENT (GRID LAYOUT) */}
                    <td className="text-center">
                      <div 
                        style={{ 
                          display: "grid", 
                          gridTemplateColumns: "65px 65px", 
                          gap: "6px", 
                          justifyContent: "center", 
                          alignItems: "center" 
                        }}
                      >
                        {/* COLUMN 1: Detail Button */}
                        <button
                          className="btn btn-sm btn-outline-primary rounded-pill px-1 py-1 fw-semibold w-100"
                          style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                          onClick={() => onNavigate("purchase_detail", r.ref_no)}
                        >
                          👁️ Detail
                        </button>

                        {/* COLUMN 2: Delete Button */}
                        <button
                          className="btn btn-sm btn-outline-danger rounded-pill px-1 py-1 fw-semibold w-100"
                          style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                          onClick={() => deletePurchase(r.ref_no, r.customer_name, r.sale_pkr, r.purchase_pkr)}
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && filteredRows.length === 0 && (
                <tr>
                  <td colSpan={showProfit ? 9 : 8} className="text-center py-5 text-muted">
                    No Purchase Records Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📑 FOOTER PAGINATION */}
      {!loading && filteredRows.length > 0 && (
        <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2 text-muted" style={{ fontSize: "13px" }}>
          <div className="d-flex align-items-center gap-2">
            <span>Displaying</span>
            <select
              className="form-select form-select-sm border-0 shadow-sm bg-white"
              style={{ width: "80px", borderRadius: "8px" }}
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
              <option value={1000000}>All</option>
            </select>
            <span>rows</span>
          </div>

          <div className="d-flex align-items-center gap-1">
            <button
              className="btn btn-sm btn-white border shadow-sm rounded-pill px-3"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(currentPage - 1)}
            >
              Prev
            </button>

            {getPageNumbers().map((num, i) =>
              num === "..." ? (
                <span key={i} className="px-2 align-self-center">...</span>
              ) : (
                <button
                  key={num}
                  className={`btn btn-sm rounded-pill px-3 ${
                    currentPage === num ? "btn-primary shadow-sm" : "btn-white border shadow-sm"
                  }`}
                  onClick={() => setCurrentPage(num)}
                >
                  {num}
                </button>
              )
            )}

            <button
              className="btn btn-sm btn-white border shadow-sm rounded-pill px-3"
              disabled={currentPage === totalPages || totalPages === 0}
              onClick={() => setCurrentPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}