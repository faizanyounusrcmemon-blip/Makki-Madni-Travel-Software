import React, { useEffect, useState, useMemo } from "react";

export default function PurchaseList({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadList();
  }, []);

  useEffect(() => {
    const t = setTimeout(loadList, 400);
    return () => clearTimeout(t);
  }, [from, to]);

  const loadList = async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (from) qs.append("from", from);
    if (to) qs.append("to", to);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/list?${qs}`
      );
      const data = await res.json();
      if (data.success) setRows(data.rows || []);
    } catch {
      alert("Server error");
    }
    setLoading(false);
  };

  const deletePurchase = async (refNo) => {
    const password = prompt("Enter delete password (786)");
    if (!password) return;

    const res = await fetch(
      `${import.meta.env.VITE_BACKEND_URL}/api/purchase/delete/${refNo}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      }
    );
    const data = await res.json();
    if (data.success) loadList();
    else alert(data.error || "Delete failed");
  };

  const filteredRows = useMemo(() => {
    if (!search) return rows;
    return rows.filter((r) =>
      Object.values(r).join(" ").toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  const totals = useMemo(() => {
    return filteredRows.reduce(
      (a, r) => {
        a.sale += +r.sale_pkr || 0;
        a.purchase += +r.purchase_pkr || 0;
        a.profit += +r.profit || 0;
        return a;
      },
      { sale: 0, purchase: 0, profit: 0 }
    );
  }, [filteredRows]);

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="container py-3">

      {/* HEADER */}
      <div
        className="p-3 rounded text-white mb-3"
        style={{ background: "linear-gradient(90deg,#0d6efd,#6610f2)" }}
      >
        <div className="d-flex justify-content-between align-items-center">
          <button
            className="btn btn-light btn-sm"
            onClick={() => onNavigate("dashboard")}
          >
            ⬅ Back
          </button>
          <h4 className="fw-bold mb-0">📄 Purchase List</h4>
        </div>
      </div>

      {/* FILTER */}
      <div className="card shadow-sm mb-2">
        <div className="card-body py-2">
          <div className="row g-2">
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
            <div className="col-md-6">
              <input
                className="form-control form-control-sm"
                placeholder="🔍 Search anything..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-responsive shadow rounded">
        <table className="table table-sm align-middle mb-0">
          <thead className="text-white" style={{ background: "#212529" }}>
            <tr>
              <th>Ref</th>
              <th>Customer</th>
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
                <td colSpan="7" className="text-center py-3">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && filteredRows.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center text-muted py-3">
                  No records found
                </td>
              </tr>
            )}

            {!loading &&
              filteredRows.map((r, i) => (
                <tr key={i}>
                  <td className="fw-bold">{r.ref_no}</td>

                  <td className="fw-semibold text-primary small">
                    {r.customer_name || "-"}
                  </td>

                  <td>
                    <span className="badge bg-primary">
                      {(+r.sale_pkr).toLocaleString()}
                    </span>
                  </td>

                  <td>
                    <span className="badge bg-secondary">
                      {(+r.purchase_pkr).toLocaleString()}
                    </span>
                  </td>

                  <td>
                    <span
                      className={`badge ${
                        +r.profit >= 0 ? "bg-success" : "bg-danger"
                      }`}
                    >
                      {(+r.profit).toLocaleString()}
                    </span>
                  </td>

                  <td className="small text-muted">
                    {fmtDate(r.created_at)}
                  </td>

                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-info me-1"
                      onClick={() =>
                        onNavigate("purchase_detail", r.ref_no)
                      }
                    >
                      Detail
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deletePurchase(r.ref_no)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

            {!loading && filteredRows.length > 0 && (
              <tr className="table-dark fw-bold">
                <td colSpan={2} className="text-end">
                  TOTAL
                </td>
                <td>{totals.sale.toLocaleString()}</td>
                <td>{totals.purchase.toLocaleString()}</td>
                <td
                  className={
                    totals.profit >= 0 ? "text-success" : "text-danger"
                  }
                >
                  {totals.profit.toLocaleString()}
                </td>
                <td colSpan={2}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
