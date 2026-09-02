import React, { useEffect, useState, useMemo } from "react";

// ================= HELPERS =================
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

export default function PendingPurchase({ onNavigate }) {
  const [pendingRows, setPendingRows] = useState([]);
  const [missingRows, setMissingRows] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    loadAll();
  }, []);

  // ================= MAIN LOADER =================
  const loadAll = async () => {
    try {
      setLoading(true);

      const [pendingRes, missingRes, reportRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase/pending`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase/missing-supplier`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/all`),
      ]);

      const [pendingData, missingData, reportData] = await Promise.all([
        pendingRes.json(),
        missingRes.json(),
        reportRes.json(),
      ]);

      const pendingBase = pendingData.success ? pendingData.rows : [];
      const missingBase = missingData.success ? missingData.rows : [];

      const saleMap = {};
      (reportData || []).forEach((r) => {
        saleMap[r.ref_no] = r.total_pkr || 0;
      });

      const attachAmounts = async (rows) =>
        Promise.all(
          rows.map(async (r) => {
            let purchase_pkr = 0;
            try {
              const listRes = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/purchase/list?ref=${r.ref_no}`
              );
              const listData = await listRes.json();
              if (listData.success && listData.rows.length) {
                purchase_pkr = listData.rows[0].purchase_pkr || 0;
              }
            } catch (err) {
              console.error(err);
            }
            return { ...r, sale_pkr: saleMap[r.ref_no] || 0, purchase_pkr };
          })
        );

      const [pendingRowsWithAmounts, missingRowsWithAmounts] = await Promise.all([
        attachAmounts(pendingBase),
        attachAmounts(missingBase),
      ]);

      setPendingRows(pendingRowsWithAmounts);
      setMissingRows(missingRowsWithAmounts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ================= FILTERING =================
  const filterRows = (rows) => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.ref_no?.toLowerCase().includes(q) ||
        r.customer_name?.toLowerCase().includes(q)
    );
  };

  const filteredPending = useMemo(() => filterRows(pendingRows), [pendingRows, search]);
  const filteredMissing = useMemo(() => filterRows(missingRows), [missingRows, search]);

  const activeRows = activeTab === "pending" ? filteredPending : filteredMissing;

  // Reset page on tab or search change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, search]);

  // ================= STATS TOTALS =================
  const totals = useMemo(() => {
    return activeRows.reduce(
      (acc, r) => {
        acc.sale += Number(r.sale_pkr || 0);
        acc.purchase += Number(r.purchase_pkr || 0);
        return acc;
      },
      { sale: 0, purchase: 0 }
    );
  }, [activeRows]);

  // ================= PAGINATION LOGIC =================
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
          background: "linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)", 
          borderRadius: "16px",
          color: "#ffffff" 
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3" style={{ background: "rgba(255, 255, 255, 0.25)" }}>⚠️</span>
              <h3 className="fw-bold mb-0 text-white">Purchase Overview</h3>
            </div>
            <p className="text-white-50 small mb-0 mt-1">
              Track pending, partial purchases, and missing supplier details
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
                <div className="text-muted small fw-semibold">TOTAL RECORDS</div>
                <div className="h4 fw-bold text-dark mb-0">{activeRows.length}</div>
              </div>
              <div className="bg-warning-subtle p-3 rounded-circle text-warning-emphasis fw-bold fs-4">📦</div>
            </div>
          </div>
        </div>

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
      </div>

      {/* 🎛️ CONTROLS & SEARCH CARD */}
      <div className="card border-0 shadow-sm mb-4 rounded-4 p-3" style={{ background: "#ffffff" }}>
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          
          {/* TABS */}
          <div className="d-flex gap-2">
            <button
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                activeTab === "pending" ? "btn-warning text-dark shadow-sm" : "btn-light text-secondary border"
              }`}
              onClick={() => setActiveTab("pending")}
            >
              ⏳ Pending / Partial ({pendingRows.length})
            </button>

            <button
              className={`btn btn-sm rounded-pill px-3 fw-semibold ${
                activeTab === "missing" ? "btn-danger shadow-sm" : "btn-light text-secondary border"
              }`}
              onClick={() => setActiveTab("missing")}
            >
              🚫 Missing Supplier ({missingRows.length})
            </button>
          </div>

          {/* SEARCH INPUT */}
          <div style={{ minWidth: "280px" }}>
            <input
              type="text"
              className="form-control border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              placeholder="🔍 Search Ref No / Customer..."
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
                <th className="py-3">Customer Name</th>
                {activeTab === "missing" && <th className="py-3">Supplier Name</th>}
                <th className="py-3 text-center">Status</th>
                <th className="py-3 text-end">Sale (PKR)</th>
                <th className="py-3 text-end">Purchase (PKR)</th>
                <th className="py-3 text-center px-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={activeTab === "missing" ? 8 : 7} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-warning me-2" role="status"></div>
                    Loading purchase records...
                  </td>
                </tr>
              )}

              {!loading && currentRows.map((r, i) => (
                <tr key={i} className="align-middle">
                  <td className="text-center text-muted fw-bold">{i + 1 + indexOfFirst}</td>
                  
                  <td className="text-center fw-bold text-primary">
                    {r.ref_no || "-"}
                  </td>

                  <td className="fw-semibold text-dark">
                    {r.customer_name || "-"}
                  </td>

                  {activeTab === "missing" && (
                    <td className="fw-bold text-danger">
                      {r.supplier_name || "MISSING"}
                    </td>
                  )}

                  <td className="text-center">
                    {activeTab === "pending" && (
                      <>
                        {r.purchase_status === "PENDING" && (
                          <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded-pill fw-bold">
                            🔻 Pending
                          </span>
                        )}
                        {r.purchase_status === "PARTIAL" && (
                          <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 rounded-pill fw-bold">
                            ⚠️ Partial
                          </span>
                        )}
                        {r.purchase_status === "COMPLETE" && (
                          <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill fw-bold">
                            ✅ Complete
                          </span>
                        )}
                      </>
                    )}

                    {activeTab === "missing" && (
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill fw-bold">
                        ✅ Complete
                      </span>
                    )}
                  </td>

                  <td className="text-end fw-bold text-success">
                    PKR {fmt(r.sale_pkr)}
                  </td>

                  <td className="text-end fw-bold text-primary">
                    PKR {fmt(r.purchase_pkr)}
                  </td>

                  <td className="text-center px-3">
                    {activeTab === "pending" ? (
                      <button
                        className={`btn btn-sm rounded-pill px-3 fw-semibold shadow-sm ${
                          r.purchase_status === "PENDING"
                            ? "btn-danger"
                            : "btn-warning text-dark"
                        }`}
                        style={{ fontSize: "12px" }}
                        onClick={() => onNavigate("purchase", r.ref_no)}
                      >
                        {r.purchase_status === "PENDING"
                          ? "➕ Start Purchase"
                          : "✏️ Complete Purchase"}
                      </button>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {!loading && activeRows.length === 0 && (
                <tr>
                  <td colSpan={activeTab === "missing" ? 8 : 7} className="text-center py-5 text-success fw-bold">
                    🎉 No records found!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📑 FOOTER PAGINATION */}
      {!loading && activeRows.length > 0 && (
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
                  p === currentPage ? "btn-warning text-dark shadow-sm fw-bold" : "btn-white border shadow-sm"
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