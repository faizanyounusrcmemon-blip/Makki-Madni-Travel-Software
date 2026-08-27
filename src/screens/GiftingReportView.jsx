import React, { useEffect, useMemo, useState } from "react";

export default function GiftingReportView({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
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
      console.error("Agent commission load error:", err);
      alert("Server error");
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
      const text = [
        r.ref_no,
        r.customer_name,
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
  }, [rows, search, fromDate, toDate]);

  useEffect(() => setCurrentPage(1), [search, fromDate, toDate]);

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
    <div className="container py-4">
      <div className="card shadow-sm border-0 mb-3">
        <div className="card-body d-flex justify-content-between align-items-center"
          style={{ background: "linear-gradient(135deg, #0d6efd, #6610f2)", color: "#fff", borderRadius: "12px" }}>
          <div>
            <h5 className="fw-bold mb-0">🎁 Gifting Report</h5>
            <small style={{ opacity: .85 }}>Gifting details & date-wise report</small>
          </div>
          <button className="btn btn-light btn-sm" onClick={() => onNavigate("allreports")}>← Back</button>
        </div>
      </div>

      <div className="card shadow-sm mb-2">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-5">
              <input className="form-control form-control-sm"
                placeholder="🔍 Search Ref / Customer / Gift Item"
                value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm"
                value={fromDate} onChange={e => setFromDate(e.target.value)} />
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm"
                value={toDate} onChange={e => setToDate(e.target.value)} />
            </div>
            <div className="col-md-3">
              <button className="btn btn-outline-danger btn-sm w-100" onClick={resetFilters}>♻ Reset Filters</button>
            </div>
          </div>
        </div>
      </div>

      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button className="btn btn-outline-primary btn-sm" onClick={setToday}>📅 Today</button>
        <button className="btn btn-outline-success btn-sm" onClick={setWeek}>📆 This Week</button>
        <button className="btn btn-outline-warning btn-sm" onClick={setMonth}>🗓 This Month</button>
      </div>

      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="text-center">SR#</th>
                <th className="text-center">Ref</th>
                <th className="text-center">Customer</th>
                <th className="text-center">Date</th>
                <th className="text-center">Gift Item / Details</th>
                <th className="text-center">Qty</th>
                <th className="text-center">Gifting PKR</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={7} className="text-center py-3">Loading...</td></tr>}
              {!loading && currentRows.map((r, i) => (
                <tr key={r.id || i}>
                  <td className="fw-bold text-muted" style={{fontSize:"12px"}}>{i + 1 + indexOfFirst}</td>
                  <td className="fw-bold text-nowrap small-cell">{r.ref_no || "-"}</td>
                  <td className="fw-semibold text-primary text-nowrap small-cell">{r.customer_name || "-"}</td>
                  <td className="text-muted text-nowrap small-cell">{formatDate(r.booking_date)}</td>
                  <td className="small-cell">{getGift(r)}</td>
                  <td className="text-center"><span className="badge bg-info text-dark">{getQty(r) || "-"}</span></td>
                  <td className="text-end"><span className="badge bg-success">🎁 {fmtPKR(getGiftingTotal(r))}</span></td>
                </tr>
              ))}
              {!loading && filtered.length === 0 &&
                <tr><td colSpan={7} className="text-center py-3 text-muted">No Records Found</td></tr>}
              {!loading && filtered.length > 0 &&
                <tr className="table-dark">
                  <td colSpan={6} className="text-end fw-bold">TOTAL GIFTING</td>
                  <td className="fw-bold text-end">{fmtPKR(totalGifting)}</td>
                </tr>}
            </tbody>
          </table>
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
        <select className="form-select form-select-sm" style={{width:"100px"}} value={rowsPerPage}
          onChange={e => {setRowsPerPage(Number(e.target.value)); setCurrentPage(1);}}>
          <option value={25}>25</option><option value={50}>50</option><option value={75}>75</option>
          <option value={100}>100</option><option value={1000000}>Full View</option>
        </select>
        <div className="d-flex gap-1 align-items-center flex-wrap">
          <button className="btn btn-sm btn-outline-primary" disabled={currentPage===1}
            onClick={() => setCurrentPage(currentPage-1)}>⬅ Prev</button>
          {getPagination().map((p, idx) =>
            <button key={idx} className={`btn btn-sm ${p===currentPage ? "btn-primary" : "btn-outline-primary"}`}
              disabled={p==="…"} onClick={() => typeof p==="number" && setCurrentPage(p)}>{p}</button>
          )}
          <button className="btn btn-sm btn-outline-primary" disabled={currentPage===totalPages || totalPages===0}
            onClick={() => setCurrentPage(currentPage+1)}>Next ➡</button>
        </div>
        <input type="number" min={1} max={totalPages} placeholder="Go"
          className="form-control form-control-sm" style={{width:"70px"}}
          onKeyDown={e => { if(e.key==="Enter"){const v=Number(e.target.value); if(v>=1&&v<=totalPages)setCurrentPage(v);}}}/>
      </div>
    </div>
  );
}
