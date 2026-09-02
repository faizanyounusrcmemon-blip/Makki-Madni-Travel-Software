import React, { useState, useEffect, useMemo } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/* ================= HELPERS ================= */
const fmt = (v) =>
  v !== null && v !== undefined
    ? Number(v).toLocaleString("en-US")
    : "0";

export default function SaleChangeCheckReport({ onNavigate }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ref, setRef] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  /* ================= LOAD DATA ================= */
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // 🔹 PURCHASE LIST
      const purchaseUrl = new URL(`${BACKEND_URL}/api/purchase/list`);
      if (from) purchaseUrl.searchParams.append("from", from);
      if (to) purchaseUrl.searchParams.append("to", to);
      if (ref) purchaseUrl.searchParams.append("ref", ref);

      const purchaseRes = await fetch(purchaseUrl.toString());
      if (!purchaseRes.ok) throw new Error("Failed to fetch purchase data");
      const purchaseData = await purchaseRes.json();
      if (!purchaseData.success) throw new Error(purchaseData.error || "Purchase API error");

      // Create map for faster lookup
      const purchaseMap = {};
      (purchaseData.rows || []).forEach((p) => {
        const salePkr = parseFloat(p.sale_pkr) || 0;
        const purchasePkr = parseFloat(p.purchase_pkr) || 0;
        if (purchasePkr > 0) {
          purchaseMap[p.ref_no] = salePkr;
        }
      });

      // 🔹 SALE DATA FROM REPORTS
      const reportRes = await fetch(`${BACKEND_URL}/api/reports/all`);
      if (!reportRes.ok) throw new Error("Failed to fetch reports");
      const reportData = await reportRes.json();

      // 🔹 COMBINE AND CALCULATE DIFF
      const combined = (reportData || [])
        .filter((r) => r.total_pkr && purchaseMap[r.ref_no])
        .map((r) => {
          const saleFromPurchase = purchaseMap[r.ref_no] || 0;
          const saleFromReport = parseFloat(r.total_pkr) || 0;
          const diff = saleFromReport - saleFromPurchase;
          return {
            ref_no: r.ref_no,
            customer_name: r.customer_name,
            type: r.type,
            sale_report: saleFromReport,
            sale_purchase: saleFromPurchase,
            diff,
          };
        })
        .filter((row) => row.diff !== 0);

      setData(combined);
      setCurrentPage(1);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= QUICK DATE FILTERS ================= */
  const setToday = () => {
    const today = new Date().toISOString().split("T")[0];
    setFrom(today);
    setTo(today);
  };

  const setThisWeek = () => {
    const now = new Date();
    const first = now.getDate() - now.getDay();
    const start = new Date(now.setDate(first));
    const end = new Date();

    setFrom(start.toISOString().split("T")[0]);
    setTo(end.toISOString().split("T")[0]);
  };

  const setThisMonth = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date();

    setFrom(start.toISOString().split("T")[0]);
    setTo(end.toISOString().split("T")[0]);
  };

  const resetFilters = () => {
    setFrom("");
    setTo("");
    setRef("");
  };

  /* ================= STATS TOTALS ================= */
  const totals = useMemo(() => {
    return data.reduce(
      (acc, r) => {
        acc.report += Number(r.sale_report || 0);
        acc.purchase += Number(r.sale_purchase || 0);
        acc.diff += Number(r.diff || 0);
        return acc;
      },
      { report: 0, purchase: 0, diff: 0 }
    );
  }, [data]);

  /* ================= PAGINATION LOGIC ================= */
  const totalPages = Math.ceil(data.length / rowsPerPage);
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = data.slice(indexOfFirst, indexOfLast);

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
          background: "linear-gradient(135deg, #0d6efd 0%, #0dcaf0 100%)", 
          borderRadius: "16px",
          color: "#ffffff" 
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3" style={{ background: "rgba(255, 255, 255, 0.2)" }}>📊</span>
              <h3 className="fw-bold mb-0">Sale vs Purchase Check Report</h3>
            </div>
            <p className="text-white-50 small mb-0 mt-1">
              Only showing mismatches and records with associated purchases
            </p>
          </div>

          <button 
            className="btn btn-outline-light btn-sm rounded-pill px-3 py-2 fw-semibold"
            onClick={() => onNavigate && onNavigate("dashboard")}
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
                <div className="text-muted small fw-semibold">SALE (REPORT) TOTAL</div>
                <div className="h4 fw-bold text-primary mb-0">PKR {fmt(totals.report)}</div>
              </div>
              <div className="bg-primary-subtle p-3 rounded-circle text-primary fw-bold fs-4">📋</div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold">SALE (PURCHASE) TOTAL</div>
                <div className="h4 fw-bold text-info mb-0">PKR {fmt(totals.purchase)}</div>
              </div>
              <div className="bg-info-subtle p-3 rounded-circle text-info fw-bold fs-4">🛒</div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold">TOTAL MISMATCH DIFF</div>
                <div className="h4 fw-bold text-danger mb-0">PKR {fmt(totals.diff)}</div>
              </div>
              <div className="bg-danger-subtle p-3 rounded-circle text-danger fw-bold fs-4">⚠️</div>
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
              placeholder="🔍 Search Ref No / Customer..."
              value={ref}
              onChange={(e) => setRef(e.target.value)}
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

          <div className="col-lg-3 col-md-6 d-flex gap-2">
            <button 
              className="btn btn-primary fw-semibold w-100 shadow-sm" 
              style={{ fontSize: "13px", borderRadius: "10px" }}
              onClick={loadData}
            >
              ⚡ Load Mismatches
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
                <th className="py-3 text-center">Ref No</th>
                <th className="py-3">Customer Name</th>
                <th className="py-3 text-center">Type</th>
                <th className="py-3 text-end">Sale (Report)</th>
                <th className="py-3 text-end">Sale (Purchase)</th>
                <th className="py-3 text-end px-3">Difference</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Comparing sales and purchase records...
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-danger fw-bold">
                    ⚠️ {error}
                  </td>
                </tr>
              )}

              {!loading && !error && currentRows.map((row, i) => (
                <tr key={row.ref_no || i} className="align-middle">
                  <td className="text-center text-muted fw-bold">{i + 1 + indexOfFirst}</td>

                  <td className="text-center fw-bold text-primary">
                    {row.ref_no || "-"}
                  </td>

                  <td className="fw-semibold text-dark">
                    {row.customer_name || "Unknown Customer"}
                  </td>

                  <td className="text-center">
                    <span className="badge bg-secondary-subtle text-secondary border border-secondary-subtle px-2 py-1 rounded-pill">
                      {row.type || "N/A"}
                    </span>
                  </td>

                  <td className="text-end fw-semibold text-dark">
                    PKR {fmt(row.sale_report)}
                  </td>

                  <td className="text-end fw-semibold text-info-emphasis">
                    PKR {fmt(row.sale_purchase)}
                  </td>

                  <td className="text-end fw-bold text-danger px-3">
                    PKR {fmt(row.diff)}
                  </td>
                </tr>
              ))}

              {!loading && !error && data.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-5 text-muted">
                    🎉 No mismatches found!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📑 FOOTER PAGINATION */}
      {!loading && !error && data.length > 0 && (
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