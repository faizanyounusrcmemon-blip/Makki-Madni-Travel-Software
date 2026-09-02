import React, { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";

export default function DeletedReports({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  /* ================= LOAD DATA ================= */
  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/deleted/list`
      );
      const data = await res.json();
      if (data.success) setRows(data.rows || []);
    } catch (err) {
      console.error(err);
      Swal.fire({
        width: "320px",
        icon: "error",
        text: "Failed to load deleted reports",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
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
    setCategory("ALL");
    setFromDate("");
    setToDate("");
  };

  /* ================= FILTER & SUMMARY ================= */
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const s = search.toLowerCase();

      const matchSearch =
        r.ref_no?.toLowerCase().includes(s) ||
        r.customer_name?.toLowerCase().includes(s) ||
        r.customer_code?.toLowerCase().includes(s) ||
        r.type?.toLowerCase().includes(s);

      const matchCategory =
        category === "ALL" ? true : r.type?.toUpperCase() === category;

      let matchDate = true;
      if (fromDate) matchDate = matchDate && new Date(r.booking_date) >= new Date(fromDate);
      if (toDate) matchDate = matchDate && new Date(r.booking_date) <= new Date(toDate);

      return matchSearch && matchCategory && matchDate;
    });
  }, [rows, search, category, fromDate, toDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, category, fromDate, toDate]);

  const totalAmount = useMemo(() => {
    return filteredRows.reduce(
      (sum, r) => sum + (Number(r.amount) || 0),
      0
    );
  }, [filteredRows]);

  /* ================= PAGINATION logic ================= */
  const totalPages = Math.ceil(filteredRows.length / rowsPerPage);
  const indexOfLast = currentPage * rowsPerPage;
  const indexOfFirst = indexOfLast - rowsPerPage;
  const currentRows = filteredRows.slice(indexOfFirst, indexOfLast);

  const getPagination = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];
    let l;
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - delta && i <= currentPage + delta)
      ) {
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

  /* ================= REUSABLE PASSWORD POPUP ================= */
  const askPasswordPopup = async (
    title,
    btnColor,
    confirmText,
    type,
    ref_no,
    customer_name,
    amount
  ) => {
    const { value: password } = await Swal.fire({
      width: "380px",
      padding: "1.25em",
      customClass: { popup: "rounded-4 border-0 shadow-lg" },
      html: `
        <div style="text-align:left; font-size:13px; line-height:1.6; color:#1e293b;">
          <div style="margin-bottom:12px; font-size:16px; font-weight:700; color:${btnColor}; display:flex; align-items:center; gap:8px;">
            <span>🛡️</span> ${title}
          </div>
          <div style="background:#f8fafc; padding:12px; border-radius:12px; border:1px solid #e2e8f0; margin-bottom:12px;">
            <div><b>Type:</b> ${type}</div>
            <div><b>Ref No:</b> <span style="color:#2563eb; font-weight:600;">${ref_no}</span></div>
            <div><b>Name:</b> ${customer_name || "-"}</div>
            ${amount ? `<div><b>Amount:</b> <span style="color:#e11d48; font-weight:700;">PKR ${Number(amount).toLocaleString()}</span></div>` : ""}
          </div>
          <div style="position:relative">
            <input id="swal-pass" type="password" class="swal2-input"
              placeholder="Enter Security Password" style="height:38px; font-size:13px; margin:0; width:100%; box-sizing:border-box; padding-right:40px; border-radius:8px;">
            <span id="toggle-pass" style="
              position:absolute; right:12px; top:50%; transform:translateY(-50%);
              cursor:pointer; font-size:14px; user-select:none; color:#64748b; z-index:10;
            ">👁</span>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: confirmText,
      confirmButtonColor: btnColor,
      focusConfirm: false,
      preConfirm: () => {
        const val = document.getElementById("swal-pass").value.trim();
        if (!val) {
          Swal.showValidationMessage("Password required");
          return false;
        }
        return val;
      },
      didOpen: () => {
        let show = false;
        const input = document.getElementById("swal-pass");
        const toggle = document.getElementById("toggle-pass");

        toggle.addEventListener("click", () => {
          show = !show;
          input.type = show ? "text" : "password";
          toggle.textContent = show ? "🙈" : "👁";
        });

        input.addEventListener("keypress", (e) => {
          if (e.key === "Enter") Swal.clickConfirm();
        });
      },
    });
    return password;
  };

  /* ================= RESTORE ================= */
  const restore = async (type, ref_no, customer_name, amount) => {
    const password = await askPasswordPopup(
      "Restore Record",
      "#16a34a",
      "Restore Record",
      type,
      ref_no,
      customer_name,
      amount
    );

    if (!password) return;

    Swal.fire({
      width: "280px",
      title: "Restoring...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/deleted/restore`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, ref_no, password }),
        }
      );

      const data = await res.json();
      Swal.close();

      if (res.ok && data.success) {
        Swal.fire({
          icon: "success",
          title: "Restored!",
          text: `Record ${ref_no} is active now.`,
          timer: 1500,
          showConfirmButton: false,
        });
        load();
      } else {
        Swal.fire({
          title: "Restore Blocked!",
          text: data.error || "Failed to restore record.",
          icon: "error",
          confirmButtonColor: "#dc3545",
        });
      }
    } catch (err) {
      Swal.close();
      Swal.fire({
        icon: "error",
        text: "Server network error",
      });
    }
  };

  /* ================= PERMANENT DELETE ================= */
  const permanentDelete = async (type, ref_no, customer_name, amount) => {
    const password = await askPasswordPopup(
      "Permanent Delete",
      "#e11d48",
      "Delete Forever",
      type,
      ref_no,
      customer_name,
      amount
    );

    if (!password) return;

    const finalConfirm = await Swal.fire({
      width: "350px",
      title: "Are you absolutely sure?",
      text: "This record will be erased forever from the database!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#e11d48",
      confirmButtonText: "Yes, Erase Completely",
    });

    if (!finalConfirm.isConfirmed) return;

    Swal.fire({
      width: "280px",
      title: "Erasing...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/deleted/permanent-delete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type, ref_no, password }),
        }
      );
      const data = await res.json();
      Swal.close();

      if (data.success) {
        Swal.fire({
          icon: "success",
          title: "Erased!",
          text: `Record ${ref_no} removed permanently.`,
          timer: 1500,
          showConfirmButton: false,
        });
        load();
      } else {
        Swal.fire({
          title: "Error",
          text: data.error || "Failed",
          icon: "error",
        });
      }
    } catch {
      Swal.close();
      Swal.fire({
        icon: "error",
        text: "Server network error",
      });
    }
  };

  /* ================= VIEW ================= */
  const handleView = (type, ref_no) => {
    const t = type?.toUpperCase();
    let route = "";

    if (t === "PACKAGE" || t === "PACKAGES") route = "packages_view_deleted";
    else if (t === "HOTEL" || t === "HOTELS") route = "hotels_view_deleted";
    else if (t === "TICKETING") route = "ticket_view_deleted";
    else if (t === "TRANSPORT") route = "transport_view_deleted";
    else if (t === "ZIYARAT") route = "ziyarat_view_deleted";
    else if (t === "VISA") route = "visa_view_deleted";
    else if (t === "CARD") route = "card_view_deleted";
    else if (t === "GROUPS") route = "groups_view_deleted";
    else if (t === "PURCHASE") route = "purchase_view_deleted";
    else {
      Swal.fire({
        icon: "info",
        text: "No detailed view available for this record type",
      });
      return;
    }

    onNavigate(route, ref_no);
  };

  /* ================= HELPERS ================= */
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fmtPKR = (v) => Number(v || 0).toLocaleString("en-PK");

  const typeIcon = (type) => {
    const map = {
      PACKAGE: "📦",
      PACKAGES: "📦",
      HOTEL: "🏨",
      HOTELS: "🏨",
      TICKETING: "✈️",
      TRANSPORT: "🚐",
      ZIYARAT: "🕌",
      VISA: "🛂",
      CARD: "💳",
      GROUPS: "👥",
      PURCHASE: "🛒",
      SUPPLIER: "🏢",
      CUSTOMER: "👤",
    };
    return map[type?.toUpperCase()] || "📄";
  };

  const isSupplier = (t) => t?.toUpperCase() === "SUPPLIER";
  const isCustomer = (t) => t?.toUpperCase() === "CUSTOMER";

  return (
    <div
      style={{
        backgroundColor: "#f8fafc",
        minHeight: "100vh",
        fontFamily: "'Inter', sans-serif",
      }}
      className="p-3 p-lg-4"
    >
      {/* 🚀 APPLE/SAAS STYLE HEADER BANNER */}
      <div
        className="card border-0 shadow-sm mb-4"
        style={{
          background: "linear-gradient(135deg, #e11d48 0%, #be123c 100%)",
          borderRadius: "16px",
          color: "#ffffff",
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span
                className="p-2 rounded-3"
                style={{ background: "rgba(255, 255, 255, 0.2)" }}
              >
                🗑️
              </span>
              <h3 className="fw-bold mb-0">Deleted Reports</h3>
            </div>
            <p className="text-white-50 small mb-0 mt-1">
              Review, restore, or permanently erase soft-deleted system records.
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
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold">DELETED RECORDS</div>
                <div className="h4 fw-bold text-danger mb-0">
                  {filteredRows.length} Items
                </div>
              </div>
              <div className="bg-danger-subtle p-3 rounded-circle text-danger fw-bold fs-4">
                📦
              </div>
            </div>
          </div>
        </div>

        <div className="col-md-6 col-lg-4">
          <div className="card border-0 shadow-sm p-3 rounded-4 bg-white">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <div className="text-muted small fw-semibold">CUMULATIVE VALUE</div>
                <div className="h4 fw-bold text-danger mb-0">
                  PKR {fmtPKR(totalAmount)}
                </div>
              </div>
              <div className="bg-danger-subtle p-3 rounded-circle text-danger fw-bold fs-4">
                💰
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 🎛️ SEARCH & CONTROL CARD */}
      <div className="card border-0 shadow-sm mb-4 rounded-4 p-3 bg-white">
        <div className="row g-2 mb-3">
          <div className="col-lg-4 col-md-6">
            <input
              type="text"
              className="form-control border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              placeholder="🔍 Search Ref / Customer / Code / Type..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-lg-3 col-md-6">
            <select
              className="form-select border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="ALL">All Services</option>
              <option value="PACKAGE">Packages</option>
              <option value="HOTEL">Hotels</option>
              <option value="TICKETING">Ticketing</option>
              <option value="TRANSPORT">Transport</option>
              <option value="ZIYARAT">Ziyarat</option>
              <option value="VISA">Visa</option>
              <option value="CARD">Card</option>
              <option value="GROUPS">Groups</option>
              <option value="PURCHASE">Purchase</option>
              <option value="SUPPLIER">Supplier</option>
              <option value="CUSTOMER">Customer</option>
            </select>
          </div>

          <div className="col-lg-2 col-md-3">
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
        </div>

        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2 pt-2 border-top">
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-light border fw-semibold rounded-pill px-3"
              style={{ fontSize: "12px" }}
              onClick={setToday}
            >
              📅 Today
            </button>
            <button
              className="btn btn-sm btn-light border fw-semibold rounded-pill px-3"
              style={{ fontSize: "12px" }}
              onClick={setWeek}
            >
              📆 This Week
            </button>
            <button
              className="btn btn-sm btn-light border fw-semibold rounded-pill px-3"
              style={{ fontSize: "12px" }}
              onClick={setMonth}
            >
              🗓️ This Month
            </button>
          </div>

          <button
            className="btn btn-sm btn-link text-danger text-decoration-none fw-semibold"
            style={{ fontSize: "12px" }}
            onClick={resetFilters}
          >
            ♻️ Reset Filters
          </button>
        </div>
      </div>

      {/* 📊 ELEGANT TABLE CONTAINER */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead className="table-light text-secondary">
              <tr>
                <th className="py-3 px-3 text-center" style={{ width: "50px" }}>SR#</th>
                <th className="py-3">Type</th>
                <th className="py-3">Ref No</th>
                <th className="py-3">Customer Name</th>
                <th className="py-3 text-center">Code / Status</th>
                <th className="py-3 text-center">Date</th>
                <th className="py-3 text-end px-3">Amount</th>
                <th className="py-3 text-center" style={{ width: "200px" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-danger me-2" role="status"></div>
                    Loading deleted records...
                  </td>
                </tr>
              )}

              {!loading && currentRows.map((r, i) => {
                const isRegistered = r.customer_code && r.customer_code.trim() !== "";

                return (
                  <tr key={i} className="align-middle">
                    <td className="text-center text-muted fw-bold">{i + 1 + indexOfFirst}</td>

                    <td>
                      <span className="badge bg-danger-subtle text-danger border border-danger-subtle px-2 py-1 rounded-3">
                        {typeIcon(r.type)} {r.type}
                      </span>
                    </td>

                    <td className="fw-bold text-dark">{r.ref_no}</td>

                    <td className="fw-bold">
                      <span style={{ color: isRegistered ? "#16a34a" : "#2563eb" }}>
                        {r.customer_name || "-"}
                      </span>
                    </td>

                    {/* CODE / STATUS COLUMN RENDER */}
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

                    <td className="text-end fw-bold text-danger px-3">
                      {r.amount ? `PKR ${fmtPKR(r.amount)}` : "-"}
                    </td>

                    {/* ACTION BUTTON GRID */}
                    <td className="text-center">
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "55px 65px 65px",
                          gap: "4px",
                          justifyContent: "center",
                          alignItems: "center",
                        }}
                      >
                        {/* VIEW BUTTON */}
                        {!isSupplier(r.type) && !isCustomer(r.type) ? (
                          <button
                            className="btn btn-sm btn-outline-primary rounded-pill px-1 py-1 fw-semibold w-100"
                            style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                            onClick={() => handleView(r.type, r.ref_no)}
                          >
                            👁️ View
                          </button>
                        ) : (
                          <div></div>
                        )}

                        {/* RESTORE BUTTON */}
                        <button
                          className="btn btn-sm btn-outline-success rounded-pill px-1 py-1 fw-semibold w-100"
                          style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                          onClick={() =>
                            restore(r.type, r.ref_no, r.customer_name, r.amount)
                          }
                        >
                          ♻️ Restore
                        </button>

                        {/* ERASE BUTTON */}
                        <button
                          className="btn btn-sm btn-outline-danger rounded-pill px-1 py-1 fw-semibold w-100"
                          style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                          onClick={() =>
                            permanentDelete(
                              r.type,
                              r.ref_no,
                              r.customer_name,
                              r.amount
                            )
                          }
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
                  <td colSpan={8} className="text-center py-5 text-muted">
                    🎉 No deleted records matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 📑 FOOTER PAGINATION */}
      <div
        className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2 text-muted"
        style={{ fontSize: "13px" }}
      >
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
                p === currentPage
                  ? "btn-danger shadow-sm text-white"
                  : "btn-white border shadow-sm"
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
    </div>
  );
}