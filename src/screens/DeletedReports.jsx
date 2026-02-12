import React, { useEffect, useState } from "react";

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
  const restore = async (type, ref_no) => {
    const pass = prompt(
      `RESTORE RECORD\nREF NO: ${ref_no}\n\nEnter password`
    );

    if (pass !== "7865") {
      alert("Wrong password");
      return;
    }

    if (!window.confirm(`Confirm restore?\nREF NO: ${ref_no}`)) return;

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/deleted/restore`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ref_no }),
      }
    );

    const data = await res.json();
    if (data.success) {
      alert(`✅ Restored\nREF NO: ${ref_no}`);
      load();
    } else {
      alert(data.error || "Restore failed");
    }
  };

  /* ================= DELETE ================= */
  const permanentDelete = async (type, ref_no) => {
    const pass = prompt(
      `PERMANENT DELETE ⚠\nREF NO: ${ref_no}\n\nEnter password`
    );

    if (pass !== "7865") {
      alert("Wrong password");
      return;
    }

    if (
      !window.confirm(
        `FINAL WARNING ⚠\nThis cannot be undone!\nREF NO: ${ref_no}`
      )
    )
      return;

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/deleted/permanent-delete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ref_no, password: pass }),
      }
    );

    const data = await res.json();
    if (data.success) {
      alert(`🔥 Permanently deleted\nREF NO: ${ref_no}`);
      load();
    } else {
      alert(data.error || "Delete failed");
    }
  };

  /* ================= FORMAT ================= */
  const formatDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-GB");
  };

  const formatPKR = (v) => {
    if (v === null || v === undefined) return "-";
    return Number(v).toLocaleString("en-PK") + " PKR";
  };

  const isPurchase = (t) => t === "PURCHASE";

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="card shadow-sm border-0 mb-3">
        <div
          className="card-body d-flex justify-content-between align-items-center"
          style={{
            background: "linear-gradient(135deg, #dc3545, #6f0000)",
            color: "#fff",
            borderRadius: 12,
          }}
        >
          <h5 className="fw-bold mb-0">Deleted Reports</h5>
          <button
            className="btn btn-light btn-sm"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0">
            <thead className="table-light">
              <tr>
                <th>Type</th>
                <th>Ref</th>
                <th>Customer</th>
                <th>Date</th>
                <th className="text-end">Amount PKR</th>
                <th className="text-center">Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="6" className="text-center py-3">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-3 text-muted">
                    No deleted records
                  </td>
                </tr>
              )}

              {rows.map((r, i) => (
                <tr key={i}>
                  {/* TYPE */}
                  <td>
                    <span
                      className={`badge ${
                        isPurchase(r.type)
                          ? "bg-primary"
                          : "bg-danger"
                      }`}
                    >
                      {isPurchase(r.type) ? "🛒" : "💰"} {r.type}
                    </span>
                  </td>

                  {/* REF */}
                  <td className="fw-bold">{r.ref_no}</td>

                  {/* CUSTOMER */}
                  <td className="fw-semibold text-primary">
                    {r.customer_name || "-"}
                  </td>

                  {/* DATE */}
                  <td className="text-muted">
                    {formatDate(r.booking_date)}
                  </td>

                  {/* AMOUNT */}
                  <td className="text-end fw-bold">
                    {formatPKR(r.amount)}
                  </td>

                  {/* ACTIONS */}
                  <td className="text-center">
                    <button
                      className="btn btn-outline-success btn-sm me-1"
                      onClick={() => restore(r.type, r.ref_no)}
                    >
                      Restore
                    </button>

                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() =>
                        permanentDelete(r.type, r.ref_no)
                      }
                    >
                      Delete
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
