import React, { useEffect, useState } from "react";

export default function DeletedReports({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/deleted/list`
    );
    const data = await res.json();
    setLoading(false);

    if (data.success) setRows(data.rows);
  };

  useEffect(() => {
    load();
  }, []);

  // ♻ RESTORE
  const restore = async (type, ref_no) => {
    if (!window.confirm("Restore this record?")) return;

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/deleted/restore`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ref_no })
      }
    );

    const data = await res.json();
    if (data.success) load();
    else alert("Restore failed");
  };

  // 🗑 PERMANENT DELETE
  const permanentDelete = async (type, ref_no) => {
    const pass = prompt("Enter delete password");

    if (pass !== "7865") {
      alert("❌ Wrong password");
      return;
    }

    if (!window.confirm("PERMANENT DELETE? This cannot be undone!"))
      return;

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/deleted/permanent-delete`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, ref_no, password: pass })
      }
    );

    const data = await res.json();
    if (data.success) load();
    else alert(data.error || "Delete failed");
  };

  return (
    <div className="container p-3">
      <button
        className="btn btn-secondary btn-sm mb-2"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Back
      </button>

      <h4 className="text-danger fw-bold">🗑 Deleted Reports</h4>

      {loading && <p>Loading...</p>}

      <table className="table table-bordered table-sm mt-2">
        <thead className="table-dark">
          <tr>
            <th>Type</th>
            <th>Ref No</th>
            <th>Customer</th>
            <th>Date</th>
            <th style={{ width: 180 }}>Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="5" className="text-center text-muted">
                No deleted records
              </td>
            </tr>
          )}

          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.type}</td>
              <td>{r.ref_no}</td>
              <td>{r.customer_name}</td>
              <td>{new Date(r.created_at).toLocaleDateString()}</td>
              <td>
                <button
                  className="btn btn-success btn-sm me-1"
                  onClick={() => restore(r.type, r.ref_no)}
                >
                  ♻ Restore
                </button>

                <button
                  className="btn btn-danger btn-sm"
                  onClick={() =>
                    permanentDelete(r.type, r.ref_no)
                  }
                >
                  🗑 Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
