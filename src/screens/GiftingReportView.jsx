import React, { useEffect, useMemo, useState } from "react";

export default function GiftingReportView({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [custTypeFilter, setCustTypeFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/bookings/list`);
      const data = await res.json();

      const giftingRows = Array.isArray(data)
        ? data.filter((r) => {
            const total = Number(r.gifting_total || r.gifting_pkr_total || 0);
            return total > 0 || (Array.isArray(r.gifting) && r.gifting.length > 0) || r.gift || r.gift_details;
          })
        : [];

      setRows(giftingRows);
    } catch (err) {
      console.error("Gifting report load error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const setToday = () => {
    const t = new Date().toISOString().slice(0, 10);
    setFromDate(t); setToDate(t);
  };

  const setWeek = () => {
    const now = new Date();
    const day = now.getDay();
    const first = new Date(now);
    first.setDate(now.getDate() - day);
    const last = new Date(first);
    last.setDate(first.getDate() + 6);
    setFromDate(first.toISOString().slice(0, 10));
    setToDate(last.toISOString().slice(0, 10));
  };

  const setMonth = () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setFromDate(first.toISOString().slice(0, 10));
    setToDate(last.toISOString().slice(0, 10));
  };

  const resetFilters = () => {
    setSearch("");
    setFromDate("");
    setToDate("");
    setCustTypeFilter("");
  };

  const getGiftingTotal = (r) => {
    let total = Number(r.gifting_total || r.gifting_pkr_total || 0);
    if (!total && Array.isArray(r.gifting)) {
      total = r.gifting.reduce(
        (sum, g) => sum + Number(g.total || Number(g.qty || 0) * Number(g.rate || 0)),
        0
      );
    }
    return Number.isFinite(total) ? total : 0;
  };

  const getQty = (r) => {
    if (Array.isArray(r.gifting) && r.gifting.length) {
      return r.gifting.reduce((s, g) => s + Number(g.qty || 1), 0);
    }
    return 1;
  };

  const getGift = (r) => {
    if (Array.isArray(r.gifting) && r.gifting.length) {
      return r.gifting.map(g => g.item || g.gift_item || g.name || "Gift").join(", ");
    }
    return r.gift || r.gift_details || "-";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      const isRegistered = r.customer_code && r.customer_code.trim() !== "";
      if (custTypeFilter === "Registered" && !isRegistered) return false;
      if (custTypeFilter === "Walk-in" && isRegistered) return false;

      const text = [
        r.ref_no,
        r.customer_name,
        r.customer_code,
        r.gift,
        r.gift_details,
        ...(Array.isArray(r.gifting)
          ? r.gifting.flatMap(g => [g.item, g.gift_item, g.name, g.rate])
          : [])
      ].filter(Boolean).join(" ").toLowerCase();

      const date = r.booking_date ? new Date(r.booking_date) : null;
      const from = fromDate ? new Date(`${fromDate}T00:00:00`) : null;
      const to = toDate ? new Date(`${toDate}T23:59:59`) : null;

      return (!q || text.includes(q)) &&
        (!from || (date && date >= from)) &&
        (!to || (date && date <= to));
    });
  }, [rows, search, fromDate, toDate, custTypeFilter]);

  useEffect(() => setCurrentPage(1), [search, fromDate, toDate, custTypeFilter]);

  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filtered.slice(indexOfFirst, indexOfLast);

  const getPagination = () => {
    const delta = 2, range = [], result = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) range.push(i);
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

  const totalGifting = useMemo(
    () => filtered.reduce((sum, r) => sum + getGiftingTotal(r), 0),
    [filtered]
  );

  const fmtPKR = v => Number(v || 0).toLocaleString("en-PK");
  const formatDate = d => d ? new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric"
  }) : "-";

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }} className="p-3 p-lg-4">
      
      {/* 🚀 BANNER HEADER */}
      <div 
        className="card border-0 shadow-sm mb-4" 
        style={{ 
          background: "linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)", 
          borderRadius: "16px",
          color: "#ffffff" 
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3" style={{ background: "rgba(255, 255, 255, 0.2)" }}>🎁</span>
              <h3 className="fw-bold mb-0">Gifting Report</h3>
            </div>
            <p className="text-white-50 small mb-0 mt-1">
              Detailed tracking of client gifts, items distributed, and total expenditure
            </p>
          </div>

          <button 
            className="btn btn-outline-light btn-sm rounded-pill px-3 py-2"
            onClick={() => onNavigate("allreports")}
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
                <div className="text-muted small fw-semibold">TOTAL GIFTING EXPENSE</div>
                <div className="h4 fw-bold text-purple mb-0" style={{ color: "#7c3aed" }}>PKR {fmtPKR(totalGifting)}</div>
              </div>
              <div className="p-3 rounded-circle text-purple fw-bold fs-4" style={{ background: "#f3e8ff", color: "#7c3aed" }}>🎁</div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm p-3 rounded-4" style={{ background: "#ffffff" }}>
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold">TOTAL GIFTED BOOKINGS</div>
                <div className="h4 fw-bold text-primary mb-0">{filtered.length} Bookings</div>
              </div>
              <div className="bg-primary-subtle p-3 rounded-circle text-primary fw-bold fs-4">📦</div>
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
              placeholder="🔍 Search Ref / Customer / Gift Item..."
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
                <th className="py-3 text-center">Booking Date</th>
                <th className="py-3">Gift Item / Details</th>
                <th className="py-3 text-center">Qty</th>
                <th className="py-3 text-end px-3">Gifting PKR</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-purple me-2" style={{ color: "#7c3aed" }} role="status"></div>
                    Loading gifting records...
                  </td>
                </tr>
              )}

              {!loading && currentRows.map((r, i) => {
                const isRegistered = r.customer_code && r.customer_code.trim() !== "";
                return (
                  <tr key={r.id || i} className="align-middle">
                    <td className="text-center text-muted fw-bold">{i + 1 + indexOfFirst}</td>
                    <td className="fw-bold text-dark">{r.ref_no || "-"}</td>
                    
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
                          👤 {r.customer_code}
                        </span>
                      ) : (
                        <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill">
                          🚶 Walk-in
                        </span>
                      )}
                    </td>

                    <td className="text-center text-muted">{formatDate(r.booking_date)}</td>
                    <td className="fw-semibold text-secondary">{getGift(r)}</td>

                    <td className="text-center">
                      <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 rounded-pill fw-bold">
                        📦 {getQty(r) || "-"}
                      </span>
                    </td>

                    <td className="text-end fw-bold px-3" style={{ color: "#7c3aed" }}>
                      PKR {fmtPKR(getGiftingTotal(r))}
                    </td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    No Gifting Records Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📑 FOOTER PAGINATION */}
      {!loading && filtered.length > 0 && (
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
                  p === currentPage ? "text-white shadow-sm" : "btn-white border shadow-sm"
                }`}
                style={{ backgroundColor: p === currentPage ? "#7c3aed" : "", borderColor: p === currentPage ? "#7c3aed" : "" }}
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