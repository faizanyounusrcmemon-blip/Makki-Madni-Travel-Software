import React, { useEffect, useState } from "react";
import API from "../api"; // ✅ Fixed: Using central API router instead of raw axios
import Swal from "sweetalert2";

export default function ArchiveList({ onNavigate, onView, onLogs }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      // ✅ Fixed path matching with backend router mapping
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

  const showProcessingAlert = (message) => {
    Swal.fire({
      title: message,
      html: "Please wait while system processes your request...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Delete Archive ?",
      text: "This action cannot be undone and will delete data from live tables.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes Delete",
      cancelButtonText: "Cancel",
    });

    if (!result.isConfirmed) return;

    showProcessingAlert("Deleting Archive Data...");

    try {
      // ✅ Fixed path matching
      const res = await API.delete(`/archive/delete/${id}`);
      if (res.data.success) {
        Swal.fire("Deleted", "Archive deleted successfully", "success");
        load();
      } else {
        Swal.fire("Error", res.data.error || "Delete failed", "error");
      }
    } catch (err) {
      Swal.fire("Error", err.response?.data?.error || "Delete operation failed", "error");
    }
  };

  const formatNumber = (num) => {
    return Number(num || 0).toLocaleString();
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("en-GB");
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
          <h2 style={{ margin: 0 }}>📦 Archive List</h2>
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
                    const isArchived = r.has_log === true || String(r.has_log).toLowerCase() === "true" || Number(r.has_log) === 1;

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
                                  const { value: password } = await Swal.fire({
                                    title: "Delete Archive Data",
                                    html: `
                                      <div class="input-group">
                                        <input type="password" id="archivePassword" class="swal2-input" placeholder="Enter Password" style="margin:0;width:100%;" />
                                        <button type="button" id="togglePassword" class="btn btn-secondary" style="margin-top:10px;">👁</button>
                                      </div>
                                    `,
                                    focusConfirm: false,
                                    showCancelButton: true,
                                    confirmButtonText: "Verify",
                                    preConfirm: () => document.getElementById("archivePassword").value,
                                    didOpen: () => {
                                      const pass = document.getElementById("archivePassword");
                                      const toggle = document.getElementById("togglePassword");
                                      toggle.addEventListener("click", () => {
                                        pass.type = pass.type === "password" ? "text" : "password";
                                        toggle.innerHTML = pass.type === "password" ? "👁" : "🙈";
                                      });
                                    },
                                  });

                                  if (!password) return;
                                  if (password !== "faizan") {
                                    return Swal.fire({ icon: "error", title: "Access Denied", text: "Wrong Password" });
                                  }

                                  handleDelete(r.id);
                                }}
                              >
                                🗑 Delete
                              </button>

                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={async () => {
                                  const { value: password } = await Swal.fire({
                                    title: "Delete Snapshot",
                                    html: `
                                      <div class="input-group">
                                        <input type="password" id="snapshotPassword" class="swal2-input" placeholder="Enter Password" style="margin:0;width:100%;" />
                                        <button type="button" id="toggleSnapshotPassword" class="btn btn-secondary" style="margin-top:10px;">👁</button>
                                      </div>
                                    `,
                                    focusConfirm: false,
                                    showCancelButton: true,
                                    confirmButtonText: "Verify",
                                    preConfirm: () => document.getElementById("snapshotPassword").value,
                                    didOpen: () => {
                                      const pass = document.getElementById("snapshotPassword");
                                      const toggle = document.getElementById("toggleSnapshotPassword");
                                      toggle.addEventListener("click", () => {
                                        pass.type = pass.type === "password" ? "text" : "password";
                                        toggle.innerHTML = pass.type === "password" ? "👁" : "🙈";
                                      });
                                    },
                                  });

                                  if (!password) return;
                                  if (password !== "faizan") {
                                    return Swal.fire({ icon: "error", title: "Access Denied", text: "Wrong Password" });
                                  }

                                  const confirm = await Swal.fire({
                                    title: "Delete Snapshot?",
                                    text: "Sirf snapshot delete hoga, live data delete nahi hoga.",
                                    icon: "warning",
                                    showCancelButton: true,
                                    confirmButtonText: "Yes Delete",
                                  });

                                  if (!confirm.isConfirmed) return;

                                  showProcessingAlert("Deleting Snapshot...");

                                  try {
                                    // ✅ Fixed path mapping route
                                    const res = await API.delete(`/archive/delete-snapshot/${r.id}`);
                                    if (res.data.success) {
                                      Swal.fire("Deleted", "Snapshot deleted successfully", "success");
                                      load();
                                    } else {
                                      Swal.fire("Error", res.data.error || "Delete failed", "error");
                                    }
                                  } catch (err) {
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
