import React, { useState, useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

/* ================= FORMAT ================= */
const fmt = (v) =>
  Number(v || 0).toLocaleString("en-US");

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB");
};

export default function ItemLossZeroReport({ onNavigate }) {
  const [data, setData] = useState([]);
  const [activeTab, setActiveTab] = useState("loss");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  /* ================= LOAD ================= */
  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch(
        `${BACKEND_URL}/api/reports/supplier-purchase`
      );

      if (!res.ok) throw new Error("Failed to fetch data");

      const json = await res.json();
      if (!json.success) throw new Error("API error");

      const rows = (json.rows || []).map((r) => ({
        ...r,
        profit:
          Number(r.sale_pkr || 0) -
          Number(r.purchase_pkr || 0),
      }));

      setData(rows);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  /* ================= SEARCH ================= */
  const filterRows = (rows) => {
    if (!search) return rows;
    const q = search.toLowerCase();

    return rows.filter(
      (r) =>
        r.ref_no?.toLowerCase().includes(q) ||
        r.item?.toLowerCase().includes(q) ||
        r.supplier_name?.toLowerCase().includes(q)
    );
  };

  /* ================= SPLIT ================= */
  const lossData = filterRows(
    data.filter((d) => d.profit < 0)
  );

  const zeroData = filterRows(
    data.filter((d) => d.profit === 0)
  );

  const rows =
    activeTab === "loss" ? lossData : zeroData;

  /* ================= TABLE ================= */
  const renderTable = () => (
    <div className="table-responsive shadow-sm rounded">
      <table className="table table-hover table-sm align-middle text-center compact-table mb-0">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Ref</th>
            <th>Item</th>
            <th>Supplier</th>

            <th>Sale SAR</th>
            <th>Rate</th>
            <th>Sale PKR</th>

            <th>Purchase SAR</th>
            <th>Rate</th>
            <th>Purchase PKR</th>

            <th>Profit</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan="12" className="py-4 text-muted">
                No Records Found
              </td>
            </tr>
          )}

          {rows.map((r, i) => (
            <tr key={r.id || i}>
              <td>{i + 1}</td>

              <td className="fw-bold text-primary">
                {r.ref_no}
              </td>

              <td
                title={r.item}
                className="fw-semibold text-nowrap"
              >
                {r.item}
              </td>

              <td
                title={r.supplier_name}
                className="text-nowrap"
              >
                {r.supplier_name}
              </td>

              <td className="text-end">
                {fmt(r.sale_sar)}
              </td>

              <td className="text-end">
                {fmt(r.sale_rate)}
              </td>

              <td className="text-end text-success fw-bold">
                {fmt(r.sale_pkr)}
              </td>

              <td className="text-end">
                {fmt(r.purchase_sar)}
              </td>

              <td className="text-end">
                {fmt(r.purchase_rate)}
              </td>

              <td className="text-end text-primary fw-bold">
                {fmt(r.purchase_pkr)}
              </td>

              <td>
                {r.profit < 0 ? (
                  <span className="badge bg-danger">
                    LOSS {fmt(r.profit)}
                  </span>
                ) : (
                  <span className="badge bg-warning text-dark">
                    ZERO {fmt(r.profit)}
                  </span>
                )}
              </td>

              <td>{formatDate(r.booking_date)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  /* ================= LOADING ================= */
  if (loading)
    return (
      <div className="text-center p-5">
        <div className="spinner-border text-primary"></div>
        <div className="mt-2 text-muted">
          Loading report...
        </div>
      </div>
    );

  if (error)
    return (
      <div className="text-center text-danger p-5 fw-bold">
        {error}
      </div>
    );

  /* ================= UI ================= */
  return (
    <div className="container-fluid py-3">

      {/* HEADER */}
      <div className="card shadow-sm border-0 mb-3">
        <div
          className="card-body d-flex justify-content-between align-items-center"
          style={{
            background:
              "linear-gradient(135deg,#0d6efd,#6610f2)",
            color: "#fff",
            borderRadius: "10px",
          }}
        >
          <h5 className="fw-bold mb-0">
            📊 Item Profit Analysis
          </h5>

          <button
            className="btn btn-light btn-sm"
            onClick={() => onNavigate("dashboard")}
          >
            ← Back
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="mb-3">
        <button
          className={`btn btn-sm me-2 ${
            activeTab === "loss"
              ? "btn-danger"
              : "btn-outline-danger"
          }`}
          onClick={() => setActiveTab("loss")}
        >
          🔻 Loss Items ({lossData.length})
        </button>

        <button
          className={`btn btn-sm ${
            activeTab === "zero"
              ? "btn-warning"
              : "btn-outline-warning"
          }`}
          onClick={() => setActiveTab("zero")}
        >
          ⚖ Zero Profit ({zeroData.length})
        </button>
      </div>

      {/* SEARCH */}
      <input
        className="form-control form-control-sm mb-3"
        placeholder="Search Ref / Item / Supplier..."
        value={search}
        onChange={(e) =>
          setSearch(e.target.value)
        }
      />

      {renderTable()}
    </div>
  );
}
