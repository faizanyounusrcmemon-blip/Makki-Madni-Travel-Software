import React, { useEffect, useState, useMemo } from "react";
import API from "../api";
import Swal from "sweetalert2";

export default function ArchiveList({ onNavigate, onView, onLogs }) {
  const [rows, setRows] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(25);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await API.get("/archive/list");
      if (res.data.success) {
        const data = res.data.rows || [];
        setRows(data);
        setFiltered(data);
      }
    } catch (err) {
      console.error("Archive Load Error:", err);
      Swal.fire({
        icon: "error",
        title: "Connection Error",
        text: "Could not retrieve archive records.",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= SEARCH & FILTER ================= */
  useEffect(() => {
    let temp = [...rows];
    if (search) {
      const query = search.toLowerCase();
      temp = temp.filter(
        (r) =>
          formatDate(r.date_from).toLowerCase().includes(query) ||
          formatDate(r.date_to).toLowerCase().includes(query) ||
          String(r.id).includes(query)
      );
    }
    setFiltered(temp);
    setCurrentPage(1);
  }, [search, rows]);

  /* ================= PAGINATION ================= */
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

  /* ================= REUSABLE PROGRESS MODAL ================= */
  const showProgressModal = (title, barColor = "#dc3545", statusText = "Processing request...") => {
    let percent = 0;
    Swal.fire({
      title: title,
      html: `
        <div style="margin-top:15px">
          <div style="width:100%; height:18px; background:#e2e8f0; border-radius:50px; overflow:hidden;">
            <div id="swalProgressBar" style="width:0%; height:100%; background:${barColor}; transition:width .2s ease;"></div>
          </div>
          <div id="swalProgressPercent" style="margin-top:10px; font-size:15px; font-weight:800; color:#1e293b;">0%</div>
          <div style="margin-top:4px; font-size:12px; color:#64748b;">${statusText}</div>
        </div>
      `,
      allowOutsideClick: false,
      allowEscapeKey: false,
      showConfirmButton: false,
    });

    const timer = setInterval(() => {
      if (percent >= 90) return;
      percent += 5;
      const bar = document.getElementById("swalProgressBar");
      const txt = document.getElementById("swalProgressPercent");
      if (bar) bar.style.width = `${percent}%`;
      if (txt) txt.innerHTML = `${percent}%`;
    }, 150);

    return {
      finish: () => {
        clearInterval(timer);
        const bar = document.getElementById("swalProgressBar");
        const txt = document.getElementById("swalProgressPercent");
        if (bar) bar.style.width = "100%";
        if (txt) txt.innerHTML = "100%";
      },
      stop: () => clearInterval(timer)
    };
  };

  /* ================= PASSWORD PROMPT ================= */
  const verifyArchivePassword = async (actionTitle) => {
    let showPassword = false;
    const { value: password } = await Swal.fire({
      width: "350px",
      padding: "1.2em",
      customClass: { popup: "rounded-4 border-0 shadow-lg" },
      title: `<span style="font-size: 16px; font-weight: 700; color: #1e293b;">🔐 ${actionTitle}</span>`,
      html: `
        <div style="position: relative; margin-top: 10px;">
          <input 
            id="swal-archive-password" 
            type="password" 
            placeholder="Enter Password" 
            class="swal2-input"
            style="width: 100%; height: 38px; font-size: 13px; margin: 0; padding-right: 38px; border-radius: 8px; box-sizing: border-box;" 
          />
          <button 
            id="swal-toggle-pass" 
            type="button" 
            style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); border: none; background: none; cursor: pointer; font-size: 14px; opacity: 0.6;"
          >👁️</button>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: "Verify",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#2563eb",
      cancelButtonColor: "#64748b",
      focusConfirm: false,
      didOpen: () => {
        const input = document.getElementById("swal-archive-password");
        const btn = document.getElementById("swal-toggle-pass");
        input.focus();
        btn.addEventListener("click", () => {
          showPassword = !showPassword;
          input.type = showPassword ? "text" : "password";
          btn.innerHTML = showPassword ? "🙈" : "👁️";
        });
      },
      preConfirm: () => {
        const val = document.getElementById("swal-archive-password").value;
        if (!val) Swal.showValidationMessage("Password is required!");
        return val;
      }
    });

    if (!password) return false;

    try {
      const res = await API.post("/archive/verify-password", {
        key_name: "archive_management_pass",
        password: password
      });
      return res.data.success;
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Access Denied",
        text: err.response?.data?.error || "Wrong Password",
        width: 300,
        confirmButtonColor: "#dc3545"
      });
      return false;
    }
  };

  /* ================= DELETE ACTION ================= */
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Archive?",
      text: "This action cannot be undone and will delete data from live tables.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#e11d48"
    });

    if (!result.isConfirmed) return;

    const prog = showProgressModal("🔥 Deleting Archive Data...", "#e11d48", "Removing archive records from system...");

    try {
      const res = await API.delete(`/archive/delete/${id}`);
      prog.finish();
      await new Promise(r => setTimeout(r, 300));
      Swal.close();

      if (res.data.success) {
        Swal.fire("Deleted", "Archive deleted successfully", "success");
        load();
      } else {
        Swal.fire("Error", res.data.error || "Delete failed", "error");
      }
    } catch (err) {
      prog.stop();
      Swal.close();
      Swal.fire("Error", err.response?.data?.error || "Delete operation failed", "error");
    }
  };

  const fmtPKR = (num) => Number(num || 0).toLocaleString("en-PK");

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d)) return "-";
    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }} className="p-3 p-lg-4">
      
      {/* HEADER BANNER */}
      <div 
        className="card border-0 shadow-sm mb-4" 
        style={{ 
          background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", 
          borderRadius: "16px",
          color: "#ffffff" 
        }}
      >
        <div className="card-body p-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <span className="p-2 rounded-3" style={{ background: "rgba(255, 255, 255, 0.2)" }}>📦</span>
              <h3 className="fw-bold mb-0">Archive Records</h3>
            </div>
            <p className="text-white-50 small mb-0 mt-1">View, inspect snapshots, and manage system database archives.</p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span 
              className="px-3 py-2 rounded-pill fw-semibold" 
              style={{ background: "rgba(255,255,255,0.15)", fontSize: "12px", border: "1px solid rgba(255,255,255,0.2)" }}
            >
              Total Archives: <strong className="text-warning">{rows.length}</strong>
            </span>

            <button 
              className="btn btn-outline-light btn-sm rounded-pill px-3 py-2"
              onClick={() => onNavigate("dashboard")}
            >
              ← Back
            </button>
          </div>
        </div>
      </div>

      {/* SEARCH CARD */}
      <div className="card border-0 shadow-sm mb-4 rounded-4 p-3" style={{ background: "#ffffff" }}>
        <div className="row g-2">
          <div className="col-md-6 col-lg-4">
            <input
              type="text"
              className="form-control border-light-subtle bg-light shadow-none"
              style={{ fontSize: "13px", padding: "10px 14px", borderRadius: "10px" }}
              placeholder="🔍 Search Archive Period / ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* TABLE CONTAINER */}
      <div className="card border-0 shadow-sm rounded-4 overflow-hidden" style={{ background: "#ffffff" }}>
        <div className="table-responsive">
          <table className="table align-middle mb-0" style={{ fontSize: "13px" }}>
            <thead className="table-light text-secondary">
              <tr>
                <th className="py-3 px-3 text-center" style={{ width: "50px" }}>SR#</th>
                <th className="py-3">Archive Period</th>
                <th className="py-3 text-end">Opening Cash</th>
                <th className="py-3 text-end">Opening Bank</th>
                <th className="py-3 text-end">Total Profit</th>
                <th className="py-3 text-end">Receivables</th>
                <th className="py-3 text-end">Payables</th>
                <th className="py-3 text-center" style={{ width: "240px" }}>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    <div className="spinner-border spinner-border-sm text-primary me-2" role="status"></div>
                    Loading archive records...
                  </td>
                </tr>
              )}

              {!loading && currentRows.map((r, index) => {
                const isArchived =
                  r.has_log === true ||
                  String(r.has_log).toLowerCase() === "true" ||
                  Number(r.has_log) === 1;

                return (
                  <tr key={r.id || index} className="align-middle">
                    <td className="text-center text-muted fw-bold">{index + 1 + indexOfFirst}</td>
                    <td>
                      <div className="fw-bold text-dark">{formatDate(r.date_from)}</div>
                      <small className="text-muted">To {formatDate(r.date_to)}</small>
                    </td>
                    <td className="text-end fw-bold text-secondary">PKR {fmtPKR(r.opening_cash)}</td>
                    <td className="text-end fw-bold text-primary">PKR {fmtPKR(r.opening_bank)}</td>
                    <td className="text-end">
                      <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill fw-bold">
                        PKR {fmtPKR(r.total_profit || r.opening_profit)}
                      </span>
                    </td>
                    <td className="text-end">
                      <span className="badge bg-info-subtle text-info border border-info-subtle px-2 py-1 rounded-pill fw-bold">
                        PKR {fmtPKR(r.total_customer_receivable)}
                      </span>
                    </td>
                    <td className="text-end">
                      <span className="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1 rounded-pill fw-bold">
                        PKR {fmtPKR(r.total_supplier_payable)}
                      </span>
                    </td>
                    <td className="text-center">
                      <div 
                        style={{ 
                          display: "grid", 
                          gridTemplateColumns: isArchived ? "75px 75px" : "70px 70px 75px", 
                          gap: "4px", 
                          justifyContent: "center", 
                          alignItems: "center" 
                        }}
                      >
                        <button
                          className="btn btn-sm btn-outline-primary rounded-pill px-1 py-1 fw-semibold w-100"
                          style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                          onClick={() => onView(r.id)}
                        >
                          👁️ View
                        </button>

                        {isArchived ? (
                          <button
                            className="btn btn-sm btn-outline-warning rounded-pill px-1 py-1 fw-semibold w-100"
                            style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                            onClick={() => onLogs(r.id)}
                          >
                            📜 Logs
                          </button>
                        ) : (
                          <>
                            <button
                              className="btn btn-sm btn-outline-danger rounded-pill px-1 py-1 fw-semibold w-100"
                              style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                              onClick={async () => {
                                const isValid = await verifyArchivePassword("Verify Delete Password");
                                if (!isValid) return;
                                handleDelete(r.id);
                              }}
                            >
                              🗑️ Delete
                            </button>

                            <button
                              className="btn btn-sm btn-outline-secondary rounded-pill px-1 py-1 fw-semibold w-100"
                              style={{ fontSize: "11px", whiteSpace: "nowrap" }}
                              onClick={async () => {
                                const isValid = await verifyArchivePassword("Verify Snapshot Password");
                                if (!isValid) return;

                                const confirm = await Swal.fire({
                                  title: "Delete Snapshot?",
                                  text: "Sirf snapshot delete hoga, live data delete nahi hoga.",
                                  icon: "warning",
                                  showCancelButton: true,
                                  confirmButtonText: "Yes Delete",
                                  confirmButtonColor: "#dc3545"
                                });

                                if (!confirm.isConfirmed) return;

                                const prog = showProgressModal("❌ Deleting Snapshot...", "#6c757d", "Clearing snapshot records...");

                                try {
                                  const res = await API.delete(`/archive/delete-snapshot/${r.id}`);
                                  prog.finish();
                                  await new Promise(r => setTimeout(r, 300));
                                  Swal.close();

                                  if (res.data.success) {
                                    Swal.fire("Deleted", "Snapshot deleted successfully", "success");
                                    load();
                                  } else {
                                    Swal.fire("Error", res.data.error || "Delete failed", "error");
                                  }
                                } catch (err) {
                                  prog.stop();
                                  Swal.close();
                                  Swal.fire("Error", err.response?.data?.error || "Delete snapshot failed", "error");
                                }
                              }}
                            >
                              ❌ Snapshot
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-5 text-muted">
                    No archive records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FOOTER PAGINATION */}
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
            <option value={100}>100</option>
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
    </div>
  );
}