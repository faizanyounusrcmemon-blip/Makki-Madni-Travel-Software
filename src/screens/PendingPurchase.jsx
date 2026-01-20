import React, { useEffect, useState } from "react";

export default function PendingPurchase({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      setLoading(true);

      /* ===============================
         1️⃣ Pending / Partial Purchases
      =============================== */
      const pendingRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/pending`
      );
      const pendingData = await pendingRes.json();

      const pendingRows = pendingData.success
        ? pendingData.rows.map(r => ({
            ...r,
            source: "PENDING"
          }))
        : [];

      /* =====================================
         2️⃣ Completed BUT Supplier Missing
      ===================================== */
      const missingRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/missing-supplier`
      );
      const missingData = await missingRes.json();

      const missingRows = missingData.success
        ? missingData.rows.map(r => ({
            ...r,
            source: "MISSING_SUPPLIER"
          }))
        : [];

      /* ===============================
         3️⃣ Merge both results
      =============================== */
      const merged = [...pendingRows, ...missingRows];

      setRows(merged);
      setLoading(false);
    } catch (err) {
      console.error("LOAD PURCHASE ERROR:", err);
      setLoading(false);
    }
  };

  /* ================= FILTER ================= */
  const filteredRows = rows.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      String(r.ref_no).toLowerCase().includes(q) ||
      String(r.customer_name || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="container p-3">
      <button
        className="btn btn-secondary btn-sm mb-3"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Back
      </button>

      <h4 className="fw-bold text-warning mb-3">
        ⚠️ Pending / Supplier Missing Purchases
      </h4>

      <input
        type="text"
        placeholder="Search Ref No or Customer..."
        className="form-control form-control-sm mb-3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="text-center text-muted">Loading...</div>
      ) : (
        <div className="table-responsive shadow-sm rounded">
          <table className="table table-bordered table-hover table-sm align-middle mb-0">
            <thead className="table-dark">
              <tr>
                <th>Ref No</th>
                <th>Customer</th>
                <th>Status</th>
                <th>Note</th>
                <th className="text-end">Purchase Amount</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-success">
                    🎉 All purchases completed
                  </td>
                </tr>
              )}

              {filteredRows.map((r, i) => (
                <tr key={i}>
                  <td className="fw-bold text-primary">{r.ref_no}</td>
                  <td>{r.customer_name || "-"}</td>

                  <td>
                    {r.source === "PENDING" && r.status === "PENDING" && (
                      <span className="badge bg-danger">Pending</span>
                    )}
                    {r.source === "PENDING" && r.status === "PARTIAL" && (
                      <span className="badge bg-warning text-dark">
                        Partial
                      </span>
                    )}
                    {r.source === "MISSING_SUPPLIER" && (
                      <span className="badge bg-info text-dark">
                        Supplier Missing
                      </span>
                    )}
                  </td>

                  <td>{r.note}</td>

                  <td className="text-end fw-bold">
                    {Number(r.total_amount || r.purchase_pkr || 0).toLocaleString()}
                  </td>

                  <td>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => onNavigate("purchase", r.ref_no)}
                    >
                      ➕ Open Purchase
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
