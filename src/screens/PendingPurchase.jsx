import React, { useEffect, useState } from "react";

// ================= DATE FORMAT HELPER =================
const formatDate = (d) => {
  const date = new Date(d);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-US", options); // 01/Dec/2025
};

export default function PendingPurchase({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      setLoading(true);
      // 1️⃣ Pending / Partial status
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/pending`
      );
      const data = await res.json();
      if (!data.success) return;

      const pendingRows = data.rows;

      // 2️⃣ Get sale/purchase amounts from /list for each ref
      const promises = pendingRows.map(async (r) => {
        const listRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/purchase/list?ref=${r.ref_no}`
        );
        const listData = await listRes.json();
        if (!listData.success || !listData.rows.length) return r;

        const entry = listData.rows[0]; // exact ref match
        return {
          ...r,
          sale_pkr: entry.sale_pkr || 0,
          purchase_pkr: entry.purchase_pkr || 0,
          profit: entry.profit || 0,
        };
      });

      const finalRows = await Promise.all(promises);
      setRows(finalRows);
      setLoading(false);
    } catch (err) {
      console.error("Error loading pending purchases:", err);
      setLoading(false);
    }
  };

  // ================= FILTER ROWS =================
  const filteredRows = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.ref_no.toLowerCase().includes(q) ||
      (r.customer_name || "").toLowerCase().includes(q)
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
        ⚠️ Pending / Partial Purchases
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
                <th className="text-end">Sale Amount (PKR)</th>
                <th className="text-end">Purchase Amount (PKR)</th>
                <th className="text-end">Profit (PKR)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan="8" className="text-center text-success">
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
                      <span className="badge bg-warning text-dark">
                        Partial
                      </span>
                    )}
                  </td>

                  <td>{r.note}</td>

                  <td className="text-end fw-bold text-success">
                    {r.sale_pkr
                      ? Number(r.sale_pkr).toLocaleString("en-US")
                      : "0"}
                  </td>

                  <td className="text-end fw-bold text-primary">
                    {r.purchase_pkr
                      ? Number(r.purchase_pkr).toLocaleString("en-US")
                      : "0"}
                  </td>

                  <td className="text-end fw-bold text-warning">
                    {r.profit ? Number(r.profit).toLocaleString("en-US") : "0"}
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
      )}
    </div>
  );
}
