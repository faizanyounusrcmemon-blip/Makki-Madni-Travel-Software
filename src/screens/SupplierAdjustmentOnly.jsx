import React, { useEffect, useState, useMemo } from "react";

/* ================= HELPERS ================= */
const fmt = (v) =>
  Number(v || 0).toLocaleString("en-US");

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }) : "-";

export default function SupplierAdjustmentOnly({ onNavigate }) {

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const URL = import.meta.env.VITE_BACKEND_URL;

  /* ================= FETCH ================= */
  const loadData = () => {
    setLoading(true);
    let url = `${URL}/api/reports/supplier-adjustment-only`;

    if (fromDate && toDate) {
      url += `?from=${fromDate}&to=${toDate}`;
    }

    fetch(url)
      .then(res => res.json())
      .then(d => setRows(d.rows || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= DATE PRESETS ================= */
  const setToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setFromDate(today);
    setToDate(today);
  };

  const setThisWeek = () => {
    const now = new Date();
    const first = now.getDate() - now.getDay();
    const start = new Date(now.setDate(first));
    const end = new Date();

    setFromDate(start.toISOString().split("T")[0]);
    setToDate(end.toISOString().split("T")[0]);
  };

  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date();

    setFromDate(start.toISOString().split("T")[0]);
    setToDate(end.toISOString().split("T")[0]);
  };

  const resetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
  };

  /* ================= SEARCH FILTER ================= */
  const view = useMemo(() => {
    if (!search) return rows;
    const s = search.toLowerCase();

    return rows.filter(r =>
      (r.supplier_name || "").toLowerCase().includes(s) ||
      (r.supplier_code || "").toLowerCase().includes(s)
    );
  }, [rows, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, fromDate, toDate]);

  /* ================= TOTAL ================= */
  const totalAdjustment = view.reduce(
    (a, r) => a + Number(r.adjustment_amount || 0),
    0
  );

  /* ================= PAGINATION ================= */
  const totalPages = Math.ceil(view.length / rowsPerPage);
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = view.slice(indexOfFirst, indexOfLast);

  const getPagination = () => {
    const delta = 2;
    const range = [];
    const result = [];

    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }

    let last;
    for (const p of range) {
      if (last) {
        if (p - last === 2) result.push(last + 1);
        else if (p - last > 2) result.push("…");
      }
      result.push(p);
      last = p;
    }
    return result;
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }} className="p-3 p-lg-4">
      
      {/* 🚀 BANNER HEADER */}
      <div 
        className="card border-0 shadow-sm mb-4" 
        style={{ 
          background: "linear-gradient(135deg, #6f42c1 0%, #0d6efd 100%)", 
          borderRadius: "16px",
          color: "#ffffff" 
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3" style={{ background: "rgba(255, 255, 255, 0.2)" }}>🏭</span>
              <h3 className="fw-bold mb-0">Supplier Adjustment Report</h3>
            </div>
            <p className="text-white-50 small mb-0 mt-1">
              Payment mode details: Supplier adjustment records only
            </p>
          </div>

          <button 
            className="btn btn-outline-light btn-sm rounded-pill px-3 py-2 fw-semibold"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* 💳 SUMMARY STATS CARDS */}
      <div className="row g-3 mb-4">
        <div className="col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold">TOTAL SUPPLIER ADJUSTMENTS</div>
                <div className="h4 fw-bold text-danger mb-0">PKR {fmt(totalAdjustment)}</div>
              </div>
              <div className="bg-danger-subtle p-3 rounded-circle text-danger fw-bold fs-4">📉</div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold">TOTAL RECORDS</div>
                <div className="h4 fw-bold text-primary mb-0">{view.length} Transactions</div>
              </div>
              <div className="bg-primary-subtle p-3 rounded-circle text-primary fw-bold fs-4">📝</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🎛️ SEARCH & FILTERS CARD */}
      <div className="card border-0 shadow-sm mb-4 rounded-4 p-3" style={{ background: "#ffffff" }}>
        <div className="row g-2 mb-3">
          <div className="col-lg-4 col-md-6">
            <input
              type="text"
              className="form-control border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              placeholder="🔍 Search Supplier / Code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-lg-3 col-md-3">
            <input
              type="date"
              className="form-control border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="col-lg-3 col-md-3">
            <input
              type="date"
              className="form-control border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div className="col-lg-2 col-md-6">
            <button
              className="btn btn-primary w-100 fw-semibold"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              onClick={loadData}
            >
              Filter
            </button>
          </div>
        </div>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2 border-top">
          <div className="d-flex gap-2">
            <button className="btn btn-sm btn-light border fw-semibold rounded-pill px-3" style={{ fontSize: "12px" }} onClick={setToday}>📅 Today</button>
            <button className="btn btn-sm btn-light border fw-semibold rounded-pill px-3" style={{ fontSize: "12px" }} onClick={setThisWeek}>📆 This Week</button>
            <button className="btn btn-sm btn-light border fw-semibold rounded-pill px-3" style={{ fontSize: "12px" }} onClick={setThisMonth}>🗓️ This Month</button>
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
                <th className="py-3 text-center">Payment Date</th>
                <th className="py-3 text-center">Supplier Code</th>
                <th className="py-3">Supplier Name</th>
                <th className="py-3 text-end px-3">Adjustment Amount</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Loading supplier adjustment records...
                  </td>
                </tr>
              )}

              {!loading && currentRows.map((r, i) => (
                <tr key={i} className="align-middle">
                  <td className="text-center text-muted fw-bold">{i + 1 + indexOfFirst}</td>
                  <td className="text-center text-muted">{fmtDate(r.payment_date)}</td>
                  
                  <td className="text-center">
                    <span className="badge bg-purple-subtle border px-2 py-1 rounded-pill" style={{ background: "#f3e8ff", color: "#6f42c1", borderColor: "#d8b4fe" }}>
                      🏭 {r.supplier_code || "-"}
                    </span>
                  </td>

                  <td className="fw-bold text-dark">{r.supplier_name || "-"}</td>

                  <td className="text-end fw-bold text-danger px-3">
                    PKR {fmt(r.adjustment_amount)}
                  </td>
                </tr>
              ))}

              {!loading && view.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    No Supplier Adjustment Records Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📑 FOOTER PAGINATION */}
      {!loading && view.length > 0 && (
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

            {getPagination().map((p, idx) => (
              <button
                key={idx}
                className={`btn btn-sm rounded-pill px-3 ${
                  p === currentPage ? "btn-primary shadow-sm" : "btn-white border shadow-sm"
                }`}
                disabled={p === "…"}
                onClick={() => typeof p === "number" && setCurrentPage(p)}
              >
                {p}
              </button>
            ))}

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