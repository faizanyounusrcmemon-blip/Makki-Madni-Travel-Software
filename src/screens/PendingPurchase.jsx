import React, { useEffect, useState } from "react";

// ================= DATE FORMAT =================
const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function PendingPurchase({ onNavigate }) {
  const [pendingRows, setPendingRows] = useState([]);
  const [missingRows, setMissingRows] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAll();

  }, []);



  // ================= MAIN LOADER =================
  const loadAll = async () => {
    try {
      setLoading(true);

      // Pending + Missing + Reports parallel fetch
      const [pendingRes, missingRes, reportRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase/pending`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase/missing-supplier`),
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/all`)
      ]);

      const [pendingData, missingData, reportData] = await Promise.all([
        pendingRes.json(),
        missingRes.json(),
        reportRes.json()
      ]);

      const pendingBase = pendingData.success ? pendingData.rows : [];
      const missingBase = missingData.success ? missingData.rows : [];
      console.log("Pending Data:", pendingData);
      console.log("Pending Rows:", pendingData.rows);

      // Sale map
      const saleMap = {};
      reportData.forEach((r) => {
        saleMap[r.ref_no] = r.total_pkr || 0;
      });

      // Attach purchase + sale amounts per row
      const attachAmounts = async (rows) =>
        Promise.all(
          rows.map(async (r) => {
            let purchase_pkr = 0;
            try {
              const listRes = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/purchase/list?ref=${r.ref_no}`
              );
              const listData = await listRes.json();
              if (listData.success && listData.rows.length) {
                purchase_pkr = listData.rows[0].purchase_pkr || 0;
              }
            } catch (err) {
              console.error(err);
            }
            return { ...r, sale_pkr: saleMap[r.ref_no] || 0, purchase_pkr };
          })
        );

      // Pending + Missing rows with amounts parallel
      const [pendingRowsWithAmounts, missingRowsWithAmounts] = await Promise.all([
        attachAmounts(pendingBase),
        attachAmounts(missingBase)
      ]);

      setPendingRows(pendingRowsWithAmounts);
      setMissingRows(missingRowsWithAmounts);

      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  // ================= FILTER =================
  const filterRows = (rows) => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) =>
        r.ref_no?.toLowerCase().includes(q) ||
        r.customer_name?.toLowerCase().includes(q)
    );
  };

  const rows =
    activeTab === "pending"
      ? filterRows(pendingRows)
      : filterRows(missingRows);

  // ================= UI =================
  return (
    <div className="container p-3">
      <button
        className="btn btn-secondary btn-sm mb-3"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Back
      </button>

      <h4 className="fw-bold text-warning mb-3">⚠️ Purchase Overview</h4>

      {/* TABS */}
      <div className="mb-3">
        <button
          className={`btn btn-sm me-2 ${
            activeTab === "pending" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setActiveTab("pending")}
        >
          Pending / Partial
        </button>

        <button
          className={`btn btn-sm ${
            activeTab === "missing" ? "btn-primary" : "btn-outline-primary"
          }`}
          onClick={() => setActiveTab("missing")}
        >
          Missing Supplier
        </button>
      </div>

      {/* SEARCH */}
      <input
        className="form-control form-control-sm mb-3"
        placeholder="Search Ref / Customer..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* LOADING SPINNER */}
      {loading ? (
        <div className="text-center my-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-2 text-muted">Please wait, loading data...</div>
        </div>
      ) : (
        <div className="table-responsive shadow-sm rounded">
          <table className="table table-bordered table-hover table-sm align-middle">
            <thead className="table-dark">
              <tr>
                <th>Ref No</th>
                <th>Customer</th>
                {activeTab === "missing" && <th>Supplier</th>}
                <th>Status</th>
                <th className="text-end">Sale (PKR)</th>
                <th className="text-end">Purchase (PKR)</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan="7" className="text-center text-success">
                    🎉 No records
                  </td>
                </tr>
              )}

              {rows.map((r, i) => (
<tr
  key={i}
  className={
    r.purchase_status === "PENDING"
      ? "table-danger"
      : r.purchase_status === "PARTIAL"
      ? "table-warning"
      : ""
  }
>
                  <td className="fw-bold text-primary">{r.ref_no}</td>
                  <td>{r.customer_name || "-"}</td>

                  {activeTab === "missing" && (
                    <td className="text-danger fw-bold">
                      {r.supplier_name || "MISSING"}
                    </td>
                  )}

<td>
  {activeTab === "pending" && (
    <>
      {r.purchase_status === "PENDING" && (
        <span className="badge bg-danger">
          Pending
        </span>
      )}

      {r.purchase_status === "PARTIAL" && (
        <span className="badge bg-warning text-dark">
          Partial
        </span>
      )}

      {r.purchase_status === "COMPLETE" && (
        <span className="badge bg-success">
          Complete
        </span>
      )}
    </>
  )}

  {activeTab === "missing" && (
    <span className="badge bg-success">
      Complete
    </span>
  )}
</td>

                  <td className="text-end text-success fw-bold">
                    {Number(r.sale_pkr).toLocaleString("en-US")}
                  </td>

                  <td className="text-end text-primary fw-bold">
                    {Number(r.purchase_pkr).toLocaleString("en-US")}
                  </td>

<td>
  {activeTab === "pending" ? (
    <button
      className={`btn btn-sm ${
        r.purchase_status === "PENDING"
          ? "btn-danger"
          : "btn-warning"
      }`}
      onClick={() => onNavigate("purchase", r.ref_no)}
    >
      {r.purchase_status === "PENDING"
        ? "➕ Start Purchase"
        : "✏ Complete Purchase"}
    </button>
  ) : (
    <span className="text-muted">—</span>
  )}
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
