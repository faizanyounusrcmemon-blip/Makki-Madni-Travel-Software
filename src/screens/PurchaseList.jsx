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

  // ===============================
  // LOAD LIST (FILTER + SEARCH)
  // ===============================
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

      if (data.success) {
        setRows(data.rows || []);
      } else {
        alert(data.error || "Failed to load list");
      }
    } catch (err) {
      alert("Server error");
    }

    setLoading(false);
  };

  // ===============================
  // DELETE PURCHASE (SOFT)
  // ===============================
  const deletePurchase = async (refNo) => {
    if (!window.confirm(`Delete purchase ${refNo}?`)) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/delete/${refNo}`,
        { method: "DELETE" }   // ✅ FIXED
      );
      const data = await res.json();

      if (data.success) {
        alert("Purchase deleted");
        loadList();
      } else {
        alert(data.error || "Delete failed");
      }
    } catch (err) {
      alert("Server error");
    }
  };

  return (
    <div className="container p-3">
      {/* TOP BAR */}
      <div className="d-flex justify-content-between mb-3">
        <button
          className="btn btn-secondary btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
        <h4>📄 Purchase List</h4>
      </div>

      {/* FILTERS */}
      <div className="row g-2 mb-3">
        <div className="col-md-3">
          <input
            type="date"
            className="form-control form-control-sm"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          />
        </div>

        <div className="col-md-3">
          <input
            type="date"
            className="form-control form-control-sm"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          />
        </div>

        <div className="col-md-4">
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
            Search
          </button>
        </div>
      </div>

      {/* TABLE */}
      <table className="table table-bordered table-sm">
        <thead className="table-dark">
          <tr>
            <th>Ref No</th>
            <th>Sale PKR</th>
            <th>Purchase PKR</th>
            <th>Profit</th>
            <th>Date</th>
            <th width="90">Action</th>
          </tr>
        </thead>

        <tbody>
          {loading && (
            <tr>
              <td colSpan="6" className="text-center">
                Loading...
              </td>
            </tr>
          )}

          {!loading && rows.length === 0 && (
            <tr>
              <td colSpan="6" className="text-center text-muted">
                No records found
              </td>
            </tr>
          )}

          {!loading &&
            rows.map((r, i) => (
              <tr key={i}>
                <td>{r.ref_no}</td>

                <td>{Number(r.sale_pkr).toLocaleString()}</td>

                <td>{Number(r.purchase_pkr).toLocaleString()}</td>

                <td
                  className={
                    Number(r.profit) >= 0
                      ? "text-success fw-bold"
                      : "text-danger fw-bold"
                  }
                >
                  {Number(r.profit).toLocaleString()}
                </td>

                <td>
                  {r.created_at
                    ? new Date(r.created_at).toLocaleDateString()
                    : ""}
                </td>

                <td>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deletePurchase(r.ref_no)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
