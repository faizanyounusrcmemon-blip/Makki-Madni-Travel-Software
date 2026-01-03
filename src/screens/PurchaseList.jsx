import React, { useEffect, useState } from "react";

export default function PurchaseList({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [ref, setRef] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadList();
  }, []);

  /* ===============================
     LOAD LIST
  =============================== */
  const loadList = async () => {
    setLoading(true);

    const qs = new URLSearchParams();
    if (from) qs.append("from", from);
    if (to) qs.append("to", to);
    if (ref) qs.append("ref", ref);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/list?${qs.toString()}`
      );
      const data = await res.json();
      if (data.success) setRows(data.rows || []);
      else alert(data.error || "Failed to load list");
    } catch {
      alert("Server error");
    }

    setLoading(false);
  };

  /* ===============================
     DELETE
  =============================== */
  const deletePurchase = async (refNo) => {
    if (!window.confirm(`Delete purchase ${refNo}?`)) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/delete/${refNo}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (data.success) loadList();
      else alert(data.error || "Delete failed");
    } catch {
      alert("Server error");
    }
  };

  return (
    <div className="container py-4">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
        <h4 className="fw-bold mb-0">📄 Purchase List</h4>
      </div>

      {/* FILTER CARD */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label small">From</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label small">To</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small">Ref No</label>
              <input
                className="form-control form-control-sm"
                placeholder="Search Ref No"
                value={ref}
                onChange={(e) => setRef(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <button
                className="btn btn-primary btn-sm w-100"
                onClick={loadList}
              >
                🔍 Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0">
              <thead className="table-light">
                <tr>
                  <th>Ref No</th>
                  <th>Sale</th>
                  <th>Purchase</th>
                  <th>Profit</th>
                  <th>Date</th>
                  <th className="text-center">Action</th>
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
                    <td colSpan="6" className="text-center text-muted py-3">
                      No records found
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((r, i) => (
                    <tr key={i}>
                      <td className="fw-bold">{r.ref_no}</td>

                      <td>
                        <span className="badge bg-primary">
                          {Number(r.sale_pkr).toLocaleString()}
                        </span>
                      </td>

                      <td>
                        <span className="badge bg-secondary">
                          {Number(r.purchase_pkr).toLocaleString()}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`badge ${
                            Number(r.profit) >= 0
                              ? "bg-success"
                              : "bg-danger"
                          }`}
                        >
                          {Number(r.profit).toLocaleString()}
                        </span>
                      </td>

                      <td>
                        {r.created_at
                          ? new Date(r.created_at).toLocaleDateString("en-GB")
                          : ""}
                      </td>

                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-info"
                            onClick={() =>
                              onNavigate("purchase_detail", r.ref_no)
                            }
                          >
                            Detail
                          </button>

                          <button
                            className="btn btn-outline-danger"
                            onClick={() => deletePurchase(r.ref_no)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
}
