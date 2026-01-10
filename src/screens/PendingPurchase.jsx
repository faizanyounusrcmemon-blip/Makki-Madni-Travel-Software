import React, { useEffect, useState, useMemo } from "react";

// ================= DATE FORMAT HELPER =================
const formatDate = (d) => {
  const date = new Date(d);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-US", options); // 01/Dec/2025
};

export default function PendingPurchase({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const r = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/pending`
      );
      const d = await r.json();
      if (d.success) setRows(d.rows || []);
    } catch (err) {
      console.error("Error loading pending purchases:", err);
    }
  };

  // ================= FILTER ROWS =================
  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.ref_no.toLowerCase().includes(q) ||
        (r.customer_name || "").toLowerCase().includes(q)
    );
  }, [search, rows]);

  return (
    <div className="container p-3">
      <button
        className="btn btn-secondary btn-sm mb-3"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Back
      </button>

      <h4 className="fw-bold text-warning mb-3">
        ⚠️ Pending / Partial Purchases
      </h4>

      {/* ================= SEARCH BOX ================= */}
      <input
        type="text"
        placeholder="Search Ref No or Customer..."
        className="form-control form-control-sm mb-3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-responsive shadow-sm rounded">
        <table className="table table-bordered table-hover table-sm align-middle mb-0">
          <thead className="table-dark">
            <tr>
              <th>Ref No</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Note</th>
              <th>Sale Amount (PKR)</th>
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

                <td className="text-dark fw-semibold">
                  {r.customer_name || "-"}
                </td>

                <td>
                  {r.status === "PENDING" && (
                    <span className="badge bg-danger">Pending</span>
                  )}
                  {r.status === "PARTIAL" && (
                    <span className="badge bg-warning text-dark">Partial</span>
                  )}
                </td>

                <td>{r.note}</td>

                <td className="text-end fw-bold text-success">
                  {r.sale_pkr
                    ? Number(r.sale_pkr).toLocaleString("en-US")
                    : "0"}
                </td>

                <td>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onNavigate("purchase", r.ref_no)}
                  >
                    ➕ Complete Purchase
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
