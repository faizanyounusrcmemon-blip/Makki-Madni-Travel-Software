import React, { useEffect, useState } from "react";

/* ================= AMOUNT FORMAT ================= */
const fmt = (v) =>
  Number(v || 0).toLocaleString("en-US", {
    maximumFractionDigits: 0,
  });

export default function BalanceSheet({ onNavigate }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/balance-sheet`
      );
      const d = await res.json();

      if (d.success) setData(d);
      else alert(d.error || "Failed to load balance sheet");
    } catch {
      alert("Server error");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4 text-white">Loading...</div>;

  const customerRows = data.customers.filter((r) => r.balance > 0);
  const purchaseRows = data.purchases.filter((r) => r.balance > 0);

  return (
    <div className="container p-4 text-white">

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>📊 BALANCE SHEET</h3>
        <button
          className="btn btn-secondary"
          onClick={() => onNavigate("dashboard")}
        >
          ⬅ Back
        </button>
      </div>

      {/* ================= CUSTOMER RECEIVABLE ================= */}
      <h5 className="text-info">💰 Customer Receivable</h5>
      <table className="table table-dark table-bordered mt-2">
        <thead>
          <tr>
            <th>#</th>
            <th>Ref No</th>
            <th>Customer</th>
            <th>Total Sale</th>
            <th>Received</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {customerRows.map((r, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{r.ref_no}</td>
              <td className="text-info fw-bold">{r.customer_name || "-"}</td>
              <td>{fmt(r.sale_total)}</td>
              <td>{fmt(r.received)}</td>
              <td className="text-danger fw-bold">{fmt(r.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ================= SUPPLIER PAYABLE ================= */}
      <h5 className="text-warning mt-4">📦 Supplier Payable</h5>
      <table className="table table-dark table-bordered mt-2">
        <thead>
          <tr>
            <th>#</th>
            <th>Ref No</th>
            <th>Customer</th>
            <th>Total Purchase</th>
            <th>Paid</th>
            <th>Balance</th>
          </tr>
        </thead>
        <tbody>
          {purchaseRows.map((r, i) => (
            <tr key={i}>
              <td>{i + 1}</td>
              <td>{r.ref_no}</td>
              <td className="text-info fw-bold">{r.customer_name || "-"}</td>
              <td>{fmt(r.purchase_total)}</td>
              <td>{fmt(r.paid)}</td>
              <td className="text-danger fw-bold">{fmt(r.balance)}</td>
            </tr>
          ))}
        </tbody>
      </table>

    </div>
  );
}
