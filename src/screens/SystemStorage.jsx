import React, { useEffect, useState } from "react";

export default function SystemStorage({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/system/capacity-rows`
      );
      const d = await res.json();

      if (!d.success) {
        setError(d.error || "Failed to load report");
      } else {
        setData(d);
      }
    } catch (err) {
      setError("Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading system storage report…</div>;
  if (error) return <div className="p-4 text-danger">{error}</div>;
  if (!data) return null;

  const usedPercent = Math.round((data.usedMB / data.dbLimitMB) * 100);

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
            <b>Used Storage:</b> {data.usedMB} MB
          </p>
          <p>
            <b>Free Storage:</b> {data.freeMB} MB
          </p>

          <div className="progress mb-2" style={{ height: 22 }}>
            <div
              className={`progress-bar ${
                usedPercent < 60
                  ? "bg-success"
                  : usedPercent < 80
                  ? "bg-warning"
                  : "bg-danger"
              }`}
              style={{ width: `${usedPercent}%` }}
            >
              {usedPercent}%
            </div>
          </div>

          <hr />

          <p className="mb-1">
            <b>Total Rows (All Tables):</b>{" "}
            {data.totalRows.toLocaleString()}
          </p>

          <p className="mb-1">
            <b>Average Row Size:</b> {data.avgRowKB} KB
          </p>

          <p className="fw-bold text-success mb-0">
            👉 Estimated More Rows Possible:{" "}
            {data.possibleMoreRows.toLocaleString()}
          </p>
        </div>
      </div>

      {/* TABLE ROW COUNTS */}
      <h5 className="fw-bold mb-2">📊 Table-wise Row Count</h5>

      <table className="table table-bordered table-sm">
        <thead className="table-dark">
          <tr>
            <th>Table</th>
            <th>Rows</th>
          </tr>
        </thead>
        <tbody>
          {data.tables.map((t) => (
            <tr key={t.table}>
              <td className="fw-bold">{t.table}</td>
              <td>{Number(t.rows).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="alert alert-info mt-3">
        ℹ️ Calculation logic:
        <br />
        <code>
          avg row size = used storage ÷ total rows
        </code>
        <br />
        <code>
          possible rows = free storage ÷ avg row size
        </code>
        <br />
        This is a <b>global estimate</b> based on current data pattern.
      </div>
    </div>
  );
}
