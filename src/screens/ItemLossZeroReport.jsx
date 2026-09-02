import React, { useState, useEffect, useMemo } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/* ================= HELPERS ================= */
const fmt = (v) =>
  v !== null && v !== undefined
    ? Number(v).toLocaleString("en-US")
    : "0";

const formatDate = (d) => {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function ItemLossZeroReport({ onNavigate }) {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("loss");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    loadData();
  }, []);

  /* ================= LOAD ================= */
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(`${BACKEND_URL}/api/reports/supplier-purchase`);
      if (!res.ok) throw new Error("Failed to fetch data");

      const json = await res.json();
      if (!json.success) throw new Error("API error");

      const rows = (json.rows || []).map((r) => ({
        ...r,
        profit: Number(r.sale_pkr || 0) - Number(r.purchase_pkr || 0),
      }));

      setData(rows);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  /* ================= FILTERING & TAB DATA ================= */
  const filterRows = (rows) => {
    if (!search) return rows;
    const q = search.toLowerCase();

    return rows.filter(
      (r) =>
        r.ref_no?.toLowerCase().includes(q) ||
        r.item?.toLowerCase().includes(q) ||
        r.supplier_name?.toLowerCase().includes(q)
    );
  };

  const lossData = useMemo(() => filterRows(data.filter((d) => d.profit < 0)), [data, search]);
  const zeroData = useMemo(() => filterRows(data.filter((d) => d.profit === 0)), [data, search]);

  const activeRows = activeTab === "loss" ? lossData : zeroData;

  // Reset page when tab or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  /* ================= STATS TOTALS ================= */
  const totals = useMemo(() => {
    return activeRows.reduce(
      (acc, r) => {
        acc.sale += Number(r.sale_pkr || 0);
        acc.purchase += Number(r.purchase_pkr || 0);
        acc.profit += Number(r.profit || 0);
        return acc;
      },
      { sale: 0, purchase: 0, profit: 0 }
    );
  }, [activeRows]);

  /* ================= PAGINATION LOGIC ================= */
  const totalPages = Math.ceil(activeRows.length / rowsPerPage);
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = activeRows.slice(indexOfFirst, indexOfLast);

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
          background: "linear-gradient(135deg, #0d6efd 0%, #6610f2 100%)", 
          borderRadius: "16px",
          color: "#ffffff" 
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3" style={{ background: "rgba(255, 255, 255, 0.2)" }}>📊</span>
              <h3 className="fw-bold mb-0">Item Profit Analysis</h3>
            </div>
            <p className="text-white-50 small mb-0 mt-1">
              Analyze loss-making items and zero-profit transactions
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
                <div className="text-muted small fw-semibold">TOTAL SALE (PKR)</div>
                <div className="h4 fw-bold text-success mb-0">PKR {fmt(totals.sale)}</div>
              </div>
              <div className="bg-success-subtle p-3 rounded-circle text-success fw-bold fs-4">💰</div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold">TOTAL PURCHASE (PKR)</div>
                <div className="h4 fw-bold text-primary mb-0">PKR {fmt(totals.purchase)}</div>
              </div>
              <div className="bg-primary-subtle p-3 rounded-circle text-primary fw-bold fs-4">🛒</div>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold">NET MARGIN / PROFIT</div>
                <div className={`h4 fw-bold mb-0 ${totals.profit < 0 ? "text-danger" : "text-warning"}`}>
                  PKR {fmt(totals.profit)}
                </div>
              </div>
              <div className={`p-3 rounded-circle fw-bold fs-4 ${totals.profit < 0 ? "bg-danger-subtle text-danger" : "bg-warning-subtle text-warning"}`}>
                {activeTab === "loss" ? "🔻" : "⚖️"}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🎛️ CONTROLS & SEARCH CARD */}
      <div className="card border-0 shadow-sm mb-4 rounded-4 p-3" style={{ background: "#ffffff" }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          
          {/* TABS */}
          <div className="d-flex gap-2">
            <button
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                activeTab === "loss" ? "btn-danger shadow-sm" : "btn-light text-secondary border"
              }`}
              onClick={() => setActiveTab("loss")}
            >
              🔻 Loss Items ({data.filter((d) => d.profit < 0).length})
            </button>

            <button
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                activeTab === "zero" ? "btn-warning text-dark shadow-sm" : "btn-light text-secondary border"
              }`}
              onClick={() => setActiveTab("zero")}
            >
              ⚖️ Zero Profit ({data.filter((d) => d.profit === 0).length})
            </button>
          </div>

          {/* SEARCH INPUT */}
          <div style={{ minWidth: "280px" }}>
            <input
              type="text"
              className="form-control border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              placeholder="🔍 Search Ref / Item / Supplier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

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
                <th className="py-3">Item</th>
                <th className="py-3">Supplier</th>
                <th className="py-3 text-end">Sale SAR</th>
                <th className="py-3 text-end">Rate</th>
                <th className="py-3 text-end">Sale PKR</th>
                <th className="py-3 text-end">Pur. SAR</th>
                <th className="py-3 text-end">Rate</th>
                <th className="py-3 text-end">Pur. PKR</th>
                <th className="py-3 text-center">Status / Profit</th>
                <th className="py-3 text-center px-3">Date</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={12} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Loading item profit analysis...
                  </td>
                </tr>
              )}

              {error && !loading && (
                <tr>
                  <td colSpan={12} className="text-center py-5 text-danger fw-bold">
                    ⚠️ {error}
                  </td>
                </tr>
              )}

              {!loading && !error && currentRows.map((r, i) => (
                <tr key={r.id || i} className="align-middle">
                  <td className="text-center text-muted fw-bold">{i + 1 + indexOfFirst}</td>
                  
                  <td className="text-center fw-bold text-primary">
                    {r.ref_no || "-"}
                  </td>

                  <td title={r.item} className="fw-semibold text-dark text-nowrap">
                    {r.item || "-"}
                  </td>

                  <td title={r.supplier_name} className="text-secondary text-nowrap">
                    {r.supplier_name || "-"}
                  </td>

                  <td className="text-end text-muted">{fmt(r.sale_sar)}</td>
                  <td className="text-end text-muted">{fmt(r.sale_rate)}</td>
                  <td className="text-end fw-bold text-success">PKR {fmt(r.sale_pkr)}</td>

                  <td className="text-end text-muted">{fmt(r.purchase_sar)}</td>
                  <td className="text-end text-muted">{fmt(r.purchase_rate)}</td>
                  <td className="text-end fw-bold text-primary">PKR {fmt(r.purchase_pkr)}</td>

                  <td className="text-center">
                    {r.profit < 0 ? (
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded-pill fw-bold">
                        🔻 LOSS {fmt(r.profit)}
                      </span>
                    ) : (
                      <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 rounded-pill fw-bold">
                        ⚖️ ZERO {fmt(r.profit)}
                      </span>
                    )}
                  </td>

                  <td className="text-center text-muted px-3">{formatDate(r.booking_date)}</td>
                </tr>
              ))}

              {!loading && !error && activeRows.length === 0 && (
                <tr>
                  <td colSpan={12} className="text-center py-5 text-muted">
                    No Records Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📑 FOOTER PAGINATION */}
      {!loading && !error && activeRows.length > 0 && (
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