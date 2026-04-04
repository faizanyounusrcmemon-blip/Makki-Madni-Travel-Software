import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";

export default function DeletedReports({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  /* ================= LOAD ================= */
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
      alert("Failed to load deleted reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

/* ================= RESTORE ================= */
const restore = async (type, ref_no, customer_name, amount) => {
  const { value: password } = await Swal.fire({
    title: `RESTORE (${ref_no})`,
    html: `
      <div style="text-align:left;font-size:13px">
        <b>Type:</b> ${type}<br>
        <b>Ref:</b> ${ref_no}<br>
        <b>Customer:</b> ${customer_name || "-"}<br>
        <b>Amount:</b> ${amount ? Number(amount).toLocaleString() : "-"}<br><br>
        <input type="password" id="swal-input1" class="swal2-input" placeholder="Enter password">
        <input type="checkbox" id="swal-showpass" style="margin-top:5px;">
        <label for="swal-showpass" style="font-size:12px;">Show Password</label>
      </div>
    `,
    focusConfirm: false,
    preConfirm: () => {
      const passInput = document.getElementById('swal-input1');
      if (!passInput.value) Swal.showValidationMessage('Password is required');
      return passInput.value;
    },
    didOpen: () => {
      const checkbox = document.getElementById('swal-showpass');
      const passInput = document.getElementById('swal-input1');
      checkbox.addEventListener('change', () => {
        passInput.type = checkbox.checked ? 'text' : 'password';
      });
    },
    showCancelButton: true,
    confirmButtonText: 'Restore',
    cancelButtonText: 'Cancel',
    customClass: { confirmButton: 'btn btn-success', cancelButton: 'btn btn-secondary' },
    buttonsStyling: false,
  });

  if (!password) return;

  const confirmRestore = await Swal.fire({
    title: 'Confirm Restore',
    html: `<span style="color:green;font-weight:bold;">Restore record ${ref_no}?</span>`,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Yes, Restore',
    cancelButtonText: 'Cancel',
    customClass: { confirmButton: 'btn btn-success', cancelButton: 'btn btn-secondary' },
    buttonsStyling: false,
  });

  if (!confirmRestore.isConfirmed) return;

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
    if (data.success) {
      Swal.fire({
        html: `<span style="color:white;font-weight:bold;">RESTORED (${ref_no}) ✅</span>`,
        icon: 'success',
        background: 'green',
        timer: 1500,
        showConfirmButton: false,
      });
      load();
    } else {
      Swal.fire('Error', data.error || 'Restore failed', 'error');
    }
  } catch {
    Swal.fire('Error', 'Server error', 'error');
  }
};

/* ================= DELETE ================= */
const permanentDelete = async (type, ref_no, customer_name, amount) => {
  const { value: password } = await Swal.fire({
    title: `DELETE (${ref_no})`,
    html: `
      <div style="text-align:left;font-size:13px">
        <b>Type:</b> ${type}<br>
        <b>Ref:</b> ${ref_no}<br>
        <b>Customer:</b> ${customer_name || "-"}<br>
        <b>Amount:</b> ${amount ? Number(amount).toLocaleString() : "-"}<br><br>
        <input type="password" id="swal-input1" class="swal2-input" placeholder="Enter password">
        <input type="checkbox" id="swal-showpass" style="margin-top:5px;">
        <label for="swal-showpass" style="font-size:12px;">Show Password</label>
      </div>
    `,
    focusConfirm: false,
    preConfirm: () => {
      const passInput = document.getElementById('swal-input1');
      if (!passInput.value) Swal.showValidationMessage('Password is required');
      return passInput.value;
    },
    didOpen: () => {
      const checkbox = document.getElementById('swal-showpass');
      const passInput = document.getElementById('swal-input1');
      checkbox.addEventListener('change', () => {
        passInput.type = checkbox.checked ? 'text' : 'password';
      });
    },
    showCancelButton: true,
    confirmButtonText: 'Delete',
    cancelButtonText: 'Cancel',
    customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
    buttonsStyling: false,
  });

  if (!password) return;

  const confirmDelete = await Swal.fire({
    title: 'FINAL WARNING!',
    html: `<span style="color:red;font-weight:bold;">Permanently delete record ${ref_no}?</span>`,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Yes, Delete',
    cancelButtonText: 'Cancel',
    customClass: { confirmButton: 'btn btn-danger', cancelButton: 'btn btn-secondary' },
    buttonsStyling: false,
  });

  if (!confirmDelete.isConfirmed) return;

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
    if (data.success) {
      Swal.fire({
        html: `<span style="color:white;font-weight:bold;">DELETED (${ref_no}) 🔴</span>`,
        icon: 'error',
        background: 'red',
        timer: 1500,
        showConfirmButton: false,
      });
      load();
    } else {
      Swal.fire('Error', data.error || 'Delete failed', 'error');
    }
  } catch {
    Swal.fire('Error', 'Server error', 'error');
  }
};

  /* ================= VIEW ================= */
  const handleView = (type, ref_no) => {
    const t = type?.toUpperCase();
    let route = "";

    if (t === "PACKAGE") route = "packages_view_deleted";
    else if (t === "HOTEL") route = "hotels_view_deleted";
    else if (t === "TICKETING") route = "ticket_view_deleted";
    else if (t === "TRANSPORT") route = "transport_view_deleted";
    else if (t === "ZIYARAT") route = "ziyarat_view_deleted";
    else if (t === "VISA") route = "visa_view_deleted";
    else if (t === "CARD") route = "card_view_deleted";
    else if (t === "PURCHASE") route = "purchase_view_deleted";
    else {
      alert("No view available");
      return;
    }

    onNavigate(route, ref_no);
  };

  /* ================= HELPERS ================= */
  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");
  const isPurchase = (t) => t?.toUpperCase() === "PURCHASE";
  const isSupplier = (t) => t?.toUpperCase() === "SUPPLIER";

  /* ================= UI ================= */
  return (
    <div className="container py-3" style={{ fontSize: "13px" }}>
      {/* HEADER */}
      <div
        className="mb-3 p-2 rounded-3 shadow text-white"
        style={{ background: "linear-gradient(135deg,#ff416c,#ff4b2b)" }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="fw-bold mb-0">🗑 Deleted Reports</h6>
          <button
            className="btn btn-light btn-sm fw-bold"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="card border-0 shadow-sm rounded-3 overflow-hidden">
        <div className="table-responsive">
          <table className="table table-sm table-hover align-middle mb-0">
            <thead style={{ background: "#f8f9fa", fontSize: "12px" }}>
              <tr className="text-secondary">
                <th>Type</th>
                <th>Ref</th>
                <th>Customer</th>
                <th>Date</th>
                <th className="text-end">Amount</th>
                <th className="text-center">View</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>
            <tbody style={{ fontSize: "12.5px" }}>
              {loading && (
                <tr>
                  <td colSpan="7" className="text-center py-3">⏳ Loading...</td>
                </tr>
              )}
              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center py-3 text-muted">
                    No deleted records
                  </td>
                </tr>
              )}
              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <span
                      className={`badge px-2 py-1 ${
                        isPurchase(r.type)
                          ? "bg-primary"
                          : isSupplier(r.type)
                          ? "bg-warning text-dark"
                          : "bg-danger"
                      }`}
                      style={{ fontSize: "11px" }}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td className="fw-bold">{r.ref_no}</td>
                  <td className="text-primary">{r.customer_name || "-"}</td>
                  <td>{formatDate(r.booking_date)}</td>
                  <td className="text-end fw-bold text-success">
                    {r.amount ? Number(r.amount).toLocaleString() : "-"}
                  </td>
                  {/* VIEW */}
                  <td className="text-center">
                    <button
                      className="btn btn-sm px-2 py-1"
                      style={{
                        background: "linear-gradient(135deg,#36d1dc,#5b86e5)",
                        color: "#fff",
                        fontSize: "11px",
                        borderRadius: 6
                      }}
                      onClick={() => handleView(r.type, r.ref_no)}
                    >
                      👁 View
                    </button>
                  </td>
                  {/* ACTIONS */}
                  <td className="text-center">
<button
  className="btn btn-outline-success btn-sm me-1"
  style={{ fontSize: "11px", padding: "2px 6px" }}
  onClick={() => restore(r.type, r.ref_no, r.customer_name, r.amount)}
>
  ♻ Restore
</button>

<button
  className="btn btn-outline-danger btn-sm"
  style={{ fontSize: "11px", padding: "2px 6px" }}
  onClick={() => permanentDelete(r.type, r.ref_no, r.customer_name, r.amount)}
>
  🗑 Delete
</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}