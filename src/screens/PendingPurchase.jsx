import React, { useEffect, useState } from "react";
import "./PendingPurchase.css"; // khubsurat styling
import { FaArrowRight } from "react-icons/fa";

const formatDate = (d) => {
  const date = new Date(d);
  const options = { day: "2-digit", month: "short", year: "numeric" };
  return date.toLocaleDateString("en-US", options);
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

      const saleMap = {};
      reportsData.forEach((r) => {
        saleMap[r.ref_no] = r.total_pkr || 0;
      });

      // 3️⃣ Merge with purchase amounts from /list
      const promises = pendingRows.map(async (r) => {
        const listRes = await fetch(
          `${import.meta.env.VITE_BACKEND_URL}/api/purchase/list?ref=${r.ref_no}`
        );
        const listData = await listRes.json();
        let purchase_pkr = 0;
        if (listData.success && listData.rows.length) {
          purchase_pkr = listData.rows[0].purchase_pkr || 0;
        }
        return {
          ...r,
          sale_pkr: saleMap[r.ref_no] || 0,
          purchase_pkr,
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

  const filteredRows = rows.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const ref = typeof r.ref_no === "string" ? r.ref_no.toLowerCase() : "";
    const name =
      typeof r.customer_name === "string" ? r.customer_name.toLowerCase() : "";
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

      <h3 className="fw-bold text-warning mb-3">⚠️ Pending / Partial Purchases</h3>

      <input
        type="text"
        placeholder="Search Ref No or Customer..."
        className="form-control form-control-sm mb-4"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {loading ? (
        <div className="text-center text-muted">Loading...</div>
      ) : filteredRows.length === 0 ? (
        <div className="text-center text-success fw-bold">
          🎉 All purchases completed
        </div>
      ) : (
        <div className="cards-container">
          {filteredRows.map((r, i) => {
            const progress =
              r.sale_pkr > 0
                ? Math.min((r.purchase_pkr / r.sale_pkr) * 100, 100)
                : 0;

            return (
              <div
                key={i}
                className={`purchase-card ${
                  r.status === "PENDING"
                    ? "pending-card"
                    : r.status === "PARTIAL"
                    ? "partial-card"
                    : ""
                }`}
              >
                <div className="card-header">
                  <span className="ref-tag">{r.ref_no}</span>
                  <span className="date">{formatDate(r.created_at)}</span>
                </div>

                <div className="customer-name">{r.customer_name || "-"}</div>

                <div className="amounts">
                  <div className="sale">
                    Sale: <strong>{r.sale_pkr.toLocaleString("en-US")}</strong> PKR
                  </div>
                  <div className="purchase">
                    Purchased: <strong>{r.purchase_pkr.toLocaleString("en-US")}</strong> PKR
                  </div>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <div className="card-footer">
                  <span
                    className={`status-badge ${
                      r.status === "PENDING" ? "status-pending" : "status-partial"
                    }`}
                  >
                    {r.status}
                  </span>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onNavigate("purchase", r.ref_no)}
                  >
                    Complete <FaArrowRight />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
