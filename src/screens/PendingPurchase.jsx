import React, { useEffect, useState } from "react";

// ================= DATE FORMAT HELPER =================
const formatDate = (d) => {
  const date = new Date(d);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-US", options); // 01/Dec/2025
};

export default function PendingPurchase({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPending();
  }, []);

  const loadPending = async () => {
    try {
      setLoading(true);

      // 1️⃣ Pending / Partial refs
      const pendingRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/pending`
      );
      const pendingData = await pendingRes.json();
      if (!pendingData.success) return;

      const pendingRows = pendingData.rows;

      // 2️⃣ Sale amounts from /reports/all
      const reportsRes = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/reports/all`
      );
      const reportsData = await reportsRes.json();

      // Map sale amount by ref_no
      const saleMap = {};
      reportsData.forEach((r) => {
        saleMap[r.ref_no] = r.total_pkr || 0;
      });

      // 3️⃣ Merge with purchase amounts from /list
      const promises = pendingRows.map(async (r) => {
        // Purchase amount
        const listRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/purchase/list?ref=${r.ref_no}`
        );
        const listData = await listRes.json();
        let purchase_pkr = 0;
        let missingSupplier = false;

        if (listData.success && listData.rows.length) {
          const row = listData.rows[0];
          purchase_pkr = row.purchase_pkr || 0;

          // Check if supplier name or code missing
          if (!row.supplier_name || !row.supplier_code) {
            missingSupplier = true;
          }
        }

        // Sale amount from reports
        const sale_pkr = saleMap[r.ref_no] || 0;

        return {
          ...r,
          sale_pkr,
          purchase_pkr,
          missingSupplier, // ✅ new field
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
    const ref = typeof r.ref_no === "string" ? r.ref_no.toLowerCase() : "";
    const name = typeof r.customer_name === "string" ? r.customer_name.toLowerCase() : "";
    return ref.includes(q) || name.includes(q);
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
                <th>Missing Supplier Info</th> {/* ✅ New Column */}
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
                <tr key={i} className="align-middle">
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
                    {r.sale_pkr ? Number(r.sale_pkr).toLocaleString("en-US") : "0"}
                  </td>

                  <td className="text-end fw-bold text-primary">
                    {r.purchase_pkr ? Number(r.purchase_pkr).toLocaleString("en-US") : "0"}
                  </td>

                  <td>
                    {r.missingSupplier ? (
                      <span className="badge bg-danger">Missing</span>
                    ) : (
                      <span className="text-success">✔️</span>
                    )}
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
