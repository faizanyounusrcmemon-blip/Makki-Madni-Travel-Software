import React, { useEffect, useState } from "react";
import API from "../api";
import Swal from "sweetalert2";

export default function ArchiveList({ onNavigate, onView, onLogs }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await API.get("/archive/list");
      if (res.data.success) {
        setRows(res.data.rows || []);
      }
    } catch (err) {
      console.error("Archive Load Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // 🌟 REUSABLE LIVE PROGRESS BAR MODAL
  const showProgressModal = (title, barColor = "#dc3545", statusText = "Processing request...") => {
    let percent = 0;

    Swal.fire({
      title: title,
      html: `
        <div style="margin-top:15px">
          <div style="width:100%; height:20px; background:#e9ecef; border-radius:50px; overflow:hidden; border:1px solid #dee2e6;">
            <div id="swalProgressBar" style="width:0%; height:100%; background:${barColor}; transition:width .2s ease;"></div>
          </div>
          <div id="swalProgressPercent" style="margin-top:10px; font-size:16px; font-weight:800; color:#212529;">0%</div>
          <div style="margin-top:5px; font-size:12px; color:#6c757d;">${statusText}</div>
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

  // 🛠️ Dynamic Database Password Verification Function
  const verifyArchivePassword = async (actionTitle) => {
    let showPassword = false;

    const { value: password } = await Swal.fire({
      title: `<span style="font-size: 16px; font-weight: 600; color: #333;">🔐 ${actionTitle}</span>`,
      html: `
        <div style="position: relative; margin-top: 10px;">
          <input 
            id="swal-archive-password" 
            type="password" 
            placeholder="Enter Password" 
            style="width: 100%; padding: 8px 38px 8px 12px; border: 1px solid #ccc; border-radius: 6px; font-size: 14px; outline: none; box-sizing: border-box;" 
          />
          <button 
            id="swal-toggle-pass" 
            type="button" 
            style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); border: none; background: none; cursor: pointer; font-size: 14px; opacity: 0.6; padding: 0;"
          >👁️</button>
        </div>
      `,
      width: 310,
      padding: "15px",
      showCancelButton: true,
      confirmButtonText: "Verify",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#0d6efd",
      cancelButtonColor: "#6c757d",
      focusConfirm: false,
      customClass: {
        popup: "rounded-3 shadow-sm",
        confirmButton: "btn btn-primary btn-sm px-3",
        cancelButton: "btn btn-secondary btn-sm px-3"
      },
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
        if (!val) {
          Swal.showValidationMessage("Password is required!");
        }
        return val;
      }
    });

    if (!password) return false;

    // Backend API se DB check
    try {
      const res = await API.post("/archive/verify-password", {
        key_name: "archive_management_pass",
        password: password
      });

      if (res.data.success) {
        return true;
      }
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

    return false;
  };

  // 🔥 DELETE LIVE ARCHIVE DATA WITH LIVE PROGRESS BAR
  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Archive ?",
      text: "This action cannot be undone and will delete data from live tables.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes Delete",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc3545"
    });

    if (!result.isConfirmed) return;

    const prog = showProgressModal("🔥 Deleting Archive Data...", "#dc3545", "Removing archive records from system...");

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

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString();
  };

  // 📅 Required Date Format: DD/MMM/YYYY (e.g., 01/Jul/2026)
  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    if (isNaN(d)) return "-";
    const day = String(d.getDate()).padStart(2, "0");
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = months[d.getMonth()];
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return (
      <div className="archive-loading text-center p-5">
        <div className="spinner-border text-primary"></div>
        <p className="mt-2">Loading Archive...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid p-3">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h2 style={{ margin: 0, fontSize: "20px" }}>📦 Archive List</h2>
          <div>
            <span className="badge bg-light text-dark me-2">Total : {rows.length}</span>
            <button onClick={() => onNavigate("dashboard")} className="btn btn-dark btn-sm">
              ← Back
            </button>
          </div>
        </div>

        <div className="card-body">
          {rows.length === 0 ? (
            <div className="text-center text-muted p-4">No Archive Found</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-dark">
                  <tr>
                    <th>#</th>
                    <th>Period</th>
                    <th>Opening Cash</th>
                    <th>Opening Bank</th>
                    <th>Profit</th>
                    <th>Customers</th>
                    <th>Suppliers</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, index) => {
                    const isArchived =
                      r.has_log === true ||
                      String(r.has_log).toLowerCase() === "true" ||
                      Number(r.has_log) === 1;

                    return (
                      <tr key={r.id || index}>
                        <td>{index + 1}</td>
                        <td>
                          <span className="fw-bold">{formatDate(r.date_from)}</span>
                          <br />
                          <small className="text-muted">To {formatDate(r.date_to)}</small>
                        </td>
                        <td>💵 {formatNumber(r.opening_cash)}</td>
                        <td>🏦 {formatNumber(r.opening_bank)}</td>
                        <td>
                          <span className="badge bg-success">
                            {formatNumber(r.total_profit || r.opening_profit)}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-info text-dark">
                            {formatNumber(r.total_customer_receivable)}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-warning text-dark">
                            {formatNumber(r.total_supplier_payable)}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-primary btn-sm me-2" onClick={() => onView(r.id)}>
                            👁 View
                          </button>

                          {isArchived ? (
                            <button className="btn btn-warning btn-sm me-2" onClick={() => onLogs(r.id)}>
                              📜 Logs
                            </button>
                          ) : (
                            <>
                              <button
                                className="btn btn-danger btn-sm me-2"
                                onClick={async () => {
                                  // Password check before Delete Action
                                  const isValid = await verifyArchivePassword("Verify Delete Password");
                                  if (!isValid) return;

                                  handleDelete(r.id);
                                }}
                              >
                                🗑 Delete
                              </button>

                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={async () => {
                                  // Password check before Snapshot Action
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
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}