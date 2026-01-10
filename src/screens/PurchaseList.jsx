import React, { useEffect, useState, useMemo } from "react";

export default function PurchaseList({ onNavigate }) {
  const [rows, setRows] = useState([]);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= LOAD ================= */
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
      else alert(data.error || "Failed");
    } catch {
      alert("Server error");
    }
    setLoading(false);
  };

  /* ================= DELETE ================= */
  const deletePurchase = async (refNo) => {
    const password = prompt("Enter delete password (786)");
    if (!password) return;

    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/purchase/delete/${refNo}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password }),
        }
      );
      const data = await res.json();

      if (data.success) {
        alert("✅ Deleted");
        loadList();
      } else {
        alert(data.error || "Delete failed");
      }
    } catch {
      alert("Server error");
    }
  };

  /* ================= GLOBAL SEARCH ================= */
  const filteredRows = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) =>
      [
        r.ref_no,
        r.customer_name,
        r.sale_pkr,
        r.purchase_pkr,
        r.profit,
        r.created_at,
      ]
        .join(" ")
        .toLowerCase()
        .includes(q)
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

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

  return (
    <div className="container py-3">
      {/* HEADER */}
      <div className="d-flex justify-content-between mb-2">
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
        <h5 className="fw-bold mb-0">📄 Purchase List</h5>
      </div>

      {/* FILTER */}
      <div className="card mb-2">
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
      <div className="table-responsive">
        <table className="table table-sm table-hover align-middle">
          <thead className="table-dark">
            <tr>
              <th>Ref</th>
              <th>Customer</th>
              <th>Sale</th>
              <th>Purchase</th>
              <th>Profit</th>
              <th>Date</th>
              <th width="120">Action</th>
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

                  <td
                    className="text-primary small fw-semibold text-nowrap"
                    style={{ maxWidth: 180 }}
                  >
                    {r.customer_name || "-"}
                  </td>

                  <td>{(+r.sale_pkr).toLocaleString()}</td>
                  <td>{(+r.purchase_pkr).toLocaleString()}</td>

                  <td
                    className={
                      +r.profit >= 0 ? "text-success" : "text-danger"
                    }
                  >
                    {(+r.profit).toLocaleString()}
                  </td>

                  <td className="small text-muted text-nowrap">
                    {fmtDate(r.created_at)}
                  </td>

                  <td>
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

            {!loading && filteredRows.length > 0 && (
              <tr className="table-dark fw-bold">
                <td colSpan="2" className="text-end">
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
                <td colSpan="2"></td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
