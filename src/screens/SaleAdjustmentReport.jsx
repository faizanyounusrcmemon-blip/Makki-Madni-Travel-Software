import React, { useEffect, useState, useMemo } from "react";

/* ================= HELPERS ================= */
const fmt = (v) =>
  v !== null && v !== undefined
    ? Number(v).toLocaleString("en-US")
    : "0";

const fmtDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function SaleAdjustmentReport({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [view, setView] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [custTypeFilter, setCustTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const URL = import.meta.env.VITE_BACKEND_URL;

  /* ================= LOAD ================= */
  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${URL}/api/reports/sale-adjustments`);
      const data = await res.json();
      const rowsData = data.rows || [];
      setRows(rowsData);
      setView(rowsData);
    } catch (err) {
      console.error("Load Error:", err);
      setRows([]);
      setView([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  /* ================= QUICK DATE FILTERS ================= */
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
    setCustTypeFilter("");
  };

  /* ================= HELPER FOR REG / WALKIN ================= */
  const checkIsRegistered = (r) => {
    const code = r.customer_code || r.ref_no || "";
    return code.startsWith("CUST-") || Boolean(r.customer_code && r.customer_code.trim() !== "");
  };

  /* ================= FILTER ================= */
  useEffect(() => {
    let temp = [...rows];

    if (search) {
      const s = search.toLowerCase();
      temp = temp.filter(
        (r) =>
          (r.customer_name || "").toLowerCase().includes(s) ||
          (r.ref_no || "").toLowerCase().includes(s) ||
          (r.customer_code || "").toLowerCase().includes(s)
      );
    }

    if (custTypeFilter) {
      temp = temp.filter((r) => {
        const isRegistered = checkIsRegistered(r);
        if (custTypeFilter === "Registered") return isRegistered;
        if (custTypeFilter === "Walk-in") return !isRegistered;
        return true;
      });
    }

    if (fromDate) {
      temp = temp.filter((r) => new Date(r.date) >= new Date(fromDate));
    }

    if (toDate) {
      temp = temp.filter((r) => new Date(r.date) <= new Date(toDate));
    }

    setView(temp);
    setCurrentPage(1);
  }, [search, fromDate, toDate, custTypeFilter, rows]);

  /* ================= TOTALS ================= */
  const totals = useMemo(() => {
    return view.reduce(
      (acc, r) => {
        const amount = Number(r.amount || 0);
        const adj = Number(r.adjustment_amount || 0);
        acc.amount += amount;
        acc.adjustment += adj;
        acc.net += amount - adj;
        return acc;
      },
      { amount: 0, adjustment: 0, net: 0 }
    );
  }, [view]);

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
          background: "linear-gradient(135deg, #0d6efd 0%, #20c997 100%)", 
          borderRadius: "16px",
          color: "#ffffff" 
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3" style={{ background: "rgba(255, 255, 255, 0.2)" }}>📉</span>
              <h3 className="fw-bold mb-0">Sale Adjustment Report</h3>
            </div>
            <p className="text-white-50 small mb-0 mt-1">
              Sale adjustments, discounted amounts, and net revenue summary
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
        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold">TOTAL SALE</div>
                <div className="h4 fw-bold text-primary mb-0">PKR {fmt(totals.amount)}</div>
              </div>
              <div className="bg-primary-subtle p-3 rounded-circle text-primary fw-bold fs-4">💳</div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold">TOTAL ADJUSTMENTS</div>
                <div className="h4 fw-bold text-danger mb-0">-PKR {fmt(totals.adjustment)}</div>
              </div>
              <div className="bg-danger-subtle p-3 rounded-circle text-danger fw-bold fs-4">✂️</div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold">NET REVENUE</div>
                <div className="h4 fw-bold text-success mb-0">PKR {fmt(totals.net)}</div>
              </div>
              <div className="bg-success-subtle p-3 rounded-circle text-success fw-bold fs-4">💰</div>
            </div>
          </div>
        </div>
      </div>

      {/* 🎛️ SEARCH & FILTERS CARD */}
      <div className="card border-0 shadow-sm mb-4 rounded-4 p-3" style={{ background: "#ffffff" }}>
        <div className="row g-2 mb-3">
          <div className="col-lg-3 col-md-6">
            <input
              type="text"
              className="form-control border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              placeholder="🔍 Search Customer / Ref No..."
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
          <div className="col-lg-3 col-md-6">
            <select
              className="form-select border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              value={custTypeFilter}
              onChange={(e) => setCustTypeFilter(e.target.value)}
            >
              <option value="">All Customer Types</option>
              <option value="Registered">👤 Registered Customers</option>
              <option value="Walk-in">🚶 Walk-in Customers</option>
            </select>
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
                <th className="py-3 text-center">Date</th>
                <th className="py-3">Customer Name</th>
                <th className="py-3 text-center">Code / Status</th>
                <th className="py-3 text-center">Ref No</th>
                <th className="py-3 text-end">Total Sale</th>
                <th className="py-3 text-end">Adjustment</th>
                <th className="py-3 text-end px-3">Net Amount</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Loading sale adjustment records...
                  </td>
                </tr>
              )}

              {!loading && currentRows.map((r, i) => {
                const adj = Number(r.adjustment_amount || 0);
                const net = Number(r.amount || 0) - adj;
                const isRegistered = checkIsRegistered(r);
                const displayCode = r.customer_code || (r.ref_no?.startsWith("CUST-") ? r.ref_no : null);

                return (
                  <tr key={i} className="align-middle">
                    <td className="text-center text-muted fw-bold">{i + 1 + indexOfFirst}</td>
                    <td className="text-center text-muted">{fmtDate(r.date)}</td>
                    
                    {/* CUSTOMER NAME COLORS */}
                    <td className="fw-bold">
                      <span style={{ color: isRegistered ? "#16a34a" : "#2563eb" }}>
                        {r.customer_name || "-"}
                      </span>
                    </td>

                    {/* CODE / STATUS COLUMN */}
                    <td className="text-center">
                      {isRegistered ? (
                        <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill">
                          👤 {displayCode}
                        </span>
                      ) : (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill">
                          🚶 Walk-in
                        </span>
                      )}
                    </td>

                    <td className="text-center fw-semibold text-secondary">{r.ref_no || "-"}</td>

                    <td className="text-end fw-semibold text-dark">
                      PKR {fmt(r.amount)}
                    </td>

                    <td className="text-end fw-bold text-danger">
                      -{fmt(adj)}
                    </td>

                    <td className="text-end fw-bold text-success px-3">
                      PKR {fmt(net)}
                    </td>
                  </tr>
                );
              })}

              {!loading && view.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    No Sale Adjustment Records Found
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