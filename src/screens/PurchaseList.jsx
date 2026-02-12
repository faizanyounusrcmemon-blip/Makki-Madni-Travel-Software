import React, { useEffect, useState, useMemo } from "react";

export default function PurchaseList({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showProfit, setShowProfit] = useState(false);

  useEffect(() => {
    loadList();
  }, []);

  useEffect(() => {
    const t = setTimeout(loadList, 400);
    return () => clearTimeout(t);
  }, [from, to]);

  /* ================= LOAD ================= */
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

  /* ================= DELETE ================= */
  const deletePurchase = async (refNo, customer_name) => {
    const password = prompt(
      `DELETE PURCHASE\nREF NO: ${refNo}\nCustomer: ${customer_name}\n\nEnter password`
    );
    if (!password) return;

    if (
      !window.confirm(
        `Confirm delete?\nREF NO: ${refNo}\nCustomer: ${customer_name}\n\nThis will move to deleted list`
      )
    )
      return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/delete/${refNo}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, customer_name }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert(`✅ Deleted\nREF NO: ${refNo}\nCustomer: ${customer_name}`);
        loadList();
      } else {
        alert(data.error || "Delete failed");
      }
    } catch {
      alert("Server error");
    }
  };

  /* ================= FILTER ================= */
  const filteredRows = useMemo(() => {
    if (!search) return rows;
    return rows.filter((r) =>
      Object.values(r).join(" ").toLowerCase().includes(search.toLowerCase())
    );
  }, [rows, search]);

  /* ================= TOTALS ================= */
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

  /* ================= FORMAT ================= */
  const fmtDate = (d) => {
    if (!d) return "-";
    return new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const fmtPKR = (v) => {
    if (!v) return "0";
    return Number(v).toLocaleString("en-PK");
  };

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
          <h4 className="fw-bold mb-0">🛒 Purchase List</h4>
        </div>
      </div>

      {/* FILTER */}
      <div className="card shadow-sm mb-2">
        <div className="card-body py-2">
          <div className="row g-2 align-items-end">
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
                placeholder="🔍 Search anything..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <div className="form-check mt-1">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="showProfit"
                  checked={showProfit}
                  onChange={(e) => setShowProfit(e.target.checked)}
                />
                <label
                  className="form-check-label fw-semibold"
                  htmlFor="showProfit"
                >
                  Show Profit
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="table-responsive shadow rounded">
        <table className="table table-sm align-middle mb-0">
          <thead className="text-white" style={{ background: "#212529" }}>
            <tr>
              <th>SR#</th>
              <th>Ref</th>
              <th>Customer</th>
              <th>Sale</th>
              <th>Purchase</th>
              {showProfit && <th>Profit</th>}
              <th>Date</th>
              <th className="text-center">Action</th>
            </tr>
          </thead>

          <tbody>
            {loading && (
              <tr>
                <td colSpan={showProfit ? 8 : 7} className="text-center py-3">
                  Loading...
                </td>
              </tr>
            )}

            {!loading && filteredRows.length === 0 && (
              <tr>
                <td colSpan={showProfit ? 8 : 7} className="text-center text-muted py-3">
                  No records found
                </td>
              </tr>
            )}

            {!loading &&
              filteredRows.map((r, i) => (
                <tr key={i}>
                  <td className="fw-bold text-muted">{i + 1}</td>
                  <td className="fw-bold">{r.ref_no}</td>
                  <td className="fw-semibold text-primary small">
                    {r.customer_name || "-"}
                  </td>
                  <td>
                    <span className="badge bg-success">💰 {fmtPKR(r.sale_pkr)}</span>
                  </td>
                  <td>
                    <span className="badge bg-secondary">🛒 {fmtPKR(r.purchase_pkr)}</span>
                  </td>
                  {showProfit && (
                    <td>
                      <span
                        className={`badge ${+r.profit >= 0 ? "bg-primary" : "bg-danger"}`}
                      >
                        {fmtPKR(r.profit)}
                      </span>
                    </td>
                  )}
                  <td className="small text-muted">{fmtDate(r.created_at)}</td>
                  <td className="text-center">
                    <button
                      className="btn btn-sm btn-outline-info me-1"
                      onClick={() => onNavigate("purchase_detail", r.ref_no)}
                    >
                      Detail
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deletePurchase(r.ref_no, r.customer_name)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}

            {!loading && filteredRows.length > 0 && (
              <tr className="table-dark fw-bold">
                <td colSpan={3} className="text-end">
                  TOTAL
                </td>
                <td>{fmtPKR(totals.sale)}</td>
                <td>{fmtPKR(totals.purchase)}</td>
                {showProfit && (
                  <td className={totals.profit >= 0 ? "text-primary" : "text-danger"}>
                    {fmtPKR(totals.profit)}
                  </td>
                )}
                <td colSpan={showProfit ? 2 : 2}></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
