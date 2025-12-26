import React, { useEffect, useState } from "react";

export default function SystemStorage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/system/capacity-rows`
    );
    const d = await res.json();
    if (d.success) setData(d);
    setLoading(false);
  };

  if (loading) return <div className="p-4">Loading system storage report…</div>;
  if (!data) return <div className="p-4 text-danger">Failed to load report</div>;

  return (
    <div className="container p-3">
      {/* BACK */}
      <button
        className="btn btn-secondary btn-sm mb-3"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Back
      </button>

      <h3 className="fw-bold mb-3">💾 System Storage Report</h3>

      {/* SUMMARY */}
      <div className="card shadow mb-3">
        <div className="card-body">
          <p>
            <b>Total Storage Limit:</b> {data.dbLimitMB} MB
          </p>
          <p>
            <b>Used:</b> {data.usedMB} MB
          </p>
          <p>
            <b>Remaining:</b> {data.remainingMB} MB
          </p>

          <div className="progress" style={{ height: 22 }}>
            <div
              className={`progress-bar ${
                data.usedMB / data.dbLimitMB < 0.6
                  ? "bg-success"
                  : data.usedMB / data.dbLimitMB < 0.8
                  ? "bg-warning"
                  : "bg-danger"
              }`}
              style={{
                width: `${Math.min(
                  100,
                  Math.round((data.usedMB / data.dbLimitMB) * 100)
                )}%`
              }}
            >
              {Math.round((data.usedMB / data.dbLimitMB) * 100)}%
            </div>
          </div>
        </div>
      </div>

      {/* TABLE REPORT */}
      <table className="table table-bordered table-sm">
        <thead className="table-dark">
          <tr>
            <th>Table</th>
            <th>Total Rows</th>
            <th>Table Size (MB)</th>
            <th>Avg Row Size (KB)</th>
            <th>Est. More Rows Possible</th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((r) => (
            <tr key={r.table}>
              <td className="fw-bold">{r.table}</td>
              <td>{r.totalRows.toLocaleString()}</td>
              <td>{r.tableMB}</td>
              <td>{r.avgRowKB}</td>
              <td>{r.possibleRows.toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="alert alert-info mt-3">
        ℹ️ Estimates are calculated as: <br />
        <code>
          remaining storage ÷ average row size
        </code>
        <br />
        Actual capacity may vary due to indexes, text fields & vacuum.
      </div>
    </div>
  );
}
