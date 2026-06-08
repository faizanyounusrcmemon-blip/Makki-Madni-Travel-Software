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
      if (!d.success) setError(d.error || "Failed to load report");
      else setData(d);
    } catch {
      setError("Server not reachable");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading system storage…</div>;
  if (error) return <div className="p-4 text-danger">{error}</div>;
  if (!data) return null;

  const usedPercent = Math.round((data.usedMB / data.dbLimitMB) * 100);

const uniqueTables = Object.values(
  data.tables.reduce((acc, item) => {
    if (!acc[item.table]) {
      acc[item.table] = {
        table: item.table,
        rows: Number(item.rows || 0),
      };
    } else {
      acc[item.table].rows += Number(item.rows || 0);
    }
    return acc;
  }, {})
);



  return (
    <div className="container py-3">

      {/* HEADER */}
      <div
        className="p-3 rounded text-white mb-3 shadow"
        style={{ background: "linear-gradient(90deg,#0d6efd,#6610f2)" }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <h4 className="fw-bold mb-0">💾 System Storage Report</h4>
          <button
            className="btn btn-light btn-sm"
            onClick={() => onNavigate("dashboard")}
          >
            ⬅ Back
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS */}
      <div className="row g-3 mb-3">
        <div className="col-md-4">
          <div className="card shadow text-white"
            style={{ background: "linear-gradient(135deg,#0d6efd,#0dcaf0)" }}>
            <div className="card-body">
              <small>Total Limit</small>
              <h4>{data.dbLimitMB} MB</h4>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow text-white"
            style={{ background: "linear-gradient(135deg,#fd7e14,#ffc107)" }}>
            <div className="card-body">
              <small>Used Storage</small>
              <h4>{data.usedMB} MB</h4>
            </div>
          </div>
        </div>

        <div className="col-md-4">
          <div className="card shadow text-white"
            style={{ background: "linear-gradient(135deg,#198754,#20c997)" }}>
            <div className="card-body">
              <small>Free Storage</small>
              <h4>{data.freeMB} MB</h4>
            </div>
          </div>
        </div>
      </div>

      {/* USAGE BAR */}
      <div className="card shadow mb-3">
        <div className="card-body">
          <h6 className="fw-bold mb-2">📊 Storage Usage</h6>
          <div className="progress" style={{ height: 22 }}>
            <div
              className={`progress-bar fw-bold ${
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

          <div className="row text-center">
            <div className="col">
              <small>Total Rows</small>
              <div className="fw-bold">
                {data.totalRows.toLocaleString()}
              </div>
            </div>
            <div className="col">
              <small>Avg Row Size</small>
              <div className="fw-bold">{data.avgRowKB} KB</div>
            </div>
            <div className="col">
              <small>More Rows Possible</small>
              <div className="fw-bold text-success">
                {data.possibleMoreRows.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow mb-3">
        <div className="card-header fw-bold">
          📋 Table-wise Row Count
        </div>
        <div className="table-responsive">
          <table className="table table-hover table-sm mb-0">
            <thead className="table-dark">
              <tr>
                <th>Table</th>
                <th>Rows</th>
              </tr>
            </thead>
<tbody>
  {data.tables.map((t, i) => (
    <tr key={`${t.table}-${i}`}>
      <td className="fw-semibold">{t.table}</td>
      <td>{Number(t.rows).toLocaleString()}</td>
    </tr>
  ))}
</tbody>
          </table>
        </div>
      </div>

      {/* INFO */}
      <div className="alert alert-info shadow-sm">
        <b>ℹ️ Calculation Logic</b>
        <div className="small mt-1">
          avg row size = used storage ÷ total rows <br />
          possible rows = free storage ÷ avg row size <br />
          <span className="fw-bold">
            This is an estimated value based on current data.
          </span>
        </div>
      </div>
    </div>
  );
}
