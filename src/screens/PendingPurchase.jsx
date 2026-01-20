import React, { useEffect, useState } from "react";

// ================= DATE FORMAT HELPER =================
const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-US", options); // 01/Dec/2025
};

export default function PendingPurchase({ onNavigate }) {
  const [pendingRows, setPendingRows] = useState([]);
  const [missingSupplierRows, setMissingSupplierRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingMissing, setLoadingMissing] = useState(false);
  const [activeTab, setActiveTab] = useState("pending"); // "pending" or "missing"

  useEffect(() => {
    loadPending();
    loadMissingSupplier();
  }, []);

  // ================= LOAD PENDING / PARTIAL =================
  const loadPending = async () => {
    try {
      setLoadingPending(true);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase/pending`);
      const data = await res.json();
      if (data.success) setPendingRows(data.rows);
      setLoadingPending(false);
    } catch (err) {
      console.error("Error loading pending purchases:", err);
      setLoadingPending(false);
    }
  };

  // ================= LOAD COMPLETED BUT MISSING SUPPLIER =================
  const loadMissingSupplier = async () => {
    try {
      setLoadingMissing(true);
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/purchase/missing-supplier`);
      const data = await res.json();
      if (data.success) setMissingSupplierRows(data.rows);
      setLoadingMissing(false);
    } catch (err) {
      console.error("Error loading missing supplier purchases:", err);
      setLoadingMissing(false);
    }
  };

  // ================= FILTER FUNCTION =================
  const filterRows = (rows) => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => {
      const ref = r.ref_no?.toLowerCase() || "";
      const customer = r.customer_name?.toLowerCase() || "";
      const supplier = r.supplier_name?.toLowerCase() || "";
      return ref.includes(q) || customer.includes(q) || supplier.includes(q);
    });
  };

  const pendingFiltered = filterRows(pendingRows);
  const missingFiltered = filterRows(missingSupplierRows);

  return (
    <div className="container p-3">
      <button
        className="btn btn-secondary btn-sm mb-3"
        onClick={() => onNavigate("dashboard")}
      >
        ⬅ Back
      </button>

      <h4 className="fw-bold text-warning mb-3">
        ⚠️ Purchase Overview
      </h4>

      {/* TAB SWITCH */}
      <div className="mb-3">
        <button
          className={`btn btn-sm me-2 ${activeTab === "pending" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("pending")}
        >
          Pending / Partial
        </button>
        <button
          className={`btn btn-sm ${activeTab === "missing" ? "btn-primary" : "btn-outline-primary"}`}
          onClick={() => setActiveTab("missing")}
        >
          Completed but Missing Supplier
        </button>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search Ref / Customer / Supplier..."
        className="form-control form-control-sm mb-3"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* ================= PENDING / PARTIAL TABLE ================= */}
      {activeTab === "pending" && (
        loadingPending ? (
          <div className="text-center text-muted">Loading Pending / Partial...</div>
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
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {pendingFiltered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-success">
                      🎉 All purchases completed
                    </td>
                  </tr>
                )}
                {pendingFiltered.map((r, i) => (
                  <tr key={i} className="align-middle">
                    <td className="fw-bold text-primary">{r.ref_no}</td>
                    <td className="text-dark fw-semibold">{r.customer_name || "-"}</td>
                    <td>
                      {r.status === "PENDING" && <span className="badge bg-danger">Pending</span>}
                      {r.status === "PARTIAL" && <span className="badge bg-warning text-dark">Partial</span>}
                    </td>
                    <td>{r.note}</td>
                    <td className="text-end fw-bold text-success">{r.sale_pkr ? Number(r.sale_pkr).toLocaleString("en-US") : "0"}</td>
                    <td className="text-end fw-bold text-primary">{r.purchase_pkr ? Number(r.purchase_pkr).toLocaleString("en-US") : "0"}</td>
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
        )
      )}

      {/* ================= MISSING SUPPLIER TABLE ================= */}
      {activeTab === "missing" && (
        loadingMissing ? (
          <div className="text-center text-muted">Loading Missing Supplier...</div>
        ) : (
          <div className="table-responsive shadow-sm rounded">
            <table className="table table-bordered table-hover table-sm align-middle mb-0">
              <thead className="table-dark">
                <tr>
                  <th>Ref No</th>
                  <th>Customer</th>
                  <th>Supplier Name</th>
                  <th>Supplier Code</th>
                  <th className="text-end">Total Amount (PKR)</th>
                  <th>Status</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {missingFiltered.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-success">
                      🎉 No missing suppliers
                    </td>
                  </tr>
                )}
                {missingFiltered.map((r, i) => (
                  <tr key={i} className="align-middle">
                    <td className="fw-bold text-primary">{r.ref_no}</td>
                    <td className="text-dark fw-semibold">{r.customer_name || "-"}</td>
                    <td className="text-dark fw-semibold">{r.supplier_name || "-"}</td>
                    <td className="text-dark fw-semibold">{r.supplier_code || "-"}</td>
                    <td className="text-end fw-bold text-primary">{r.total_amount ? Number(r.total_amount).toLocaleString("en-US") : "0"}</td>
                    <td><span className="badge bg-success">Complete</span></td>
                    <td>{r.note || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
