import React, { useEffect, useState } from "react";

export default function DeletedReports({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/deleted/list`
      );
      const data = await res.json();
      if (data.success) setRows(data.rows || []);
    } catch (err) {
      console.error("Load deleted reports error", err);
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
    if (!window.confirm("Restore this record?")) return;

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
      alert("Record restored");
      load();
    } else {
      alert(data.error || "Restore failed");
    }
  };

  /* ================= PERMANENT DELETE ================= */
  const permanentDelete = async (type, ref_no) => {
    const pass = prompt("Enter permanent delete password");
    if (pass !== "7865") {
      alert("Wrong password");
      return;
    }

    if (
      !window.confirm(
        "PERMANENT DELETE?\nThis action cannot be undone!"
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
      alert("Record permanently deleted");
      load();
    } else {
      alert(data.error || "Delete failed");
    }
  };

  /* ================= DATE FORMAT ================= */
  const formatDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="card shadow-sm border-0 mb-3">
        <div
          className="card-body d-flex justify-content-between align-items-center"
          style={{
            background: "linear-gradient(135deg, #dc3545, #6f0000)",
            color: "#fff",
            borderRadius: "12px",
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
          <table className="table table-hover table-sm mb-0 align-middle">
            <thead className="table-light">
              <tr>
                <th>Type</th>
                <th>Ref No</th>
                <th>Customer</th>
                <th>Date</th>
                <th className="text-center" style={{ width: 200 }}>
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {loading && (
                <tr>
                  <td colSpan="5" className="text-center py-3">
                    Loading...
                  </td>
                </tr>
              )}

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan="5" className="text-center text-muted py-3">
                    No deleted records
                  </td>
                </tr>
              )}

              {rows.map((r, i) => (
                <tr key={i}>
                  <td>
                    <span className="badge bg-danger">
                      {r.type}
                    </span>
                  </td>
                  <td className="fw-bold">{r.ref_no}</td>
                  <td className="fw-semibold text-primary">
                    {r.customer_name || "-"}
                  </td>
                  <td className="text-muted">
                    {formatDate(r.created_at)}
                  </td>
                  <td className="text-center">
                    <button
                      className="btn btn-outline-success btn-sm me-1"
                      onClick={() => restore(r.type, r.ref_no)}
                    >
                      RESTORE
                    </button>

                    <button
                      className="btn btn-outline-danger btn-sm"
                      onClick={() =>
                        permanentDelete(r.type, r.ref_no)
                      }
                    >
                      DELETE
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
