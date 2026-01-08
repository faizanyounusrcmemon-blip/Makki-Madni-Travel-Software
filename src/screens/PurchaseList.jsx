import React, { useEffect, useState, useMemo } from "react";

export default function PurchaseList({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* ===============================
     LOAD ON PAGE OPEN
  =============================== */
  useEffect(() => {
    loadList();
  }, []);

  /* ===============================
     AUTO SEARCH
  =============================== */
  useEffect(() => {
    const delay = setTimeout(() => {
      loadList();
    }, 400);
    return () => clearTimeout(delay);
  }, [from, to, search]);

  /* ===============================
     LOAD LIST
  =============================== */
  const loadList = async () => {
    setLoading(true);

    const qs = new URLSearchParams();
    if (from) qs.append("from", from);
    if (to) qs.append("to", to);
    if (search) qs.append("ref", search);

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/list?${qs.toString()}`
      );
      const data = await res.json();
      if (data.success) setRows(data.rows || []);
      else alert(data.error || "Failed to load list");
    } catch {
      alert("Server error");
    }

    setLoading(false);
  };

  /* ===============================
     DELETE (PASSWORD = 786)
  =============================== */
  const deletePurchase = async (refNo) => {
    const password = window.prompt("Enter delete password");

    if (!password) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/delete/${refNo}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ password }),
        }
      );

      const data = await res.json();

      if (data.success) {
        alert("Deleted successfully");
        loadList();
      } else {
        alert(data.error || "Delete failed");
      }
    } catch {
      alert("Server error");
    }
  };

  /* ===============================
     TOTALS
  =============================== */
  const totals = useMemo(() => {
    return rows.reduce(
      (acc, r) => {
        acc.sale += Number(r.sale_pkr || 0);
        acc.purchase += Number(r.purchase_pkr || 0);
        acc.profit += Number(r.profit || 0);
        return acc;
      },
      { sale: 0, purchase: 0, profit: 0 }
    );
  }, [rows]);

  /* ===============================
     FORMAT DATE AS 01/DEC/2025
  =============================== */
  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).toUpperCase(); // 01/DEC/2025
  };

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
        <h4 className="fw-bold mb-0">📄 Purchase List</h4>
      </div>

      {/* FILTER */}
      <div className="card shadow-sm mb-3">
        <div className="card-body">
          <div className="row g-2 align-items-end">
            <div className="col-md-3">
              <label className="form-label small">From</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>

            <div className="col-md-3">
              <label className="form-label small">To</label>
              <input
                type="date"
                className="form-control form-control-sm"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>

            <div className="col-md-4">
              <label className="form-label small">
                Ref No / Customer
              </label>
              <input
                className="form-control form-control-sm"
                placeholder="Type ref or customer name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="col-md-2">
              <button
                className="btn btn-primary btn-sm w-100"
                onClick={loadList}
              >
                🔍 Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover table-sm mb-0">
              <thead className="table-light">
                <tr>
                  <th>Ref No</th>
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

                {!loading && rows.length === 0 && (
                  <tr>
                    <td colSpan="7" className="text-center text-muted py-3">
                      No records found
                    </td>
                  </tr>
                )}

                {!loading &&
                  rows.map((r, i) => (
                    <tr key={i}>
                      <td className="fw-bold">{r.ref_no}</td>
                      <td className="fw-bold text-primary">
                        {r.customer_name || "-"}
                      </td>
                      <td>
                        <span className="badge bg-primary">
                          {Number(r.sale_pkr).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span className="badge bg-secondary">
                          {Number(r.purchase_pkr).toLocaleString()}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            Number(r.profit) >= 0
                              ? "bg-success"
                              : "bg-danger"
                          }`}
                        >
                          {Number(r.profit).toLocaleString()}
                        </span>
                      </td>
                      <td>{formatDate(r.created_at)}</td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <button
                            className="btn btn-outline-info"
                            onClick={() =>
                              onNavigate("purchase_detail", r.ref_no)
                            }
                          >
                            Detail
                          </button>
                          <button
                            className="btn btn-outline-danger"
                            onClick={() => deletePurchase(r.ref_no)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                {!loading && rows.length > 0 && (
                  <tr className="table-dark fw-bold">
                    <td colSpan={2} className="text-end">TOTAL</td>
                    <td>{totals.sale.toLocaleString()}</td>
                    <td>{totals.purchase.toLocaleString()}</td>
                    <td className={totals.profit >= 0 ? "text-success" : "text-danger"}>
                      {totals.profit.toLocaleString()}
                    </td>
                    <td colSpan={2}></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
