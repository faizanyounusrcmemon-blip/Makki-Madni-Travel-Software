import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";

export default function AllReportsToday({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentAuthorityDays, setCurrentAuthorityDays] = useState("-");

  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

/* ================= LOAD DATA & SYSTEM ACCESS (FIXED) ================= */
  const loadData = async () => {
    try {
      setLoading(true);
      
      // Check 1: Get Days Authority (Double /api/reports fix)
      const setRes = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/authority/get-days`);
      if (!setRes.ok) throw new Error("Authority route missing");
      const setData = await setRes.json();
      if(setData.success) {
        setCurrentAuthorityDays(setData.days);
      }

      // Check 2: Get Restricted Data (Double /api/reports fix)
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/today-restricted`);
      if (!res.ok) throw new Error("Data route missing");
      const data = await res.json();
      
      setRows(data || []);
      setFiltered(data || []);
    } catch (err) {
      console.error("Fetch error details:", err);
      Swal.fire("Server Error", "Could not synchronize secure data block", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= DATE PRESETS ================= */
  const setToday = () => {
    const t = new Date().toISOString().slice(0, 10);
    setFromDate(t);
    setToDate(t);
  };

  const setWeek = () => {
    const now = new Date();
    const first = new Date(now.setDate(now.getDate() - now.getDay()));
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
    setTypeFilter("");
  };

  /* ================= PASSWORD PROMPT ================= */
  const askPassword = async (type, ref_no, customer_name, total_pkr) => {
    const { value: password } = await Swal.fire({
      width: "360px",
      padding: "1em",
      html: `
        <div style="text-align:left;font-size:13px;line-height:1.5">
          <div style="margin-bottom:8px">
            <b style="color:#dc3545">🗑 DELETE SALE</b>
          </div>
          <div style="font-size:12px;margin-bottom:6px"><b>Type:</b> ${type}</div>
          <div style="font-size:12px;margin-bottom:6px"><b>REF NO:</b> ${ref_no}</div>
          <div style="font-size:12px;margin-bottom:6px"><b>Customer:</b> ${customer_name}</div>
          <div style="font-size:12px;margin-bottom:8px">💰 <b>Amount:</b> ${total_pkr}</div>
          <div style="position:relative;margin-top:8px">
            <input id="swal-pass" type="password" class="swal2-input" style="height:34px;font-size:13px;width:100%;box-sizing:border-box;padding-right:40px;margin:0;" placeholder="Enter password"/>
            <span id="toggle-pass" style="
              position:absolute;
              right:12px;
              top:50%;
              transform:translateY(-50%);
              cursor:pointer;
              font-size:14px;
              user-select:none;
            ">👁</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Delete",
      focusConfirm: false,
      buttonsStyling: false,
      customClass: { 
        confirmButton: "swal-btn-delete",
        cancelButton: "swal-btn-cancel"
      },
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
    return password;
  };

  /* ================= LOADER ================= */
  const showLoader = (text = "Processing...") => {
    Swal.fire({
      width: "300px",
      title: text,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  };

  /* ================= DELETE ================= */
  const handleDelete = async (type, ref_no, customer_name, total_pkr) => {
    const password = await askPassword(type, ref_no, customer_name, total_pkr);
    if (!password) return;

    const confirm = await Swal.fire({
      width: "320px",
      title: "Are you sure?",
      html: `REF NO: <b>${ref_no}</b><br>Customer: <b>${customer_name}</b>`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, Delete",
      cancelButtonText: "Cancel",
      buttonsStyling: false,
      customClass: {
        confirmButton: "swal-btn-delete",
        cancelButton: "swal-btn-cancel"
      }
    });

    if (!confirm.isConfirmed) return;

    const map = {
      Packages: "bookings",
      Hotels: "hotels",
      Ticketing: "ticketing",
      Transport: "transport",
      Ziyarat: "ziyarat",
      Visa: "visa",
      Card: "card",
      Groups: "groups",
    };

    const endpoint = map[type];
    showLoader("Deleting...");

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/${endpoint}/delete/${ref_no}`,
        { 
          method: "DELETE",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ password: password })
        }
      );
      const data = await res.json();
      Swal.close();

      if (!data.success) {
        return Swal.fire("Error", data.message || data.error || "Delete failed", "error");
      }

      Swal.fire("Deleted", `REF NO: ${ref_no}`, "success");
      loadData();
    } catch (err) {
      Swal.close();
      Swal.fire("Error", "Delete failed", "error");
    }
  };

  /* ================= NAVIGATION VIEWS ================= */
  const handleView = (type, ref_no) => {
    const map = {
      Packages: "packages_view",
      Hotels: "hotels_view",
      Ticketing: "ticket_view",
      Transport: "transport_view",
      Ziyarat: "ziyarat_view",
      Visa: "visa_view",
      Card: "card_view",
      Groups: "groups_view",
    };
    onNavigate(map[type], ref_no);
  };

  const handleSumry = (type, ref_no) => {
    if (type !== "Packages") return;
    onNavigate("packages_summary_view", ref_no);
  };

  /* ================= FILTERS EFFECT ================= */
  useEffect(() => {
    let temp = [...rows];
    if (search)
      temp = temp.filter(
        (r) =>
          (r.ref_no || "").toLowerCase().includes(search.toLowerCase()) ||
          (r.customer_name || "").toLowerCase().includes(search.toLowerCase())
      );
    if (fromDate)
      temp = temp.filter((r) => new Date(r.booking_date) >= new Date(fromDate));
    if (toDate)
      temp = temp.filter((r) => new Date(r.booking_date) <= new Date(toDate));
    if (typeFilter)
      temp = temp.filter((r) => r.type === typeFilter);

    setFiltered(temp);
    setCurrentPage(1);
  }, [search, fromDate, toDate, typeFilter, rows]);

  /* ================= PAGINATION LOGIC ================= */
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filtered.slice(indexOfFirst, indexOfLast);

  const getPagination = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - delta && i <= currentPage + delta)) {
        range.push(i);
      }
    }
    for (let i of range) {
      if (l) {
        if (i - l === 2) rangeWithDots.push(l + 1);
        else if (i - l > 2) rangeWithDots.push("…");
      }
      rangeWithDots.push(i);
      l = i;
    }
    return rangeWithDots;
  };

  /* ================= MATHS SUMMATION ================= */
  const totalPKR = useMemo(() => {
    return filtered.reduce((sum, r) => sum + Number(r.total_pkr || 0), 0);
  }, [filtered]);

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const fmtPKR = (v) => Number(v || 0).toLocaleString("en-PK");

  const typeIcon = (type) => {
    const map = { Packages: "📦", Hotels: "🏨", Ticketing: "✈️", Transport: "🚐", Ziyarat: "🕌", Visa: "🛂", Card: "💳", Groups: "👨‍👩‍👧‍👦" };
    return map[type] || "📄";
  };

  return (
    <div className="container py-4">
      {/* SAME SAME UI HEADER */}
      <div className="card shadow-sm border-0 mb-3">
        <div
          className="card-body d-flex justify-content-between align-items-center"
          style={{ background: "linear-gradient(135deg, #e11d48, #9f1239)", color: "#fff", borderRadius: "12px" }}
        >
          <div>
            <h5 className="fw-bold mb-0">🕒 All Reports Today</h5>
            <small style={{ fontSize: "11px", opacity: 0.9 }}>
              🛡️ Restricted View: Locked to Last <b>{currentAuthorityDays} Days</b> by Manager
            </small>
          </div>
          <button className="btn btn-light btn-sm" onClick={() => onNavigate("dashboard")}>
            ← Back
          </button>
        </div>
      </div>

      {/* FILTER */}
      <div className="card shadow-sm mb-2">
        <div className="card-body">
          <div className="row g-2">
            <div className="col-md-4">
              <input
                className="form-control form-control-sm"
                placeholder="🔍 Search Ref / Customer"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
            </div>
            <div className="col-md-2">
              <input type="date" className="form-control form-control-sm" value={toDate} onChange={(e) => setToDate(e.target.value)} />
            </div>
            <div className="col-md-4">
              <select className="form-control form-control-sm" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="">All Types</option>
                <option>Packages</option>
                <option>Hotels</option>
                <option>Ticketing</option>
                <option>Transport</option>
                <option>Ziyarat</option>
                <option>Visa</option>
                <option>Card</option>
                <option>Groups</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* DATE PRESETS */}
      <div className="d-flex gap-2 mb-3 flex-wrap">
        <button className="btn btn-outline-primary btn-sm" onClick={setToday}>📅 Today</button>
        <button className="btn btn-outline-success btn-sm" onClick={setWeek}>📆 This Week</button>
        <button className="btn btn-outline-warning btn-sm" onClick={setMonth}>🗓 This Month</button>
        <button className="btn btn-outline-danger btn-sm" onClick={resetFilters}>♻ Reset</button>
      </div>

      {/* TABLE DATA STRUCTURE */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th className="text-center">SR#</th>
                <th className="text-center">Type</th>
                <th className="text-center">Ref</th>
                <th className="text-center">Customer</th>
                <th className="text-center">Date</th>
                <th className="text-center">PKR</th>
                <th className="text-center">Summary</th>
                <th className="text-center">View</th>
                <th className="text-center">Delete</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="text-center py-3">Loading secure channel...</td>
                </tr>
              )}

              {!loading && currentRows.map((r, i) => (
                <tr key={i}>
                  <td className="fw-bold text-muted" style={{ fontSize: "12px" }}>{i + 1 + indexOfFirst}</td>
                  <td><span className="badge bg-info text-dark">{typeIcon(r.type)} {r.type}</span></td>
                  <td className="fw-bold text-nowrap small-cell">{r.ref_no}</td>
                  <td className="fw-semibold text-primary text-nowrap small-cell">{r.customer_name || "-"}</td>
                  <td className="text-muted text-nowrap small-cell">{formatDate(r.booking_date)}</td>
                  <td><span className="badge bg-success">💰 {fmtPKR(r.total_pkr)}</span></td>
                  <td className="text-center">
                    {r.type === "Packages" && (
                      <button className="btn btn-outline-warning btn-sm" onClick={() => handleSumry(r.type, r.ref_no)}>📊 SUMMARY</button>
                    )}
                  </td>
                  <td className="text-center"><button className="btn btn-outline-info btn-sm" onClick={() => handleView(r.type, r.ref_no)}>👁️ VIEW</button></td>
                  <td className="text-center"><button className="btn btn-outline-danger btn-sm" onClick={() => handleDelete(r.type, r.ref_no, r.customer_name, r.total_pkr)}>🗑 DELETE</button></td>
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-3 text-muted">No Authorized Records Found For Current Cycle</td>
                </tr>
              )}

              {!loading && filtered.length > 0 && (
                <tr className="table-dark">
                  <td colSpan={5} className="text-end fw-bold">TOTAL</td>
                  <td className="fw-bold">{fmtPKR(totalPKR)}</td>
                  <td colSpan={3}></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SMART PAGINATION */}
      <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
        <select
          className="form-select form-select-sm"
          style={{ width: "100px" }}
          value={rowsPerPage}
          onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
        >
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={75}>75</option>
          <option value={100}>100</option>
          <option value={1000000}>Full View</option>
        </select>

        <div className="d-flex gap-1 align-items-center flex-wrap">
          <button className="btn btn-sm btn-outline-primary" disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)}>⬅ Prev</button>
          {getPagination().map((p, idx) => (
            <button
              key={idx}
              className={`btn btn-sm ${p === currentPage ? "btn-primary" : "btn-outline-primary"}`}
              disabled={p === "…"}
              onClick={() => typeof p === "number" && setCurrentPage(p)}
            >
              {p}
            </button>
          ))}
          <button className="btn btn-sm btn-outline-primary" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(currentPage + 1)}>Next ➡</button>
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
              if (val >= 1 && val <= totalPages) setCurrentPage(val);
            }
          }}
        />
      </div>
    </div>
  );
}